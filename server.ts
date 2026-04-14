import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import db from './src/lib/db.js';
import { seedDb } from './src/lib/seed.js';

// Initialize DB and Seed
seedDb();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Get all modules with progress for the current user
  app.get('/api/modules', (req, res) => {
    const userId = 'student-1'; // Mocked user
    const modules = db.prepare(`
      SELECT m.*, up.status, up.last_section_id
      FROM modules m
      LEFT JOIN user_progress up ON m.id = up.module_id AND up.user_id = ?
      ORDER BY m.order_index ASC
    `).all(userId);
    res.json(modules);
  });

  // Get a specific module and its sections
  app.get('/api/modules/:id', (req, res) => {
    const moduleId = req.params.id;
    const moduleData = db.prepare('SELECT * FROM modules WHERE id = ?').get(moduleId) as any;
    if (!moduleData) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    const sections = db.prepare('SELECT * FROM sections WHERE module_id = ? ORDER BY order_index ASC').all(moduleId);
    
    // Attach questions to quiz and lsat sections
    const sectionsWithQuestions = sections.map((sec: any) => {
      if (sec.content_type === 'quiz' || sec.content_type === 'lsat') {
        const questions = db.prepare('SELECT id, prompt, options FROM questions WHERE section_id = ?').all(sec.id);
        return { ...sec, questions: questions.map((q: any) => ({ ...q, options: JSON.parse(q.options) })) };
      }
      return sec;
    });

    res.json({ ...moduleData, sections: sectionsWithQuestions });
  });

  // Submit an answer and get AI feedback
  app.post('/api/submit-answer', async (req, res) => {
    const { questionId, selectedAnswer } = req.body;
    const userId = 'student-1';

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId) as any;
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = question.correct_answer === selectedAnswer;

    // Generate AI Feedback
    let aiFeedback = '';
    try {
      const prompt = `
        You are an expert LSAT tutor. A student just answered a question.
        Question: ${question.prompt}
        Student's Answer: ${selectedAnswer}
        Correct Answer: ${question.correct_answer}
        Base Explanation: ${question.explanation}
        
        Provide a short, encouraging, and educational response (max 3 sentences). 
        If they are right, reinforce why. If they are wrong, gently correct them using the base explanation.
        Do not use markdown formatting like bolding or italics, just plain text.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      aiFeedback = response.text || question.explanation;
    } catch (error) {
      console.error('AI Feedback error:', error);
      aiFeedback = question.explanation; // Fallback to base explanation
    }

    // Save answer
    db.prepare('INSERT INTO user_answers (user_id, question_id, selected_answer, is_correct, ai_feedback) VALUES (?, ?, ?, ?, ?)')
      .run(userId, questionId, selectedAnswer, isCorrect ? 1 : 0, aiFeedback);

    res.json({
      isCorrect,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      aiFeedback
    });
  });

  // Update progress
  app.post('/api/progress', (req, res) => {
    const { moduleId, status, lastSectionId } = req.body;
    const userId = 'student-1';

    db.prepare(`
      INSERT INTO user_progress (user_id, module_id, status, last_section_id)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, module_id) DO UPDATE SET
        status = excluded.status,
        last_section_id = excluded.last_section_id
    `).run(userId, moduleId, status, lastSectionId);

    // If completed, unlock the next module
    if (status === 'completed') {
      const currentModule = db.prepare('SELECT order_index FROM modules WHERE id = ?').get(moduleId) as any;
      const nextModule = db.prepare('SELECT id FROM modules WHERE order_index > ? ORDER BY order_index ASC LIMIT 1').get(currentModule.order_index) as any;
      
      if (nextModule) {
        db.prepare(`
          INSERT INTO user_progress (user_id, module_id, status)
          VALUES (?, ?, 'in_progress')
          ON CONFLICT(user_id, module_id) DO NOTHING
        `).run(userId, nextModule.id);
      }
    }

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

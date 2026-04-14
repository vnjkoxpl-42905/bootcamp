import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'abstraction.db');
const db = new Database(dbPath);

// Initialize schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      is_locked_by_default BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content_type TEXT NOT NULL, -- 'lesson', 'quiz', 'lsat'
      body TEXT,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (module_id) REFERENCES modules (id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON array of strings
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      FOREIGN KEY (section_id) REFERENCES sections (id)
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      status TEXT NOT NULL, -- 'locked', 'in_progress', 'completed'
      last_section_id TEXT,
      PRIMARY KEY (user_id, module_id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (module_id) REFERENCES modules (id)
    );

    CREATE TABLE IF NOT EXISTS user_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_answer TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      ai_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (question_id) REFERENCES questions (id)
    );
  `);
}

export default db;

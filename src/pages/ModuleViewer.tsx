import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Question {
  id: string;
  prompt: string;
  options: string[];
}

interface Section {
  id: string;
  title: string;
  content_type: 'lesson' | 'quiz' | 'lsat';
  body: string;
  order_index: number;
  questions?: Question[];
}

interface ModuleData {
  id: string;
  title: string;
  sections: Section[];
}

export default function ModuleViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string; aiFeedback: string; correctAnswer: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/modules/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setModuleData(data);
        setLoading(false);
      });
  }, [id]);

  if (loading || !moduleData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading Module...</div>
      </div>
    );
  }

  const currentSection = moduleData.sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === moduleData.sections.length - 1;

  const handleNext = async () => {
    if (isLastSection) {
      // Mark complete
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: id, status: 'completed', lastSectionId: currentSection.id })
      });
      navigate('/');
    } else {
      const nextIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIndex);
      setSelectedAnswer(null);
      setFeedback(null);
      
      // Save progress
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: id, status: 'in_progress', lastSectionId: moduleData.sections[nextIndex].id })
      });
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setSelectedAnswer(null);
      setFeedback(null);
    }
  };

  const submitAnswer = async (questionId: string) => {
    if (!selectedAnswer) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selectedAnswer })
      });
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (currentSection.content_type === 'lesson') {
      return (
        <div className="prose prose-gray max-w-none prose-headings:font-medium prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
          <ReactMarkdown>{currentSection.body}</ReactMarkdown>
        </div>
      );
    }

    if (currentSection.content_type === 'quiz' || currentSection.content_type === 'lsat') {
      const question = currentSection.questions?.[0];
      if (!question) return null;

      return (
        <div className="space-y-8">
          <div className="prose prose-gray max-w-none mb-8">
            <ReactMarkdown>{question.prompt}</ReactMarkdown>
          </div>
          
          <div className="space-y-3">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => !feedback && setSelectedAnswer(opt)}
                disabled={!!feedback}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  feedback
                    ? opt === feedback.correctAnswer
                      ? 'bg-green-50 border-green-200 text-green-900'
                      : opt === selectedAnswer
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-white border-gray-200 opacity-50'
                    : selectedAnswer === opt
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {!feedback && (
            <button
              onClick={() => submitAnswer(question.id)}
              disabled={!selectedAnswer || submitting}
              className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              {submitting ? 'Checking...' : 'Submit Answer'}
            </button>
          )}

          {feedback && (
            <div className={`mt-8 p-6 rounded-2xl border ${feedback.isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-orange-50/50 border-orange-100'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 text-xs font-bold">!</div>
                  )}
                </div>
                <div>
                  <h4 className={`font-medium mb-2 ${feedback.isCorrect ? 'text-green-900' : 'text-orange-900'}`}>
                    {feedback.isCorrect ? 'Correct!' : 'Not quite.'}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{feedback.aiFeedback}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  const canProceed = currentSection.content_type === 'lesson' || !!feedback;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{moduleData.title}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{currentSection.title}</span>
        </div>
        <div className="text-sm font-medium text-gray-400">
          {currentSectionIndex + 1} / {moduleData.sections.length}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 md:py-20">
        <div className="mb-12">
          <h1 className="text-3xl font-medium tracking-tight text-gray-900 mb-4">{currentSection.title}</h1>
          {currentSection.content_type === 'quiz' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              Checkpoint
            </span>
          )}
          {currentSection.content_type === 'lsat' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
              LSAT Application
            </span>
          )}
        </div>

        {renderContent()}
      </main>

      {/* Bottom Action Bar */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
              canProceed 
                ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLastSection ? 'Complete Module' : 'Continue'}
            {!isLastSection && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </div>
  );
}

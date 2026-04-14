import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  status: 'locked' | 'in_progress' | 'completed' | null;
  last_section_id: string | null;
}

export default function Dashboard() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/modules')
      .then((res) => res.json())
      .then((data) => {
        setModules(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading Bootcamp...</div>
      </div>
    );
  }

  const completedCount = modules.filter(m => m.status === 'completed').length;
  const progressPercent = Math.round((completedCount / modules.length) * 100) || 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-3xl font-medium tracking-tight text-gray-900 mb-2">Abstraction</h1>
        <p className="text-gray-500">LSAT Bootcamp Curriculum</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Modules</h2>
          {modules.map((mod) => {
            const isLocked = false; // Force unlocked
            const isCompleted = mod.status === 'completed';
            const isInProgress = mod.status === 'in_progress';

            return (
              <div 
                key={mod.id} 
                className={`relative p-6 rounded-2xl border transition-all duration-200 bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      )}
                      <h3 className={`font-medium text-gray-900`}>
                        {mod.order_index}. {mod.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">{mod.description}</p>
                  </div>
                  
                  <Link 
                    to={`/module/${mod.id}`}
                    className={`shrink-0 ml-6 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isCompleted 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Progress</h2>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-light tracking-tight text-gray-900">{progressPercent}%</span>
              <span className="text-sm text-gray-500 mb-1">completed</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gray-900 h-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {completedCount} of {modules.length} modules finished
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

interface ComingSoonModulePageProps {
  moduleName: string;
  description: string;
  icon: string;
}

export const ComingSoonModulePage: React.FC<ComingSoonModulePageProps> = ({
  moduleName,
  description,
  icon,
}) => {
  const { setActiveModule, setActiveTab } = useAppData();

  const handleBackToFinance = () => {
    setActiveModule('finance');
    setActiveTab('overview');
  };

  return (
    <div className="py-12 md:py-20 flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-4xl mb-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <span>{icon}</span>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold mb-3 border border-purple-200/60 dark:border-purple-800/40">
        <Clock className="w-3.5 h-3.5" />
        <span>LifeOS Roadmap Module</span>
      </div>

      <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
        {moduleName}
      </h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-md">
        {description}
      </p>

      <button
        type="button"
        onClick={handleBackToFinance}
        className="mt-8 px-6 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Finance Dashboard</span>
      </button>
    </div>
  );
};

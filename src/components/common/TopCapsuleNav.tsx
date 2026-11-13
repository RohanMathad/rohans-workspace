import React from 'react';
import { FinanceTab, useAppData } from '../../context/AppDataContext';

export const TopCapsuleNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAppData();

  const tabs: { id: FinanceTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'basket', label: 'Basket' },
    { id: 'reports', label: 'Reports' },
    { id: 'categories', label: 'Categories' },
  ];

  return (
    <nav
      aria-label="Finance navigation"
      className="w-full flex items-center justify-between gap-1.5 p-1.5 bg-white dark:bg-[#1C1E26] rounded-full border border-slate-200/70 dark:border-white/10 shadow-sm"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-center px-4 py-2.5 text-xs md:text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isActive
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};

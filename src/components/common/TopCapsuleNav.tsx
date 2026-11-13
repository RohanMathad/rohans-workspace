import React from 'react';
import { FinanceTab, useAppData } from '../../context/AppDataContext';

export const TopCapsuleNav: React.FC = () => {
  const { activeTab, setActiveTab, profile } = useAppData();

  const workspaceOwner = (profile?.userName || 'Rohan').trim() || 'Rohan';
  const workspaceTitle = `${workspaceOwner}'s Workspace`;

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
      className="w-full flex items-center justify-between gap-4 pl-6 pr-2 py-2 bg-white/75 dark:bg-[#1C1E26]/75 backdrop-blur-xl rounded-full border border-slate-200/80 dark:border-white/10 shadow-lg"
    >
      {/* Left: Dynamic Workspace Title */}
      <div className="flex items-center shrink-0">
        <span className="text-sm xl:text-base font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
          {workspaceTitle}
        </span>
      </div>

      {/* Right: Unified Navigation Pills */}
      <div className="flex items-center gap-1 flex-1 max-w-2xl justify-end">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-center px-3.5 xl:px-4 py-2 text-xs md:text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};


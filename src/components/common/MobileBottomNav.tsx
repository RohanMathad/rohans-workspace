import React from 'react';
import {
  LayoutGrid,
  FileText,
  Plus,
  ShoppingBag,
  PieChart,
} from 'lucide-react';
import { FinanceTab, useAppData } from '../../context/AppDataContext';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openQuickAdd } = useAppData();

  const navItems: { id: FinanceTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'activity', label: 'Activity', icon: FileText },
    { id: 'basket', label: 'Basket', icon: ShoppingBag },
    { id: 'reports', label: 'Reports', icon: PieChart },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 lg:hidden pointer-events-none">
      <nav
        aria-label="Mobile Bottom Navigation"
        className="pointer-events-auto flex items-center justify-between w-full max-w-sm px-3 py-2 bg-white dark:bg-[#1C1E26] backdrop-blur-lg rounded-full border border-slate-200/70 dark:border-white/10 shadow-sm"
      >
        {/* Overview */}
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-colors ${
            activeTab === 'overview'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
          aria-label="Overview"
        >
          <div
            className={`p-1.5 rounded-full ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : ''
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Overview</span>
        </button>

        {/* Activity */}
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-colors ${
            activeTab === 'activity'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
          aria-label="Activity"
        >
          <div
            className={`p-1.5 rounded-full ${
              activeTab === 'activity'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : ''
            }`}
          >
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Activity</span>
        </button>

        {/* Center Prominent '+' Button */}
        <button
          type="button"
          onClick={openQuickAdd}
          aria-label="Add transaction or expense"
          className="w-12 h-12 -mt-4 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-[#F6F7FB] dark:border-[#12131A] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Basket */}
        <button
          type="button"
          onClick={() => setActiveTab('basket')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-colors ${
            activeTab === 'basket'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
          aria-label="Basket"
        >
          <div
            className={`p-1.5 rounded-full ${
              activeTab === 'basket'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : ''
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Basket</span>
        </button>

        {/* Reports */}
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-colors ${
            activeTab === 'reports'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
          aria-label="Reports"
        >
          <div
            className={`p-1.5 rounded-full ${
              activeTab === 'reports'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : ''
            }`}
          >
            <PieChart className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Reports</span>
        </button>
      </nav>
    </div>
  );
};

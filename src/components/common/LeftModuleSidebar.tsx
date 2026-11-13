import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Zap,
  Wallet,
  ShoppingBag,
  Heart,
  CheckCircle2,
  Settings,
  ChevronsRight,
  ChevronsLeft,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { LifeOsModule, useAppData } from '../../context/AppDataContext';

export const LeftModuleSidebar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { activeModule, setActiveModule, activeTab } = useAppData();
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    {
      id: 'finance' as LifeOsModule,
      label: 'Finance',
      icon: Wallet,
      isActive: activeModule === 'finance' && activeTab !== 'basket',
    },
    {
      id: 'basket' as LifeOsModule,
      label: 'Basket',
      icon: ShoppingBag,
      isActive: activeModule === 'basket' || activeTab === 'basket',
    },
    {
      id: 'health' as LifeOsModule,
      label: 'Health & Vitals',
      icon: Heart,
      isActive: activeModule === 'health',
      isComingSoon: true,
    },
    {
      id: 'habits' as LifeOsModule,
      label: 'Habits & Routine',
      icon: CheckCircle2,
      isActive: activeModule === 'habits',
      isComingSoon: true,
    },
    {
      id: 'settings' as LifeOsModule,
      label: 'Settings',
      icon: Settings,
      isActive: activeModule === 'settings',
      isComingSoon: true,
    },
  ];

  return (
    <aside
      className={`fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center bg-white dark:bg-[#1C1E26] backdrop-blur-md rounded-[28px] border border-slate-200/70 dark:border-white/10 shadow-sm transition-all duration-300 py-3.5 ${
        isExpanded ? 'w-52 px-3' : 'w-16 px-2'
      }`}
    >
      {/* Light / Dark Mode Toggle Pill */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {theme === 'light' ? (
          <Sun className="w-5 h-5 text-amber-500 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-400 transition-transform hover:-rotate-12" />
        )}
      </button>

      {/* LifeOS Brand Icon */}
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm mb-4">
        <Zap className="w-5 h-5 fill-white text-white" />
      </div>

      <div className="w-8 h-[1px] bg-slate-200/80 dark:bg-white/10 my-1" />

      {/* Module Icons List */}
      <nav className="flex flex-col gap-2 my-2 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveModule(item.id)}
              className={`group flex items-center gap-3 w-full p-2.5 rounded-2xl transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                item.isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
              } ${isExpanded ? 'justify-start px-3' : 'justify-center'}`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isExpanded && (
                <span className="text-xs font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                  {item.isComingSoon && (
                    <span className="ml-1.5 text-[9px] font-normal px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/10">
                      Soon
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="w-8 h-[1px] bg-slate-200/80 dark:bg-white/10 my-1" />

      {/* Expand / Collapse toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors mt-2"
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isExpanded ? (
          <ChevronsLeft className="w-4 h-4" />
        ) : (
          <ChevronsRight className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import {
  Sun,
  Moon,
  Wallet,
  Heart,
  CheckCircle2,
  Settings,
  ChevronsRight,
  ChevronsLeft,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { LifeOsModule, useAppData } from '../../context/AppDataContext';
import { getUserInitials } from '../../services/financeLogic';

export const LeftModuleSidebar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { activeModule, setActiveModule, profile, resetToSetupDemo, logout } = useAppData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profilePopoverRef = useRef<HTMLDivElement>(null);

  const userName = profile?.userName || 'Rohan';
  const initials = getUserInitials(userName);

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profilePopoverRef.current &&
        !profilePopoverRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileMenuOpen]);

  const navItems: {
    id: LifeOsModule;
    label: string;
    icon: React.ElementType;
    isActive: boolean;
    isComingSoon?: boolean;
  }[] = [
    {
      id: 'finance',
      label: 'Finance Tracker',
      icon: Wallet,
      isActive: activeModule === 'finance' || activeModule === 'basket',
    },
    {
      id: 'health',
      label: 'Health Tracker',
      icon: Heart,
      isActive: activeModule === 'health',
      isComingSoon: true,
    },
    {
      id: 'habits',
      label: 'Tasks & Habits',
      icon: CheckCircle2,
      isActive: activeModule === 'habits',
      isComingSoon: true,
    },
    {
      id: 'settings',
      label: 'Category & Settings',
      icon: Settings,
      isActive: activeModule === 'settings',
      isComingSoon: true,
    },
  ];

  const handleSelectModule = (moduleId: LifeOsModule) => {
    setActiveModule(moduleId);
    setIsExpanded(false);
    setIsProfileMenuOpen(false);
  };

  const handleRerunSetup = async () => {
    setIsProfileMenuOpen(false);
    setIsExpanded(false);
    await resetToSetupDemo();
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    setIsExpanded(false);
    await logout();
  };

  return (
    <>
      {/* Full-Screen Blurred Backdrop Overlay when Desktop Sidebar is Expanded */}
      <div
        aria-hidden={!isExpanded}
        onClick={() => setIsExpanded(false)}
        className={`hidden lg:block fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out ${
          isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Top-Left Anchored Frosted Glass Sidebar Capsule */}
      <aside
        aria-label="Workspace modules"
        className={`fixed top-5 left-5 z-50 hidden lg:flex flex-col items-center bg-white/75 dark:bg-[#1C1E26]/75 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-lg transition-all duration-300 ease-out py-3.5 ${
          isExpanded ? 'w-60 px-3.5 items-stretch' : 'w-16 px-2 items-center'
        }`}
      >
        {/* 1. Top Item: Clickable Account Initials Avatar with Workspace Popover */}
        <div ref={profilePopoverRef} className="relative w-full mb-3">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label="Workspace profile menu"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            title={`${userName}'s Workspace`}
            className={`flex items-center gap-3 w-full rounded-2xl p-1 transition-colors hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
              isExpanded ? 'px-1.5 justify-start' : 'justify-center'
            }`}
          >
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 text-white flex items-center justify-center font-extrabold text-sm tracking-tight shadow-sm ring-2 ring-indigo-500/20 dark:ring-indigo-400/25 shrink-0">
              <span>{initials}</span>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1C1E26]"
                aria-label="Active workspace status"
              />
            </div>
            {isExpanded && (
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  Active Workspace
                </p>
              </div>
            )}
          </button>

          {isProfileMenuOpen && (
            <div
              role="menu"
              aria-label="Workspace profile options"
              className="absolute left-full top-0 ml-3 w-64 p-3 rounded-2xl bg-white dark:bg-[#1C1E26] border border-slate-200 dark:border-white/10 shadow-2xl z-50"
            >
              <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {userName}&apos;s Workspace
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Active Workspace
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleRerunSetup}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer text-left"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Edit Workspace Profile</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Second Item: Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`flex items-center gap-3 w-full p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            isExpanded ? 'justify-start px-3' : 'justify-center'
          }`}
        >
          {theme === 'light' ? (
            <Sun className="w-5 h-5 text-amber-500 shrink-0 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-400 shrink-0 transition-transform hover:-rotate-12" />
          )}
          {isExpanded && (
            <span className="text-xs font-semibold whitespace-nowrap">
              {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        <div className="w-full h-[1px] bg-slate-200/80 dark:bg-white/10 my-1.5" />

        {/* 3. Module Navigation Icons (Basket intentionally excluded) */}
        <nav className="flex flex-col gap-1.5 my-2 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectModule(item.id)}
                className={`group flex items-center gap-3 w-full p-2.5 rounded-2xl transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  item.isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
                } ${isExpanded ? 'justify-start px-3' : 'justify-center'}`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {isExpanded && (
                  <span className="text-xs font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.isComingSoon && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        Soon
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="w-full h-[1px] bg-slate-200/80 dark:bg-white/10 my-1.5" />

       

        {/* 4. Bottom Expand / Collapse Toggle (>>) */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`flex items-center gap-3 w-full p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            isExpanded ? 'justify-start px-3' : 'justify-center'
          }`}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <>
              <ChevronsLeft className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">Collapse</span>
            </>
          ) : (
            <ChevronsRight className="w-4 h-4 shrink-0" />
          )}
        </button>
      </aside>
    </>
  );
};


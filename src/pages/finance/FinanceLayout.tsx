import React, { useState } from 'react';
import {
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
  Wallet,
  ShoppingBag,
  Heart,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { LeftModuleSidebar } from '../../components/common/LeftModuleSidebar';
import { TopCapsuleNav } from '../../components/common/TopCapsuleNav';
import { MobileBottomNav } from '../../components/common/MobileBottomNav';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { QuickAddExpenseModal } from '../../components/finance/QuickAddExpenseModal';
import { SettleBasketModal } from '../../components/finance/SettleBasketModal';
import { FinanceOverviewPage } from './FinanceOverviewPage';
import { FinanceActivityPage } from './FinanceActivityPage';
import { FinanceBasketPage } from './FinanceBasketPage';
import { FinanceReportsPage } from './FinanceReportsPage';
import { FinanceCategoriesPage } from './FinanceCategoriesPage';
import { ComingSoonModulePage } from '../placeholders/ComingSoonModulePage';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';

export const FinanceLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeModule,
    setActiveModule,
    settleBasketItemTarget,
    closeSettleModal,
    settleItem,
    resetToSetupDemo,
  } = useAppData();

  const { theme, toggleTheme } = useTheme();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const renderActiveContent = () => {
    if (activeModule === 'health') {
      return (
        <ComingSoonModulePage
          moduleName="Health & Vitals Telemetry"
          description="Continuous heart rate, sleep recovery, calorie expenditure, and gym biometric sync are in development for LifeOS Q1."
          icon="❤️"
        />
      );
    }
    if (activeModule === 'habits') {
      return (
        <ComingSoonModulePage
          moduleName="Habits & Routine Architecture"
          description="Atomic habit loops, circadian rhythm tracking, and streak gamification are queued for upcoming LifeOS release."
          icon="🎯"
        />
      );
    }
    if (activeModule === 'settings') {
      return (
        <ComingSoonModulePage
          moduleName="LifeOS Workspace Preferences"
          description="Configure currency locales, bank sync APIs, privacy vaults, and export encryption keys."
          icon="⚙️"
        />
      );
    }

    switch (activeTab) {
      case 'overview':
        return <FinanceOverviewPage />;
      case 'activity':
        return <FinanceActivityPage />;
      case 'basket':
        return <FinanceBasketPage />;
      case 'reports':
        return <FinanceReportsPage />;
      case 'categories':
        return <FinanceCategoriesPage />;
      default:
        return <FinanceOverviewPage />;
    }
  };

  const getMobileTabTitle = () => {
    if (activeModule === 'health') return 'Health & Vitals';
    if (activeModule === 'habits') return 'Habits & Routine';
    if (activeModule === 'settings') return 'Settings';

    switch (activeTab) {
      case 'overview':
        return 'Finance Tracker';
      case 'activity':
        return 'Activity Ledger';
      case 'basket':
        return 'Shopping Basket';
      case 'reports':
        return 'Reports';
      case 'categories':
        return 'Categories';
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] dark:bg-[#12131A] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Left Module Sidebar */}
      <LeftModuleSidebar />

      {/* Main Container Area */}
      <div className="lg:pl-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 lg:pb-12">
        {/* ================= DESKTOP TOP HEADER (>= 1024px) ================= */}
        <header className="hidden lg:block py-4 mb-6">
          <TopCapsuleNav />
        </header>

        {/* ================= MOBILE WHATSAPP-STYLE HEADER (< 1024px) ================= */}
        <header className="lg:hidden flex items-center gap-3.5 py-2.5 mb-4">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1C1E26] border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            {getMobileTabTitle()}
          </h1>
        </header>

        {/* Page Content Rendering */}
        <main>{renderActiveContent()}</main>
      </div>

      {/* Desktop Floating Action Button (+) */}
      <FloatingActionButton />

      {/* Mobile Fixed Bottom Nav Capsule */}
      <MobileBottomNav />

      {/* Quick Add Expense Modal */}
      <QuickAddExpenseModal />

      {/* Settle Basket Modal */}
      <SettleBasketModal
        item={settleBasketItemTarget}
        isOpen={!!settleBasketItemTarget}
        onClose={closeSettleModal}
        onSettle={settleItem}
      />

      {/* Mobile Slide-Out Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#1C1E26] h-full shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200/70 dark:border-white/10">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5 fill-white text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      LifeOS
                    </h3>
                    <span className="text-[11px] text-slate-400">Personal Wealth OS</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-white/5 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Modules */}
              <div className="mt-6 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-2">
                  Modules
                </span>

                {[
                  { id: 'finance' as const, label: 'Finance & Ledger', icon: Wallet },
                  { id: 'basket' as const, label: 'Shopping Basket', icon: ShoppingBag },
                  { id: 'health' as const, label: 'Health & Vitals', icon: Heart, soon: true },
                  { id: 'habits' as const, label: 'Habits & Routine', icon: CheckCircle2, soon: true },
                  { id: 'settings' as const, label: 'Settings', icon: Settings, soon: true },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveModule(item.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.soon && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/10 font-normal">
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Categories Shortcut */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-2">
                    Configuration
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('categories');
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5"
                  >
                    <span>🎛️ Manage Categories</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Drawer Controls: Dark Mode & Demo Reset */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  {theme === 'light' ? (
                    <Sun className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  )}
                  <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                <span className="text-slate-400">Switch</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsMobileDrawerOpen(false);
                  await resetToSetupDemo();
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-run Setup Wizard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

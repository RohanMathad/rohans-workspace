import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { OnboardingSetupCard } from '../../components/setup/OnboardingSetupCard';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { initialCategories } from '../../mockData/financeMockData';
import { Category } from '../../types/finance.types';

export const InitialSetupPage: React.FC = () => {
  const {
    completeSetup,
    loginOrCreateWorkspace,
    logout,
    activeWorkspaceId,
    profile,
    categories,
  } = useAppData();
  const { theme, toggleTheme } = useTheme();

  const isEditingExistingWorkspace = Boolean(activeWorkspaceId);

  const handleSubmit = async (data: {
    userName: string;
    pin?: string;
    currencySymbol: string;
    monthlyBaseIncome: number;
    monthlySavingsTarget: number;
    categories: Category[];
  }) => {
    if (isEditingExistingWorkspace) {
      await completeSetup({
        userName: data.userName,
        currencySymbol: data.currencySymbol,
        monthlyBaseIncome: 0,
        monthlySavingsTarget: data.monthlySavingsTarget,
        categories: data.categories,
      });
    } else {
      await loginOrCreateWorkspace(data.userName, data.pin || '', data.monthlySavingsTarget, {
        currencySymbol: data.currencySymbol,
        categories: data.categories,
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F6F7FB] dark:bg-[#12131A] transition-colors duration-200 overflow-y-auto">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        className="fixed top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/80 dark:bg-[#1C1E26]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#252834] transition-colors cursor-pointer"
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-400" />
        )}
      </button>

      <OnboardingSetupCard
        isEditingExisting={isEditingExistingWorkspace}
        initialProfile={isEditingExistingWorkspace ? profile : null}
        initialCategoriesList={
          isEditingExistingWorkspace && categories.length > 0 ? categories : initialCategories
        }
        onComplete={handleSubmit}
        onSwitchWorkspace={isEditingExistingWorkspace ? logout : undefined}
      />
    </div>
  );
};


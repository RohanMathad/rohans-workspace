/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { FinanceLayout } from './pages/finance/FinanceLayout';
import { InitialSetupPage } from './pages/setup/InitialSetupPage';

const AppContent: React.FC = () => {
  const { profile, isLoading } = useAppData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB] dark:bg-[#12131A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-neutral-400">Loading LifeOS...</span>
        </div>
      </div>
    );
  }

  // Automatic Route Guard: if isSetupComplete === false, show InitialSetupPage
  if (profile && !profile.isSetupComplete) {
    return <InitialSetupPage />;
  }

  return <FinanceLayout />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </ThemeProvider>
  );
}

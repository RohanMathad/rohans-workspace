import React from 'react';
import { OnboardingSetupCard } from '../../components/setup/OnboardingSetupCard';
import { useAppData } from '../../context/AppDataContext';
import { Category } from '../../types/finance.types';

export const InitialSetupPage: React.FC = () => {
  const { completeSetup } = useAppData();

  const handleComplete = async (data: {
    userName: string;
    monthlyBaseIncome: number;
    monthlyBudgetCap: number;
    categories: Category[];
  }) => {
    await completeSetup(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F6F7FB] dark:bg-[#12131A] transition-colors duration-200">
      <OnboardingSetupCard onComplete={handleComplete} />
    </div>
  );
};

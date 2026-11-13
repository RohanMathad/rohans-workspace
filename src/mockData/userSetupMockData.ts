import { UserSetupProfile } from '../types/finance.types';

export const initialUserSetupProfile: UserSetupProfile = {
  isSetupComplete: false,
  userName: 'Rohan',
  currencySymbol: '₹',
  monthlyBaseIncome: 0,
  monthlyBudgetCap: 50000,
  monthlySavingsTarget: 0,
  selectedAccount: 'Main Savings A/C',
  monthPeriod: 'November 2026',
};

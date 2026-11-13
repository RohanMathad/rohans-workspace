import { UserSetupProfile } from '../types/finance.types';

export const initialUserSetupProfile: UserSetupProfile = {
  isSetupComplete: true, // Set to true by default for immediate exploration; user can toggle or reset in UI
  userName: 'Rohan',
  currencySymbol: '₹',
  monthlyBaseIncome: 85992,
  monthlyBudgetCap: 50000,
  monthlySavingsTarget: 40000,
  selectedAccount: 'Main Savings A/C',
  monthPeriod: 'November 2026',
};

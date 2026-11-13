export type CategoryType = 'EXPENSE' | 'INCOME';

export type PaymentMethod = 
  | 'UPI / GPay' 
  | 'Card' 
  | 'Cash' 
  | 'Amazon Pay' 
  | 'Auto-debit'
  | 'ICICI Card'
  | 'Card Citi'
  | 'Card Amex'
  | 'UPI / HDFC';

export type LedgerStatus = 'BASKET_PLANNED' | 'SETTLED';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  iconName?: string;
  color: string; // hex
  bgLight: string; // tailwind or hex e.g. #FEF2F2
  bgDark: string;
  textLight: string;
  textDark: string;
  type: CategoryType;
  monthlyLimit?: number;
  isArchived?: boolean;
  description?: string;
}

export interface LedgerEntry {
  id: string;
  title: string;
  categoryId: string; // ONLY categoryId stored (strict normalization)
  amount: number | null; // null if BASKET_PLANNED, actual spent if SETTLED
  estimatedAmount?: number; // optional estimated budget for basket items
  status: LedgerStatus;
  type: CategoryType;
  date: string; // '2026-11-08'
  dayKey?: string; // '2026-11-08'
  monthKey?: string | null; // '2026-11' or null if BASKET_PLANNED
  dateTimestamp?: number; // epoch ms for fast chronological sorting
  time?: string; // '04:15 PM'
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  settledAt?: string;
  createdAt?: string | number;
  merchantOrPlatform?: string; // e.g. 'Instamart', 'Amazon Pay', 'UPI / HDFC'
  tagStatus?: 'Completed' | 'Cleared' | 'Settled' | 'Recurring';
}

export interface UserSetupProfile {
  isSetupComplete: boolean;
  userName: string;
  currencySymbol: string;
  monthlyBaseIncome: number;
  monthlyBudgetCap: number;
  monthlySavingsTarget?: number;
  selectedAccount?: string;
  monthPeriod: string;
}

export type TimeframeFilter = 'Daily' | 'Weekly' | 'Monthly';
export type OverviewScope = 'Monthly' | 'Yearly';

export interface MonthOption {
  key: string; // '2026-11'
  label: string; // 'November 2026'
  shortLabel: string; // 'Nov 2026'
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  emoji: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
  limit?: number;
}

export interface FlowTrendPoint {
  label: string; // '04 Sun', '05 Mon', etc. or 'M', 'T', 'W'
  fullLabel?: string;
  savings: number;
  expense: number;
  isPeak?: boolean;
}

export interface OverviewData {
  profile: UserSetupProfile;
  scope: OverviewScope;
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  savingsRate: number;
  budgetCap: number;
  incomeDeltaMoM: number;
  expenseDeltaMoM: number;
  savingsDeltaMoM: number;
  currentMonthExpense: number;
  currentMonthExpenseDelta: number;
  flowTrend: FlowTrendPoint[];
  categorySpend: CategoryBreakdown[];
  recentTransactions: LedgerEntry[];
  activeBasketCount: number;
  activeBasketEstTotal: number;
}

export interface MonthlySummary {
  monthKey: string; // e.g., '2026-11'
  yearKey: string; // e.g., '2026'
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  monthlySavingsTarget: number;
  categoryTotals: Record<string, number>; // categoryId -> total amount
  transactionCount: number;
  updatedAt: number;
}

export interface YearlySummary {
  yearKey: string; // e.g., '2026'
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  yearlySavingsTarget: number;
  monthlyBreakdown: Record<string, { income: number; expense: number; savings: number }>;
}


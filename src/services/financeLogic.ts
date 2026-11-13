import {
  Category,
  CategoryBreakdown,
  FlowTrendPoint,
  LedgerEntry,
  MonthlySummary,
  OverviewData,
  TimeframeFilter,
  UserSetupProfile,
  YearlySummary,
} from '../types/finance.types';

export const UNKNOWN_CATEGORY: Category = {
  id: 'cat-unknown',
  name: 'General',
  emoji: '🏷️',
  color: '#64748B',
  bgLight: '#F1F5F9',
  bgDark: '#1E293B',
  textLight: '#475569',
  textDark: '#94A3B8',
  type: 'EXPENSE',
};

/**
 * Calculates previous month key from YYYY-MM (e.g. 2026-11 -> 2026-10, 2026-01 -> 2025-12)
 */
export function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10) || new Date().getFullYear();
  let month = parseInt(monthStr, 10) || new Date().getMonth() + 1;

  if (month === 1) {
    year -= 1;
    month = 12;
  } else {
    month -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Calculates percentage delta between current and previous month values
 */
export function calculateMoMDelta(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  const delta = ((current - previous) / previous) * 100;
  return Math.round(delta);
}

/**
 * Calculates financial aggregates and category distributions for settled expenses
 * Accepts either Category[] array or memoized categoryMap Record
 */
export function calculateCategoryBreakdown(
  entries: LedgerEntry[],
  categoriesInput: Category[] | Record<string, Category>
): CategoryBreakdown[] {
  const settledExpenses = entries.filter(
    (e) => e.status === 'SETTLED' && e.type === 'EXPENSE' && typeof e.amount === 'number'
  );

  const totalSpent = settledExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const spendByCat = new Map<string, { amount: number; count: number }>();

  for (const entry of settledExpenses) {
    const existing = spendByCat.get(entry.categoryId) || { amount: 0, count: 0 };
    spendByCat.set(entry.categoryId, {
      amount: existing.amount + (entry.amount || 0),
      count: existing.count + 1,
    });
  }

  const categoryLookup: Record<string, Category> = Array.isArray(categoriesInput)
    ? Object.fromEntries(categoriesInput.map((c) => [c.id, c]))
    : categoriesInput;

  const breakdown: CategoryBreakdown[] = [];

  for (const [catId, data] of spendByCat.entries()) {
    if (data.amount > 0) {
      const cat = categoryLookup[catId] || {
        ...UNKNOWN_CATEGORY,
        id: catId,
      };
      const percentage = totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0;
      breakdown.push({
        categoryId: cat.id,
        categoryName: cat.name,
        emoji: cat.emoji,
        amount: data.amount,
        percentage,
        color: cat.color,
        count: data.count,
        limit: cat.monthlyLimit,
      });
    }
  }

  // Sort descending by amount
  return breakdown.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculates total income, total expense, savings and savings rate
 */
export function calculateFinancialTotals(
  _profile: UserSetupProfile,
  entries: LedgerEntry[]
) {
  const settled = entries.filter((e) => e.status === 'SETTLED');

  const totalExpense = settled
    .filter((e) => e.type === 'EXPENSE' && typeof e.amount === 'number')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalIncome = settled
    .filter((e) => e.type === 'INCOME' && typeof e.amount === 'number')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalSavings = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Number(((totalSavings / totalIncome) * 100).toFixed(1)) : 0;

  return {
    totalIncome,
    totalExpense,
    totalSavings,
    savingsRate,
  };
}

export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRelativeDate(offsetDays: number = 0, baseDate: Date = new Date()): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - offsetDays);
  return getLocalDateStr(d);
}

export function getAvailableMonths(): { key: string; label: string; shortLabel: string }[] {
  const options: { key: string; label: string; shortLabel: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const shortLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    options.push({ key, label, shortLabel });
  }
  return options;
}

/**
 * Filters ledger entries according to timeframe:
 * - Daily: Today's transactions
 * - Weekly: Past 7 days (including today)
 * - Monthly: Selected month (YYYY-MM)
 */
export function filterEntriesByTimeframe(
  entries: LedgerEntry[],
  timeframe: TimeframeFilter,
  selectedMonth?: string
): LedgerEntry[] {
  const now = new Date();
  const todayStr = getLocalDateStr(now);
  const sevenDaysAgoStr = getRelativeDate(6, now);
  const activeMonth = selectedMonth || todayStr.substring(0, 7);

  return entries.filter((e) => {
    if (timeframe === 'Daily') {
      return e.date === todayStr;
    }
    if (timeframe === 'Weekly') {
      return e.date >= sevenDaysAgoStr && e.date <= todayStr;
    }
    // Monthly
    return e.date.startsWith(activeMonth);
  });
}

export interface DayGroupedTransactions {
  date: string; // '2026-11-08'
  title: string; // 'Today — 08 Nov 2026' or 'Yesterday — 07 Nov 2026' or '06 Nov 2026, Friday'
  totalAmount: number;
  items: LedgerEntry[];
  badgeColor?: 'peach' | 'lavender' | 'mint';
}

/**
 * Groups settled transactions by day in chronological reverse order
 */
export function groupTransactionsByDay(entries: LedgerEntry[]): DayGroupedTransactions[] {
  const settled = entries
    .filter((e) => e.status === 'SETTLED')
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return (b.time || '').localeCompare(a.time || '');
    });

  const groupsMap = new Map<string, LedgerEntry[]>();

  for (const entry of settled) {
    const list = groupsMap.get(entry.date) || [];
    list.push(entry);
    groupsMap.set(entry.date, list);
  }

  const result: DayGroupedTransactions[] = [];

  const now = new Date();
  const todayStr = getLocalDateStr(now);
  const yesterdayStr = getRelativeDate(1, now);

  for (const [date, items] of groupsMap.entries()) {
    const totalAmount = items
      .filter((i) => i.type === 'EXPENSE')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    let title = date;
    let badgeColor: 'peach' | 'lavender' | 'mint' = 'lavender';

    const parts = date.split('-').map(Number);
    const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(date);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[d.getMonth()];
    const year = d.getFullYear();

    if (date === todayStr) {
      title = `Today — ${dayNum} ${monthName} ${year}`;
      badgeColor = 'peach';
    } else if (date === yesterdayStr) {
      title = `Yesterday — ${dayNum} ${monthName} ${year}`;
      badgeColor = 'lavender';
    } else {
      title = `${dayNum} ${monthName} ${year}, ${dayName}`;
      badgeColor = 'lavender';
    }

    result.push({
      date,
      title,
      totalAmount,
      items,
      badgeColor,
    });
  }

  return result;
}

/**
 * Format currency in Indian numbering format (e.g. ₹38,160 or ₹1,18,000)
 */
export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined) return '₹0';
  const isNeg = val < 0;
  const abs = Math.abs(Math.round(val));

  const str = abs.toString();
  let lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${isNeg ? '-' : ''}₹${formatted}`;
}

/**
 * Formats large currency values compactly for target pills (e.g., 40000 -> ₹40k, 480000 -> ₹480k)
 */
export function formatCompactINR(val: number | null | undefined): string {
  if (val === null || val === undefined || val <= 0) return '₹0';
  if (val >= 1000) {
    const inK = val / 1000;
    const rounded = Number.isInteger(inK) ? String(inK) : inK.toFixed(1).replace(/\.0$/, '');
    return `₹${rounded}k`;
  }
  return formatINR(val);
}

/**
 * Calculates yearly income, expense, savings, and savings rate strictly from settled ledger entries
 */
export function calculateYearlyFinancialTotals(
  _profile: UserSetupProfile,
  yearEntries: LedgerEntry[]
) {
  const settled = yearEntries.filter((e) => e.status === 'SETTLED');

  const totalExpense = settled
    .filter((e) => e.type === 'EXPENSE' && typeof e.amount === 'number')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalIncome = settled
    .filter((e) => e.type === 'INCOME' && typeof e.amount === 'number')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalSavings = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Number(((totalSavings / totalIncome) * 100).toFixed(1)) : 0;

  return {
    totalIncome,
    totalExpense,
    totalSavings,
    savingsRate,
  };
}

/**
 * Filters settled entries strictly within `selectedMonth` according to scoped timeframe:
 * - Monthly: all settled entries in `selectedMonth`
 * - Weekly: 7-day window ending on the latest active day (or today if in current month) within `selectedMonth`
 * - Daily: the latest active day within `selectedMonth`
 */
export function filterMonthEntriesByScopedTimeframe(
  entries: LedgerEntry[],
  timeframe: TimeframeFilter,
  selectedMonth: string
): LedgerEntry[] {
  const monthEntries = entries.filter(
    (e) =>
      e.status === 'SETTLED' &&
      (e.monthKey === selectedMonth || e.date.startsWith(selectedMonth))
  );

  if (timeframe === 'Monthly' || monthEntries.length === 0) {
    return monthEntries;
  }

  // Find latest active day within the selected month
  const latestActiveDay = monthEntries.reduce(
    (max, e) => (e.date > max ? e.date : max),
    monthEntries[0].date
  );

  if (timeframe === 'Daily') {
    return monthEntries.filter((e) => e.date === latestActiveDay);
  }

  // Weekly: 7-day window ending on today (if in current month & >= latestActiveDay) or latestActiveDay
  const todayStr = getLocalDateStr();
  const anchorStr =
    todayStr.startsWith(selectedMonth) && todayStr >= latestActiveDay
      ? todayStr
      : latestActiveDay;

  const [y, m, d] = anchorStr.split('-').map(Number);
  const anchorDate = new Date(y, m - 1, d);
  const weekStartStr = getRelativeDate(6, anchorDate);

  return monthEntries.filter((e) => e.date >= weekStartStr && e.date <= anchorStr);
}

/**
 * Builds a category breakdown array in O(k) directly from pre-aggregated categoryTotals
 */
export function buildCategoryBreakdownFromTotals(
  categoryTotals: Record<string, number>,
  categoriesInput: Category[] | Record<string, Category>
): CategoryBreakdown[] {
  const categoryLookup: Record<string, Category> = Array.isArray(categoriesInput)
    ? Object.fromEntries(categoriesInput.map((c) => [c.id, c]))
    : categoriesInput;

  const entries = Object.entries(categoryTotals).filter(([, amount]) => amount > 0);
  const totalSpent = entries.reduce((sum, [, amount]) => sum + amount, 0);

  return entries
    .map(([catId, amount]) => {
      const cat = categoryLookup[catId] || {
        ...UNKNOWN_CATEGORY,
        id: catId,
      };
      const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        emoji: cat.emoji,
        amount,
        percentage,
        color: cat.color,
        count: 1,
        limit: cat.monthlyLimit,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Builds an aggregated MonthlySummary record for a specific YYYY-MM monthKey
 */
export function buildMonthlySummary(
  monthKey: string,
  profile: UserSetupProfile,
  entries: LedgerEntry[]
): MonthlySummary {
  const monthEntries = entries.filter(
    (e) =>
      e.status === 'SETTLED' &&
      (e.monthKey === monthKey || e.date.startsWith(monthKey))
  );

  const totals = calculateFinancialTotals(profile, monthEntries);

  const categoryTotals: Record<string, number> = {};
  for (const entry of monthEntries) {
    if (entry.type === 'EXPENSE' && typeof entry.amount === 'number' && entry.amount > 0) {
      categoryTotals[entry.categoryId] = (categoryTotals[entry.categoryId] || 0) + entry.amount;
    }
  }

  return {
    monthKey,
    yearKey: monthKey.slice(0, 4),
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    totalSavings: totals.totalSavings,
    monthlySavingsTarget: profile.monthlySavingsTarget ?? 0,
    categoryTotals,
    transactionCount: monthEntries.length,
    updatedAt: Date.now(),
  };
}

/**
 * Builds an aggregated YearlySummary record for a specific YYYY yearKey from monthly summaries
 */
export function buildYearlySummary(
  yearKey: string,
  profile: UserSetupProfile,
  monthlySummariesMap: Record<string, MonthlySummary>
): YearlySummary {
  const yearMonths = Object.values(monthlySummariesMap)
    .filter((m) => m.yearKey === yearKey)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  const monthlyBreakdown: Record<string, { income: number; expense: number; savings: number }> = {};
  let totalIncome = 0;
  let totalExpense = 0;

  for (const m of yearMonths) {
    monthlyBreakdown[m.monthKey] = {
      income: m.totalIncome,
      expense: m.totalExpense,
      savings: m.totalSavings,
    };
    totalIncome += m.totalIncome;
    totalExpense += m.totalExpense;
  }

  const totalSavings = Math.max(0, totalIncome - totalExpense);
  const yearlySavingsTarget = (profile.monthlySavingsTarget ?? 0) * 12;

  return {
    yearKey,
    totalIncome,
    totalExpense,
    totalSavings,
    yearlySavingsTarget,
    monthlyBreakdown,
  };
}

/**
 * Generates initial MonthlySummary and YearlySummary maps from a profile and ledger entries
 */
export function buildAllSummaryTables(
  profile: UserSetupProfile,
  entries: LedgerEntry[]
): {
  monthlySummaries: Record<string, MonthlySummary>;
  yearlySummaries: Record<string, YearlySummary>;
} {
  const currentMonthKey = getLocalDateStr().slice(0, 7);
  const monthKeys = new Set<string>([currentMonthKey]);

  for (const e of entries) {
    if (e.status === 'SETTLED') {
      const mKey = e.monthKey || e.date.slice(0, 7);
      if (mKey) monthKeys.add(mKey);
    }
  }

  const monthlySummaries: Record<string, MonthlySummary> = {};
  const yearKeys = new Set<string>([currentMonthKey.slice(0, 4)]);

  for (const mKey of monthKeys) {
    monthlySummaries[mKey] = buildMonthlySummary(mKey, profile, entries);
    yearKeys.add(mKey.slice(0, 4));
  }

  const yearlySummaries: Record<string, YearlySummary> = {};
  for (const yKey of yearKeys) {
    yearlySummaries[yKey] = buildYearlySummary(yKey, profile, monthlySummaries);
  }

  return { monthlySummaries, yearlySummaries };
}

/**
 * Derives 1-2 uppercase initials from a user's display name (e.g., "Rohan Mathad" -> "RM", "Rohan" -> "R")
 */
export function getUserInitials(name?: string | null): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'R';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}




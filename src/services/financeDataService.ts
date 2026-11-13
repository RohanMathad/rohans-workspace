import {
  Category,
  LedgerEntry,
  MonthlySummary,
  OverviewData,
  OverviewScope,
  PaymentMethod,
  TimeframeFilter,
  UserSetupProfile,
  YearlySummary,
} from '../types/finance.types';
import {
  initialCategories,
  initialLedgerEntries,
  initialMonthlySummaries,
  initialYearlySummaries,
  mobileDaysFlowTrendData,
  weeklyFlowTrendData,
} from '../mockData/financeMockData';
import { initialUserSetupProfile } from '../mockData/userSetupMockData';
import {
  buildAllSummaryTables,
  buildCategoryBreakdownFromTotals,
  buildMonthlySummary,
  buildYearlySummary,
  calculateMoMDelta,
  getLocalDateStr,
  getPreviousMonthKey,
} from './financeLogic';

/**
 * IN-MEMORY DATA STORE (Simulating DB calls)
 * No localStorage persistence as requested.
 * Ready to be swapped with Firebase/REST API routes in future!
 */
let inMemoryProfile: UserSetupProfile = { ...initialUserSetupProfile };
let inMemoryCategories: Category[] = [...initialCategories];
let inMemoryLedgerEntries: LedgerEntry[] = [...initialLedgerEntries];

const cloneMonthlySummaries = (
  source: Record<string, MonthlySummary>
): Record<string, MonthlySummary> => {
  const copy: Record<string, MonthlySummary> = {};
  for (const [key, val] of Object.entries(source)) {
    copy[key] = { ...val, categoryTotals: { ...val.categoryTotals } };
  }
  return copy;
};

const cloneYearlySummaries = (
  source: Record<string, YearlySummary>
): Record<string, YearlySummary> => {
  const copy: Record<string, YearlySummary> = {};
  for (const [key, val] of Object.entries(source)) {
    const breakdownCopy: Record<string, { income: number; expense: number; savings: number }> = {};
    for (const [mKey, mVal] of Object.entries(val.monthlyBreakdown)) {
      breakdownCopy[mKey] = { ...mVal };
    }
    copy[key] = { ...val, monthlyBreakdown: breakdownCopy };
  }
  return copy;
};

let monthly_summaries: Record<string, MonthlySummary> = cloneMonthlySummaries(initialMonthlySummaries);
let yearly_summaries: Record<string, YearlySummary> = cloneYearlySummaries(initialYearlySummaries);

/**
 * Internal helper: Recomputes MonthlySummary for `monthKey` and its parent YearlySummary.
 * Triggered automatically whenever a settled transaction is added, edited, deleted, or settled from basket.
 */
function recalculateMonthAndYearSummary(monthKey: string): void {
  if (!monthKey) return;
  const normalizedMonthKey = monthKey.slice(0, 7);
  monthly_summaries[normalizedMonthKey] = buildMonthlySummary(
    normalizedMonthKey,
    inMemoryProfile,
    inMemoryLedgerEntries
  );

  const yearKey = normalizedMonthKey.slice(0, 4);
  yearly_summaries[yearKey] = buildYearlySummary(yearKey, inMemoryProfile, monthly_summaries);
}

/**
 * Internal helper: Rebuilds all MonthlySummary and YearlySummary records (e.g. when base income or target changes).
 */
function rebuildAllSummaries(): void {
  const rebuilt = buildAllSummaryTables(inMemoryProfile, inMemoryLedgerEntries);
  monthly_summaries = rebuilt.monthlySummaries;
  yearly_summaries = rebuilt.yearlySummaries;
}

// Helper to simulate network micro-latency if needed
const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

export const financeDataService = {
  /**
   * Fetch current user setup profile
   */
  async getUserProfile(): Promise<UserSetupProfile> {
    await delay();
    return { ...inMemoryProfile };
  },

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserSetupProfile>): Promise<UserSetupProfile> {
    await delay();
    inMemoryProfile = {
      ...inMemoryProfile,
      ...updates,
    };
    rebuildAllSummaries();
    return { ...inMemoryProfile };
  },

  /**
   * Complete initial setup wizard
   */
  async completeSetup(data: {
    userName: string;
    monthlyBaseIncome: number;
    monthlyBudgetCap?: number;
    categories?: Category[];
  }): Promise<UserSetupProfile> {
    await delay();
    inMemoryProfile = {
      ...inMemoryProfile,
      userName: data.userName,
      monthlyBaseIncome: data.monthlyBaseIncome,
      monthlyBudgetCap: data.monthlyBudgetCap || Math.round(data.monthlyBaseIncome * 0.6),
      isSetupComplete: true,
    };
    if (data.categories && data.categories.length > 0) {
      inMemoryCategories = [...data.categories];
    }
    rebuildAllSummaries();
    return { ...inMemoryProfile };
  },

  /**
   * Reset profile or data for testing/demoing onboarding
   */
  async resetToSetupDemo(): Promise<UserSetupProfile> {
    await delay();
    inMemoryProfile.isSetupComplete = false;
    return { ...inMemoryProfile };
  },

  /**
   * Reset all mock data to initial seeds
   */
  async resetAllData(): Promise<void> {
    await delay();
    inMemoryProfile = { ...initialUserSetupProfile };
    inMemoryCategories = [...initialCategories];
    inMemoryLedgerEntries = [...initialLedgerEntries];
    monthly_summaries = cloneMonthlySummaries(initialMonthlySummaries);
    yearly_summaries = cloneYearlySummaries(initialYearlySummaries);
  },

  /**
   * O(1) read for pre-aggregated MonthlySummary record
   */
  async getMonthlySummary(monthKey: string): Promise<MonthlySummary> {
    await delay();
    const existing = monthly_summaries[monthKey];
    if (existing) {
      return {
        ...existing,
        categoryTotals: { ...existing.categoryTotals },
      };
    }
    // Empty month fallback (with current base income & savings target)
    return buildMonthlySummary(monthKey, inMemoryProfile, []);
  },

  /**
   * O(1) read for pre-aggregated YearlySummary record
   */
  async getYearlySummary(yearKey: string): Promise<YearlySummary> {
    await delay();
    const existing = yearly_summaries[yearKey];
    if (existing) {
      const breakdownCopy: Record<string, { income: number; expense: number; savings: number }> = {};
      for (const [k, v] of Object.entries(existing.monthlyBreakdown)) {
        breakdownCopy[k] = { ...v };
      }
      return {
        ...existing,
        monthlyBreakdown: breakdownCopy,
      };
    }
    return buildYearlySummary(yearKey, inMemoryProfile, monthly_summaries);
  },

  /**
   * Get all categories (active or archived)
   */
  async getCategories(includeArchived = false): Promise<Category[]> {
    await delay();
    if (includeArchived) return [...inMemoryCategories];
    return inMemoryCategories.filter((c) => !c.isArchived);
  },

  /**
   * Add a new category
   */
  async addCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    await delay();
    const newCategory: Category = {
      ...cat,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    inMemoryCategories.push(newCategory);
    return newCategory;
  },

  /**
   * Update category
   */
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    await delay();
    const index = inMemoryCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Category ${id} not found`);
    inMemoryCategories[index] = { ...inMemoryCategories[index], ...updates };
    return inMemoryCategories[index];
  },

  /**
   * Soft-archive category (NEVER permanently delete to prevent orphaned transactions)
   */
  async deleteCategory(id: string): Promise<boolean> {
    return this.archiveCategory(id, true);
  },

  /**
   * Archive category (or set archived state)
   */
  async archiveCategory(id: string, isArchived: boolean = true): Promise<boolean> {
    await delay();
    const index = inMemoryCategories.findIndex((c) => c.id === id);
    if (index === -1) return false;
    inMemoryCategories[index].isArchived = isArchived;
    return true;
  },

  /**
   * Restore archived category
   */
  async restoreCategory(id: string): Promise<boolean> {
    return this.archiveCategory(id, false);
  },

  /**
   * Dual-Month Window Fetching:
   * Returns settled entries matching either selectedMonth OR the previousMonthKey.
   * Flat query designed for single Firestore `where('monthKey', 'in', [selectedMonth, prevMonth])`.
   */
  async getSettledEntriesForMonthWindow(selectedMonth: string): Promise<LedgerEntry[]> {
    await delay();
    const prevMonth = getPreviousMonthKey(selectedMonth);
    return inMemoryLedgerEntries.filter(
      (e) =>
        e.status === 'SETTLED' &&
        (e.monthKey === selectedMonth ||
          e.monthKey === prevMonth ||
          e.date.startsWith(selectedMonth) ||
          e.date.startsWith(prevMonth))
    );
  },

  /**
   * Time-Independent Basket:
   * Returns all planned basket items completely independent of selectedMonth (monthKey: null).
   * Unbought basket items remain visible across all months until settled or deleted.
   */
  async getBasketPlannedEntries(): Promise<LedgerEntry[]> {
    await delay();
    return inMemoryLedgerEntries.filter((e) => e.status === 'BASKET_PLANNED');
  },

  /**
   * Flat query for ledger entries (no multi-field composite indexes)
   */
  async getLedgerEntries(filter?: {
    status?: 'BASKET_PLANNED' | 'SETTLED';
    categoryId?: string;
    month?: string;
  }): Promise<LedgerEntry[]> {
    await delay();
    let result = [...inMemoryLedgerEntries];
    if (filter?.status) {
      result = result.filter((e) => e.status === filter.status);
    }
    if (filter?.categoryId && filter.categoryId !== 'all') {
      result = result.filter((e) => e.categoryId === filter.categoryId);
    }
    if (filter?.month) {
      if (filter.status === 'BASKET_PLANNED') {
        // Basket items remain visible across all months
      } else {
        result = result.filter(
          (e) => e.monthKey === filter.month || e.date.startsWith(filter.month!)
        );
      }
    }
    return result;
  },

  /**
   * Add a new direct expense / income transaction and sync monthly/yearly summaries
   */
  async addExpense(entry: {
    title: string;
    categoryId: string;
    amount: number;
    type?: 'EXPENSE' | 'INCOME';
    date?: string;
    time?: string;
    paymentMethod?: PaymentMethod | string;
    merchantOrPlatform?: string;
    notes?: string;
  }): Promise<LedgerEntry> {
    await delay();
    const now = new Date();
    const defaultDate = entry.date || getLocalDateStr();
    const timestamp = new Date(defaultDate).getTime();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = entry.time || `${((hours + 11) % 12) + 1}:${minutes} ${ampm}`;

    const newEntry: LedgerEntry = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: entry.title,
      categoryId: entry.categoryId,
      amount: entry.amount,
      status: 'SETTLED',
      type: entry.type || 'EXPENSE',
      date: defaultDate,
      dayKey: defaultDate,
      monthKey: defaultDate.slice(0, 7),
      dateTimestamp: timestamp,
      createdAt: Date.now(),
      time: formattedTime,
      paymentMethod: entry.paymentMethod || 'UPI / GPay',
      merchantOrPlatform: entry.merchantOrPlatform || entry.paymentMethod || 'Card',
      notes: entry.notes,
      tagStatus: 'Completed',
    };

    inMemoryLedgerEntries.unshift(newEntry);
    if (newEntry.monthKey) {
      recalculateMonthAndYearSummary(newEntry.monthKey);
    }
    return newEntry;
  },

  /**
   * Alias for addExpense
   */
  async addTransaction(entry: {
    title: string;
    categoryId: string;
    amount: number;
    type?: 'EXPENSE' | 'INCOME';
    date?: string;
    time?: string;
    paymentMethod?: PaymentMethod | string;
    merchantOrPlatform?: string;
    notes?: string;
  }): Promise<LedgerEntry> {
    return this.addExpense(entry);
  },

  /**
   * Add planned item to basket (amount: null, status: 'BASKET_PLANNED', monthKey: null)
   */
  async addBasketItem(
    title: string,
    categoryId: string,
    estimatedAmount?: number,
    notes?: string
  ): Promise<LedgerEntry> {
    await delay();
    const today = getLocalDateStr();
    const timestamp = new Date(today).getTime();
    const newBasketItem: LedgerEntry = {
      id: `bsk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      categoryId,
      amount: null,
      estimatedAmount: estimatedAmount || undefined,
      status: 'BASKET_PLANNED',
      type: 'EXPENSE',
      date: today,
      dayKey: today,
      monthKey: null, // Time-independent: unbought basket items are month-agnostic
      dateTimestamp: timestamp,
      createdAt: Date.now(),
      notes,
    };

    inMemoryLedgerEntries.push(newBasketItem);
    return newBasketItem;
  },

  /**
   * Update a planned basket item (e.g. title, categoryId, estimatedAmount)
   */
  async updateBasketItem(
    id: string,
    updates: {
      title?: string;
      categoryId?: string;
      estimatedAmount?: number;
      notes?: string;
    }
  ): Promise<LedgerEntry> {
    return this.updateTransaction(id, updates);
  },

  /**
   * Delete a planned basket item
   */
  async deleteBasketItem(id: string): Promise<boolean> {
    return this.deleteTransaction(id);
  },

  /**
   * Move item from Basket to Expense Ledger with exact Settlement Date Stamping and summary sync
   */
  async settleBasketItem(
    id: string,
    actualAmount: number,
    paymentMethod: PaymentMethod | string,
    purchaseDateStr?: string,
    notes?: string
  ): Promise<LedgerEntry> {
    await delay();
    const index = inMemoryLedgerEntries.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`Basket item ${id} not found`);

    const existing = inMemoryLedgerEntries[index];
    const dateStr = purchaseDateStr || getLocalDateStr();
    const timestamp = new Date(dateStr).getTime();
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${((hours + 11) % 12) + 1}:${minutes} ${ampm}`;

    const updated: LedgerEntry = {
      ...existing,
      status: 'SETTLED',
      amount: actualAmount,
      date: dateStr,
      dayKey: dateStr,
      monthKey: dateStr.slice(0, 7),
      dateTimestamp: timestamp,
      time: formattedTime,
      paymentMethod,
      merchantOrPlatform: paymentMethod,
      notes: notes || existing.notes,
      settledAt: new Date().toISOString(),
      tagStatus: 'Completed',
      // Audit guarantee: createdAt is preserved untouched
    };

    inMemoryLedgerEntries[index] = updated;
    if (updated.monthKey) {
      recalculateMonthAndYearSummary(updated.monthKey);
    }
    return updated;
  },

  /**
   * Update an existing transaction entry with automatic Date Re-Indexing & summary sync (old + new month)
   */
  async updateTransaction(
    id: string,
    updatedFields: Partial<LedgerEntry>
  ): Promise<LedgerEntry> {
    await delay();
    const index = inMemoryLedgerEntries.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`Transaction ${id} not found`);

    const existing = inMemoryLedgerEntries[index];
    const prevMonthKey = existing.monthKey || existing.date.slice(0, 7);
    const prevStatus = existing.status;

    const newDate = updatedFields.date || existing.date;
    const isDateChanged = Boolean(updatedFields.date && updatedFields.date !== existing.date);

    let newDateTimestamp = existing.dateTimestamp;
    let newDayKey = existing.dayKey || existing.date;
    let newMonthKey = existing.monthKey;

    if (isDateChanged || !newDateTimestamp) {
      newDateTimestamp = new Date(newDate).getTime();
      newDayKey = newDate;
      if (existing.status === 'SETTLED' || updatedFields.status === 'SETTLED') {
        newMonthKey = newDate.slice(0, 7);
      }
    }

    const updated: LedgerEntry = {
      ...existing,
      ...updatedFields,
      date: newDate,
      dayKey: newDayKey,
      monthKey: newMonthKey,
      dateTimestamp: newDateTimestamp,
    };

    inMemoryLedgerEntries[index] = updated;

    // Auto-sync summary tables for both previous and new month if settled
    if (prevStatus === 'SETTLED' && prevMonthKey) {
      recalculateMonthAndYearSummary(prevMonthKey);
    }
    if (updated.status === 'SETTLED' && updated.monthKey && updated.monthKey !== prevMonthKey) {
      recalculateMonthAndYearSummary(updated.monthKey);
    }

    return updated;
  },

  /**
   * Delete transaction entry and sync monthly/yearly summaries
   */
  async deleteTransaction(id: string): Promise<boolean> {
    await delay();
    const target = inMemoryLedgerEntries.find((e) => e.id === id);
    if (!target) return false;

    inMemoryLedgerEntries = inMemoryLedgerEntries.filter((e) => e.id !== id);

    if (target.status === 'SETTLED') {
      const targetMonthKey = target.monthKey || target.date.slice(0, 7);
      if (targetMonthKey) {
        recalculateMonthAndYearSummary(targetMonthKey);
      }
    }
    return true;
  },

  /**
   * Delete entry (either settled or basket)
   */
  async deleteLedgerEntry(id: string): Promise<boolean> {
    return this.deleteTransaction(id);
  },

  /**
   * Get Overview dashboard metrics & chart data in O(1) directly from MonthlySummary / YearlySummary tables.
   * Where Money Went (categorySpend) is ALWAYS locked strictly to the Current Month.
   */
  async getOverviewData(
    timeframe: TimeframeFilter = 'Weekly',
    scope: OverviewScope = 'Monthly'
  ): Promise<OverviewData> {
    await delay();

    const currentMonthKey = getLocalDateStr().substring(0, 7);
    const prevMonthKey = getPreviousMonthKey(currentMonthKey);
    const currentYear = currentMonthKey.slice(0, 4);
    const prevYear = String(Number(currentYear) - 1);

    // O(1) summary reads
    const currentMonthSummary =
      monthly_summaries[currentMonthKey] || buildMonthlySummary(currentMonthKey, inMemoryProfile, []);
    const prevMonthSummary =
      monthly_summaries[prevMonthKey] || buildMonthlySummary(prevMonthKey, inMemoryProfile, []);

    const currentMonthExpenseDelta = calculateMoMDelta(
      currentMonthSummary.totalExpense,
      prevMonthSummary.totalExpense
    );

    // Where Money Went stays locked strictly to Current Month summary categoryTotals
    const categorySpend = buildCategoryBreakdownFromTotals(
      currentMonthSummary.categoryTotals,
      inMemoryCategories
    );

    let totalIncome = currentMonthSummary.totalIncome;
    let totalExpense = currentMonthSummary.totalExpense;
    let totalSavings = currentMonthSummary.totalSavings;
    let savingsRate =
      totalIncome > 0 ? Number(((totalSavings / totalIncome) * 100).toFixed(1)) : 0;

    let incomeDeltaMoM = calculateMoMDelta(
      currentMonthSummary.totalIncome,
      prevMonthSummary.totalIncome
    );
    let expenseDeltaMoM = currentMonthExpenseDelta;
    let savingsDeltaMoM = calculateMoMDelta(
      currentMonthSummary.totalSavings,
      prevMonthSummary.totalSavings
    );

    if (scope === 'Yearly') {
      const currentYearSummary =
        yearly_summaries[currentYear] ||
        buildYearlySummary(currentYear, inMemoryProfile, monthly_summaries);
      const prevYearSummary = yearly_summaries[prevYear];

      totalIncome = currentYearSummary.totalIncome;
      totalExpense = currentYearSummary.totalExpense;
      totalSavings = currentYearSummary.totalSavings;
      savingsRate =
        totalIncome > 0 ? Number(((totalSavings / totalIncome) * 100).toFixed(1)) : 0;

      if (prevYearSummary && Object.keys(prevYearSummary.monthlyBreakdown).length > 0) {
        incomeDeltaMoM = calculateMoMDelta(totalIncome, prevYearSummary.totalIncome);
        expenseDeltaMoM = calculateMoMDelta(totalExpense, prevYearSummary.totalExpense);
        savingsDeltaMoM = calculateMoMDelta(totalSavings, prevYearSummary.totalSavings);
      } else {
        incomeDeltaMoM = 0;
        expenseDeltaMoM = 0;
        savingsDeltaMoM = 0;
      }
    }

    // Basket items are time-independent
    const plannedItems = inMemoryLedgerEntries.filter((e) => e.status === 'BASKET_PLANNED');
    const activeBasketCount = plannedItems.length;
    const activeBasketEstTotal = plannedItems.reduce(
      (sum, item) => sum + (item.estimatedAmount || 0),
      0
    );

    // Recent settled transactions in current month (sorted descending)
    const recentTransactions = inMemoryLedgerEntries
      .filter(
        (e) =>
          e.status === 'SETTLED' &&
          (e.monthKey === currentMonthKey || e.date.startsWith(currentMonthKey))
      )
      .sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0))
      .slice(0, 6);

    const currentMonthShort = new Date().toLocaleDateString('en-US', { month: 'short' });
    let flowTrend = weeklyFlowTrendData;
    if (timeframe === 'Daily') {
      flowTrend = mobileDaysFlowTrendData;
    } else if (timeframe === 'Monthly') {
      flowTrend = [
        { label: 'Jun', savings: 54000, expense: 32000 },
        { label: 'Jul', savings: 61000, expense: 35000 },
        { label: 'Aug', savings: 59000, expense: 38000 },
        { label: 'Sep', savings: 72000, expense: 44120 },
        { label: 'Oct', savings: 68000, expense: 52400 },
        {
          label: currentMonthShort,
          savings: currentMonthSummary.totalSavings,
          expense: currentMonthSummary.totalExpense,
          isPeak: true,
        },
      ];
    }

    return {
      profile: { ...inMemoryProfile },
      scope,
      totalIncome,
      totalExpense,
      totalSavings,
      savingsRate,
      budgetCap: inMemoryProfile.monthlyBudgetCap,
      incomeDeltaMoM,
      expenseDeltaMoM,
      savingsDeltaMoM,
      currentMonthExpense: currentMonthSummary.totalExpense,
      currentMonthExpenseDelta,
      flowTrend,
      categorySpend,
      recentTransactions,
      activeBasketCount,
      activeBasketEstTotal,
    };
  },
};


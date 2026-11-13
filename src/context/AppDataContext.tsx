import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Category,
  LedgerEntry,
  MonthOption,
  MonthlySummary,
  OverviewData,
  OverviewScope,
  PaymentMethod,
  TimeframeFilter,
  UserSetupProfile,
  YearlySummary,
} from '../types/finance.types';
import { financeDataService } from '../services/financeDataService';
import {
  calculateMoMDelta,
  filterEntriesByTimeframe,
  getAvailableMonths,
  getLocalDateStr,
  getPreviousMonthKey,
} from '../services/financeLogic';

export type FinanceTab = 'overview' | 'activity' | 'basket' | 'reports' | 'categories';
export type LifeOsModule = 'finance' | 'basket' | 'health' | 'habits' | 'settings';

interface AppDataContextType {
  profile: UserSetupProfile | null;
  categories: Category[];
  activeCategories: Category[];
  categoryMap: Record<string, Category>;
  ledgerEntries: LedgerEntry[];
  filteredEntries: LedgerEntry[];
  overviewData: OverviewData | null;
  selectedMonthSummary: MonthlySummary | null;
  currentYearSummary: YearlySummary | null;
  isLoading: boolean;
  activeTab: FinanceTab;
  activeModule: LifeOsModule;
  selectedCategoryFilter: string;
  isQuickAddOpen: boolean;
  editingTransaction: LedgerEntry | null;
  settleBasketItemTarget: LedgerEntry | null;
  isMobileDrawerOpen: boolean;
  timeframeFilter: TimeframeFilter;
  overviewScope: OverviewScope;
  selectedMonth: string;
  availableMonths: MonthOption[];
  incomeDeltaMoM: number;
  expenseDeltaMoM: number;
  savingsDeltaMoM: number;
  
  // Navigation & state setters
  setActiveTab: (tab: FinanceTab) => void;
  setActiveModule: (module: LifeOsModule) => void;
  setSelectedCategoryFilter: (catId: string) => void;
  setTimeframeFilter: (filter: TimeframeFilter) => void;
  setOverviewScope: (scope: OverviewScope) => void;
  setSelectedMonth: (month: string) => void;
  setIsMobileDrawerOpen: (open: boolean) => void;
  
  // Modals
  openQuickAdd: () => void;
  openEditModal: (entry: LedgerEntry) => void;
  closeQuickAdd: () => void;
  openSettleModal: (item: LedgerEntry) => void;
  closeSettleModal: () => void;
  
  // Actions
  refreshData: () => Promise<void>;
  addDirectExpense: (entry: {
    title: string;
    categoryId: string;
    amount: number;
    type?: 'EXPENSE' | 'INCOME';
    date?: string;
    paymentMethod?: PaymentMethod | string;
    notes?: string;
  }) => Promise<void>;
  updateTransaction: (id: string, updatedFields: Partial<LedgerEntry>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBasketItem: (
    title: string,
    categoryId: string,
    estimatedAmount?: number,
    notes?: string
  ) => Promise<void>;
  updateBasketItem: (
    id: string,
    updates: {
      title?: string;
      categoryId?: string;
      estimatedAmount?: number;
      notes?: string;
    }
  ) => Promise<void>;
  deleteBasketItem: (id: string) => Promise<void>;
  settleItem: (
    id: string,
    actualAmount: number,
    paymentMethod: PaymentMethod | string,
    date?: string,
    notes?: string
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addNewCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  archiveCategory: (id: string) => Promise<void>;
  restoreCategory: (id: string) => Promise<void>;
  completeSetup: (data: {
    userName: string;
    currencySymbol?: string;
    monthlyBaseIncome?: number;
    monthlySavingsTarget?: number;
    monthlyBudgetCap?: number;
    categories?: Category[];
  }) => Promise<void>;
  loginOrCreateWorkspace: (
    userName: string,
    pin: string,
    monthlySavingsTarget?: number,
    options?: { currencySymbol?: string; categories?: Category[] }
  ) => Promise<void>;
  logout: () => Promise<void>;
  activeWorkspaceId: string | null;
  updateSavingsTarget: (target: number) => Promise<void>;
  resetToSetupDemo: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserSetupProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [selectedMonthSummary, setSelectedMonthSummary] = useState<MonthlySummary | null>(null);
  const [currentYearSummary, setCurrentYearSummary] = useState<YearlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic MoM deltas state
  const [incomeDeltaMoM, setIncomeDeltaMoM] = useState<number>(17);
  const [expenseDeltaMoM, setExpenseDeltaMoM] = useState<number>(12);
  const [savingsDeltaMoM, setSavingsDeltaMoM] = useState<number>(45);

  const availableMonths = useMemo(() => getAvailableMonths(), []);
  const [selectedMonth, setSelectedMonthState] = useState<string>(
    availableMonths[0]?.key || getLocalDateStr().substring(0, 7)
  );

  const [activeTab, setActiveTabState] = useState<FinanceTab>('overview');
  const [activeModule, setActiveModuleState] = useState<LifeOsModule>('finance');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilterState] = useState<TimeframeFilter>('Weekly');
  const [overviewScope, setOverviewScope] = useState<OverviewScope>('Monthly');

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<LedgerEntry | null>(null);
  const [settleBasketItemTarget, setSettleBasketItemTarget] = useState<LedgerEntry | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Architectural Safeguard 1: In-Memory Category Lookup Map
  // Resolves category details dynamically with safe fallback
  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const cat of categories) {
      map[cat.id] = cat;
    }
    return map;
  }, [categories]);

  // Architectural Safeguard 2: Active categories for dropdowns (excluding archived)
  const activeCategories = useMemo(() => {
    return categories.filter((c) => !c.isArchived);
  }, [categories]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() =>
    financeDataService.getActiveWorkspaceId()
  );

  // Architectural Safeguard 3 & 4: Dual-Month Window Fetching & O(1) Summary Reads
  const refreshData = useCallback(async () => {
    try {
      const currentWorkspaceId = financeDataService.getActiveWorkspaceId();
      setActiveWorkspaceId(currentWorkspaceId);

      if (!currentWorkspaceId) {
        const uProfile = await financeDataService.getUserProfile();
        setProfile(uProfile);
        setCategories([]);
        setLedgerEntries([]);
        setOverviewData(null);
        setSelectedMonthSummary(null);
        setCurrentYearSummary(null);
        setIncomeDeltaMoM(0);
        setExpenseDeltaMoM(0);
        setSavingsDeltaMoM(0);
        return;
      }

      const prevMonth = getPreviousMonthKey(selectedMonth);
      const selectedYear = selectedMonth.slice(0, 4);

      const [
        uProfile,
        uCats,
        windowEntries,
        basketEntries,
        uOverview,
        curMonthSum,
        prevMonthSum,
        curYearSum,
      ] = await Promise.all([
        financeDataService.getUserProfile(),
        financeDataService.getCategories(true),
        financeDataService.getSettledEntriesForMonthWindow(selectedMonth),
        financeDataService.getBasketPlannedEntries(),
        financeDataService.getOverviewData(timeframeFilter, overviewScope),
        financeDataService.getMonthlySummary(selectedMonth),
        financeDataService.getMonthlySummary(prevMonth),
        financeDataService.getYearlySummary(selectedYear),
      ]);

      // Compute dynamic Month-over-Month deltas in O(1) from summary records
      setIncomeDeltaMoM(calculateMoMDelta(curMonthSum.totalIncome, prevMonthSum.totalIncome));
      setExpenseDeltaMoM(calculateMoMDelta(curMonthSum.totalExpense, prevMonthSum.totalExpense));
      setSavingsDeltaMoM(calculateMoMDelta(curMonthSum.totalSavings, prevMonthSum.totalSavings));

      // Combine settled entries with time-independent basket items
      // (Basket items are month-independent and always present)
      const mergedEntries = [...windowEntries, ...basketEntries];

      setProfile(uProfile);
      setCategories(uCats);
      setLedgerEntries(mergedEntries);
      setOverviewData(uOverview);
      setSelectedMonthSummary(curMonthSum);
      setCurrentYearSummary(curYearSum);
    } finally {
      setIsLoading(false);
    }
  }, [timeframeFilter, selectedMonth, overviewScope]);

  // Architectural Safeguard 5: Zero composite index queries
  // In-memory chronological sorting and timeframe filtering
  const sortedLedgerEntries = useMemo(() => {
    return [...ledgerEntries].sort(
      (a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0)
    );
  }, [ledgerEntries]);

  const filteredEntries = useMemo(() => {
    let list = filterEntriesByTimeframe(sortedLedgerEntries, timeframeFilter, selectedMonth);
    if (selectedCategoryFilter !== 'all') {
      list = list.filter((e) => e.categoryId === selectedCategoryFilter);
    }
    return list;
  }, [sortedLedgerEntries, timeframeFilter, selectedMonth, selectedCategoryFilter]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const setSelectedMonth = (month: string) => {
    setSelectedMonthState(month);
  };

  const setActiveTab = (tab: FinanceTab) => {
    setActiveTabState(tab);
    if (activeModule !== 'finance' && activeModule !== 'basket') {
      setActiveModuleState('finance');
    }
  };

  const setActiveModule = (module: LifeOsModule) => {
    setActiveModuleState(module);
    if (module === 'basket') {
      setActiveTabState('basket');
    } else if (module === 'finance') {
      if (activeTab === 'basket' || activeTab === 'categories') {
        setActiveTabState('overview');
      }
    }
  };

  const setTimeframeFilter = (filter: TimeframeFilter) => {
    setTimeframeFilterState(filter);
  };

  const openQuickAdd = () => {
    setEditingTransaction(null);
    setIsQuickAddOpen(true);
  };

  const openEditModal = (entry: LedgerEntry) => {
    setEditingTransaction(entry);
    setIsQuickAddOpen(true);
  };

  const closeQuickAdd = () => {
    setIsQuickAddOpen(false);
    setEditingTransaction(null);
  };

  const openSettleModal = (item: LedgerEntry) => {
    setSettleBasketItemTarget(item);
  };
  const closeSettleModal = () => {
    setSettleBasketItemTarget(null);
  };

  const addDirectExpense = async (entry: {
    title: string;
    categoryId: string;
    amount: number;
    type?: 'EXPENSE' | 'INCOME';
    date?: string;
    paymentMethod?: PaymentMethod | string;
    notes?: string;
  }) => {
    await financeDataService.addExpense(entry);
    await refreshData();
    closeQuickAdd();
  };

  const updateTransaction = async (id: string, updatedFields: Partial<LedgerEntry>) => {
    await financeDataService.updateTransaction(id, updatedFields);
    await refreshData();
    closeQuickAdd();
  };

  const deleteTransaction = async (id: string) => {
    await financeDataService.deleteTransaction(id);
    await refreshData();
  };

  const addBasketItem = async (
    title: string,
    categoryId: string,
    estimatedAmount?: number,
    notes?: string
  ) => {
    await financeDataService.addBasketItem(title, categoryId, estimatedAmount, notes);
    await refreshData();
  };

  const updateBasketItem = async (
    id: string,
    updates: {
      title?: string;
      categoryId?: string;
      estimatedAmount?: number;
      notes?: string;
    }
  ) => {
    await financeDataService.updateBasketItem(id, updates);
    await refreshData();
  };

  const deleteBasketItem = async (id: string) => {
    await financeDataService.deleteBasketItem(id);
    await refreshData();
  };

  const settleItem = async (
    id: string,
    actualAmount: number,
    paymentMethod: PaymentMethod | string,
    date?: string,
    notes?: string
  ) => {
    await financeDataService.settleBasketItem(id, actualAmount, paymentMethod, date, notes);
    await refreshData();
    closeSettleModal();
  };

  const deleteEntry = async (id: string) => {
    await deleteTransaction(id);
  };

  const addNewCategory = async (cat: Omit<Category, 'id'>) => {
    await financeDataService.addCategory(cat);
    await refreshData();
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await financeDataService.updateCategory(id, updates);
    await refreshData();
  };

  const deleteCategory = async (id: string) => {
    // Soft-archive to protect historical transactions from breaking
    await financeDataService.deleteCategory(id);
    await refreshData();
  };

  const archiveCategory = async (id: string) => {
    await financeDataService.archiveCategory(id, true);
    await refreshData();
  };

  const restoreCategory = async (id: string) => {
    await financeDataService.restoreCategory(id);
    await refreshData();
  };

  const completeSetup = async (data: {
    userName: string;
    currencySymbol?: string;
    monthlyBaseIncome?: number;
    monthlySavingsTarget?: number;
    monthlyBudgetCap?: number;
    categories?: Category[];
  }) => {
    await financeDataService.completeSetup(data);
    await refreshData();
    setActiveTabState('overview');
  };

  const loginOrCreateWorkspace = async (
    userName: string,
    pin: string,
    monthlySavingsTarget?: number,
    options?: { currencySymbol?: string; categories?: Category[] }
  ) => {
    await financeDataService.loginOrCreateWorkspace(userName, pin, monthlySavingsTarget, options);
    await refreshData();
    setActiveModuleState('finance');
    setActiveTabState('overview');
  };

  const logout = async () => {
    await financeDataService.logoutWorkspace();
    setIsMobileDrawerOpen(false);
    setSelectedCategoryFilter('all');
    setActiveModuleState('finance');
    setActiveTabState('overview');
    await refreshData();
  };

  const updateSavingsTarget = async (target: number) => {
    await financeDataService.updateUserProfile({ monthlySavingsTarget: target });
    await refreshData();
  };

  const resetToSetupDemo = async () => {
    await financeDataService.resetToSetupDemo();
    await refreshData();
  };

  const resetAllData = async () => {
    await financeDataService.resetAllData();
    await refreshData();
  };

  return (
    <AppDataContext.Provider
      value={{
        profile,
        categories,
        activeCategories,
        categoryMap,
        ledgerEntries,
        filteredEntries,
        overviewData,
        selectedMonthSummary,
        currentYearSummary,
        isLoading,
        activeTab,
        activeModule,
        selectedCategoryFilter,
        isQuickAddOpen,
        editingTransaction,
        settleBasketItemTarget,
        isMobileDrawerOpen,
        timeframeFilter,
        overviewScope,
        selectedMonth,
        availableMonths,
        incomeDeltaMoM,
        expenseDeltaMoM,
        savingsDeltaMoM,
        setActiveTab,
        setActiveModule,
        setSelectedCategoryFilter,
        setTimeframeFilter,
        setOverviewScope,
        setSelectedMonth,
        setIsMobileDrawerOpen,
        openQuickAdd,
        openEditModal,
        closeQuickAdd,
        openSettleModal,
        closeSettleModal,
        refreshData,
        addDirectExpense,
        updateTransaction,
        deleteTransaction,
        addBasketItem,
        updateBasketItem,
        deleteBasketItem,
        settleItem,
        deleteEntry,
        addNewCategory,
        updateCategory,
        deleteCategory,
        archiveCategory,
        restoreCategory,
        completeSetup,
        loginOrCreateWorkspace,
        logout,
        activeWorkspaceId,
        updateSavingsTarget,
        resetToSetupDemo,
        resetAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

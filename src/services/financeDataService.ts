import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
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
import { initialCategories } from '../mockData/financeMockData';
import { initialUserSetupProfile } from '../mockData/userSetupMockData';
import {
  buildAllSummaryTables,
  buildCategoryBreakdownFromTotals,
  buildMonthlySummary,
  buildYearlySummary,
  calculateMoMDelta,
  getAvailableMonths,
  getLocalDateStr,
  getPreviousMonthKey,
  getRelativeDate,
} from './financeLogic';
import { db } from './firebaseConfig';

const cleanForFirestore = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Persistent lightweight session pointer (stores ONLY workspaceId, never financial data)
export const WORKSPACE_SESSION_KEY = 'lifeos_active_workspace_id';

// Firestore collection & document constants
const WORKSPACES_ROOT = 'workspaces';
const PROFILE_DOC_ID = 'profile';
const CONFIG_SUBCOLLECTION = 'config';
const CATEGORIES_COLLECTION = 'categories';
const LEDGER_COLLECTION = 'ledger_entries';
const MONTHLY_SUMMARIES_COLLECTION = 'monthly_summaries';
const YEARLY_SUMMARIES_COLLECTION = 'yearly_summaries';

const isNodeTestRuntime = typeof window === 'undefined';
let nodeTestWorkspaceId: string | null = 'test_0000';

export function buildWorkspaceId(userName: string, pin: string): string {
  const normalizedName = userName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const normalizedPin = pin.trim();
  return `${normalizedName}_${normalizedPin}`;
}

export function getActiveWorkspaceId(): string | null {
  if (isNodeTestRuntime) {
    return nodeTestWorkspaceId;
  }
  try {
    return window.localStorage.getItem(WORKSPACE_SESSION_KEY);
  } catch {
    return null;
  }
}

function setActiveWorkspaceId(workspaceId: string | null): void {
  if (isNodeTestRuntime) {
    nodeTestWorkspaceId = workspaceId;
    return;
  }
  try {
    if (workspaceId) {
      window.localStorage.setItem(WORKSPACE_SESSION_KEY, workspaceId);
    } else {
      window.localStorage.removeItem(WORKSPACE_SESSION_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

const profileDocRef = (workspaceId: string) =>
  doc(db, WORKSPACES_ROOT, workspaceId, CONFIG_SUBCOLLECTION, PROFILE_DOC_ID);
const categoriesColRef = (workspaceId: string) =>
  collection(db, WORKSPACES_ROOT, workspaceId, CATEGORIES_COLLECTION);
const categoryDocRef = (workspaceId: string, categoryId: string) =>
  doc(db, WORKSPACES_ROOT, workspaceId, CATEGORIES_COLLECTION, categoryId);
const ledgerColRef = (workspaceId: string) =>
  collection(db, WORKSPACES_ROOT, workspaceId, LEDGER_COLLECTION);
const ledgerDocRef = (workspaceId: string, entryId: string) =>
  doc(db, WORKSPACES_ROOT, workspaceId, LEDGER_COLLECTION, entryId);
const monthlySummariesColRef = (workspaceId: string) =>
  collection(db, WORKSPACES_ROOT, workspaceId, MONTHLY_SUMMARIES_COLLECTION);
const monthlySummaryDocRef = (workspaceId: string, monthKey: string) =>
  doc(db, WORKSPACES_ROOT, workspaceId, MONTHLY_SUMMARIES_COLLECTION, monthKey);
const yearlySummariesColRef = (workspaceId: string) =>
  collection(db, WORKSPACES_ROOT, workspaceId, YEARLY_SUMMARIES_COLLECTION);
const yearlySummaryDocRef = (workspaceId: string, yearKey: string) =>
  doc(db, WORKSPACES_ROOT, workspaceId, YEARLY_SUMMARIES_COLLECTION, yearKey);

// ============================================================================
// SESSION IN-MEMORY CACHE (HYDRATED FROM FIRESTORE ON BOOT)
// ============================================================================
let inMemoryProfile: UserSetupProfile = { ...initialUserSetupProfile };
let inMemoryCategories: Category[] = initialCategories.map((c) => ({ ...c }));
let inMemoryLedgerEntries: LedgerEntry[] = [];

let monthly_summaries: Record<string, MonthlySummary> = {};
let yearly_summaries: Record<string, YearlySummary> = {};

interface PendingLoginMeta {
  userName: string;
  currencySymbol?: string;
  monthlySavingsTarget?: number;
  categories?: Category[];
}
let pendingLoginMeta: PendingLoginMeta | null = null;

function clearInMemoryState(isSetupComplete = false): void {
  inMemoryProfile = { ...initialUserSetupProfile, isSetupComplete };
  inMemoryCategories = initialCategories.map((c) => ({ ...c }));
  inMemoryLedgerEntries = [];
  monthly_summaries = {};
  yearly_summaries = {};
}

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

function rebuildAllSummaries(): void {
  const rebuilt = buildAllSummaryTables(inMemoryProfile, inMemoryLedgerEntries);
  monthly_summaries = rebuilt.monthlySummaries;
  yearly_summaries = rebuilt.yearlySummaries;
}

// ============================================================================
// FIRESTORE INITIALIZATION, AUTO-SEEDING & BATCH COMMIT HELPERS
// ============================================================================
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function commitBatchedWrites(
  operations: Array<(batch: ReturnType<typeof writeBatch>) => void>
): Promise<void> {
  if (operations.length === 0) return;
  const CHUNK_SIZE = 450;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    const slice = operations.slice(i, i + CHUNK_SIZE);
    for (const op of slice) {
      op(batch);
    }
    await batch.commit();
  }
}

function buildSeedOperations(
  workspaceId: string
): Array<(batch: ReturnType<typeof writeBatch>) => void> {
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  ops.push((batch) => {
    batch.set(profileDocRef(workspaceId), cleanForFirestore(inMemoryProfile));
  });

  for (const cat of inMemoryCategories) {
    ops.push((batch) => {
      batch.set(categoryDocRef(workspaceId, cat.id), cleanForFirestore(cat));
    });
  }

  return ops;
}

async function ensureInitialized(): Promise<void> {
  if (isNodeTestRuntime || isInitialized) return;

  const workspaceId = getActiveWorkspaceId();
  if (!workspaceId) {
    // Unauthenticated / logged-out state: do not query Firestore yet
    clearInMemoryState(false);
    return;
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const profileSnap = await getDoc(profileDocRef(workspaceId));

        if (profileSnap.exists()) {
          const [catSnap, ledgerSnap, monthlySnap, yearlySnap] = await Promise.all([
            getDocs(categoriesColRef(workspaceId)),
            getDocs(ledgerColRef(workspaceId)),
            getDocs(monthlySummariesColRef(workspaceId)),
            getDocs(yearlySummariesColRef(workspaceId)),
          ]);

          inMemoryProfile = profileSnap.data() as UserSetupProfile;
          inMemoryCategories = catSnap.docs.map((d) => d.data() as Category);
          inMemoryLedgerEntries = ledgerSnap.docs.map((d) => d.data() as LedgerEntry);

          const hydratedMonthly: Record<string, MonthlySummary> = {};
          for (const d of monthlySnap.docs) {
            const data = d.data() as MonthlySummary;
            hydratedMonthly[data.monthKey || d.id] = {
              ...data,
              categoryTotals: { ...(data.categoryTotals || {}) },
            };
          }
          monthly_summaries = hydratedMonthly;

          const hydratedYearly: Record<string, YearlySummary> = {};
          for (const d of yearlySnap.docs) {
            const data = d.data() as YearlySummary;
            const breakdownCopy: Record<string, { income: number; expense: number; savings: number }> = {};
            for (const [mKey, mVal] of Object.entries(data.monthlyBreakdown || {})) {
              breakdownCopy[mKey] = { ...mVal };
            }
            hydratedYearly[data.yearKey || d.id] = {
              ...data,
              monthlyBreakdown: breakdownCopy,
            };
          }
          yearly_summaries = hydratedYearly;

          // Migrate legacy hardcoded base income (85992 -> 0) and seed any missing INCOME categories
          const migrationOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

          const missingIncomeCategories = initialCategories.filter(
            (cat) =>
              cat.type === 'INCOME' &&
              !inMemoryCategories.some((existing) => existing.id === cat.id)
          );
          if (missingIncomeCategories.length > 0) {
            for (const incomeCat of missingIncomeCategories) {
              const catCopy = { ...incomeCat };
              inMemoryCategories.push(catCopy);
              migrationOps.push((batch) =>
                batch.set(categoryDocRef(workspaceId, catCopy.id), cleanForFirestore(catCopy))
              );
            }
          }

          if (inMemoryProfile.monthlyBaseIncome === 85992) {
            inMemoryProfile = {
              ...inMemoryProfile,
              monthlyBaseIncome: 0,
              monthlySavingsTarget:
                inMemoryProfile.monthlySavingsTarget === 40000
                  ? 0
                  : inMemoryProfile.monthlySavingsTarget,
            };
            migrationOps.push((batch) =>
              batch.set(profileDocRef(workspaceId), cleanForFirestore(inMemoryProfile))
            );

            rebuildAllSummaries();
            for (const d of monthlySnap.docs) {
              if (!monthly_summaries[d.id]) {
                migrationOps.push((batch) => batch.delete(d.ref));
              }
            }
            for (const d of yearlySnap.docs) {
              if (!yearly_summaries[d.id]) {
                migrationOps.push((batch) => batch.delete(d.ref));
              }
            }
            for (const mSum of Object.values(monthly_summaries)) {
              migrationOps.push((batch) =>
                batch.set(
                  monthlySummaryDocRef(workspaceId, mSum.monthKey),
                  cleanForFirestore(mSum)
                )
              );
            }
            for (const ySum of Object.values(yearly_summaries)) {
              migrationOps.push((batch) =>
                batch.set(
                  yearlySummaryDocRef(workspaceId, ySum.yearKey),
                  cleanForFirestore(ySum)
                )
              );
            }
          }

          if (migrationOps.length > 0) {
            await commitBatchedWrites(migrationOps);
          }
        } else {
          // Brand-new workspace in Firestore: create profile (isSetupComplete: true) + seed default categories ONLY
          inMemoryProfile = {
            ...initialUserSetupProfile,
            userName: pendingLoginMeta?.userName || initialUserSetupProfile.userName,
            currencySymbol:
              pendingLoginMeta?.currencySymbol || initialUserSetupProfile.currencySymbol,
            monthlyBaseIncome: 0,
            monthlySavingsTarget: pendingLoginMeta?.monthlySavingsTarget ?? 0,
            isSetupComplete: true,
          };
          inMemoryCategories =
            pendingLoginMeta?.categories && pendingLoginMeta.categories.length > 0
              ? pendingLoginMeta.categories.map((c) => ({ ...c }))
              : initialCategories.map((c) => ({ ...c }));
          inMemoryLedgerEntries = [];
          monthly_summaries = {};
          yearly_summaries = {};

          await commitBatchedWrites(buildSeedOperations(workspaceId));
        }

        isInitialized = true;
      } catch (error) {
        initPromise = null;
        isInitialized = false;
        console.error('Firestore ensureInitialized error:', error);
        throw error;
      }
    })();
  }

  return initPromise;
}

function appendSummaryWrites(
  workspaceId: string,
  batch: ReturnType<typeof writeBatch>,
  monthKeys: Iterable<string>
): void {
  const uniqueMonths = new Set<string>();
  const uniqueYears = new Set<string>();

  for (const m of monthKeys) {
    if (!m) continue;
    const normalized = m.slice(0, 7);
    uniqueMonths.add(normalized);
    uniqueYears.add(normalized.slice(0, 4));
  }

  for (const mKey of uniqueMonths) {
    const mSum = monthly_summaries[mKey];
    if (mSum) {
      batch.set(monthlySummaryDocRef(workspaceId, mKey), cleanForFirestore(mSum));
    }
  }

  for (const yKey of uniqueYears) {
    const ySum = yearly_summaries[yKey];
    if (ySum) {
      batch.set(yearlySummaryDocRef(workspaceId, yKey), cleanForFirestore(ySum));
    }
  }
}

export const financeDataService = {
  getActiveWorkspaceId,

  /**
   * Log into an existing workspace or initialize a brand-new isolated workspace in Firestore
   */
  async loginOrCreateWorkspace(
    userName: string,
    pin: string,
    monthlySavingsTarget?: number,
    options?: { currencySymbol?: string; categories?: Category[] }
  ): Promise<UserSetupProfile> {
    const cleanName = userName.trim();
    const cleanPin = pin.trim();
    if (!cleanName) {
      throw new Error('Workspace owner name is required.');
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error('Workspace PIN must be a 4-digit number.');
    }

    const workspaceId = buildWorkspaceId(cleanName, cleanPin);
    setActiveWorkspaceId(workspaceId);
    pendingLoginMeta = {
      userName: cleanName,
      currencySymbol: options?.currencySymbol || '₹',
      monthlySavingsTarget: monthlySavingsTarget ?? 0,
      categories: options?.categories,
    };
    isInitialized = false;
    initPromise = null;
    clearInMemoryState(false);

    try {
      if (isNodeTestRuntime) {
        inMemoryProfile = {
          ...initialUserSetupProfile,
          userName: cleanName,
          currencySymbol: options?.currencySymbol || initialUserSetupProfile.currencySymbol,
          monthlyBaseIncome: 0,
          monthlySavingsTarget: monthlySavingsTarget ?? 0,
          isSetupComplete: true,
        };
        if (options?.categories && options.categories.length > 0) {
          inMemoryCategories = options.categories.map((c) => ({ ...c }));
        }
        isInitialized = true;
      } else {
        await ensureInitialized();
      }
      return { ...inMemoryProfile };
    } finally {
      pendingLoginMeta = null;
    }
  },

  /**
   * Log out of the active workspace, clear session pointer and in-memory cache
   */
  async logoutWorkspace(): Promise<void> {
    setActiveWorkspaceId(null);
    clearInMemoryState(false);
    isInitialized = false;
    initPromise = null;
    pendingLoginMeta = null;
  },

  /**
   * Fetch current user setup profile
   */
  async getUserProfile(): Promise<UserSetupProfile> {
    await ensureInitialized();
    return { ...inMemoryProfile };
  },

  /**
   * Update user profile and sync all summaries atomically
   */
  async updateUserProfile(updates: Partial<UserSetupProfile>): Promise<UserSetupProfile> {
    await ensureInitialized();
    inMemoryProfile = { ...inMemoryProfile, ...updates };
    rebuildAllSummaries();

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
        (batch) => batch.set(profileDocRef(workspaceId), cleanForFirestore(inMemoryProfile)),
      ];
      for (const mSum of Object.values(monthly_summaries)) {
        ops.push((batch) =>
          batch.set(monthlySummaryDocRef(workspaceId, mSum.monthKey), cleanForFirestore(mSum))
        );
      }
      for (const ySum of Object.values(yearly_summaries)) {
        ops.push((batch) =>
          batch.set(yearlySummaryDocRef(workspaceId, ySum.yearKey), cleanForFirestore(ySum))
        );
      }
      await commitBatchedWrites(ops);
    }

    return { ...inMemoryProfile };
  },

  /**
   * Complete initial setup wizard / update active workspace profile
   */
  async completeSetup(data: {
    userName: string;
    currencySymbol?: string;
    monthlyBaseIncome?: number;
    monthlySavingsTarget?: number;
    monthlyBudgetCap?: number;
    categories?: Category[];
  }): Promise<UserSetupProfile> {
    await ensureInitialized();
    inMemoryProfile = {
      ...inMemoryProfile,
      userName: data.userName.trim() || 'Rohan',
      currencySymbol: data.currencySymbol || inMemoryProfile.currencySymbol || '₹',
      monthlyBaseIncome: data.monthlyBaseIncome ?? 0,
      monthlySavingsTarget:
        data.monthlySavingsTarget !== undefined
          ? data.monthlySavingsTarget
          : inMemoryProfile.monthlySavingsTarget ?? 0,
      monthlyBudgetCap: data.monthlyBudgetCap ?? inMemoryProfile.monthlyBudgetCap,
      isSetupComplete: true,
    };

    const updatedCategories: Category[] = [];
    if (data.categories && data.categories.length > 0) {
      inMemoryCategories = data.categories.map((c) => ({ ...c }));
      updatedCategories.push(...inMemoryCategories);
    }

    rebuildAllSummaries();

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
        (batch) => batch.set(profileDocRef(workspaceId), cleanForFirestore(inMemoryProfile)),
      ];
      for (const cat of updatedCategories) {
        ops.push((batch) =>
          batch.set(categoryDocRef(workspaceId, cat.id), cleanForFirestore(cat))
        );
      }
      for (const mSum of Object.values(monthly_summaries)) {
        ops.push((batch) =>
          batch.set(monthlySummaryDocRef(workspaceId, mSum.monthKey), cleanForFirestore(mSum))
        );
      }
      for (const ySum of Object.values(yearly_summaries)) {
        ops.push((batch) =>
          batch.set(yearlySummaryDocRef(workspaceId, ySum.yearKey), cleanForFirestore(ySum))
        );
      }
      await commitBatchedWrites(ops);
    }

    return { ...inMemoryProfile };
  },

  /**
   * Reset profile or data for testing/demoing onboarding
   */
  async resetToSetupDemo(): Promise<UserSetupProfile> {
    await ensureInitialized();
    inMemoryProfile.isSetupComplete = false;

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (workspaceId) {
        const batch = writeBatch(db);
        batch.set(profileDocRef(workspaceId), cleanForFirestore(inMemoryProfile));
        await batch.commit();
      }
    }

    return { ...inMemoryProfile };
  },

  /**
   * Wipe ledger_entries, monthly_summaries, and yearly_summaries (keeping Categories & User Profile intact)
   */
  async resetAllData(): Promise<void> {
    await ensureInitialized();
    inMemoryLedgerEntries = [];
    monthly_summaries = {};
    yearly_summaries = {};

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) return;
      const [ledgerSnap, monthlySnap, yearlySnap] = await Promise.all([
        getDocs(ledgerColRef(workspaceId)),
        getDocs(monthlySummariesColRef(workspaceId)),
        getDocs(yearlySummariesColRef(workspaceId)),
      ]);

      const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
      for (const docSnap of [...ledgerSnap.docs, ...monthlySnap.docs, ...yearlySnap.docs]) {
        ops.push((batch) => batch.delete(docSnap.ref));
      }

      await commitBatchedWrites(ops);
    }
  },

  /**
   * O(1) read for pre-aggregated MonthlySummary record
   */
  async getMonthlySummary(monthKey: string): Promise<MonthlySummary> {
    await ensureInitialized();
    const existing = monthly_summaries[monthKey];
    if (existing) {
      return { ...existing, categoryTotals: { ...existing.categoryTotals } };
    }
    return buildMonthlySummary(monthKey, inMemoryProfile, []);
  },

  /**
   * O(1) read for pre-aggregated YearlySummary record
   */
  async getYearlySummary(yearKey: string): Promise<YearlySummary> {
    await ensureInitialized();
    const existing = yearly_summaries[yearKey];
    if (existing) {
      const breakdownCopy: Record<string, { income: number; expense: number; savings: number }> = {};
      for (const [k, v] of Object.entries(existing.monthlyBreakdown)) {
        breakdownCopy[k] = { ...v };
      }
      return { ...existing, monthlyBreakdown: breakdownCopy };
    }
    return buildYearlySummary(yearKey, inMemoryProfile, monthly_summaries);
  },

  /**
   * Get all categories (active or archived)
   */
  async getCategories(includeArchived = false): Promise<Category[]> {
    await ensureInitialized();
    if (includeArchived) return [...inMemoryCategories];
    return inMemoryCategories.filter((c) => !c.isArchived);
  },

  /**
   * Add a new category
   */
  async addCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    await ensureInitialized();
    const newCategory: Category = {
      ...cat,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    inMemoryCategories.push(newCategory);

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const batch = writeBatch(db);
      batch.set(categoryDocRef(workspaceId, newCategory.id), cleanForFirestore(newCategory));
      await batch.commit();
    }

    return newCategory;
  },

  /**
   * Update category
   */
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    await ensureInitialized();
    const index = inMemoryCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Category ${id} not found`);
    inMemoryCategories[index] = { ...inMemoryCategories[index], ...updates };

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const batch = writeBatch(db);
      batch.set(
        categoryDocRef(workspaceId, id),
        cleanForFirestore(inMemoryCategories[index])
      );
      await batch.commit();
    }

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
    await ensureInitialized();
    const index = inMemoryCategories.findIndex((c) => c.id === id);
    if (index === -1) return false;
    inMemoryCategories[index] = { ...inMemoryCategories[index], isArchived };

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const batch = writeBatch(db);
      batch.set(
        categoryDocRef(workspaceId, id),
        cleanForFirestore(inMemoryCategories[index])
      );
      await batch.commit();
    }

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
   */
  async getSettledEntriesForMonthWindow(selectedMonth: string): Promise<LedgerEntry[]> {
    await ensureInitialized();
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
   */
  async getBasketPlannedEntries(): Promise<LedgerEntry[]> {
    await ensureInitialized();
    return inMemoryLedgerEntries.filter((e) => e.status === 'BASKET_PLANNED');
  },

  /**
   * Query ledger entries with optional filters (status, category, month)
   */
  async getLedgerEntries(filter?: {
    status?: 'BASKET_PLANNED' | 'SETTLED';
    categoryId?: string;
    month?: string;
  }): Promise<LedgerEntry[]> {
    await ensureInitialized();
    let result = [...inMemoryLedgerEntries];
    if (filter?.status) {
      result = result.filter((e) => e.status === filter.status);
    }
    if (filter?.categoryId && filter.categoryId !== 'all') {
      result = result.filter((e) => e.categoryId === filter.categoryId);
    }
    if (filter?.month && filter.status !== 'BASKET_PLANNED') {
      result = result.filter(
        (e) => e.monthKey === filter.month || e.date.startsWith(filter.month!)
      );
    }
    return result;
  },

  /**
   * Add a new direct expense / income transaction and sync monthly/yearly summaries atomically
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
    await ensureInitialized();
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

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const batch = writeBatch(db);
      batch.set(ledgerDocRef(workspaceId, newEntry.id), cleanForFirestore(newEntry));
      if (newEntry.monthKey) {
        appendSummaryWrites(workspaceId, batch, [newEntry.monthKey]);
      }
      await batch.commit();
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
    await ensureInitialized();
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

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const batch = writeBatch(db);
      batch.set(ledgerDocRef(workspaceId, newBasketItem.id), cleanForFirestore(newBasketItem));
      await batch.commit();
    }

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
   * Move item from Basket to Expense Ledger with exact Settlement Date Stamping and atomic summary sync
   */
  async settleBasketItem(
    id: string,
    actualAmount: number,
    paymentMethod: PaymentMethod | string,
    purchaseDateStr?: string,
    notes?: string
  ): Promise<LedgerEntry> {
    await ensureInitialized();
    const index = inMemoryLedgerEntries.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`Basket item ${id} not found`);

    const dateStr = purchaseDateStr || getLocalDateStr();
    const timestamp = new Date(dateStr).getTime();
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${((hours + 11) % 12) + 1}:${minutes} ${ampm}`;

    const existing = inMemoryLedgerEntries[index];
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
    };

    inMemoryLedgerEntries[index] = updated;
    if (updated.monthKey) {
      recalculateMonthAndYearSummary(updated.monthKey);
    }

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const batch = writeBatch(db);
      batch.set(ledgerDocRef(workspaceId, id), cleanForFirestore(updated));
      if (updated.monthKey) {
        appendSummaryWrites(workspaceId, batch, [updated.monthKey]);
      }
      await batch.commit();
    }

    return updated;
  },

  /**
   * Update an existing transaction entry with automatic Date Re-Indexing & atomic summary sync
   */
  async updateTransaction(
    id: string,
    updatedFields: Partial<LedgerEntry>
  ): Promise<LedgerEntry> {
    await ensureInitialized();
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

    const affectedMonths: string[] = [];
    if (prevStatus === 'SETTLED' && prevMonthKey) {
      recalculateMonthAndYearSummary(prevMonthKey);
      affectedMonths.push(prevMonthKey);
    }
    if (updated.status === 'SETTLED' && updated.monthKey && updated.monthKey !== prevMonthKey) {
      recalculateMonthAndYearSummary(updated.monthKey);
      affectedMonths.push(updated.monthKey);
    }

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const batch = writeBatch(db);
      batch.set(ledgerDocRef(workspaceId, id), cleanForFirestore(updated));
      appendSummaryWrites(workspaceId, batch, affectedMonths);
      await batch.commit();
    }

    return updated;
  },

  /**
   * Delete transaction entry and sync monthly/yearly summaries atomically
   */
  async deleteTransaction(id: string): Promise<boolean> {
    await ensureInitialized();
    const target = inMemoryLedgerEntries.find((e) => e.id === id);
    if (!target) return false;

    inMemoryLedgerEntries = inMemoryLedgerEntries.filter((e) => e.id !== id);

    let targetMonthKey: string | null = null;
    if (target.status === 'SETTLED') {
      targetMonthKey = target.monthKey || target.date.slice(0, 7);
      if (targetMonthKey) {
        recalculateMonthAndYearSummary(targetMonthKey);
      }
    }

    if (!isNodeTestRuntime) {
      const workspaceId = getActiveWorkspaceId();
      if (!workspaceId) throw new Error('No active workspace session.');
      const entryRef = ledgerDocRef(workspaceId, id);
      if (targetMonthKey) {
        const batch = writeBatch(db);
        batch.delete(entryRef);
        appendSummaryWrites(workspaceId, batch, [targetMonthKey]);
        await batch.commit();
      } else {
        await deleteDoc(entryRef);
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
   * Get Overview dashboard metrics & chart data in O(1) directly from MonthlySummary / YearlySummary.
   * Where Money Went (categorySpend) is ALWAYS locked strictly to the Current Month.
   */
  async getOverviewData(
    timeframe: TimeframeFilter = 'Weekly',
    scope: OverviewScope = 'Monthly'
  ): Promise<OverviewData> {
    await ensureInitialized();
    const currentMonthKey = getLocalDateStr().substring(0, 7);
    const prevMonthKey = getPreviousMonthKey(currentMonthKey);

    const currentMonthSummary =
      monthly_summaries[currentMonthKey] || buildMonthlySummary(currentMonthKey, inMemoryProfile, []);
    const prevMonthSummary =
      monthly_summaries[prevMonthKey] || buildMonthlySummary(prevMonthKey, inMemoryProfile, []);

    const currentMonthExpenseDelta = calculateMoMDelta(
      currentMonthSummary.totalExpense,
      prevMonthSummary.totalExpense
    );

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
      const currentYear = currentMonthKey.slice(0, 4);
      const prevYear = String(Number(currentYear) - 1);
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

    const plannedItems = inMemoryLedgerEntries.filter((e) => e.status === 'BASKET_PLANNED');
    const activeBasketCount = plannedItems.length;
    const activeBasketEstTotal = plannedItems.reduce(
      (sum, item) => sum + (item.estimatedAmount || 0),
      0
    );

    const currentMonthSettled = inMemoryLedgerEntries.filter(
      (e) =>
        e.status === 'SETTLED' &&
        (e.monthKey === currentMonthKey || e.date.startsWith(currentMonthKey))
    );
    const recentTransactions = [...currentMonthSettled]
      .sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0))
      .slice(0, 6);

    const settledEntries = inMemoryLedgerEntries.filter((e) => e.status === 'SETTLED');
    const buildDayPoint = (dateStr: string, format: 'weekday' | 'dayWeekday') => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayPadded = String(d).padStart(2, '0');
      const label = format === 'weekday' ? weekday : `${dayPadded} ${weekday}`;

      let dayExpense = 0;
      let dayIncome = 0;
      for (const entry of settledEntries) {
        if (entry.date === dateStr && typeof entry.amount === 'number') {
          if (entry.type === 'EXPENSE') {
            dayExpense += entry.amount;
          } else if (entry.type === 'INCOME') {
            dayIncome += entry.amount;
          }
        }
      }

      return {
        label,
        savings: dayIncome,
        expense: dayExpense,
      };
    };

    let flowTrend = [];
    if (timeframe === 'Daily') {
      for (let i = 4; i >= 0; i -= 1) {
        flowTrend.push(buildDayPoint(getRelativeDate(i), 'weekday'));
      }
    } else if (timeframe === 'Weekly') {
      for (let i = 6; i >= 0; i -= 1) {
        flowTrend.push(buildDayPoint(getRelativeDate(i), 'dayWeekday'));
      }
    } else {
      const monthsChronological = getAvailableMonths().slice().reverse();
      flowTrend = monthsChronological.map(({ key, label }) => {
        const shortLabel = label.slice(0, 3);
        const mSum = monthly_summaries[key];
        if (mSum && settledEntries.length > 0) {
          return {
            label: shortLabel,
            savings: mSum.totalSavings,
            expense: mSum.totalExpense,
            isPeak: key === currentMonthKey,
          };
        }
        return {
          label: shortLabel,
          savings: 0,
          expense: 0,
        };
      });
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

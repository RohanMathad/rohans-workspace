import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCategoryBreakdown,
  calculateFinancialTotals,
  calculateYearlyFinancialTotals,
  formatCompactINR,
  formatINR,
  groupTransactionsByDay,
  getLocalDateStr,
  getRelativeDate,
  getAvailableMonths,
  filterEntriesByTimeframe,
  filterMonthEntriesByScopedTimeframe,
  getPreviousMonthKey,
  calculateMoMDelta,
  buildMonthlySummary,
  buildYearlySummary,
  buildAllSummaryTables,
  buildCategoryBreakdownFromTotals,
  getUserInitials,
} from './financeLogic';
import { buildWorkspaceId, financeDataService } from './financeDataService';
import { Category, LedgerEntry, UserSetupProfile } from '../types/finance.types';

const mockProfile: UserSetupProfile = {
  isSetupComplete: true,
  userName: 'Rohan',
  currencySymbol: '₹',
  monthlyBaseIncome: 85992,
  monthlyBudgetCap: 50000,
  monthPeriod: 'November 2026',
};

const mockCategories: Category[] = [
  {
    id: 'c1',
    name: 'Food',
    emoji: '🍔',
    color: '#D4532B',
    bgLight: '#FDF0EA',
    bgDark: '#2B1B18',
    textLight: '#D4532B',
    textDark: '#FF8566',
    type: 'EXPENSE',
  },
  {
    id: 'c2',
    name: 'Groceries',
    emoji: '🛒',
    color: '#168B53',
    bgLight: '#E8F8F0',
    bgDark: '#162822',
    textLight: '#168B53',
    textDark: '#3DDC84',
    type: 'EXPENSE',
  },
];

const todayStr = getLocalDateStr();
const yesterdayStr = getRelativeDate(1);

const mockEntries: LedgerEntry[] = [
  {
    id: '1',
    title: 'Coffee',
    categoryId: 'c1',
    amount: 500,
    status: 'SETTLED',
    type: 'EXPENSE',
    date: todayStr,
    dayKey: todayStr,
    monthKey: todayStr.slice(0, 7),
    dateTimestamp: new Date(todayStr).getTime(),
  },
  {
    id: '2',
    title: 'Milk',
    categoryId: 'c2',
    amount: 1500,
    status: 'SETTLED',
    type: 'EXPENSE',
    date: yesterdayStr,
    dayKey: yesterdayStr,
    monthKey: yesterdayStr.slice(0, 7),
    dateTimestamp: new Date(yesterdayStr).getTime(),
  },
  {
    id: '3',
    title: 'Planned Apples',
    categoryId: 'c2',
    amount: null,
    status: 'BASKET_PLANNED',
    type: 'EXPENSE',
    date: todayStr,
    dayKey: todayStr,
    monthKey: null,
    dateTimestamp: new Date(todayStr).getTime(),
  },
];

test('calculateFinancialTotals computes income, expense, and savings strictly from settled transactions', () => {
  const emptyTotals = calculateFinancialTotals(mockProfile, []);
  assert.equal(emptyTotals.totalIncome, 0);
  assert.equal(emptyTotals.totalExpense, 0);
  assert.equal(emptyTotals.totalSavings, 0);

  const incomeAndExpenseEntries: LedgerEntry[] = [
    ...mockEntries,
    {
      id: 'inc-1',
      title: 'Monthly Salary',
      categoryId: 'cat-salary',
      amount: 10000,
      status: 'SETTLED',
      type: 'INCOME',
      date: todayStr,
      dayKey: todayStr,
      monthKey: todayStr.slice(0, 7),
      dateTimestamp: new Date(todayStr).getTime(),
    },
  ];
  const totals = calculateFinancialTotals(mockProfile, incomeAndExpenseEntries);
  assert.equal(totals.totalIncome, 10000);
  assert.equal(totals.totalExpense, 2000);
  assert.equal(totals.totalSavings, 8000);
  assert.equal(totals.savingsRate, 80);
});

test('calculateCategoryBreakdown computes percentages and excludes planned basket items', () => {
  const breakdown = calculateCategoryBreakdown(mockEntries, mockCategories);
  assert.equal(breakdown.length, 2);
  // Groceries should be highest (1500 vs 500)
  assert.equal(breakdown[0].categoryName, 'Groceries');
  assert.equal(breakdown[0].amount, 1500);
  assert.equal(breakdown[0].percentage, 75);
  assert.equal(breakdown[1].categoryName, 'Food');
  assert.equal(breakdown[1].amount, 500);
  assert.equal(breakdown[1].percentage, 25);
});

test('formatINR formats numbers with Indian numbering commas', () => {
  assert.equal(formatINR(500), '₹500');
  assert.equal(formatINR(38160), '₹38,160');
  assert.equal(formatINR(118000), '₹1,18,000');
  assert.equal(formatINR(0), '₹0');
});

test('groupTransactionsByDay properly groups entries and ignores BASKET_PLANNED', () => {
  const groups = groupTransactionsByDay(mockEntries);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].items.length, 1);
  assert.ok(groups[0].title.startsWith('Today'));
  assert.ok(groups[1].title.startsWith('Yesterday'));
});

test('date helpers generate valid ISO dates and available months', () => {
  const nowStr = getLocalDateStr();
  assert.match(nowStr, /^\d{4}-\d{2}-\d{2}$/);

  const months = getAvailableMonths();
  assert.equal(months.length, 6);
  assert.match(months[0].key, /^\d{4}-\d{2}$/);
});

test('filterEntriesByTimeframe filters Daily, Weekly, and Monthly correctly', () => {
  const daily = filterEntriesByTimeframe(mockEntries, 'Daily');
  assert.equal(daily.length, 2); // 1 settled + 1 planned for today

  const weekly = filterEntriesByTimeframe(mockEntries, 'Weekly');
  assert.equal(weekly.length, 3); // all within past 7 days

  const monthly = filterEntriesByTimeframe(mockEntries, 'Monthly', todayStr.substring(0, 7));
  assert.equal(monthly.length, 3);
});

test('category archive and restore state transitions correctly', () => {
  const cat: Category = { ...mockCategories[0], isArchived: false };
  assert.equal(Boolean(cat.isArchived), false);
  cat.isArchived = true;
  assert.equal(Boolean(cat.isArchived), true);
  cat.isArchived = false;
  assert.equal(Boolean(cat.isArchived), false);
});

test('getPreviousMonthKey calculates previous month across years correctly', () => {
  assert.equal(getPreviousMonthKey('2026-11'), '2026-10');
  assert.equal(getPreviousMonthKey('2026-01'), '2025-12');
  assert.equal(getPreviousMonthKey('2026-10'), '2026-09');
});

test('calculateMoMDelta calculates percentage delta correctly', () => {
  assert.equal(calculateMoMDelta(112, 100), 12);
  assert.equal(calculateMoMDelta(85, 100), -15);
  assert.equal(calculateMoMDelta(100, 0), 100);
});

test('formatCompactINR formats values compactly for target pills', () => {
  assert.equal(formatCompactINR(40000), '₹40k');
  assert.equal(formatCompactINR(480000), '₹480k');
  assert.equal(formatCompactINR(47500), '₹47.5k');
  assert.equal(formatCompactINR(500), '₹500');
  assert.equal(formatCompactINR(0), '₹0');
});

test('calculateYearlyFinancialTotals sums settled INCOME and EXPENSE year entries without base income scaling', () => {
  const yearEntriesWithIncome: LedgerEntry[] = [
    ...mockEntries,
    {
      id: 'inc-y1',
      title: 'Bonus',
      categoryId: 'cat-salary',
      amount: 50000,
      status: 'SETTLED',
      type: 'INCOME',
      date: todayStr,
      dayKey: todayStr,
      monthKey: todayStr.slice(0, 7),
      dateTimestamp: new Date(todayStr).getTime(),
    },
  ];
  const yearly = calculateYearlyFinancialTotals(mockProfile, yearEntriesWithIncome);
  assert.equal(yearly.totalIncome, 50000);
  assert.equal(yearly.totalExpense, 2000);
  assert.equal(yearly.totalSavings, 48000);
});

test('filterMonthEntriesByScopedTimeframe scopes Daily and Weekly to selectedMonth', () => {
  const octEntries: LedgerEntry[] = [
    {
      id: 'o1',
      title: 'Oct Latest',
      categoryId: 'c1',
      amount: 400,
      status: 'SETTLED',
      type: 'EXPENSE',
      date: '2026-10-28',
      dayKey: '2026-10-28',
      monthKey: '2026-10',
      dateTimestamp: new Date('2026-10-28').getTime(),
    },
    {
      id: 'o2',
      title: 'Oct Same Week',
      categoryId: 'c2',
      amount: 600,
      status: 'SETTLED',
      type: 'EXPENSE',
      date: '2026-10-24',
      dayKey: '2026-10-24',
      monthKey: '2026-10',
      dateTimestamp: new Date('2026-10-24').getTime(),
    },
    {
      id: 'o3',
      title: 'Oct Earlier',
      categoryId: 'c1',
      amount: 900,
      status: 'SETTLED',
      type: 'EXPENSE',
      date: '2026-10-05',
      dayKey: '2026-10-05',
      monthKey: '2026-10',
      dateTimestamp: new Date('2026-10-05').getTime(),
    },
  ];

  const monthly = filterMonthEntriesByScopedTimeframe(octEntries, 'Monthly', '2026-10');
  assert.equal(monthly.length, 3);

  const weekly = filterMonthEntriesByScopedTimeframe(octEntries, 'Weekly', '2026-10');
  assert.equal(weekly.length, 2);

  const daily = filterMonthEntriesByScopedTimeframe(octEntries, 'Daily', '2026-10');
  assert.equal(daily.length, 1);
  assert.equal(daily[0].id, 'o1');
});

test('buildMonthlySummary, buildYearlySummary, and buildCategoryBreakdownFromTotals aggregate correctly', () => {
  const monthKey = todayStr.slice(0, 7);
  const yearKey = monthKey.slice(0, 4);
  const entriesWithIncome: LedgerEntry[] = [
    ...mockEntries,
    {
      id: 'inc-m1',
      title: 'Stipend',
      categoryId: 'cat-salary',
      amount: 25000,
      status: 'SETTLED',
      type: 'INCOME',
      date: todayStr,
      dayKey: todayStr,
      monthKey,
      dateTimestamp: new Date(todayStr).getTime(),
    },
  ];
  const { monthlySummaries, yearlySummaries } = buildAllSummaryTables(mockProfile, entriesWithIncome);

  const mSum = monthlySummaries[monthKey];
  assert.ok(mSum);
  assert.equal(mSum.monthKey, monthKey);
  assert.equal(mSum.yearKey, yearKey);
  assert.equal(mSum.totalExpense, 2000);
  assert.equal(mSum.totalIncome, 25000);
  assert.equal(mSum.totalSavings, 23000);
  assert.equal(mSum.transactionCount, 3); // excludes BASKET_PLANNED
  assert.equal(mSum.categoryTotals['c1'], 500);
  assert.equal(mSum.categoryTotals['c2'], 1500);

  const catBreakdown = buildCategoryBreakdownFromTotals(mSum.categoryTotals, mockCategories);
  assert.equal(catBreakdown.length, 2);
  assert.equal(catBreakdown[0].categoryId, 'c2');
  assert.equal(catBreakdown[0].percentage, 75);

  const ySum = yearlySummaries[yearKey];
  assert.ok(ySum);
  assert.equal(ySum.totalIncome, 25000);
  assert.equal(ySum.totalExpense, 2000);
  assert.equal(ySum.totalSavings, 23000);
  assert.equal(ySum.monthlyBreakdown[monthKey].expense, 2000);

  // Verify standalone buildMonthlySummary & buildYearlySummary match
  const manualMonth = buildMonthlySummary(monthKey, mockProfile, entriesWithIncome);
  assert.equal(manualMonth.totalExpense, mSum.totalExpense);
  const manualYear = buildYearlySummary(yearKey, mockProfile, { [monthKey]: manualMonth });
  assert.equal(manualYear.totalExpense, ySum.totalExpense);
});

test('financeDataService auto-syncs MonthlySummary and YearlySummary on add, edit, cross-month move, settle, and delete', async () => {
  await financeDataService.resetAllData();
  const curMonth = getLocalDateStr().slice(0, 7);
  const curYear = curMonth.slice(0, 4);

  const initialMonth = await financeDataService.getMonthlySummary(curMonth);
  const initialYear = await financeDataService.getYearlySummary(curYear);
  const initialOct = await financeDataService.getMonthlySummary('2026-10');

  // 1. Add expense -> updates curMonth & curYear summaries
  const added = await financeDataService.addExpense({
    title: 'Summary Sync Coffee',
    categoryId: 'cat-food',
    amount: 1000,
    date: getLocalDateStr(),
  });

  const afterAddMonth = await financeDataService.getMonthlySummary(curMonth);
  const afterAddYear = await financeDataService.getYearlySummary(curYear);
  assert.equal(afterAddMonth.totalExpense, initialMonth.totalExpense + 1000);
  assert.equal(afterAddMonth.categoryTotals['cat-food'], (initialMonth.categoryTotals['cat-food'] || 0) + 1000);
  assert.equal(afterAddYear.totalExpense, initialYear.totalExpense + 1000);

  // 2. Edit expense to move across months (curMonth -> 2026-10) -> updates BOTH months
  await financeDataService.updateTransaction(added.id, {
    amount: 1500,
    date: '2026-10-15',
  });

  const afterMoveCur = await financeDataService.getMonthlySummary(curMonth);
  const afterMoveOct = await financeDataService.getMonthlySummary('2026-10');
  const afterMoveYear = await financeDataService.getYearlySummary(curYear);
  assert.equal(afterMoveCur.totalExpense, initialMonth.totalExpense);
  assert.equal(afterMoveOct.totalExpense, initialOct.totalExpense + 1500);
  assert.equal(afterMoveYear.totalExpense, initialYear.totalExpense + 1500);

  // 3. Delete expense -> decrements 2026-10 & curYear
  await financeDataService.deleteTransaction(added.id);
  const afterDeleteOct = await financeDataService.getMonthlySummary('2026-10');
  const afterDeleteYear = await financeDataService.getYearlySummary(curYear);
  assert.equal(afterDeleteOct.totalExpense, initialOct.totalExpense);
  assert.equal(afterDeleteYear.totalExpense, initialYear.totalExpense);

  // 4. Add & settle basket item -> updates curMonth & curYear
  await financeDataService.addBasketItem('Planned Monitor Stand', 'cat-electronics', 500);
  const basketItems = await financeDataService.getBasketPlannedEntries();
  assert.equal(basketItems.length, 1);
  await financeDataService.settleBasketItem(basketItems[0].id, 250, 'UPI / GPay', getLocalDateStr());
  const afterSettleMonth = await financeDataService.getMonthlySummary(curMonth);
  assert.equal(afterSettleMonth.totalExpense, initialMonth.totalExpense + 250);

  // 5. Add INCOME entry -> updates totalIncome & totalSavings in curMonth & curYear
  await financeDataService.addExpense({
    title: 'Monthly Salary',
    categoryId: 'cat-salary',
    amount: 5000,
    type: 'INCOME',
    date: getLocalDateStr(),
  });
  const afterIncomeMonth = await financeDataService.getMonthlySummary(curMonth);
  assert.equal(afterIncomeMonth.totalIncome, 5000);
  assert.equal(afterIncomeMonth.totalSavings, 5000 - (initialMonth.totalExpense + 250));

  // 6. Reset wipes ledger & summaries back to 0 while keeping categories & profile intact
  await financeDataService.resetAllData();
  const afterResetEntries = await financeDataService.getLedgerEntries();
  const afterResetCategories = await financeDataService.getCategories(true);
  const afterResetMonth = await financeDataService.getMonthlySummary(curMonth);
  assert.equal(afterResetEntries.length, 0);
  assert.ok(afterResetCategories.some((c) => c.type === 'INCOME'));
  assert.equal(afterResetMonth.totalIncome, 0);
  assert.equal(afterResetMonth.totalExpense, 0);
  assert.equal(afterResetMonth.totalSavings, 0);
});

test('getUserInitials derives 1-2 uppercase initials from user name', () => {
  assert.equal(getUserInitials('Rohan'), 'R');
  assert.equal(getUserInitials('Rohan Mathad'), 'RM');
  assert.equal(getUserInitials('rohan a. mathad'), 'RM');
  assert.equal(getUserInitials(''), 'R');
  assert.equal(getUserInitials(undefined), 'R');
});

test('financeDataService completeSetup persists owner, currency, savings target, and keeps base income at 0', async () => {
  await financeDataService.resetToSetupDemo();
  const demoProfile = await financeDataService.getUserProfile();
  assert.equal(demoProfile.isSetupComplete, false);

  const completed = await financeDataService.completeSetup({
    userName: 'Rohan Mathad',
    currencySymbol: '₹',
    monthlyBaseIncome: 0,
    monthlySavingsTarget: 40000,
  });

  assert.equal(completed.isSetupComplete, true);
  assert.equal(completed.userName, 'Rohan Mathad');
  assert.equal(completed.currencySymbol, '₹');
  assert.equal(completed.monthlyBaseIncome, 0);
  assert.equal(completed.monthlySavingsTarget, 40000);
});

test('multi-user workspace ID normalization, login, and logout isolate sessions cleanly', async () => {
  assert.equal(buildWorkspaceId('Rohan', '1234'), 'rohan_1234');
  assert.equal(buildWorkspaceId('  Rohan Mathad! ', '0042'), 'rohanmathad_0042');

  const p1 = await financeDataService.loginOrCreateWorkspace('Rohan', '1234', 35000);
  assert.equal(financeDataService.getActiveWorkspaceId(), 'rohan_1234');
  assert.equal(p1.userName, 'Rohan');
  assert.equal(p1.monthlySavingsTarget, 35000);
  assert.equal(p1.monthlyBaseIncome, 0);
  assert.equal(p1.isSetupComplete, true);

  await financeDataService.addExpense({
    title: 'Rohan Lunch',
    categoryId: 'cat-food',
    amount: 450,
    date: getLocalDateStr(),
  });
  const rohanEntries = await financeDataService.getLedgerEntries();
  assert.equal(rohanEntries.length, 1);

  await financeDataService.logoutWorkspace();
  assert.equal(financeDataService.getActiveWorkspaceId(), null);
  const loggedOutProfile = await financeDataService.getUserProfile();
  assert.equal(loggedOutProfile.isSetupComplete, false);
  const clearedEntries = await financeDataService.getLedgerEntries();
  assert.equal(clearedEntries.length, 0);
});


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
} from './financeLogic';
import { financeDataService } from './financeDataService';
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

test('calculateFinancialTotals computes income, expense, and savings correctly', () => {
  const totals = calculateFinancialTotals(mockProfile, mockEntries);
  assert.equal(totals.totalIncome, 85992);
  assert.equal(totals.totalExpense, 2000);
  assert.equal(totals.totalSavings, 83992);
  assert.ok(totals.savingsRate > 90);
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

test('calculateYearlyFinancialTotals scales monthlyBaseIncome by 12 and sums settled year entries', () => {
  const yearly = calculateYearlyFinancialTotals(mockProfile, mockEntries);
  assert.equal(yearly.totalIncome, 85992 * 12);
  assert.equal(yearly.totalExpense, 2000);
  assert.equal(yearly.totalSavings, 85992 * 12 - 2000);
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
  const { monthlySummaries, yearlySummaries } = buildAllSummaryTables(mockProfile, mockEntries);

  const mSum = monthlySummaries[monthKey];
  assert.ok(mSum);
  assert.equal(mSum.monthKey, monthKey);
  assert.equal(mSum.yearKey, yearKey);
  assert.equal(mSum.totalExpense, 2000);
  assert.equal(mSum.totalIncome, 85992);
  assert.equal(mSum.totalSavings, 83992);
  assert.equal(mSum.transactionCount, 2); // excludes BASKET_PLANNED
  assert.equal(mSum.categoryTotals['c1'], 500);
  assert.equal(mSum.categoryTotals['c2'], 1500);

  const catBreakdown = buildCategoryBreakdownFromTotals(mSum.categoryTotals, mockCategories);
  assert.equal(catBreakdown.length, 2);
  assert.equal(catBreakdown[0].categoryId, 'c2');
  assert.equal(catBreakdown[0].percentage, 75);

  const ySum = yearlySummaries[yearKey];
  assert.ok(ySum);
  assert.equal(ySum.totalIncome, 85992 * 12);
  assert.equal(ySum.totalExpense, 2000);
  assert.equal(ySum.totalSavings, 85992 * 12 - 2000);
  assert.equal(ySum.monthlyBreakdown[monthKey].expense, 2000);

  // Verify standalone buildMonthlySummary & buildYearlySummary match
  const manualMonth = buildMonthlySummary(monthKey, mockProfile, mockEntries);
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

  // 4. Settle basket item -> updates curMonth & curYear
  const basketItems = await financeDataService.getBasketPlannedEntries();
  assert.ok(basketItems.length > 0);
  await financeDataService.settleBasketItem(basketItems[0].id, 250, 'UPI / GPay', getLocalDateStr());
  const afterSettleMonth = await financeDataService.getMonthlySummary(curMonth);
  assert.equal(afterSettleMonth.totalExpense, initialMonth.totalExpense + 250);

  await financeDataService.resetAllData();
});



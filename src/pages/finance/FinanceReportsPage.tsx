import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { DonutBreakdownChart, DonutSlice } from '../../components/common/DonutBreakdownChart';
import { MonthSelector } from '../../components/common/MonthSelector';
import { MonthlyStatementCard } from '../../components/finance/MonthlyStatementCard';
import {
  formatINR,
  buildCategoryBreakdownFromTotals,
  calculateCategoryBreakdown,
  filterMonthEntriesByScopedTimeframe,
  getPreviousMonthKey,
} from '../../services/financeLogic';
import { TimeframeFilter } from '../../types/finance.types';

export const FinanceReportsPage: React.FC = () => {
  const {
    ledgerEntries,
    categoryMap,
    profile,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    selectedMonthSummary,
    incomeDeltaMoM,
    expenseDeltaMoM,
    setActiveTab,
    setSelectedCategoryFilter,
  } = useAppData();

  const [timeframe, setTimeframe] = useState<TimeframeFilter>('Monthly');

  // Top 3 KPI cards read in O(1) from pre-aggregated MonthlySummary for selectedMonth
  const monthlyTotals = useMemo(() => {
    if (selectedMonthSummary) {
      const { totalIncome, totalExpense, totalSavings } = selectedMonthSummary;
      const savingsRate =
        totalIncome > 0 ? Number(((totalSavings / totalIncome) * 100).toFixed(1)) : 0;
      return { totalIncome, totalExpense, totalSavings, savingsRate };
    }
    const baseIncome = profile?.monthlyBaseIncome ?? 85992;
    return {
      totalIncome: baseIncome,
      totalExpense: 0,
      totalSavings: baseIncome,
      savingsRate: 100,
    };
  }, [selectedMonthSummary, profile]);

  // Scoped entries ONLY for Daily/Weekly views in "Where Money Went" Donut + category grid
  const scopedBreakdownEntries = useMemo(() => {
    if (timeframe === 'Monthly') return [];
    return filterMonthEntriesByScopedTimeframe(ledgerEntries, timeframe, selectedMonth);
  }, [ledgerEntries, timeframe, selectedMonth]);

  const reportCategorySpend = useMemo(() => {
    if (timeframe === 'Monthly' && selectedMonthSummary) {
      return buildCategoryBreakdownFromTotals(selectedMonthSummary.categoryTotals, categoryMap);
    }
    return calculateCategoryBreakdown(scopedBreakdownEntries, categoryMap);
  }, [timeframe, selectedMonthSummary, scopedBreakdownEntries, categoryMap]);

  const scopedTotalSpent = useMemo(() => {
    if (timeframe === 'Monthly' && selectedMonthSummary) {
      return selectedMonthSummary.totalExpense;
    }
    return scopedBreakdownEntries
      .filter((e) => e.type === 'EXPENSE')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [timeframe, selectedMonthSummary, scopedBreakdownEntries]);

  const prevMonthKey = getPreviousMonthKey(selectedMonth);
  const [prevYear, prevMonthNum] = prevMonthKey.split('-').map(Number);
  const prevMonthShort = new Date(prevYear, prevMonthNum - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
  });

  const donutSlices: DonutSlice[] = reportCategorySpend.map((c) => ({
    id: c.categoryId,
    label: c.categoryName,
    value: c.amount,
    color: c.color,
    percentage: c.percentage,
  }));

  const handleCategoryClick = (catId: string) => {
    setSelectedCategoryFilter(catId);
    setActiveTab('activity');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* Minimalist Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Financial Reports & Analytics
        </h1>

        <MonthSelector
          selectedMonth={selectedMonth}
          availableMonths={availableMonths}
          onSelect={setSelectedMonth}
          variant="large"
        />
      </div>

      {/* Top KPI Row: 3 Equal Cards Strictly Locked to Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1C1E26] p-5 rounded-[24px] border border-slate-200/70 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Inflow</span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums block">
            {formatINR(monthlyTotals.totalIncome)}
          </span>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {incomeDeltaMoM >= 0 ? '↑ +' : '↓ '}
            {incomeDeltaMoM}% vs {prevMonthShort}
          </span>
        </div>

        <div className="bg-white dark:bg-[#1C1E26] p-5 rounded-[24px] border border-slate-200/70 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Outflow</span>
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums block">
            {formatINR(monthlyTotals.totalExpense)}
          </span>
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 block">
            {expenseDeltaMoM >= 0 ? `+${expenseDeltaMoM}%` : `${expenseDeltaMoM}%`} vs {prevMonthShort}
          </span>
        </div>

        <div className="bg-white dark:bg-[#1C1E26] p-5 rounded-[24px] border border-slate-200/70 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Surplus</span>
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums block">
            {formatINR(monthlyTotals.totalSavings)}
          </span>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
            ✓ {monthlyTotals.savingsRate}% savings rate
          </span>
        </div>
      </div>

      {/* Main Grid: Where Money Went Donut & Statements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Donut Breakdown + Category Grid */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1C1E26] rounded-[28px] p-5 md:p-6 border border-slate-200/70 dark:border-white/10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Breakdown
              </span>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                Where Money Went
              </h3>
            </div>

            {/* Scoped Daily | Weekly | Monthly Segmented Toggle */}
            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Category breakdown timeframe"
                className="inline-flex p-1 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-full"
              >
                {(['Daily', 'Weekly', 'Monthly'] as TimeframeFilter[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                      timeframe === tf
                        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <DonutBreakdownChart
              slices={donutSlices}
              totalAmount={scopedTotalSpent}
              centerTitle="Total Spent"
              deltaBadge={
                timeframe === 'Monthly'
                  ? `${expenseDeltaMoM >= 0 ? '+' : ''}${expenseDeltaMoM}% vs ${prevMonthShort}`
                  : `${timeframe} view`
              }
              size={240}
              onSliceClick={handleCategoryClick}
            />
          </div>

          {/* Category Cards Grid */}
          {reportCategorySpend.length === 0 ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
              No settled expenses recorded for this {timeframe.toLowerCase()} window.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {reportCategorySpend.map((cat) => (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() => handleCategoryClick(cat.categoryId)}
                  className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 text-left transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                    >
                      <span>{cat.emoji}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#1C1E26] border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-2xs">
                      {cat.percentage}%
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate group-hover:text-slate-950 dark:group-hover:text-white">
                    {cat.categoryName}
                  </span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums block mt-0.5">
                    {formatINR(cat.amount)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 text-center">
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryFilter('all');
                setActiveTab('activity');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>Tap category to inspect in Activity ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Monthly Statement & Export Hub */}
        <div className="lg:col-span-5 space-y-6">
          <MonthlyStatementCard />
        </div>
      </div>
    </div>
  );
};

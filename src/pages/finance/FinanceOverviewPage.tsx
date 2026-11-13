import React, { useState } from 'react';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { KpiStatCard } from '../../components/common/KpiStatCard';
import { MoneyFlowChartCard } from '../../components/finance/MoneyFlowChartCard';
import { DonutBreakdownChart, DonutSlice } from '../../components/common/DonutBreakdownChart';
import { TransactionItemRow } from '../../components/finance/TransactionItemRow';
import { formatCompactINR, formatINR, getLocalDateStr, getPreviousMonthKey } from '../../services/financeLogic';
import { OverviewScope } from '../../types/finance.types';

export const FinanceOverviewPage: React.FC = () => {
  const {
    overviewData,
    profile,
    overviewScope,
    setOverviewScope,
    updateSavingsTarget,
    setActiveTab,
    setSelectedCategoryFilter,
  } = useAppData();

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState<string>('');

  const totalIncome = overviewData?.totalIncome ?? 85992;
  const totalExpense = overviewData?.totalExpense ?? 38160;
  const totalSavings = overviewData?.totalSavings ?? 47832;
  const recentTransactions = overviewData?.recentTransactions ?? [];
  const categorySpend = overviewData?.categorySpend ?? [];

  // Dynamic comparison percentage deltas
  const incDelta = overviewData?.incomeDeltaMoM ?? 0;
  const expDelta = overviewData?.expenseDeltaMoM ?? 0;
  const periodLabel = overviewScope === 'Yearly' ? 'last year' : 'last month';

  const incDeltaText = `${incDelta >= 0 ? '+' : ''}${incDelta}% vs ${periodLabel}`;
  const expDeltaText = `${expDelta >= 0 ? '+' : ''}${expDelta}% vs ${periodLabel}`;

  // Savings Target calculation (scaled ×12 when Yearly)
  const monthlyTarget = profile?.monthlySavingsTarget ?? overviewData?.profile?.monthlySavingsTarget ?? 0;
  const effectiveTarget = overviewScope === 'Yearly' ? monthlyTarget * 12 : monthlyTarget;
  const isTargetMet = effectiveTarget > 0 && totalSavings >= effectiveTarget;

  const handleOpenTargetEdit = () => {
    setTargetInput(monthlyTarget > 0 ? String(monthlyTarget) : '');
    setIsEditingTarget(true);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(targetInput);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      await updateSavingsTarget(Math.round(parsed));
    }
    setIsEditingTarget(false);
  };

  const savingsTargetBadgeNode = isEditingTarget ? (
    <form
      onSubmit={handleSaveTarget}
      className="flex items-center gap-1.5 bg-white dark:bg-[#15171F] border border-indigo-200 dark:border-indigo-700/60 rounded-full px-2 py-1 shadow-xs"
    >
      <span className="text-[10px] font-bold text-slate-400 pl-1">₹</span>
      <input
        type="number"
        min={0}
        step={500}
        autoFocus
        value={targetInput}
        onChange={(e) => setTargetInput(e.target.value)}
        placeholder="Monthly target"
        aria-label="Monthly savings target in rupees"
        className="w-20 bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none tabular-nums"
      />
      <button
        type="submit"
        aria-label="Save savings target"
        className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shrink-0"
      >
        <Check className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => setIsEditingTarget(false)}
        aria-label="Cancel target edit"
        className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </form>
  ) : (
    <button
      type="button"
      onClick={handleOpenTargetEdit}
      title="Click to edit monthly savings target"
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full max-w-full transition-colors cursor-pointer ${
        isTargetMet
          ? 'bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
          : 'bg-[#DFE5FD] text-[#2D3B87] hover:bg-[#D0D8FB] dark:bg-[#252A44] dark:text-[#9EA8FD] dark:hover:bg-[#2F3556]'
      }`}
    >
      {effectiveTarget > 0 ? (
        isTargetMet ? (
          <span className="truncate">🎯 Target Met ({formatCompactINR(effectiveTarget)})</span>
        ) : (
          <span className="truncate">
            🎯 {formatCompactINR(totalSavings)} / {formatCompactINR(effectiveTarget)}
          </span>
        )
      ) : (
        <span className="truncate">🎯 Set Target</span>
      )}
      <Pencil className="w-2.5 h-2.5 shrink-0 opacity-75" />
    </button>
  );

  // Current month breakdown label (always locked to current month)
  const currentMonthKey = getLocalDateStr().substring(0, 7);
  const prevMonthKey = getPreviousMonthKey(currentMonthKey);
  const [prevYear, prevMonthNum] = prevMonthKey.split('-').map(Number);
  const prevMonthShort = new Date(prevYear, prevMonthNum - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
  });
  const curMonthExp = overviewData?.currentMonthExpense ?? totalExpense;
  const curMonthExpDelta = overviewData?.currentMonthExpenseDelta ?? expDelta;
  const donutDeltaBadge = `${curMonthExpDelta >= 0 ? '+' : ''}${curMonthExpDelta}% vs ${prevMonthShort}`;

  // Donut slices
  const donutSlices: DonutSlice[] = categorySpend.slice(0, 4).map((c) => ({
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
      {/* KPI Cards: Financial Record Header + Monthly / Yearly Toggle */}
      <section aria-label="Financial Summary Cards">
        <div className="flex items-center justify-between pb-3.5">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Financial Record
          </h2>

          {/* Monthly | Yearly 2-option Pill Toggle */}
          <div
            role="group"
            aria-label="Financial summary scope"
            className="inline-flex items-center p-1 bg-white dark:bg-[#1C1E26] border border-slate-200/70 dark:border-white/10 rounded-full shadow-xs"
          >
            {(['Monthly', 'Yearly'] as OverviewScope[]).map((scopeOption) => {
              const isActive = overviewScope === scopeOption;
              return (
                <button
                  key={scopeOption}
                  type="button"
                  onClick={() => setOverviewScope(scopeOption)}
                  className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {scopeOption}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop 3-Card Row (>= 768px) */}
        <div className="hidden md:grid grid-cols-3 gap-5">
          <KpiStatCard
            title="Total Income"
            amount={totalIncome}
            deltaText={incDeltaText}
            colorVariant="mint"
            icon={<TrendingUp className="w-3.5 h-3.5" />}
          />
          <KpiStatCard
            title="Total Expense"
            amount={totalExpense}
            deltaText={expDeltaText}
            colorVariant="peach"
            icon={<TrendingDown className="w-3.5 h-3.5" />}
          />
          <KpiStatCard
            title="Total Savings"
            amount={totalSavings}
            colorVariant="lavender"
            icon={<PiggyBank className="w-3.5 h-3.5" />}
            badgeNode={savingsTargetBadgeNode}
          />
        </div>

        {/* Mobile Viewport (< 768px) */}
        <div className="md:hidden space-y-3">
          {/* Hero Card: Total Expense (Budget cap subtitle removed) */}
          <KpiStatCard
            isHero
            title="Total Expense"
            amount={totalExpense}
            deltaText={expDeltaText}
            colorVariant="peach"
            icon={<TrendingDown className="w-3.5 h-3.5" />}
          />

          {/* 2-Column Split Row: Total Income & Total Savings */}
          <div className="grid grid-cols-2 gap-3">
            <KpiStatCard
              title="Total Income"
              amount={totalIncome}
              deltaText={incDeltaText}
              colorVariant="mint"
              icon={<TrendingUp className="w-3.5 h-3.5" />}
            />
            <KpiStatCard
              title="Total Savings"
              amount={totalSavings}
              colorVariant="lavender"
              icon={<PiggyBank className="w-3.5 h-3.5" />}
              badgeNode={savingsTargetBadgeNode}
            />
          </div>
        </div>
      </section>

      {/* Desktop 12-Column Grid / Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns (Charts & Where Money Went) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Money Flow Card */}
          <MoneyFlowChartCard />

          {/* Where Money Went Card (Strictly locked to Current Month) */}
          <div className="bg-white dark:bg-[#1C1E26] rounded-[28px] p-5 md:p-6 border border-slate-200/70 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Breakdown • Current Month
                </span>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                  Where Money Went
                </h3>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400">
                {categorySpend.length} Categories
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Donut Chart */}
              <div className="md:col-span-5 flex justify-center py-2">
                <DonutBreakdownChart
                  slices={donutSlices}
                  totalAmount={curMonthExp}
                  centerTitle="SPENT"
                  deltaBadge={donutDeltaBadge}
                  onSliceClick={handleCategoryClick}
                />
              </div>

              {/* 2x2 Clickable Category Summary Pills */}
              <div className="md:col-span-7 grid grid-cols-2 gap-3">
                {categorySpend.slice(0, 4).map((cat) => (
                  <button
                    key={cat.categoryId}
                    type="button"
                    onClick={() => handleCategoryClick(cat.categoryId)}
                    className="p-3.5 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
                        {cat.percentage}%
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate group-hover:text-slate-950 dark:group-hover:text-white">
                      {cat.categoryName}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums block mt-0.5">
                      {formatINR(cat.amount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Click prompt */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 text-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter('all');
                  setActiveTab('activity');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <span>Tap category to inspect in Activity ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Columns (Recent Transactions Feed — Hidden on Mobile < 768px) */}
        <div className="hidden md:flex lg:col-span-4 bg-white dark:bg-[#1C1E26] rounded-[28px] p-5 md:p-6 border border-slate-200/70 dark:border-white/10 shadow-sm flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                Recent Transactions
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                See All
              </button>
            </div>

            {/* Transaction Items */}
            <div className="divide-y divide-slate-100 dark:divide-white/5 -mx-1.5">
              {recentTransactions.map((tx) => (
                <TransactionItemRow
                  key={tx.id}
                  entry={tx}
                  onClick={() => {
                    setSelectedCategoryFilter(tx.categoryId);
                    setActiveTab('activity');
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Action Pill */}
          <div className="pt-5 mt-2 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className="w-full py-3 px-4 rounded-full bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs md:text-sm font-bold flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/10 transition-all active:scale-[0.99]"
            >
              <span>View Complete Ledger in Activity</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

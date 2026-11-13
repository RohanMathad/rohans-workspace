import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { CategoryPillBar } from '../../components/common/CategoryPillBar';
import { MonthSelector } from '../../components/common/MonthSelector';
import { DayGroupedLedgerList } from '../../components/finance/DayGroupedLedgerList';
import { filterEntriesByTimeframe } from '../../services/financeLogic';
import { TimeframeFilter } from '../../types/finance.types';

export const FinanceActivityPage: React.FC = () => {
  const {
    ledgerEntries,
    selectedCategoryFilter,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    categoryMap,
  } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [periodMode, setPeriodMode] = useState<TimeframeFilter>('Monthly');

  // Filter settled transactions according to timeframe and month
  const filteredEntries = useMemo(() => {
    const settled = ledgerEntries.filter((item) => item.status === 'SETTLED');
    const timeframeFiltered = filterEntriesByTimeframe(settled, periodMode, selectedMonth);

    return timeframeFiltered.filter((item) => {
      // Category filter
      if (selectedCategoryFilter !== 'all' && item.categoryId !== selectedCategoryFilter) {
        return false;
      }

      // Search filter (resolves category name dynamically via categoryMap)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const catName = (categoryMap[item.categoryId]?.name || '').toLowerCase();
        const matchesCat = catName.includes(q);
        const matchesMethod = item.paymentMethod?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesCat && !matchesMethod) return false;
      }

      return true;
    });
  }, [ledgerEntries, periodMode, selectedMonth, selectedCategoryFilter, searchQuery, categoryMap]);

  const activeMonthOption = availableMonths.find((m) => m.key === selectedMonth) || availableMonths[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Minimalist Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Activity Ledger
        </h1>

        <div className="px-4 py-2 rounded-2xl bg-slate-100/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 text-xs font-bold tabular-nums">
          TOTAL LOGS: {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#1C1E26] p-3 md:p-3.5 rounded-[24px] border border-slate-200/70 dark:border-white/10 shadow-sm">
        {/* Left: Daily / Weekly / Monthly toggle & Month dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-full">
            {(['Daily', 'Weekly', 'Monthly'] as TimeframeFilter[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setPeriodMode(tf)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  periodMode === tf
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <MonthSelector
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            onSelect={setSelectedMonth}
            variant="capsule"
          />
        </div>

        {/* Right: Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Multi-row Wrapping Category Pills Bar */}
      <CategoryPillBar />

      {/* Day Grouped Ledger List */}
      <DayGroupedLedgerList
        entries={filteredEntries}
        showTags={false}
        monthLabel={activeMonthOption.label}
      />
    </div>
  );
};

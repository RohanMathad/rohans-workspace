import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { LedgerEntry } from '../../types/finance.types';
import { groupTransactionsByDay, formatINR, getLocalDateStr } from '../../services/financeLogic';
import { TransactionItemRow } from './TransactionItemRow';

interface DayGroupedLedgerListProps {
  entries: LedgerEntry[];
  showTags?: boolean;
  monthLabel?: string;
}

export const DayGroupedLedgerList: React.FC<DayGroupedLedgerListProps> = ({
  entries,
  showTags = false,
  monthLabel,
}) => {
  const groups = groupTransactionsByDay(entries);
  const todayStr = getLocalDateStr();
  const currentMonthLabel = monthLabel || new Date().toLocaleDateString('en-US', { month: 'long' });

  if (groups.length === 0) {
    return (
      <div className="py-12 text-center bg-white dark:bg-[#1C1E26] rounded-[28px] border border-slate-200/70 dark:border-white/10 shadow-sm p-8">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          No transactions match this category or timeframe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        return (
          <div key={group.date} className="space-y-2.5">
            {/* Day Header Row */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    group.date === todayStr ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  {group.title}
                </h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ml-1 ${
                    group.badgeColor === 'peach'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      : 'bg-indigo-100/70 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                  }`}
                >
                  Total: {formatINR(group.totalAmount)}
                </span>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Container Card for day's items */}
            <div className="bg-white dark:bg-[#1C1E26] rounded-[24px] border border-slate-200/70 dark:border-white/10 shadow-sm divide-y divide-slate-100 dark:divide-white/5 p-1.5 md:p-2">
              {group.items.map((entry) => (
                <TransactionItemRow key={entry.id} entry={entry} showTagStatus={showTags} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer reassurance badge matching screenshot 12.png */}
      <div className="pt-6 pb-12 flex flex-col items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500 gap-1.5">
        <CheckCircle2 className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        <span>All {currentMonthLabel} transactions reconciled</span>
      </div>
    </div>
  );
};

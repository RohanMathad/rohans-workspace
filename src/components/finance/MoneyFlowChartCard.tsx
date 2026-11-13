import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { TimeframeFilter } from '../../types/finance.types';
import { formatCompactINR, formatINR } from '../../services/financeLogic';

export const MoneyFlowChartCard: React.FC = () => {
  const { overviewData, profile, overviewScope, timeframeFilter, setTimeframeFilter } = useAppData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = overviewData?.flowTrend || [];
  const savingsRate = overviewData?.savingsRate ?? 0;
  const totalSavings = overviewData?.totalSavings ?? 0;
  const monthlyTarget = profile?.monthlySavingsTarget ?? overviewData?.profile?.monthlySavingsTarget ?? 0;
  const effectiveTarget = overviewScope === 'Yearly' ? monthlyTarget * 12 : monthlyTarget;
  const isTargetMet = effectiveTarget > 0 && totalSavings >= effectiveTarget;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-slate-700/50 dark:border-slate-200">
          <span>{label}: </span>
          <span className="text-emerald-400 dark:text-emerald-600">
            {formatINR(payload[0]?.value)}
          </span>
          {payload[1] && (
            <span className="text-rose-400 dark:text-rose-600 ml-2">
              Exp: {formatINR(payload[1]?.value)}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  const axisTickColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div className="bg-white dark:bg-[#1C1E26] rounded-[28px] p-5 md:p-6 border border-slate-200/70 dark:border-white/10 shadow-sm">
      {/* Header with Title and Daily / Weekly / Monthly pill toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
            Money Flow
          </h3>
          <div className="flex items-center gap-4 mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3F51B5] dark:bg-[#818CF8]" />
              Total Saving
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4532B] dark:bg-[#FF8566]" />
              Total Expense
            </span>
          </div>
        </div>

        {/* Timeframe pill toggle */}
        <div className="inline-flex items-center p-1 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-full self-start sm:self-auto">
          {(['Daily', 'Weekly', 'Monthly'] as TimeframeFilter[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframeFilter(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                timeframeFilter === tf
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Spline Area Chart (>= 768px) */}
      <div className="hidden md:block h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="savingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3F51B5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3F51B5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4532B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#D4532B" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisTickColor, fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fill: axisTickColor, fontSize: 11 }}
              tickFormatter={(val) =>
                val >= 1000
                  ? `₹${Number((val / 1000).toFixed(1))}k`
                  : `₹${val}`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="#3F51B5"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#savingGrad)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#D4532B"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#expenseGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mobile Bar Chart (< 768px) */}
      <div className="block md:hidden">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tick={{ fill: axisTickColor, fontSize: 10 }}
                tickFormatter={(val) =>
                  val >= 1000
                    ? `₹${Number((val / 1000).toFixed(0))}k`
                    : `₹${val}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="savings"
                fill="#168B53"
                radius={[6, 6, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="expense"
                fill="#D4532B"
                radius={[6, 6, 0, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Savings Rate & Target Status Badge (Desktop + Mobile) */}
      <div
        className={`mt-4 flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-semibold border ${
          isTargetMet || effectiveTarget === 0
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
            : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Savings Rate: {savingsRate}%</span>
        </span>
        <span className="flex items-center gap-1 font-bold">
          {effectiveTarget > 0
            ? isTargetMet
              ? `🎯 Target Met (${formatCompactINR(effectiveTarget)})`
              : `🎯 ${formatCompactINR(totalSavings)} / ${formatCompactINR(effectiveTarget)}`
            : '🎯 No Target Set'}
        </span>
      </div>
    </div>
  );
};

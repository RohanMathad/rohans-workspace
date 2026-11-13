import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatINR } from '../../services/financeLogic';

export interface KpiStatCardProps {
  title: string;
  amount: number;
  deltaText?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  colorVariant: 'mint' | 'peach' | 'lavender';
  subtitle?: string;
  icon?: React.ReactNode;
  isHero?: boolean;
  badgeNode?: React.ReactNode;
}

export const KpiStatCard: React.FC<KpiStatCardProps> = ({
  title,
  amount,
  deltaText,
  colorVariant,
  subtitle,
  icon,
  isHero = false,
  badgeNode,
}) => {
  // Color configuration matching design specifications
  const colorMap = {
    mint: {
      bg: 'bg-[#E8F8F0] dark:bg-[#192B24]',
      border: 'border-[#D0F0E0] dark:border-[#1E3A2E]',
      textPrimary: 'text-[#168B53] dark:text-[#3DDC84]',
      headingText: 'text-slate-900 dark:text-emerald-50',
      badgeBg: 'bg-[#D3F5E4] dark:bg-[#1D3E31]',
      badgeText: 'text-[#0E683D] dark:text-[#5CE69C]',
    },
    peach: {
      bg: 'bg-[#FDF0EA] dark:bg-[#2D1F1E]',
      border: 'border-[#FADCD0] dark:border-[#3E2520]',
      textPrimary: 'text-[#D4532B] dark:text-[#FF8566]',
      headingText: 'text-slate-900 dark:text-rose-50',
      badgeBg: 'bg-[#FBE2D8] dark:bg-[#3D2520]',
      badgeText: 'text-[#B03C18] dark:text-[#FFA085]',
    },
    lavender: {
      bg: 'bg-[#EEF2FF] dark:bg-[#1D2233]',
      border: 'border-[#DCE2FE] dark:border-[#282C46]',
      textPrimary: 'text-[#3F51B5] dark:text-[#818CF8]',
      headingText: 'text-slate-900 dark:text-indigo-50',
      badgeBg: 'bg-[#DFE5FD] dark:bg-[#252A44]',
      badgeText: 'text-[#2D3B87] dark:text-[#9EA8FD]',
    },
  };

  const currentTheme = colorMap[colorVariant];

  return (
    <div
      className={`relative rounded-[24px] p-4 sm:p-5 md:p-6 transition-all duration-200 border flex flex-col justify-between ${
        currentTheme.bg
      } ${currentTheme.border} ${isHero ? 'w-full' : ''}`}
    >
      {/* Top Row: Title + Circular Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
          {title}
        </span>
        {icon && (
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${currentTheme.badgeBg} ${currentTheme.textPrimary}`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Middle: Amount */}
      <div className="mt-3 mb-3">
        <h3 className={`text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight tabular-nums ${currentTheme.headingText}`}>
          {formatINR(amount)}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom Row: Custom Interactive Badge OR Comparison Pill */}
      {badgeNode ? (
        <div className="min-w-0">{badgeNode}</div>
      ) : deltaText ? (
        <div className="flex items-center min-w-0">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full max-w-full whitespace-nowrap truncate ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
          >
            {deltaText.includes('-') ? (
              <ArrowDownRight className="w-3 h-3 shrink-0" />
            ) : (
              <ArrowUpRight className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">{deltaText}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
};

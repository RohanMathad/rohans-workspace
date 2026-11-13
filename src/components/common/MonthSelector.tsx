import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { MonthOption } from '../../types/finance.types';

interface MonthSelectorProps {
  selectedMonth: string; // 'YYYY-MM'
  availableMonths: MonthOption[];
  onSelect: (monthKey: string) => void;
  variant?: 'capsule' | 'large';
  className?: string;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  availableMonths,
  onSelect,
  variant = 'capsule',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    availableMonths.find((m) => m.key === selectedMonth) ||
    availableMonths[0] || {
      key: selectedMonth,
      label: 'Current Month',
      shortLabel: 'Current',
    };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {variant === 'large' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-[#1C1E26] border border-slate-200/70 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-800 dark:text-slate-100 transition-all text-xs md:text-sm font-semibold shadow-xs"
        >
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{currentOption.label}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
        >
          <span>{currentOption.shortLabel}</span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 min-w-[170px] py-1.5 rounded-2xl bg-white dark:bg-[#1C1E26] border border-slate-200/80 dark:border-white/10 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Billing Cycle
          </div>
          {availableMonths.map((month) => {
            const isSelected = month.key === selectedMonth;
            return (
              <button
                key={month.key}
                type="button"
                onClick={() => {
                  onSelect(month.key);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <span>{month.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

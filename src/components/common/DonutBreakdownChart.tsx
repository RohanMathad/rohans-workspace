import React, { useState } from 'react';
import { formatINR } from '../../services/financeLogic';
import { useTheme } from '../../context/ThemeContext';

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface DonutBreakdownChartProps {
  slices: DonutSlice[];
  totalAmount: number;
  centerTitle?: string;
  deltaBadge?: string;
  size?: number;
  strokeWidth?: number;
  onSliceClick?: (sliceId: string) => void;
}

export const DonutBreakdownChart: React.FC<DonutBreakdownChartProps> = ({
  slices,
  totalAmount,
  centerTitle = 'Total Spent',
  deltaBadge = '+12% vs Oct',
  size = 220,
  strokeWidth = 26,
  onSliceClick,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<DonutSlice | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke offsets
  let accumulatedPercent = 0;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] transform"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isDark ? '#262936' : '#EEF0F6'}
          strokeWidth={strokeWidth}
        />

        {/* Dynamic slices */}
        {slices.map((slice) => {
          const sliceCircumference = (slice.percentage / 100) * circumference;
          const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
          accumulatedPercent += slice.percentage;

          const isHovered = hoveredSlice?.id === slice.id;

          return (
            <circle
              key={slice.id}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${sliceCircumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredSlice(slice)}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => onSliceClick && onSliceClick(slice.id)}
            />
          );
        })}
      </svg>

      {/* Center Metrics Pill */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
          {hoveredSlice ? hoveredSlice.label : centerTitle}
        </span>
        <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tabular-nums my-0.5">
          {hoveredSlice ? formatINR(hoveredSlice.value) : formatINR(totalAmount)}
        </span>
        {deltaBadge && (
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 mt-0.5">
            {hoveredSlice ? `${hoveredSlice.percentage}% share` : deltaBadge}
          </span>
        )}
      </div>
    </div>
  );
};

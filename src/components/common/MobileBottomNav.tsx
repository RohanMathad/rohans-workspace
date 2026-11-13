import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

export interface MobileBottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MobileBottomNavProps {
  navItems: MobileBottomNavItem[];
  activeItemId: string;
  onSelect: (id: string) => void;
  onPrimaryActionClick?: () => void;
  primaryActionLabel?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  navItems,
  activeItemId,
  onSelect,
  onPrimaryActionClick,
  primaryActionLabel = 'Add transaction or expense',
}) => {
  const splitIndex = Math.ceil(navItems.length / 2);
  const leftItems = navItems.slice(0, splitIndex);
  const rightItems = navItems.slice(splitIndex);

  const renderNavItem = (item: MobileBottomNavItem) => {
    const Icon = item.icon;
    const isActive = activeItemId === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect(item.id)}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-colors ${
          isActive
            ? 'text-slate-900 dark:text-white font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
        aria-label={item.label}
      >
        <div
          className={`p-1.5 rounded-full transition-colors ${
            isActive
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : ''
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 lg:hidden pointer-events-none">
      <nav
        aria-label="Mobile Bottom Navigation"
        className="pointer-events-auto flex items-center justify-between w-full max-w-sm px-3 py-2 bg-white/80 dark:bg-[#1C1E26]/85 backdrop-blur-xl rounded-full border border-slate-200/80 dark:border-white/10 shadow-lg"
      >
        {leftItems.map(renderNavItem)}

        {onPrimaryActionClick && (
          <button
            type="button"
            onClick={onPrimaryActionClick}
            aria-label={primaryActionLabel}
            className="w-12 h-12 -mt-4 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-[#F6F7FB] dark:border-[#12131A] focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}

        {rightItems.map(renderNavItem)}
      </nav>
    </div>
  );
};


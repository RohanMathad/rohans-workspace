import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

interface CategoryPillBarProps {
  onManageClick?: () => void;
  showManageButton?: boolean;
}

export const CategoryPillBar: React.FC<CategoryPillBarProps> = ({
  onManageClick,
  showManageButton = true,
}) => {
  const { categories, selectedCategoryFilter, setSelectedCategoryFilter, setActiveTab } =
    useAppData();

  const handleManage = () => {
    if (onManageClick) {
      onManageClick();
    } else {
      setActiveTab('categories');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {/* 'All' category pill */}
      <button
        type="button"
        onClick={() => setSelectedCategoryFilter('all')}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
          selectedCategoryFilter === 'all'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
            : 'bg-white dark:bg-[#1C1E26] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 hover:bg-slate-100/80 dark:hover:bg-white/5'
        }`}
      >
        <span>All</span>
        {selectedCategoryFilter === 'all' && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        )}
      </button>

      {/* Individual category pills */}
      {categories
        .filter((cat) => !cat.isArchived)
        .map((cat) => {
          const isSelected = selectedCategoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-[#1C1E26] text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 hover:bg-slate-100/80 dark:hover:bg-white/5'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}

      {/* '+ Manage' pill button */}
      {showManageButton && (
        <button
          type="button"
          onClick={handleManage}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-white/20 hover:border-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Manage</span>
        </button>
      )}
    </div>
  );
};

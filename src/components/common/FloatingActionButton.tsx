import React from 'react';
import { Plus } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const FloatingActionButton: React.FC = () => {
  const { openQuickAdd } = useAppData();

  return (
    <button
      type="button"
      onClick={openQuickAdd}
      aria-label="Add transaction or expense"
      className="hidden lg:flex fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 items-center justify-center shadow-[0_12px_28px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
    >
      <Plus className="w-7 h-7 stroke-[2.5]" />
    </button>
  );
};

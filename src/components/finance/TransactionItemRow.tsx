import React, { useState, useRef, useEffect } from 'react';
import {
  Utensils,
  ShoppingCart,
  Zap,
  Plane,
  ShoppingBag,
  FileText,
  Heart,
  HelpCircle,
  MoreVertical,
} from 'lucide-react';
import { LedgerEntry } from '../../types/finance.types';
import { formatINR, UNKNOWN_CATEGORY } from '../../services/financeLogic';
import { useAppData } from '../../context/AppDataContext';

interface TransactionItemRowProps {
  entry: LedgerEntry;
  showTagStatus?: boolean;
  onEdit?: (entry: LedgerEntry) => void;
  onDelete?: (id: string) => void;
  onClick?: (entry: LedgerEntry) => void;
}

export const TransactionItemRow: React.FC<TransactionItemRowProps> = ({
  entry,
  onEdit,
  onDelete,
  onClick,
}) => {
  const { openEditModal, deleteTransaction, categoryMap } = useAppData();
  const category = categoryMap[entry.categoryId] || UNKNOWN_CATEGORY;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Determine matching icon based on resolved category
  const renderCategoryIcon = () => {
    if (category.emoji) {
      return <span className="text-lg leading-none select-none">{category.emoji}</span>;
    }
    const cid = entry.categoryId.toLowerCase();
    const cname = category.name.toLowerCase();

    if (cid.includes('food') || cname.includes('food')) {
      return <Utensils className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    }
    if (cid.includes('grocer') || cname.includes('grocer')) {
      return <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (cid.includes('elect') || cname.includes('tech') || cname.includes('elect')) {
      return <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
    if (cid.includes('travel') || cname.includes('travel') || cname.includes('fuel')) {
      return <Plane className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    if (cid.includes('shop') || cname.includes('shop')) {
      return <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
    if (cid.includes('util') || cname.includes('util') || cname.includes('bill')) {
      return <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }
    if (cid.includes('person') || cname.includes('care')) {
      return <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
    }
    return <HelpCircle className="w-4 h-4 text-slate-500" />;
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onEdit) {
      onEdit(entry);
    } else {
      openEditModal(entry);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onDelete) {
      onDelete(entry.id);
    } else {
      await deleteTransaction(entry.id);
    }
  };

  return (
    <div
      onClick={() => onClick && onClick(entry)}
      className={`group relative flex items-center justify-between py-3 px-3.5 rounded-2xl transition-all duration-150 hover:bg-slate-100/80 dark:hover:bg-white/5 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Left Icon and Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${category.color}18`, color: category.color }}
        >
          {renderCategoryIcon()}
        </div>

        <div className="min-w-0">
          <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
            {entry.title}
          </h4>
          <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            <span>{category.name}</span>
            {entry.paymentMethod && (
              <>
                <span className="mx-1">•</span>
                <span>{entry.paymentMethod}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Amount, Time, and 3-Dot Action Menu */}
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <div className="flex flex-col items-end">
          <span
            className={`text-sm md:text-base font-extrabold tabular-nums ${
              entry.type === 'INCOME'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {entry.type === 'INCOME' ? '+' : '-'}
            {formatINR(entry.amount)}
          </span>

          {entry.time && (
            <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium tabular-nums">
              {entry.time}
            </span>
          )}
        </div>

        {/* 3-Dot Action Menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Transaction actions"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-9 z-40 w-40 py-1.5 rounded-2xl bg-white dark:bg-[#1C1E26] border border-slate-200/80 dark:border-white/10 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                onClick={handleEditClick}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
              >
                <span>✏️</span>
                <span>Edit Entry</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
              >
                <span>🗑️</span>
                <span>Delete Entry</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

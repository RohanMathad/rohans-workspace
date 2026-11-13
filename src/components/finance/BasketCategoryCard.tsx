import React, { useState, useRef, useEffect } from 'react';
import { Check, Plus, MoreVertical, X } from 'lucide-react';
import { Category, LedgerEntry } from '../../types/finance.types';
import { useAppData } from '../../context/AppDataContext';

interface BasketCategoryCardProps {
  category: Category;
  items: LedgerEntry[];
  onSettleClick: (item: LedgerEntry) => void;
  onAddItemClick: (categoryId: string) => void;
}

export const BasketCategoryCard: React.FC<BasketCategoryCardProps> = ({
  category,
  items,
  onSettleClick,
  onAddItemClick,
}) => {
  const { activeCategories, updateBasketItem, deleteBasketItem } = useAppData();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<LedgerEntry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const startEditing = (item: LedgerEntry) => {
    setOpenMenuId(null);
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategoryId(item.categoryId);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim()) return;
    await updateBasketItem(editingItem.id, {
      title: editTitle.trim(),
      categoryId: editCategoryId,
    });
    setEditingItem(null);
  };

  const handleRemoveItem = async (id: string) => {
    setOpenMenuId(null);
    await deleteBasketItem(id);
  };

  return (
    <div
      ref={menuContainerRef}
      className="bg-white dark:bg-[#1C1E26] rounded-[28px] border border-slate-200/70 dark:border-white/10 shadow-sm p-5 md:p-6 flex flex-col justify-between"
    >
      <div>
        {/* Category Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}
            >
              <span>{category.emoji}</span>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                {category.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {category.description || 'Planned purchases'}
              </p>
            </div>
          </div>

          {/* Items count badge */}
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 shrink-0 tabular-nums">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Planned Items List */}
        <div className="divide-y divide-slate-100 dark:divide-white/5 mb-4">
          {items.map((item) => {
            const isEditingThis = editingItem?.id === item.id;

            if (isEditingThis) {
              return (
                <form
                  key={item.id}
                  onSubmit={handleSaveEdit}
                  className="py-3.5 space-y-2.5 bg-slate-50/70 dark:bg-white/5 -mx-2 px-3 rounded-2xl my-1 border border-slate-200/70 dark:border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Edit Basket Item
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Item name..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    <select
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {activeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shadow-xs hover:opacity-90 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={item.id}
                className="py-3.5 flex items-center justify-between gap-3 group relative"
              >
                <div className="min-w-0">
                  <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    <span>Planned item</span>
                    {item.notes && <span>• {item.notes}</span>}
                  </div>
                </div>

                {/* Right Actions: [ ✓ Bought ] + [ ⋮ 3-Dot Menu ] */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSettleClick(item)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Bought</span>
                  </button>

                  {/* 3-Dot Menu Button */}
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Basket item actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === item.id ? null : item.id);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === item.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-9 z-40 w-44 py-1.5 rounded-2xl bg-white dark:bg-[#1C1E26] border border-slate-200/80 dark:border-white/10 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                        >
                          <span>✏️</span>
                          <span>Edit Item</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                        >
                          <span>🗑️</span>
                          <span>Remove from Basket</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Quick Add for this category */}
      <button
        type="button"
        onClick={() => onAddItemClick(category.id)}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors mt-2 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Add item to {category.name}</span>
      </button>
    </div>
  );
};

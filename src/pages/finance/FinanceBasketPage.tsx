import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { BasketCategoryCard } from '../../components/finance/BasketCategoryCard';

export const FinanceBasketPage: React.FC = () => {
  const {
    activeCategories,
    ledgerEntries,
    addBasketItem,
    openSettleModal,
    setActiveTab,
  } = useAppData();

  const [newItemTitle, setNewItemTitle] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Set default category
  React.useEffect(() => {
    if (activeCategories.length > 0 && !selectedCatId) {
      setSelectedCatId(activeCategories[0].id);
    }
  }, [activeCategories, selectedCatId]);

  // All planned items in basket
  const plannedItems = ledgerEntries.filter((e) => e.status === 'BASKET_PLANNED');

  // Group planned items by category
  const categoriesWithItems = activeCategories
    .map((cat) => {
      const items = plannedItems.filter((i) => i.categoryId === cat.id);
      return {
        category: cat,
        items,
      };
    })
    .filter((group) => group.items.length > 0);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !selectedCatId) return;

    try {
      setIsAdding(true);
      await addBasketItem(newItemTitle.trim(), selectedCatId, 0);
      setNewItemTitle('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__manage_categories__') {
      setActiveTab('categories');
      return;
    }
    setSelectedCatId(value);
  };

  const handleAddForCategory = (catId: string) => {
    setSelectedCatId(catId);
    const el = document.getElementById('basketItemInput');
    if (el) el.focus();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Minimalist Header */}
      <div className="flex items-center justify-between gap-3 mb-6 pt-2">
        <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          Shopping Basket & To-Buy List
        </h1>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-bold tabular-nums shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Basket Items: {plannedItems.length}</span>
        </div>
      </div>

      {/* Top Quick-Add Bar (Item Name, Category Selector, + Add to Basket) */}
      <div className="bg-white dark:bg-[#1C1E26] rounded-[28px] p-3 md:p-4 border border-slate-200/70 dark:border-white/10 shadow-sm">
        <form onSubmit={handleQuickAdd} className="flex flex-col md:flex-row items-center gap-3">
          {/* Item Name Input */}
          <div className="relative flex-1 w-full">
            <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              id="basketItemInput"
              type="text"
              required
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Add planned item (e.g., Sugar 2kg, Charger)..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs md:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Category Selector Pill */}
          <div className="relative shrink-0 w-full md:w-auto">
            <select
              aria-label="Select basket item category"
              value={selectedCatId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full md:w-auto appearance-none pl-4 pr-9 py-3 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {activeCategories.map((cat) => (
                <option
                  key={cat.id}
                  value={cat.id}
                  className="bg-white dark:bg-[#1C1E26] text-slate-900 dark:text-white"
                >
                  {cat.emoji} {cat.name}
                </option>
              ))}
              <option
                value="__manage_categories__"
                className="bg-white dark:bg-[#1C1E26] text-emerald-700 dark:text-emerald-400 font-bold"
              >
                + Add / Manage Category...
              </option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Add Button */}
          <button
            type="submit"
            disabled={isAdding || !newItemTitle.trim()}
            className="w-full md:w-auto px-6 py-3 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-[0.99] disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add to Basket</span>
          </button>
        </form>
      </div>

      {/* Category-Grouped Bento Grid */}
      {categoriesWithItems.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#1C1E26] rounded-[28px] border border-slate-200/70 dark:border-white/10 p-8 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Your shopping basket is currently empty
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Use the bar above to plan upcoming purchases without affecting your active ledger until you buy!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {categoriesWithItems.map(({ category, items }) => (
            <BasketCategoryCard
              key={category.id}
              category={category}
              items={items}
              onSettleClick={openSettleModal}
              onAddItemClick={handleAddForCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowRight, Sparkles, Check, Plus, Trash2 } from 'lucide-react';
import { Category } from '../../types/finance.types';
import { initialCategories } from '../../mockData/financeMockData';

interface OnboardingSetupCardProps {
  onComplete: (data: {
    userName: string;
    monthlyBaseIncome: number;
    monthlyBudgetCap: number;
    categories: Category[];
  }) => Promise<void>;
}

export const OnboardingSetupCard: React.FC<OnboardingSetupCardProps> = ({ onComplete }) => {
  const [userName, setUserName] = useState('Rohan');
  const [income, setIncome] = useState<number | ''>(85992);
  const [budgetCap, setBudgetCap] = useState<number | ''>(50000);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(initialCategories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived: !c.isArchived } : c))
    );
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: `cat-custom-${Date.now()}`,
      name: newCatName.trim(),
      emoji: newCatEmoji || '✨',
      color: '#6366F1',
      bgLight: '#EEF2FF',
      bgDark: '#1A1D2E',
      textLight: '#4338CA',
      textDark: '#818CF8',
      type: 'EXPENSE',
    };
    setSelectedCategories((prev) => [...prev, newCat]);
    setNewCatName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || typeof income !== 'number' || income <= 0) return;

    try {
      setIsSubmitting(true);
      await onComplete({
        userName: userName.trim(),
        monthlyBaseIncome: income,
        monthlyBudgetCap: typeof budgetCap === 'number' ? budgetCap : Math.round(income * 0.6),
        categories: selectedCategories,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl bg-white dark:bg-[#1C1E26] rounded-[32px] border border-slate-200/70 dark:border-white/10 shadow-xl p-6 md:p-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-200/60 dark:border-emerald-800/40">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>LifeOS Personal Finance Initialization</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Welcome to Your Wealth Ledger
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          Set up your primary income and default expense categories once. All data is kept local and reactive.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Profile Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            1. Your Name
          </label>
          <input
            type="text"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Rohan"
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
        </div>

        {/* Step 2: Monthly Base Income & Budget Cap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              2. Base Monthly Inflow (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1000"
                required
                value={income}
                onChange={(e) =>
                  setIncome(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="85992"
                className="w-full pl-9 pr-4 py-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Salary or monthly active deposit</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              3. Monthly Budget Cap (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="500"
                required
                value={budgetCap}
                onChange={(e) =>
                  setBudgetCap(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="50000"
                className="w-full pl-9 pr-4 py-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Target maximum expenditure</p>
          </div>
        </div>

        {/* Step 3: Confirm Categories */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            4. Initial Spending Categories
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedCategories.map((cat) => {
              const isEnabled = !cat.isArchived;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    isEnabled
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                      : 'bg-slate-100/80 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 opacity-60'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                  {isEnabled && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Quick custom category row */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCatEmoji}
              onChange={(e) => setNewCatEmoji(e.target.value)}
              className="w-12 text-center py-2 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm"
              maxLength={2}
            />
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Add another category (e.g. Subscriptions)"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3 py-2 rounded-xl bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !userName || typeof income !== 'number' || income <= 0}
            className="w-full py-4 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-sm md:text-base font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <span>Enter LifeOS Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

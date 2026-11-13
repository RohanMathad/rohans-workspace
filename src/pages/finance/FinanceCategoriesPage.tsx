import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Category, CategoryType } from '../../types/finance.types';

const PRESET_COLORS = [
  '#D4532B', // Coral
  '#168B53', // Mint
  '#3F51B5', // Indigo
  '#D97706', // Amber
  '#8B5CF6', // Purple
  '#0EA5E9', // Sky
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#6366F1', // Indigo light
];

const PRESET_EMOJIS = ['🍔', '🛒', '⚡', '✈️', '🛍️', '💡', '🧴', '🎬', '☕', '📚', '🏋️', '🏥', '🚗', '🎮', '💼', '💰', '📈'];

export const FinanceCategoriesPage: React.FC = () => {
  const {
    categories,
    addNewCategory,
    updateCategory,
    archiveCategory,
    restoreCategory,
  } = useAppData();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Category Form State (Name, Icon/Emoji, Color Swatch, Type)
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🛍️');
  const [color, setColor] = useState('#D4532B');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateForm = () => {
    setEditingId(null);
    setName('');
    setEmoji('🛍️');
    setColor('#D4532B');
    setType('EXPENSE');
    setIsCreating(true);
  };

  const openEditForm = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setEmoji(cat.emoji);
    setColor(cat.color);
    setType(cat.type);
    setIsCreating(true);
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setName('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingId) {
        await updateCategory(editingId, {
          name: name.trim(),
          emoji,
          color,
          type,
          bgLight: `${color}15`,
          bgDark: `${color}30`,
          textLight: color,
          textDark: '#FFFFFF',
        });
      } else {
        await addNewCategory({
          name: name.trim(),
          emoji,
          color,
          type,
          bgLight: `${color}15`,
          bgDark: `${color}30`,
          textLight: color,
          textDark: '#FFFFFF',
          isArchived: false,
        });
      }
      closeForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 pt-2">
        <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          Category Manager
        </h1>

        <button
          type="button"
          onClick={() => (isCreating ? closeForm() : openCreateForm())}
          className="px-4 sm:px-5 py-2.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isCreating ? 'Cancel' : 'Add New Category'}</span>
        </button>
      </div>

      {/* Category Creation / Edit Form Card */}
      {isCreating && (
        <div className="bg-white dark:bg-[#1C1E26] rounded-[28px] p-6 border border-emerald-500/30 dark:border-emerald-500/30 shadow-md animate-in slide-in-from-top-4 duration-200">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            {editingId ? 'Edit Category' : 'Create Custom Category'}
          </h3>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Subscriptions & Software"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>

              {/* Category Type (Expense | Income) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      type === 'EXPENSE'
                        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      type === 'INCOME'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>
            </div>

            {/* Emoji Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Emoji Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      emoji === em
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 scale-110 shadow-sm'
                        : 'bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200 border border-slate-200/50 dark:border-white/5'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Swatch Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Color Swatch
              </label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform cursor-pointer ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-950 dark:ring-white' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-6 py-2.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs md:text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
              >
                {editingId ? 'Update Category' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories
          .filter((cat) => !cat.isArchived)
          .map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-[#1C1E26] rounded-[28px] p-5 border border-slate-200/70 dark:border-white/10 shadow-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      <span>{cat.emoji}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            cat.type === 'INCOME'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                          }`}
                        >
                          {cat.type === 'INCOME' ? 'Income' : 'Expense'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-white/5 text-xs">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                  title="Color Swatch"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEditForm(cat)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => archiveCategory(cat.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Archived Categories Section (Shown below horizontal divider when at least one archived category exists) */}
      {categories.some((cat) => Boolean(cat.isArchived)) && (
        <section aria-label="Archived Categories" className="space-y-5 pt-2">
          <div className="flex items-center gap-4">
            <hr className="flex-1 border-slate-200/80 dark:border-white/10" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
              Archived Categories
            </span>
            <hr className="flex-1 border-slate-200/80 dark:border-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories
              .filter((cat) => Boolean(cat.isArchived))
              .map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-[28px] p-5 border border-dashed border-slate-300 dark:border-white/20 bg-slate-50/70 dark:bg-slate-900/40 opacity-75 shadow-xs flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          <span>{cat.emoji}</span>
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {cat.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                cat.type === 'INCOME'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                              }`}
                            >
                              {cat.type === 'INCOME' ? 'Income' : 'Expense'}
                            </span>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                              Archived
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200/70 dark:border-white/5 text-xs">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                      title="Color Swatch"
                    />

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(cat)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => restoreCategory(cat.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Unarchive</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
};


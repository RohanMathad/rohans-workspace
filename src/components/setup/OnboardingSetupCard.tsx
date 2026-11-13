import React, { useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, KeyRound, LogOut, Plus } from 'lucide-react';
import { Category, UserSetupProfile } from '../../types/finance.types';
import { initialCategories } from '../../mockData/financeMockData';
import { getUserInitials } from '../../services/financeLogic';

interface OnboardingSetupCardProps {
  isEditingExisting?: boolean;
  initialProfile?: UserSetupProfile | null;
  initialCategoriesList?: Category[];
  onComplete: (data: {
    userName: string;
    pin?: string;
    currencySymbol: string;
    monthlyBaseIncome: number;
    monthlySavingsTarget: number;
    categories: Category[];
  }) => Promise<void>;
  onSwitchWorkspace?: () => Promise<void>;
}

const CURRENCY_OPTIONS = [
  { symbol: '₹', label: '₹ INR' },
  { symbol: '$', label: '$ USD' },
  { symbol: '€', label: '€ EUR' },
  { symbol: '£', label: '£ GBP' },
];

export const OnboardingSetupCard: React.FC<OnboardingSetupCardProps> = ({
  isEditingExisting = false,
  initialProfile,
  initialCategoriesList,
  onComplete,
  onSwitchWorkspace,
}) => {
  const [userName, setUserName] = useState(initialProfile?.userName || '');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(initialProfile?.currencySymbol || '₹');
  const [savingsTarget, setSavingsTarget] = useState<string>(
    initialProfile?.monthlySavingsTarget && initialProfile.monthlySavingsTarget > 0
      ? String(initialProfile.monthlySavingsTarget)
      : ''
  );
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    initialCategoriesList && initialCategoriesList.length > 0
      ? initialCategoriesList.map((c) => ({ ...c }))
      : initialCategories.map((c) => ({ ...c }))
  );
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewOwnerName = userName.trim() || 'Your';
  const previewTitle = userName.trim() ? `${userName.trim()}'s Workspace` : 'Personal Workspace';
  const previewInitials = getUserInitials(previewOwnerName);

  const expenseCategories = selectedCategories.filter((c) => c.type !== 'INCOME');
  const incomeCategories = selectedCategories.filter((c) => c.type === 'INCOME');

  const isPinValid = isEditingExisting || /^\d{4}$/.test(pin.trim());
  const canSubmit = Boolean(userName.trim()) && isPinValid && !isSubmitting;

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

  const handlePinChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
    setPin(digitsOnly);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!userName.trim()) {
      setErrorMessage('Please enter your Name or Workspace ID.');
      return;
    }
    if (!isEditingExisting && !/^\d{4}$/.test(pin.trim())) {
      setErrorMessage('Please enter a valid 4-digit Workspace PIN.');
      return;
    }

    const parsedTarget = savingsTarget.trim() === '' ? 0 : Math.max(0, Number(savingsTarget) || 0);

    try {
      setIsSubmitting(true);
      await onComplete({
        userName: userName.trim(),
        pin: pin.trim(),
        currencySymbol,
        monthlyBaseIncome: 0,
        monthlySavingsTarget: parsedTarget,
        categories: selectedCategories,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to connect to workspace. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl bg-white/80 dark:bg-[#1C1E26]/85 backdrop-blur-2xl rounded-[32px] border border-slate-200/80 dark:border-white/10 shadow-2xl p-6 md:p-8 my-6">
      {/* Live Workspace & Sidebar Initials Avatar Preview */}
      <div className="flex flex-col items-center text-center mb-7">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 mb-4">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 text-white flex items-center justify-center font-extrabold text-xs tracking-tight shadow-sm ring-2 ring-indigo-500/20 dark:ring-indigo-400/25 shrink-0">
            <span>{previewInitials}</span>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1C1E26]"
              aria-hidden="true"
            />
          </div>
          <div className="text-left pr-1">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
              {previewTitle}
            </p>
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {isEditingExisting ? 'Editing Active Workspace' : 'Isolated Cloud Ledger'}
            </p>
          </div>
        </div>

        <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          {isEditingExisting ? 'Update Your Workspace' : 'Access or Create Workspace'}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
          {isEditingExisting
            ? 'Adjust your display name, currency, or monthly savings target.'
            : `Enter your name and 4-digit PIN to reconnect to an existing workspace or start a fresh ${currencySymbol}0 ledger.`}
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Your Name / Workspace ID & 2. 4-Digit Workspace PIN */}
        <div className={`grid grid-cols-1 ${isEditingExisting ? '' : 'sm:grid-cols-2'} gap-4`}>
          <div>
            <label
              htmlFor="setup-owner-name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
            >
              Your Name / Workspace ID
            </label>
            <input
              id="setup-owner-name"
              type="text"
              required
              autoComplete="username"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. Rohan"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm md:text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>

          {!isEditingExisting && (
            <div>
              <label
                htmlFor="setup-workspace-pin"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
              >
                4-Digit Workspace PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="setup-workspace-pin"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm md:text-base font-bold tracking-[0.25em] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Reconnects your workspace on any device
              </p>
            </div>
          )}
        </div>

        {/* 3. Currency Symbol & Optional Monthly Savings Target */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="setup-currency"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
            >
              Currency Symbol
            </label>
            <select
              id="setup-currency"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm md:text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option
                  key={opt.symbol}
                  value={opt.symbol}
                  className="bg-white dark:bg-[#1C1E26] text-slate-900 dark:text-white"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="setup-savings-target"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
            >
              Monthly Savings Target ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                id="setup-savings-target"
                type="number"
                step="any"
                min="0"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                placeholder="40000 (or 0 to skip)"
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm md:text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isEditingExisting
                ? 'Optional — leave blank or 0 to skip'
                : 'Used when creating a brand-new workspace'}
            </p>
          </div>
        </div>

        {/* 4. Default Categories Preview */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Default Categories Preview
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Click to toggle active
            </span>
          </div>

          {/* Expense Pills */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Expense
            </p>
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((cat) => {
                const isEnabled = !cat.isArchived;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
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
          </div>

          {/* Income Pills */}
          <div>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
              Income
            </p>
            <div className="flex flex-wrap gap-2">
              {incomeCategories.map((cat) => {
                const isEnabled = !cat.isArchived;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                      isEnabled
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 border-transparent shadow-xs'
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
          </div>

          {/* Quick Custom Category Row */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              aria-label="Custom category emoji"
              value={newCatEmoji}
              onChange={(e) => setNewCatEmoji(e.target.value)}
              className="w-12 text-center py-2 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm"
              maxLength={2}
            />
            <input
              type="text"
              aria-label="Add custom category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Add custom expense category (optional)"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              aria-label="Add custom category"
              onClick={handleAddCategory}
              className="px-3 py-2 rounded-xl bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Submit & Optional Switch Workspace */}
        <div className="pt-3 space-y-2.5">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-sm md:text-base font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <span>
              {isSubmitting
                ? 'Connecting to Workspace...'
                : isEditingExisting
                ? 'Save Profile & Return to Dashboard'
                : 'Complete Setup & Launch Workspace'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {isEditingExisting && onSwitchWorkspace && (
            <button
              type="button"
              onClick={onSwitchWorkspace}
              className="w-full py-2.5 rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out / Switch Workspace</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};


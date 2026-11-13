import React, { useState, useEffect } from 'react';
import { Plus, Check, CreditCard, Banknote, Smartphone, Calendar } from 'lucide-react';
import { SlideOverModal } from '../common/SlideOverModal';
import { PaymentMethod } from '../../types/finance.types';
import { useAppData } from '../../context/AppDataContext';

export const QuickAddExpenseModal: React.FC = () => {
  const {
    isQuickAddOpen,
    editingTransaction,
    closeQuickAdd,
    categories,
    activeCategories,
    addDirectExpense,
    updateTransaction,
  } = useAppData();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>('UPI / GPay');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form state when modal opens for Add vs Edit
  useEffect(() => {
    if (editingTransaction) {
      setTitle(editingTransaction.title);
      setAmount(editingTransaction.amount ?? '');
      setCategoryId(editingTransaction.categoryId);
      setType(editingTransaction.type || 'EXPENSE');
      setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);

      const pm = editingTransaction.paymentMethod || 'UPI / GPay';
      if (pm.toLowerCase().includes('card')) {
        setPaymentMethod('Card');
      } else if (pm.toLowerCase().includes('cash')) {
        setPaymentMethod('Cash');
      } else {
        setPaymentMethod('UPI / GPay');
      }
    } else if (isQuickAddOpen) {
      setTitle('');
      setAmount('');
      setType('EXPENSE');
      setPaymentMethod('UPI / GPay');
      setDate(new Date().toISOString().split('T')[0]);
      if (activeCategories.length > 0 && !categoryId) {
        setCategoryId(activeCategories[0].id);
      }
    }
  }, [editingTransaction, isQuickAddOpen]);

  // Ensure default category is set when categories load
  useEffect(() => {
    if (activeCategories.length > 0 && !categoryId) {
      setCategoryId(activeCategories[0].id);
    }
  }, [activeCategories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || typeof amount !== 'number' || amount <= 0 || !categoryId) return;

    try {
      setIsSubmitting(true);
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          title: title.trim(),
          categoryId,
          amount,
          type,
          paymentMethod,
          date,
        });
      } else {
        await addDirectExpense({
          title: title.trim(),
          categoryId,
          amount,
          type,
          paymentMethod,
          date,
        });
      }
      // Reset form
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { id: 'UPI / GPay', label: 'UPI / GPay', icon: Smartphone },
    { id: 'Card', label: 'Card', icon: CreditCard },
    { id: 'Cash', label: 'Cash', icon: Banknote },
  ];

  const isEditing = !!editingTransaction;

  return (
    <SlideOverModal
      isOpen={isQuickAddOpen}
      onClose={closeQuickAdd}
      title={
        isEditing
          ? 'Edit Transaction'
          : type === 'EXPENSE'
          ? 'Log New Expense'
          : 'Log New Income'
      }
      subtitle={
        isEditing
          ? 'Update transaction details and recalculate balances in real time'
          : 'Instantly update your ledger, savings rate, and category budget'
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Expense vs Income Toggle */}
        <div className="flex p-1 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              type === 'EXPENSE'
                ? 'bg-white dark:bg-[#1C1E26] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Expense (-)
          </button>
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              type === 'INCOME'
                ? 'bg-white dark:bg-[#1C1E26] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Income (+)
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="1"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Description / Merchant
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Blue Tokai Coffee, Uber Ride..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
        </div>

        {/* Date Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Date
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs md:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                  categoryId === cat.id
                    ? 'border-slate-950 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                <span>{cat.emoji}</span>
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {paymentOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = paymentMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                      : 'bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !title || typeof amount !== 'number' || amount <= 0}
            className="w-full py-3.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-sm shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add to Ledger</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlideOverModal>
  );
};

import React, { useState, useEffect } from 'react';
import { Zap, Check, Calendar, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { SlideOverModal } from '../common/SlideOverModal';
import { LedgerEntry, PaymentMethod } from '../../types/finance.types';
import { formatINR, UNKNOWN_CATEGORY } from '../../services/financeLogic';
import { useAppData } from '../../context/AppDataContext';

interface SettleBasketModalProps {
  item: LedgerEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSettle: (
    id: string,
    actualAmount: number,
    paymentMethod: PaymentMethod | string,
    date?: string,
    notes?: string
  ) => Promise<void>;
}

export const SettleBasketModal: React.FC<SettleBasketModalProps> = ({
  item,
  isOpen,
  onClose,
  onSettle,
}) => {
  const { categoryMap } = useAppData();
  const category = (item && categoryMap[item.categoryId]) || UNKNOWN_CATEGORY;
  const todayIso = new Date().toISOString().split('T')[0];
  const [actualPrice, setActualPrice] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI / GPay');
  const [dateStr, setDateStr] = useState(todayIso);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setActualPrice(item.estimatedAmount && item.estimatedAmount > 0 ? item.estimatedAmount : '');
      setPaymentMethod('UPI / GPay');
      setDateStr(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [item]);

  if (!item) return null;

  const numericPrice = typeof actualPrice === 'number' ? actualPrice : 0;
  const hasEstimate = typeof item.estimatedAmount === 'number' && item.estimatedAmount > 0;
  const estimated = hasEstimate ? item.estimatedAmount! : 0;
  const priceDiff = hasEstimate ? estimated - numericPrice : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof actualPrice !== 'number' || actualPrice <= 0) return;

    try {
      setIsSubmitting(true);
      await onSettle(item.id, actualPrice, paymentMethod, dateStr, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { id: 'UPI / GPay', label: 'UPI / GPay', icon: Smartphone },
    { id: 'Card', label: 'Card', icon: CreditCard },
    { id: 'Cash', label: 'Cash', icon: Banknote },
  ];

  return (
    <SlideOverModal
      isOpen={isOpen}
      onClose={onClose}
      badge={
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Zap className="w-3.5 h-3.5 fill-current" />
          Ledger Conversion
        </span>
      }
      title={`Move "${item.title}" to Expense Ledger`}
      subtitle={`${category.name} • Converts planned item into an active expense`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Item preview card */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{category.emoji}</span>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {item.title}
              </h4>
              <span className="text-xs text-slate-400 dark:text-slate-500">{category.name}</span>
            </div>
          </div>
          {hasEstimate && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-semibold">
                Estimated
              </span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                {formatINR(item.estimatedAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Actual Price Paid Large Input Box */}
        <div className="p-5 rounded-3xl bg-[#EEF2FF] dark:bg-[#1D2233] text-center border border-indigo-200/80 dark:border-indigo-900/60">
          <label
            htmlFor="actualPriceInput"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider"
          >
            Actual Price Paid (₹)
          </label>

          <div className="inline-flex items-center justify-center gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              ₹
            </span>
            <input
              id="actualPriceInput"
              type="number"
              step="any"
              required
              autoFocus
              min="1"
              value={actualPrice}
              onChange={(e) =>
                setActualPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="w-36 text-center text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white bg-white dark:bg-[#12131A] py-1.5 px-3 rounded-2xl border-2 border-indigo-400 dark:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-300/40 tabular-nums shadow-sm"
              placeholder="90"
            />
          </div>

          {/* Budget Saving / Overspend Pill indicator (only shown when item had an estimate) */}
          {hasEstimate && (
            <div className="mt-3 flex justify-center">
              {priceDiff > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  Saved {formatINR(priceDiff)} under expected budget!
                </span>
              ) : priceDiff < 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                  {formatINR(Math.abs(priceDiff))} over estimated allowance
                </span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Matches estimated price exactly
                </span>
              )}
            </div>
          )}
        </div>

        {/* Date and Payment Method */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Today, {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span>Payment Method</span>
          </div>

          {/* Payment Method Pills */}
          <div className="grid grid-cols-3 gap-2">
            {paymentOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = paymentMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`flex items-center justify-center gap-2 py-3 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md'
                      : 'bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || typeof actualPrice !== 'number' || actualPrice <= 0}
            className="w-full py-4 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-emerald-500/30 cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Add to Finance Budget</span>
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Will deduct {formatINR(numericPrice)} from your {new Date().toLocaleDateString('en-US', { month: 'long' })} budget
          </p>

          <div className="flex justify-center mt-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Keep in Basket
            </button>
          </div>
        </div>
      </form>
    </SlideOverModal>
  );
};

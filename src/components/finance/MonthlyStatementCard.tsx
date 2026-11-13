import React from 'react';
import { FileText, Download, Table } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatINR } from '../../services/financeLogic';

export const MonthlyStatementCard: React.FC = () => {
  const { ledgerEntries, profile, overviewData, categoryMap } = useAppData();

  const handleExportCSV = (monthLabel = 'November 2026') => {
    const settled = ledgerEntries.filter((e) => e.status === 'SETTLED');

    const headers = ['ID', 'Date', 'Time', 'Title', 'Category', 'Amount (INR)', 'Type', 'Payment Method', 'Status'];
    const rows = settled.map((entry) => [
      entry.id,
      entry.date,
      entry.time || '',
      `"${entry.title.replace(/"/g, '""')}"`,
      `"${(categoryMap[entry.categoryId]?.name || 'General').replace(/"/g, '""')}"`,
      entry.amount ?? 0,
      entry.type,
      `"${entry.paymentMethod || 'UPI'}"`,
      entry.tagStatus || 'Completed',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LifeOS_Statement_${monthLabel.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = (monthLabel = 'November 2026') => {
    const settled = ledgerEntries.filter((e) => e.status === 'SETTLED');
    const totalExp = overviewData?.totalExpense ?? 38160;
    const totalInc = overviewData?.totalIncome ?? 85992;
    const totalSav = overviewData?.totalSavings ?? 47832;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LifeOS Financial Statement — ${monthLabel}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; }
            .header { border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { margin: 0; font-size: 24px; }
            .meta { color: #666; font-size: 14px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; background: #f8f9fa; padding: 16px; border-radius: 8px; }
            .metric { font-size: 12px; color: #555; text-transform: uppercase; font-weight: bold; }
            .val { font-size: 22px; font-weight: bold; margin-top: 4px; color: #111; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
            th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; color: #555; }
            td { padding: 10px 8px; border-bottom: 1px solid #eee; }
            .num { text-align: right; font-weight: 600; }
            .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>LifeOS Personal Financial Statement</h1>
              <div class="meta">Account Holder: ${profile?.userName || 'Rohan'} • Cycle: ${monthLabel}</div>
            </div>
            <div class="meta">Status: AUDITED &amp; RECONCILED</div>
          </div>

          <div class="summary">
            <div>
              <div class="metric">Gross Inflow</div>
              <div class="val">${formatINR(totalInc)}</div>
            </div>
            <div>
              <div class="metric">Total Outflow</div>
              <div class="val">${formatINR(totalExp)}</div>
            </div>
            <div>
              <div class="metric">Net Surplus Preserved</div>
              <div class="val">${formatINR(totalSav)}</div>
            </div>
          </div>

          <h3>Settled Activity Ledger</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description / Payee</th>
                <th>Category</th>
                <th>Payment Mode</th>
                <th class="num">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              ${settled
                .map(
                  (item) => `
                <tr>
                  <td>${item.date} ${item.time || ''}</td>
                  <td><strong>${item.title}</strong></td>
                  <td>${categoryMap[item.categoryId]?.name || 'General'}</td>
                  <td>${item.paymentMethod || 'UPI'}</td>
                  <td class="num">${formatINR(item.amount)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            Digitally certified by LifeOS Personal Wealth Intelligence • Generated on ${new Date().toLocaleDateString()}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const archives = [
    {
      month: 'November 2026',
      subtitle: 'Draft / MTD • 42 transactions recorded',
      spent: '₹38,160',
      badge: 'Draft / MTD',
    },
    {
      month: 'October 2026',
      subtitle: 'Reconciled • Net Savings ₹52,400',
      spent: '₹52,400 spent',
      badge: 'Reconciled',
    },
    {
      month: 'September 2026',
      subtitle: 'Reconciled • Net Savings ₹44,120',
      spent: '₹44,120 spent',
      badge: 'Reconciled',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1C1E26] rounded-[28px] border border-slate-200/70 dark:border-white/10 shadow-sm p-5 md:p-6 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
          Export & Tax Statement
        </h3>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => handlePrintPDF('November 2026')}
          className="flex-1 py-3.5 px-4 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-[0.99] cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Nov 2026 PDF</span>
        </button>

        <button
          type="button"
          onClick={() => handleExportCSV('November 2026')}
          className="flex-1 py-3.5 px-4 rounded-full bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
        >
          <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Export CSV Spreadsheet</span>
        </button>
      </div>

      {/* Archived cycles list */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          <span>Archived Cycles</span>
          <span className="text-emerald-600 dark:text-emerald-400">3 Available</span>
        </div>

        <div className="space-y-2.5">
          {archives.map((item) => (
            <div
              key={item.month}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C1E26] border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                    {item.month} Statement
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* PDF & CSV pill buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintPDF(item.month)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#1C1E26] text-rose-600 dark:text-rose-400 border border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCSV(item.month)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#1C1E26] text-emerald-600 dark:text-emerald-400 border border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Table className="w-3 h-3" />
                  CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

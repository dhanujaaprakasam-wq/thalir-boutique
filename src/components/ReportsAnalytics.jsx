import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, IndianRupee, 
  Download, Calendar, FileText, PieChart, Layers, ArrowUpRight, ArrowDownLeft,
  Boxes, Eye, ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';

export const ReportsAnalytics = () => {
  const { showToast, language } = useStore();
  const [metrics, setMetrics] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [admMetrics, ledger] = await Promise.all([
          api.getAdminMetrics(),
          api.getLedgerEntries()
        ]);
        setMetrics(admMetrics);
        setLedgerData(ledger);
      } catch (err) {
        console.warn('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const totalIncome = ledgerData?.total_income || 0;
  const totalExpense = ledgerData?.total_expense || 0;
  const netProfit = ledgerData?.net_balance || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Print Report */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <h3 className="font-serif font-bold text-lg text-[#073822]">
            {language === 'ta' ? 'வணிக அறிக்கைகள் & பகுப்பாய்வு' : 'Executive Business Reports & Analytics'}
          </h3>
          <p className="text-xs text-stone-500">
            {language === 'ta'
              ? 'நிகழ்நேர நிதி லாப-நஷ்ட அறிக்கை, பிரிவு வாரியான செலவுகள் & சரக்கு விற்றுமுதல்'
              : 'Real-time financial P&L statement, category breakdown & inventory turnover'}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4 text-[#073822]" /> {language === 'ta' ? 'அறிக்கையை PDF அச்சிடு' : 'Print Executive Summary PDF'}
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {language === 'ta' ? 'மொத்த வருமானம் (விற்பனை)' : 'Gross Income (Sales & Inflow)'}
            </span>
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="font-serif font-extrabold text-3xl text-emerald-700">
            ₹{totalIncome.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400">
            {language === 'ta' ? 'பூட்டிக்கிற்குள் வந்த மொத்த வரவு' : 'Total money received into boutique'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {language === 'ta' ? 'செயல்பாட்டுச் செலவுகள் & சரக்கு' : 'Operating Expenses & Stock'}
            </span>
            <ArrowUpRight className="w-5 h-5 text-red-600" />
          </div>
          <div className="font-serif font-extrabold text-3xl text-red-600">
            ₹{totalExpense.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400">
            {language === 'ta' ? 'நெசவாளர் கொள்முதல், வாடகை, சம்பளம்' : 'Weaver purchases, rent, salaries, utilities'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {language === 'ta' ? 'நிகர லாபம் / இருப்பு' : 'Net Profit / Balance'}
            </span>
            <IndianRupee className="w-5 h-5 text-gold-dark" />
          </div>
          <div className={`font-serif font-extrabold text-3xl ${netProfit >= 0 ? 'text-[#073822]' : 'text-amber-700'}`}>
            ₹{netProfit.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400">
            {language === 'ta' ? 'கடையின் நிகர லாபத்தன்மை' : 'Net store profitability'}
          </p>
        </div>
      </div>

      {/* Catalog, Stock & Customer Engagement Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {language === 'ta' ? 'பட்டியல் வடிவமைப்புகள்' : 'Catalog Designs'}
            </span>
            <Boxes className="w-4 h-4 text-primary" />
          </div>
          <div className="font-serif font-bold text-2xl text-stone-900">
            {metrics?.total_products || 0}
          </div>
          <p className="text-[11px] text-stone-400">
            {language === 'ta' ? 'மொத்த சேலை ரகங்கள்' : 'Total designs in boutique'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {language === 'ta' ? 'விற்றுத் தீர்ந்தவை' : 'Sold Out Designs'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">0 Stock</span>
          </div>
          <div className="font-serif font-bold text-2xl text-rose-600">
            {metrics?.sold_products_count || 0}
          </div>
          <p className="text-[11px] text-stone-400">
            {language === 'ta' ? 'தற்போது இருப்பு இல்லாதவை' : 'Products currently sold out'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {language === 'ta' ? 'பார்வையிட்டவர்கள்' : 'Shopper Views'}
            </span>
            <Eye className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-amber-800">
            {(metrics?.total_views || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-stone-400">
            {language === 'ta' ? 'சேலைகளை பார்வையிட்ட எண்ணிக்கை' : 'Customer views on sarees'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {language === 'ta' ? 'விற்பனையான எண்ணிக்கை' : 'Sold Units'}
            </span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-emerald-700">
            {metrics?.total_sold_units || 0}
          </div>
          <p className="text-[11px] text-stone-400">
            {language === 'ta' ? 'ஆர்டர் செய்யப்பட்ட சேலைகள்' : 'Units ordered by shoppers'}
          </p>
        </div>
      </div>

      {/* Category Expenditure Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
        <h4 className="font-serif font-bold text-base text-[#073822] flex items-center gap-2 border-b border-stone-100 pb-3">
          <BarChart3 className="w-5 h-5 text-gold" />
          <span>{language === 'ta' ? 'பிரிவு வாரியான செலவு விவரங்கள்' : 'Category-Wise Expenditure Breakdown'}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(ledgerData?.category_stats || []).map((cat, idx) => {
            const isCredit = cat.entry_type === 'credit';
            const total = Number(cat.total || 0);
            const percentage = totalExpense > 0 ? Math.min(100, Math.round((total / (isCredit ? totalIncome : totalExpense)) * 100)) : 0;

            return (
              <div key={idx} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-800">{cat.category}</span>
                  <span className={`font-mono font-bold ${isCredit ? 'text-emerald-700' : 'text-stone-900'}`}>
                    {isCredit ? '+' : '-'}₹{total.toLocaleString('en-IN')} ({cat.count} txns)
                  </span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isCredit ? 'bg-emerald-600' : 'bg-primary'}`} 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

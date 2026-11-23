import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, TrendingUp, TrendingDown, Plus, Search, Filter, 
  Download, Calendar, Trash2, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2, X, Edit3, PlusCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const EXPENSE_CATEGORIES = [
  'All Categories',
  'Saree & Stock Purchases',
  'Shop Rent & Lease',
  'Staff Salary & Wages',
  'Pooja & Blessings',
  'Courier & Shipping',
  'Electricity & Utility',
  'Staff Food & Travel',
  'Shop Interior & Infrastructure',
  'Packaging Materials',
  'Capital & Partner Loan',
  'Sales & Income',
  'General Expenses'
];

export const DaybookLedger = () => {
  const { showToast, language } = useStore();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net_balance: 0 });

  const CATEGORY_NAMES_TA = {
    'All Categories': 'அனைத்து பிரிவுகள்',
    'Saree & Stock Purchases': 'புடவை & சரக்கு கொள்முதல்',
    'Shop Rent & Lease': 'கடை வாடகை & குத்தகை',
    'Staff Salary & Wages': 'பணியாளர் சம்பளம் & கூலி',
    'Pooja & Blessings': 'பூஜை & வழிபாட்டு செலவுகள்',
    'Courier & Shipping': 'கூரியர் & டெலிவரி கட்டணம்',
    'Electricity & Utility': 'மின்சாரம் & இதர பயன்பாடுகள்',
    'Staff Food & Travel': 'உணவு & பயணச் செலவுகள்',
    'Shop Interior & Infrastructure': 'கடை அலங்காரம் & கட்டமைப்பு',
    'Packaging Materials': 'பேக்கிங் கவர்கள் & பொருட்கள்',
    'Capital & Partner Loan': 'மூலதனம் & கடன் வரவு',
    'Sales & Income': 'விற்பனை & வருமானம்',
    'General Expenses': 'பொதுவான இதர செலவுகள்'
  };

  const getCatLabel = (cat) => (language === 'ta' && CATEGORY_NAMES_TA[cat] ? CATEGORY_NAMES_TA[cat] : cat);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'credit' | 'debit'
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' | '2026-03' | '2026-04' etc.

  // Modal State for New Entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    particulars: '',
    description: '',
    entry_type: 'debit',
    amount: '',
    category: 'Saree & Stock Purchases',
    payment_mode: 'Cash',
    reference_no: '',
    notes: ''
  });

  // Modal State for Edit Entry
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editFormData, setEditFormData] = useState({
    entry_date: '',
    particulars: '',
    description: '',
    entry_type: 'debit',
    amount: '',
    category: 'Saree & Stock Purchases',
    payment_mode: 'Cash',
    reference_no: '',
    notes: ''
  });

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'All Categories') params.category = selectedCategory;
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedMonth !== 'all') params.month = selectedMonth;

      const res = await api.getLedgerEntries(params);
      if (res && res.entries) {
        setEntries(res.entries);
        setSummary({
          total_income: res.total_income || 0,
          total_expense: res.total_expense || 0,
          net_balance: res.net_balance || 0
        });
      }
    } catch (err) {
      console.warn('Failed to load daybook ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedCategory, selectedType, selectedMonth]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLedger();
  };

  const handleOpenCreateModal = (type = 'debit') => {
    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      particulars: '',
      description: '',
      entry_type: type,
      amount: '',
      category: type === 'debit' ? 'Saree & Stock Purchases' : 'Sales & Income',
      payment_mode: 'Cash',
      reference_no: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (!formData.particulars.trim() || !formData.amount) {
      if (showToast) showToast('Please enter particulars and a valid amount.');
      return;
    }

    try {
      await api.createLedgerEntry(formData);
      if (showToast) showToast('Daybook transaction recorded in database! ✓');
      setIsModalOpen(false);
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        particulars: '',
        description: '',
        entry_type: 'debit',
        amount: '',
        category: 'Saree & Stock Purchases',
        payment_mode: 'Cash',
        reference_no: '',
        notes: ''
      });
      fetchLedger();
    } catch (err) {
      if (showToast) showToast('Error saving transaction.');
    }
  };

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setEditFormData({
      entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
      particulars: entry.particulars || '',
      description: entry.description || '',
      entry_type: entry.entry_type || 'debit',
      amount: entry.amount || '',
      category: entry.category || 'Saree & Stock Purchases',
      payment_mode: entry.payment_mode || 'Cash',
      reference_no: entry.reference_no || '',
      notes: entry.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    if (!editingEntry || !editFormData.particulars.trim() || !editFormData.amount) {
      if (showToast) showToast('Please enter particulars and a valid amount.');
      return;
    }

    try {
      await api.updateLedgerEntry(editingEntry.id, editFormData);
      if (showToast) showToast('Daybook entry updated successfully in database! ✓');
      setIsEditModalOpen(false);
      setEditingEntry(null);
      fetchLedger();
    } catch (err) {
      if (showToast) showToast('Failed to update daybook entry.');
    }
  };

  // Modal State for Delete Entry
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    id: null,
    particulars: '',
    amount: '',
    category: '',
    date: ''
  });

  const promptDeleteEntry = (entry) => {
    setDeleteModalConfig({
      isOpen: true,
      id: entry.id,
      particulars: entry.particulars,
      amount: entry.amount,
      category: entry.category,
      date: entry.entry_date
    });
  };

  const confirmDeleteEntry = async () => {
    if (!deleteModalConfig.id) return;
    try {
      await api.deleteLedgerEntry(deleteModalConfig.id);
      if (showToast) showToast('Record deleted.');
      fetchLedger();
    } catch (err) {
      if (showToast) showToast('Failed to delete record.');
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      if (showToast) showToast('No entries to export.');
      return;
    }

    const headers = ['Date', 'Particulars', 'Description', 'Category', 'Type', 'Amount (INR)', 'Payment Mode'];
    const rows = entries.map(e => [
      `"${e.entry_date}"`,
      `"${(e.particulars || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.entry_type === 'credit' ? 'Money In (DR)' : 'Money Out (CR)',
      e.amount,
      `"${e.payment_mode}"`
    ]);

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Thalir_Boutique_Daybook_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast(`Exported all ${entries.length} daybook records to Excel! ✓`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              {language === 'ta' ? 'மொத்த வரவு (வருமானம்)' : 'Total Money In (Income)'}
            </span>
            <div className="text-2xl font-serif font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
              <ArrowDownLeft className="w-5 h-5" />
              ₹{summary.total_income.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-stone-400">
              {language === 'ta' ? 'புடவை விற்பனை & வாடிக்கையாளர் ரசீதுகள்' : 'Saree sales & customer receipts'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              {language === 'ta' ? 'மொத்த பற்று (செலவுகள்)' : 'Total Money Out (Expenses)'}
            </span>
            <div className="text-2xl font-serif font-extrabold text-red-600 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-5 h-5" />
              ₹{summary.total_expense.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-stone-400">
              {language === 'ta' ? 'கொள்முதல், வாடகை, சம்பளம், பில்கள்' : 'Purchases, rent, salary, bills'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              {language === 'ta' ? 'நிகர இருப்புத் தொகை' : 'Net Daybook Balance'}
            </span>
            <div className={`text-2xl font-serif font-extrabold mt-1 ${summary.net_balance >= 0 ? 'text-[#073822]' : 'text-amber-700'}`}>
              ₹{summary.net_balance.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-stone-400">
              {language === 'ta' ? 'நிகழ்நேர பேரேடு இருப்பு நிலை' : 'Real-time ledger net position'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gold/15 text-[#073822] flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar & Action Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#073822]">
              {language === 'ta' ? 'பூட்டிக் கணக்கு புத்தகம் & பணப்புழக்க பேரேடு' : 'Boutique Daybook & Cashflow Ledger'}
            </h3>
            <p className="text-xs text-stone-500">
              {language === 'ta'
                ? 'SQLite தரவுத்தளத்துடன் இணைக்கப்பட்ட நேரடி பரிவர்த்தனை பதிவுகள் (மார்ச் – அக்டோபர் 2026)'
                : 'Live transaction records synced with SQLite database (March – September 2026 historical data included)'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
            <button
              onClick={handleExportCSV}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> {language === 'ta' ? 'CSV ஏற்றுமதி' : 'Export CSV'}
            </button>

            <button
              onClick={() => handleOpenCreateModal('debit')}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-red-600" /> {language === 'ta' ? '+ செலவைச் சேர்க்க' : '+ Add Expense'}
            </button>

            <button
              onClick={() => handleOpenCreateModal('credit')}
              className="bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gold" /> {language === 'ta' ? '+ வரவு / விற்பனை சேர்க்க' : '+ Add Income / Sale'}
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'ta' ? 'விவரம், வியாபாரி, பொருளைத் தேடுங்கள்...' : 'Search particulars, vendor, item...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary bg-stone-50"
            />
          </form>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary bg-stone-50 font-medium"
            >
              {EXPENSE_CATEGORIES.map((cat, i) => (
                <option key={i} value={cat}>{getCatLabel(cat)}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary bg-stone-50 font-medium"
            >
              <option value="all">{language === 'ta' ? 'அனைத்து பணப்புழக்கம் (வரவு & செலவு)' : 'All Cashflow (Income & Expenses)'}</option>
              <option value="credit">{language === 'ta' ? '🟢 வரவு (விற்பனை / வருமானம்)' : '🟢 Money In (Sales / Income)'}</option>
              <option value="debit">{language === 'ta' ? '🔴 பற்று (செலவுகள் / கொள்முதல்)' : '🔴 Money Out (Expenses / Purchases)'}</option>
            </select>
          </div>

          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary bg-stone-50 font-medium"
            >
              <option value="all">{language === 'ta' ? 'அனைத்து மாதங்கள் (2026)' : 'All Months (2026)'}</option>
              <option value="2026-03">{language === 'ta' ? 'மார்ச் 2026 (கடை திறப்பு & அமைப்பு)' : 'March 2026 (Store Setup & Opening)'}</option>
              <option value="2026-04">{language === 'ta' ? 'ஏப்ரல் 2026' : 'April 2026'}</option>
              <option value="2026-05">{language === 'ta' ? 'மே 2026' : 'May 2026'}</option>
              <option value="2026-06">{language === 'ta' ? 'ஜூன் 2026' : 'June 2026'}</option>
              <option value="2026-07">{language === 'ta' ? 'ஜூலை 2026' : 'July 2026'}</option>
              <option value="2026-08">{language === 'ta' ? 'ஆகஸ்ட் 2026' : 'August 2026'}</option>
              <option value="2026-09">{language === 'ta' ? 'செப்டம்பர் 2026' : 'September 2026'}</option>
              <option value="2026-10">{language === 'ta' ? 'அக்டோபர் 2026 (நடப்பு மாதம்)' : 'October 2026 (Current Month)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <th className="py-3 px-4">{language === 'ta' ? 'தேதி' : 'Date'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'விவரம் & குறிப்பு' : 'Particulars & Description'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'பிரிவு' : 'Category'}</th>
                <th className="py-3 px-4 text-right">{language === 'ta' ? 'வரவு (DR)' : 'Money In (DR)'}</th>
                <th className="py-3 px-4 text-right">{language === 'ta' ? 'பற்று (CR)' : 'Money Out (CR)'}</th>
                <th className="py-3 px-4 text-right">{language === 'ta' ? 'செயல்' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    {language === 'ta' ? 'தரவுத்தள கணக்குப் பதிவுகள் ஏற்றப்படுகின்றன...' : 'Loading database ledger entries...'}
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    {language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளுக்கு பரிவர்த்தனைகள் எதுவும் இல்லை.' : 'No transactions match the selected filters.'}
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 text-stone-600 font-mono text-xs whitespace-nowrap">
                      {entry.entry_date}
                    </td>

                    <td className="py-3 px-4">
                      <strong className="text-stone-900 block font-semibold">{entry.particulars}</strong>
                      {entry.description && (
                        <span className="text-[11px] text-stone-500 block">{entry.description}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                        {getCatLabel(entry.category)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {entry.entry_type === 'credit' ? (
                        <span className="font-bold text-emerald-700 font-mono text-sm">
                          +₹{Number(entry.amount).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {entry.entry_type === 'debit' ? (
                        <span className="font-bold text-red-600 font-mono text-sm">
                          -₹{Number(entry.amount).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          className="p-1.5 text-stone-600 hover:text-primary hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title={language === 'ta' ? 'பரிவர்த்தனையை திருத்த' : 'Edit transaction'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDeleteEntry(entry)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title={language === 'ta' ? 'பதிவை நீக்க' : 'Delete entry'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 flex flex-col my-auto">
            
            <div className="bg-[#073822] text-white p-5 sm:px-6 flex items-center justify-between border-b border-[#DFBA6D]/30">
              <div className="flex items-center gap-2.5">
                <IndianRupee className="w-5 h-5 text-gold" />
                <div>
                  <h2 className="font-serif font-bold text-base sm:text-lg">
                    {language === 'ta' ? 'புதிய பேரேடு பதிவைச் சேர்க்க' : 'Record Daybook Entry'}
                  </h2>
                  <p className="text-[11px] text-stone-300">
                    {language === 'ta'
                      ? 'கடை செலவு அல்லது வருமானத்தை நேரடியாக SQLite பேரேட்டில் பதியவும்'
                      : 'Add shop expense or income directly to SQLite ledger'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 space-y-4 text-stone-900 text-xs sm:text-sm">
              
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, entry_type: 'debit', category: 'Saree & Stock Purchases' })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    formData.entry_type === 'debit'
                      ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  {language === 'ta' ? '🔴 பற்று (செலவு / கொள்முதல்)' : '🔴 Money Out (Expense / Purchase)'}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, entry_type: 'credit', category: 'Sales & Income' })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    formData.entry_type === 'credit'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  {language === 'ta' ? '🟢 வரவு (வருமானம் / விற்பனை)' : '🟢 Money In (Income / Sale)'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'விவரம் / வியாபாரி / பொருள்' : 'Particulars / Vendor / Item'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.particulars}
                  onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                  placeholder={language === 'ta' ? 'எ.கா. பழனி ஆண்டவர் டெக்ஸ் புடவை கொள்முதல் / கடை வாடகை' : 'e.g. Palani Aandavar Tex Saree Purchase / Shop Rent / Tea & Snacks'}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'தொகை (₹)' : 'Amount (₹)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-primary/30 focus:border-primary font-bold text-stone-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'தேதி' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'பிரிவு' : 'Category'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary"
                  >
                    {EXPENSE_CATEGORIES.filter(c => c !== 'All Categories').map((c, i) => (
                      <option key={i} value={c}>{getCatLabel(c)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'பணம் செலுத்திய முறை' : 'Payment Mode'}
                  </label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary"
                  >
                    <option value="Cash">{language === 'ta' ? '💵 ரொக்கம் (Cash)' : '💵 Cash'}</option>
                    <option value="UPI">{language === 'ta' ? '📱 UPI (GPay/PhonePe)' : '📱 UPI (GPay/PhonePe)'}</option>
                    <option value="Bank Transfer">{language === 'ta' ? '🏦 வங்கி பரிமாற்றம் (NEFT)' : '🏦 Direct Bank NEFT'}</option>
                    <option value="Card">{language === 'ta' ? '💳 கார்டு (Card)' : '💳 Card'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'விளக்கம் / குறிப்புகள் (விருப்பத்தேர்வு)' : 'Description / Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={language === 'ta' ? 'எ.கா. திருமண பட்டுப் புடவை கொள்முதல் பில் எண்' : 'e.g. Saree purchase for wedding collection or bill no'}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  <span>{language === 'ta' ? 'தரவுத்தளத்தில் சேமி' : 'Save Record to Database'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {isEditModalOpen && editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 flex flex-col my-auto">
            
            <div className="bg-stone-900 text-white p-5 sm:px-6 flex items-center justify-between border-b border-gold/30">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-gold" />
                <div>
                  <h2 className="font-serif font-bold text-base sm:text-lg">
                    {language === 'ta' ? 'பேரேடு பதிவை திருத்தவும்' : 'Edit Daybook Entry'}
                  </h2>
                  <p className="text-[11px] text-stone-300">
                    {language === 'ta'
                      ? 'பரிவர்த்தனை விவரங்களை மாற்றி SQLite பேரேட்டில் புதுப்பிக்கவும்'
                      : 'Modify transaction details and sync with SQLite ledger'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingEntry(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateEntry} className="p-6 space-y-4 text-stone-900 text-xs sm:text-sm">
              
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, entry_type: 'debit' })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    editFormData.entry_type === 'debit'
                      ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  {language === 'ta' ? '🔴 பற்று (செலவு / கொள்முதல்)' : '🔴 Money Out (Expense / Purchase)'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, entry_type: 'credit' })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    editFormData.entry_type === 'credit'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  {language === 'ta' ? '🟢 வரவு (வருமானம் / விற்பனை)' : '🟢 Money In (Income / Sale)'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'விவரம் / வியாபாரி / பொருள்' : 'Particulars / Vendor / Item'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.particulars}
                  onChange={(e) => setEditFormData({ ...editFormData, particulars: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'தொகை (₹)' : 'Amount (₹)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-primary/30 focus:border-primary font-bold text-stone-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'தேதி' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.entry_date}
                    onChange={(e) => setEditFormData({ ...editFormData, entry_date: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'பிரிவு' : 'Category'}
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary"
                  >
                    {EXPENSE_CATEGORIES.filter(c => c !== 'All Categories').map((c, i) => (
                      <option key={i} value={c}>{getCatLabel(c)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'பணம் செலுத்திய முறை' : 'Payment Mode'}
                  </label>
                  <select
                    value={editFormData.payment_mode}
                    onChange={(e) => setEditFormData({ ...editFormData, payment_mode: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary"
                  >
                    <option value="Cash">{language === 'ta' ? '💵 ரொக்கம் (Cash)' : '💵 Cash'}</option>
                    <option value="UPI">{language === 'ta' ? '📱 UPI (GPay/PhonePe)' : '📱 UPI (GPay/PhonePe)'}</option>
                    <option value="Bank Transfer">{language === 'ta' ? '🏦 வங்கி பரிமாற்றம் (NEFT)' : '🏦 Direct Bank NEFT'}</option>
                    <option value="Card">{language === 'ta' ? '💳 கார்டு (Card)' : '💳 Card'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'விளக்கம் / குறிப்புகள்' : 'Description / Notes'}
                </label>
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEntry(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  <span>{language === 'ta' ? 'புதுப்பிக்கவும்' : 'Update Entry'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Custom Themed Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        title={language === 'ta' ? 'பேரேடு பதிவை நீக்கு' : 'Delete Daybook Record'}
        itemName={deleteModalConfig.particulars}
        itemDetails={`${language === 'ta' ? 'தேதி' : 'Date'}: ${deleteModalConfig.date} • ${language === 'ta' ? 'தொகை' : 'Amount'}: ₹${Number(deleteModalConfig.amount || 0).toLocaleString('en-IN')} • ${language === 'ta' ? 'பிரிவு' : 'Category'}: ${getCatLabel(deleteModalConfig.category)}`}
        warningText={language === 'ta'
          ? `"${deleteModalConfig.particulars}" பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா? இது பேரேடு இருப்பை மாற்றியமைக்கும்.`
          : `Are you sure you want to delete daybook entry "${deleteModalConfig.particulars}"? This will adjust the daybook totals.`}
        confirmBtnText={language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete Entry'}
        onConfirm={confirmDeleteEntry}
        onClose={() => setDeleteModalConfig({ ...deleteModalConfig, isOpen: false })}
      />

    </div>
  );
};

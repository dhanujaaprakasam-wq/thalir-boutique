import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Search, IndianRupee, Phone, MapPin, 
  Calendar, FileText, CheckCircle2, Trash2, X, Building
} from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const SupplierManager = () => {
  const { showToast, language } = useStore();
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('suppliers'); // 'suppliers' | 'purchases'
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    id: null,
    name: '',
    city: '',
    phone: ''
  });

  // Form States
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    city: 'Elampillai',
    category: 'Saree Manufacturer',
    notes: ''
  });

  const [purchaseForm, setPurchaseForm] = useState({
    supplier_name: '',
    invoice_date: new Date().toISOString().split('T')[0],
    total_amount: '',
    paid_amount: '',
    payment_status: 'Paid',
    items_summary: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppData, poData] = await Promise.all([
        api.getSuppliers(),
        api.getPurchaseOrders()
      ]);
      setSuppliers(suppData || []);
      setPurchases(poData || []);
      if (suppData && suppData.length > 0 && !purchaseForm.supplier_name) {
        setPurchaseForm(prev => ({ ...prev, supplier_name: suppData[0].name }));
      }
    } catch (err) {
      console.warn('Failed to load supplier data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    try {
      await api.createSupplier(supplierForm);
      if (showToast) showToast(`Supplier "${supplierForm.name}" added to directory! ✓`);
      setIsAddSupplierOpen(false);
      setSupplierForm({
        name: '',
        contact_person: '',
        phone: '',
        city: '',
        category: 'Saree Manufacturer',
        notes: ''
      });
      loadData();
    } catch (err) {
      if (showToast) showToast('Failed to save supplier.');
    }
  };

  const promptDeleteSupplier = (sup) => {
    setDeleteModalConfig({
      isOpen: true,
      id: sup.id,
      name: sup.name,
      city: sup.city || '',
      phone: sup.phone || ''
    });
  };

  const handleConfirmDeleteSupplier = async () => {
    if (!deleteModalConfig.id) return;
    try {
      await api.deleteSupplier(deleteModalConfig.id);
      if (showToast) showToast(`Supplier "${deleteModalConfig.name}" deleted.`);
      loadData();
    } catch (err) {
      if (showToast) showToast('Failed to delete supplier.');
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.supplier_name || !purchaseForm.total_amount) return;
    try {
      await api.createPurchaseOrder({
        ...purchaseForm,
        paid_amount: purchaseForm.paid_amount || purchaseForm.total_amount
      });
      if (showToast) showToast(`Purchase Order recorded & synced with Daybook! 🛍️`);
      setIsAddPurchaseOpen(false);
      setPurchaseForm({
        supplier_name: suppliers[0]?.name || '',
        invoice_date: new Date().toISOString().split('T')[0],
        total_amount: '',
        paid_amount: '',
        payment_status: 'Paid',
        items_summary: '',
        notes: ''
      });
      loadData();
    } catch (err) {
      if (showToast) showToast('Failed to record purchase order.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Tab Switcher & Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'suppliers' ? 'bg-[#073822] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🏢 {language === 'ta' ? 'சப்ளையர் பட்டியல்' : 'Supplier Directory'} ({suppliers.length})
          </button>

          <button
            onClick={() => setActiveSubTab('purchases')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'purchases' ? 'bg-[#073822] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            📋 {language === 'ta' ? 'கொள்முதல் பில்கள்' : 'Purchase Invoices'} ({purchases.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {activeSubTab === 'suppliers' ? (
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="w-full sm:w-auto bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gold" /> {language === 'ta' ? 'புதிய சப்ளையரைச் சேர்க்க' : 'Add New Supplier'}
            </button>
          ) : (
            <button
              onClick={() => setIsAddPurchaseOpen(true)}
              className="w-full sm:w-auto bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gold" /> {language === 'ta' ? 'கொள்முதல் பில் பதிவு செய்ய' : 'Record Purchase Invoice'}
            </button>
          )}
        </div>
      </div>

      {/* Supplier Directory List */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.length === 0 ? (
            <div className="col-span-full py-16 px-4 text-center bg-white rounded-2xl border border-stone-200">
              <Building className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-stone-700 text-sm">
                {language === 'ta' ? 'சப்ளையர் பட்டியலில் யாரும் இல்லை' : 'No suppliers in directory'}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {language === 'ta'
                  ? 'நெசவாளர்கள், ஆலைகள் அல்லது மொத்த விற்பனையாளர்களைச் சேர்க்க மேலே உள்ள பொத்தானைக் கிளிக் செய்யவும்.'
                  : 'Click "+ Add New Supplier" above to record your real weavers, mills, or wholesale vendors.'}
              </p>
            </div>
          ) : (
            suppliers.map(sup => (
              <div key={sup.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 hover:border-primary/40 transition-all relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-serif font-bold text-base text-stone-900">{sup.name}</h4>
                    <span className="text-[11px] text-emerald-800 font-semibold">{sup.category || 'Saree Manufacturer'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => promptDeleteSupplier(sup)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title={language === 'ta' ? 'சப்ளையரை நீக்க' : 'Delete supplier'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-stone-600">
                  {sup.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{sup.city}</span>
                    </div>
                  )}
                  {sup.phone && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{sup.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-xs">
                  <span className="text-stone-400">{language === 'ta' ? 'மொத்த கொள்முதல்:' : 'Total Purchase Orders:'}</span>
                  <span className="font-bold text-[#073822]">₹{Number(sup.total_purchases || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Purchase Invoices Table */}
      {activeSubTab === 'purchases' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                  <th className="py-3 px-4">{language === 'ta' ? 'PO # & தேதி' : 'PO # & Date'}</th>
                  <th className="py-3 px-4">{language === 'ta' ? 'சப்ளையர் / வியாபாரி' : 'Supplier / Vendor'}</th>
                  <th className="py-3 px-4">{language === 'ta' ? 'பொருட்கள் / சேலைகள் விவரம்' : 'Items / Sarees Description'}</th>
                  <th className="py-3 px-4 text-right">{language === 'ta' ? 'பில் தொகை' : 'Invoice Amount'}</th>
                  <th className="py-3 px-4 text-center">{language === 'ta' ? 'நிலை' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400">
                      {language === 'ta' ? 'கொள்முதல் பில்கள் எதுவும் பதிவு செய்யப்படவில்லை.' : 'No purchase invoices recorded yet. Click "Record Purchase Invoice" to add.'}
                    </td>
                  </tr>
                ) : (
                  purchases.map(po => (
                    <tr key={po.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <strong className="font-mono text-primary block">{po.po_number}</strong>
                        <span className="text-[11px] text-stone-400">{po.invoice_date}</span>
                      </td>

                      <td className="py-3 px-4">
                        <strong className="text-stone-900 block font-semibold">{po.supplier_name}</strong>
                      </td>

                      <td className="py-3 px-4 text-stone-600 text-xs">
                        {po.items_summary || (language === 'ta' ? 'மொத்த சேலை இருப்பு' : 'Bulk Saree Stock')}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-stone-900 font-mono text-sm">
                        ₹{Number(po.total_amount).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {po.payment_status === 'Paid' ? (language === 'ta' ? 'செலுத்தப்பட்டது' : 'Paid') : po.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 my-auto">
            <div className="bg-[#073822] text-white p-5 flex items-center justify-between border-b border-[#DFBA6D]/30">
              <h3 className="font-serif font-bold text-base">
                {language === 'ta' ? 'புதிய சேலை சப்ளையரைச் சேர்க்க' : 'Add New Saree Supplier'}
              </h3>
              <button onClick={() => setIsAddSupplierOpen(false)} className="text-white/80 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'ta' ? 'சப்ளையர் / ஆலை பெயர்' : 'Supplier / Mill Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g. Palani Aandavar Tex Elampillai"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'ta' ? 'ஊர் / நகரம்' : 'City / Location'}
                  </label>
                  <input
                    type="text"
                    value={supplierForm.city}
                    onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'ta' ? 'தொலைபேசி எண்' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'ta' ? 'பிரிவு / சிறப்புத் தயாரிப்பு' : 'Category / Specialty'}
                </label>
                <input
                  type="text"
                  value={supplierForm.category}
                  onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddSupplierOpen(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button type="submit" className="bg-[#073822] text-white px-5 py-2 rounded-xl font-bold cursor-pointer">
                  {language === 'ta' ? 'சப்ளையரை சேமி' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Purchase Modal */}
      {isAddPurchaseOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 my-auto">
            <div className="bg-[#073822] text-white p-5 flex items-center justify-between border-b border-[#DFBA6D]/30">
              <h3 className="font-serif font-bold text-base">
                {language === 'ta' ? 'சேலை கொள்முதல் பில் பதிவு' : 'Record Saree Purchase Invoice'}
              </h3>
              <button onClick={() => setIsAddPurchaseOpen(false)} className="text-white/80 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddPurchase} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'ta' ? 'சப்ளையரை தேர்வு செய்க' : 'Select Supplier'} *
                </label>
                <select
                  value={purchaseForm.supplier_name}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.city})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'ta' ? 'மொத்த பில் தொகை (₹)' : 'Total Bill Amount (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={purchaseForm.total_amount}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, total_amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border-2 border-primary/40 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'ta' ? 'பில் தேதி' : 'Invoice Date'}
                  </label>
                  <input
                    type="date"
                    value={purchaseForm.invoice_date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoice_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'ta' ? 'பொருட்கள் விவரம் / பெறப்பட்ட சேலைகள்' : 'Items Summary / Sarees Received'}
                </label>
                <input
                  type="text"
                  value={purchaseForm.items_summary}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, items_summary: e.target.value })}
                  placeholder={language === 'ta' ? 'எ.கா. 50 சாப்ட் சில்க் சேலைகள், 20 மல் காட்டன்' : 'e.g. 50 Soft Silk Sarees, 20 Mul Cotton'}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>
              <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl">
                ✓ <em>{language === 'ta' ? 'இந்த கொள்முதல் தானாகவே கடையின் பணப்புழக்க பேரேட்டில் பற்று வைக்கப்படும்.' : "This purchase will automatically be debited into the store's Daybook Cashflow Ledger."}</em>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddPurchaseOpen(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button type="submit" className="bg-[#073822] text-white px-5 py-2 rounded-xl font-bold cursor-pointer">
                  {language === 'ta' ? 'கொள்முதலை பதிவு செய்' : 'Record Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Luxury Confirm Delete Supplier Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        title={language === 'ta' ? 'சப்ளையரை நீக்கு' : 'Delete Supplier'}
        itemName={deleteModalConfig.name}
        itemDetails={`${deleteModalConfig.city || ''} ${deleteModalConfig.phone ? '• ' + deleteModalConfig.phone : ''}`}
        warningText={language === 'ta'
          ? `சப்ளையர் பட்டியலில் இருந்து "${deleteModalConfig.name}" ஐ நீக்க விரும்புகிறீர்களா? முந்தைய கொள்முதல் பதிவுகள் பாதுகாக்கப்படும்.`
          : `Are you sure you want to remove "${deleteModalConfig.name}" from your supplier directory? Historical purchase records will be preserved.`}
        confirmBtnText={language === 'ta' ? 'சப்ளையரை நீக்கு' : 'Delete Supplier'}
        onConfirm={handleConfirmDeleteSupplier}
        onClose={() => setDeleteModalConfig({ isOpen: false, id: null, name: '', city: '', phone: '' })}
      />

    </div>
  );
};

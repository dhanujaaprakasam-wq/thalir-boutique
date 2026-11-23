import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, AlertCircle, CheckCircle2, IndianRupee, Phone, X, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';

export const ReturnsManager = () => {
  const { showToast, language } = useStore();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    order_id: '',
    customer_name: '',
    customer_phone: '',
    product_name: '',
    reason: 'Fabric defect / Weaving damage',
    refund_amount: '',
    refund_mode: 'UPI'
  });

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await api.getReturns();
      setReturns(data || []);
    } catch (err) {
      console.warn('Failed to load returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.refund_amount) return;
    try {
      await api.createReturn(form);
      if (showToast) showToast('Return & refund record saved and debited to Daybook! ✓');
      setIsModalOpen(false);
      setForm({
        order_id: '',
        customer_name: '',
        customer_phone: '',
        product_name: '',
        reason: 'Fabric defect / Weaving damage',
        refund_amount: '',
        refund_mode: 'UPI'
      });
      loadReturns();
    } catch (err) {
      if (showToast) showToast('Failed to log return.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <h3 className="font-serif font-bold text-lg text-[#073822]">
            {language === 'ta' ? 'திரும்பப் பெறப்பட்ட & சேதமடைந்த சேலைகள் திருப்பியளிப்பு' : 'Returns & Damaged Saree Refunds'}
          </h3>
          <p className="text-xs text-stone-500">
            {language === 'ta'
              ? 'வாடிக்கையாளர் ரிட்டர்ன்கள், சேதமடைந்த பொருட்கள் மற்றும் பணத்தைத் திரும்பப் பெறும் பரிவர்த்தனைகளைக் கண்காணிக்கவும்'
              : 'Track customer returns, damaged goods, and refund transactions'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gold" /> {language === 'ta' ? 'ரிட்டர்ன் / பணத்தை திரும்பப் பதிவு செய்' : 'Log Return / Refund'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <th className="py-3.5 px-4">{language === 'ta' ? 'ரிட்டர்ன் ID & தேதி' : 'Return ID & Date'}</th>
                <th className="py-3.5 px-4">{language === 'ta' ? 'வாடிக்கையாளர்' : 'Customer'}</th>
                <th className="py-3.5 px-4">{language === 'ta' ? 'தயாரிப்பு & குறைபாடு காரணம்' : 'Product & Defect Reason'}</th>
                <th className="py-3.5 px-4 text-right">{language === 'ta' ? 'திருப்பி அளித்த தொகை' : 'Refund Amount'}</th>
                <th className="py-3.5 px-4 text-center">{language === 'ta' ? 'நிலை' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    {language === 'ta' ? 'ரிட்டர்ன்கள் எதுவும் இல்லை.' : 'No returns logged yet. Click "Log Return / Refund" to record.'}
                  </td>
                </tr>
              ) : (
                returns.map(ret => (
                  <tr key={ret.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <strong className="font-mono text-primary block">{ret.return_id}</strong>
                      <span className="text-[11px] text-stone-400">{language === 'ta' ? 'ஆர்டர்:' : 'Order:'} #{ret.order_id}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <strong className="text-stone-900 block font-semibold">{ret.customer_name}</strong>
                      {ret.customer_phone && <span className="text-[11px] text-stone-500 font-mono">{ret.customer_phone}</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-stone-800 block">{ret.product_name}</span>
                      <span className="text-[11px] text-stone-500">{ret.reason}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-red-600 font-mono text-sm">
                      -₹{Number(ret.refund_amount).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {ret.status === 'Refunded' ? (language === 'ta' ? 'திருப்பி அளிக்கப்பட்டது' : 'Refunded') : ret.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 my-auto">
            <div className="bg-[#073822] text-white p-5 flex items-center justify-between border-b border-[#DFBA6D]/30">
              <h3 className="font-serif font-bold text-base">
                {language === 'ta' ? 'சேலை ரிட்டர்ன் / ரீஃபண்ட் பதிவு' : 'Log Return / Saree Refund'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'ta' ? 'வாடிக்கையாளர் பெயர் *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sumathi / Priya"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'ta' ? 'வாடிக்கையாளர் தொலைபேசி' : 'Customer Phone'}
                  </label>
                  <input
                    type="tel"
                    placeholder="9842100000"
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'ta' ? 'திருப்பி அளிக்கப்படும் தொகை (₹) *' : 'Refund Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 1000"
                    value={form.refund_amount}
                    onChange={(e) => setForm({ ...form, refund_amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border-2 border-red-300 font-bold text-red-600"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'ta' ? 'திரும்பப் பெறப்பட்ட தயாரிப்பு' : 'Product Returned / Damaged'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chiniya Soft Silk Saree (Damage)"
                  value={form.product_name}
                  onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'ta' ? 'ரிட்டர்ன் காரணம்' : 'Reason for Return'}
                </label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button type="submit" className="bg-[#073822] text-white px-5 py-2 rounded-xl font-bold cursor-pointer">
                  {language === 'ta' ? 'ரீஃபண்ட் சேமி' : 'Save Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

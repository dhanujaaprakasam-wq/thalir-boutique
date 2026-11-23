import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Percent, IndianRupee, Sparkles, CheckCircle2, X, Copy, Check, Users, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const OffersManager = () => {
  const { showToast, loadAvailableCoupons, language, products } = useStore();
  const festiveProducts = (products || []).filter(p => p.isSpecialEvent);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Custom Delete Modal State
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    offerId: null,
    code: '',
    title: '',
    discountText: ''
  });

  const [form, setForm] = useState({
    code: '',
    title: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: 1000,
    valid_till: '2026-12-31',
    first_order_only: false,
    is_active: true
  });

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await api.getOffers();
      setOffers(data || []);
      if (loadAvailableCoupons) loadAvailableCoupons();
    } catch (e) {
      console.warn('Failed to load offers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    if (showToast) showToast(`Coupon code "${code}" copied to clipboard! 📋`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) {
      if (showToast) showToast('Please enter coupon code and discount value.');
      return;
    }
    try {
      await api.createOffer({
        ...form,
        code: form.code.toUpperCase().trim()
      });
      if (showToast) showToast(`Coupon "${form.code.toUpperCase()}" created & active on storefront! ✨`);
      setIsAddOpen(false);
      setForm({
        code: '',
        title: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_value: 1000,
        valid_till: '2026-12-31',
        first_order_only: false,
        is_active: true
      });
      loadOffers();
    } catch (err) {
      if (showToast) showToast('Failed to create coupon.');
    }
  };

  const promptDeleteCoupon = (off) => {
    setDeleteModalConfig({
      isOpen: true,
      offerId: off.id,
      code: off.code,
      title: off.title,
      discountText: off.discount_type === 'percentage' ? `${off.discount_value}% OFF` : `₹${off.discount_value} OFF`
    });
  };

  const confirmDeleteCoupon = async () => {
    if (!deleteModalConfig.offerId) return;
    try {
      await api.deleteOffer(deleteModalConfig.offerId);
      if (showToast) showToast(`Coupon "${deleteModalConfig.code}" removed.`);
      loadOffers();
    } catch (err) {
      if (showToast) showToast('Failed to delete coupon.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Add Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <h3 className="font-serif font-bold text-lg text-[#073822] flex items-center gap-2">
            <Tag className="w-5 h-5 text-gold" />
            <span>{language === 'ta' ? 'தள்ளுபடி கூப்பன்கள் & சலுகைகள்' : 'Boutique Offers & Discount Coupons'}</span>
          </h3>
          <p className="text-xs text-stone-500">
            {language === 'ta'
              ? 'வாடிக்கையாளர்கள் ஆன்லைன் மற்றும் கடையில் ஆர்டர் செய்யும்போது பயன்படுத்தும் கூப்பன்களை நிர்வகிக்கவும்'
              : 'Create and manage coupon codes used by customers during online & in-store checkout'}
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="w-full sm:w-auto bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gold" /> {language === 'ta' ? 'புதிய கூப்பன் உருவாக்க' : 'Create Discount Coupon'}
        </button>
      </div>

      {/* Festival Flash Sale Banner KPI Card */}
      <div className="bg-gradient-to-r from-[#073822] via-[#0A4D2E] to-[#0D5C3A] p-5 rounded-2xl border-2 border-gold/40 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-gold/40 flex items-center justify-center text-2xl shrink-0">
            🪔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                {language === 'ta' ? 'நேரலை பேனர்' : 'Live Storefront Banner'}
              </span>
              <span className="text-xs text-stone-300">
                {festiveProducts.length} {language === 'ta' ? 'விழா தயாரிப்புகள் குறியிடப்பட்டுள்ளன' : 'Products Tagged for Festival'}
              </span>
            </div>
            <h4 className="font-serif font-bold text-base sm:text-lg text-white mt-1">
              {festiveProducts[0]?.eventName || (language === 'ta' ? 'தீபாவளி சிறப்பு தள்ளுபடி கவுண்டவுன் பேனர்' : 'Diwali Dhamaka Flash Sale Countdown Banner')}
            </h4>
            <p className="text-xs text-stone-300 mt-0.5">
              {language === 'ta'
                ? 'தயாரிப்பை சேர்க்கும் போது "பண்டிகை / சிறப்பு நிகழ்வு தயாரிப்பு" என்பதை டிக் செய்யவும்.'
                : 'Mention special festival items while adding products in the "Catalog" tab to display them with live ticking timers!'}
            </p>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-gold/30 text-right shrink-0">
          <span className="text-[11px] text-stone-300 uppercase block font-semibold">
            {language === 'ta' ? 'பேனர் நிலை' : 'Banner Status'}
          </span>
          <span className="text-sm font-bold text-gold flex items-center gap-1.5 justify-end mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{language === 'ta' ? 'வாடிக்கையாளர்களுக்கு தெரியும்' : 'Active on Storefront'}</span>
          </span>
        </div>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
            {language === 'ta' ? 'செயலில் உள்ள கூப்பன்கள் எதுவும் இல்லை. மேலே உள்ள பொத்தானைக் கிளிக் செய்யவும்.' : 'No active discount coupons found. Click "Create Discount Coupon" above.'}
          </div>
        ) : (
          offers.map(off => (
            <div key={off.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3.5 relative overflow-hidden flex flex-col justify-between hover:border-gold/40 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-base text-primary bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 tracking-wider">
                      {off.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(off.code)}
                      className="p-1 text-stone-400 hover:text-emerald-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                      title={language === 'ta' ? 'கூப்பன் குறியீட்டை நகலெடு' : 'Copy Coupon Code'}
                    >
                      {copiedCode === off.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => promptDeleteCoupon(off)}
                    className="text-stone-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                    title={language === 'ta' ? 'கூப்பனை நீக்கு' : 'Delete coupon'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-stone-900 text-sm">{off.title}</h4>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {off.discount_type === 'percentage' ? (
                        <>
                          <Percent className="w-3 h-3" /> {off.discount_value}% {language === 'ta' ? 'தள்ளுபடி' : 'OFF'}
                        </>
                      ) : (
                        <>
                          <IndianRupee className="w-3 h-3" /> ₹{off.discount_value} {language === 'ta' ? 'தள்ளுபடி' : 'Flat OFF'}
                        </>
                      )}
                    </span>
                    {(Boolean(off.first_order_only) || off.code === 'WELCOME10') && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        <Sparkles className="w-3 h-3 text-amber-600" /> {language === 'ta' ? 'முதல் ஆர்டருக்கு மட்டும்' : '1st Order Only'}
                      </span>
                    )}
                    {Number(off.min_order_value) > 0 && (
                      <span className="text-[11px] text-stone-500 font-medium">
                        {language === 'ta' ? 'குறைந்தபட்ச செலவு:' : 'Min spend:'} ₹{Number(off.min_order_value).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage & Expiry Details */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <div className="flex items-center gap-1 text-stone-600 font-semibold">
                  <ShoppingBag className="w-3.5 h-3.5 text-gold" />
                  <span>{language === 'ta' ? `பயன்படுத்தப்பட்டது: ${off.usage_count || 0} முறை` : `Bought: ${off.usage_count || 0} times`}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {language === 'ta' ? 'செயலில் உள்ளது ✓' : 'Active ✓'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 my-auto overflow-hidden">
            <div className="bg-[#073822] text-white p-5 flex items-center justify-between border-b border-[#DFBA6D]/30">
              <h3 className="font-serif font-bold text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-gold" />
                <span>{language === 'ta' ? 'புதிய தள்ளுபடி கூப்பன் உருவாக்க' : 'Create Discount Coupon'}</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-white/80 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  {language === 'ta' ? 'கூப்பன் குறியீடு *' : 'Coupon Code *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIWALI20 / FESTIVE500 / WELCOME10"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono uppercase focus:ring-2 focus:ring-[#073822]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  {language === 'ta' ? 'கூப்பன் தலைப்பு / விளக்கம் *' : 'Coupon Title / Description *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'ta' ? 'எ.கா. பண்டிகை சிறப்பு: அனைத்து புடவைகளுக்கும் 20% தள்ளுபடி' : 'e.g. Festive Special: 20% OFF on all sarees'}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#073822]/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    {language === 'ta' ? 'தள்ளுபடி வகை' : 'Discount Type'}
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white cursor-pointer"
                  >
                    <option value="percentage">{language === 'ta' ? 'சதவீதம் (%)' : 'Percentage (%)'}</option>
                    <option value="flat">{language === 'ta' ? 'நிலையான தொகை (₹)' : 'Flat Amount (₹)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    {form.discount_type === 'percentage' 
                      ? (language === 'ta' ? 'தள்ளுபடி % *' : 'Discount % *') 
                      : (language === 'ta' ? 'தள்ளுபடி ₹ *' : 'Discount ₹ *')}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={form.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 150'}
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-[#073822]/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    {language === 'ta' ? 'குறைந்தபட்ச ஆர்டர் தொகை (₹)' : 'Min Order Subtotal (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1000"
                    value={form.min_order_value}
                    onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-[#073822]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    {language === 'ta' ? 'காலாவதி தேதி' : 'Valid Till Date'}
                  </label>
                  <input
                    type="date"
                    value={form.valid_till}
                    onChange={(e) => setForm({ ...form, valid_till: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 bg-amber-50/70 hover:bg-amber-50 rounded-xl border border-amber-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.first_order_only}
                  onChange={(e) => setForm({ ...form, first_order_only: e.target.checked })}
                  className="w-4 h-4 text-[#073822] rounded accent-[#073822] cursor-pointer"
                />
                <div>
                  <span className="font-bold text-stone-800 text-xs block">
                    {language === 'ta' ? 'முதல் ஆர்டருக்கு மட்டும்' : 'First Order Only'}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {language === 'ta' ? 'வாடிக்கையாளரின் முதல் முறை வாங்குதலுக்கு மட்டும் பொருந்தும்' : "Only eligible on customer's first purchase (like WELCOME10)"}
                  </span>
                </div>
              </label>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-[#073822] hover:bg-[#0a4d2f] text-white px-5 py-2 rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  {language === 'ta' ? 'கூப்பனை சேமி' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Themed Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        title={language === 'ta' ? 'கூப்பனை நீக்கு' : 'Delete Discount Coupon'}
        itemName={deleteModalConfig.code}
        itemDetails={`${deleteModalConfig.title} • ${language === 'ta' ? 'தள்ளுபடி:' : 'Discount:'} ${deleteModalConfig.discountText}`}
        warningText={language === 'ta'
          ? `"${deleteModalConfig.code}" கூப்பனை நீக்க விரும்புகிறீர்களா? வாடிக்கையாளர்கள் இனி இதை பயன்படுத்த முடியாது.`
          : `Are you sure you want to delete coupon code "${deleteModalConfig.code}"? Customers will no longer be able to use this coupon.`}
        confirmBtnText={language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete Coupon'}
        onConfirm={confirmDeleteCoupon}
        onClose={() => setDeleteModalConfig({ ...deleteModalConfig, isOpen: false })}
      />

    </div>
  );
};

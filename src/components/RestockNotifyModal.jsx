import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, MessageCircle, Phone, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';

export const RestockNotifyModal = ({ isOpen, onClose, product, selectedVariant = null }) => {
  const { user, storeInfo, showToast, t, language, products } = useStore();
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !product) return null;

  const currentVariant = selectedVariant || (product.variants && product.variants[0]) || null;
  const sareeCode = currentVariant?.code || currentVariant?.productCode || currentVariant?.product_code || (product.code ? `${product.code}-01` : `TB-${product.id}`);
  const colorName = currentVariant?.color_name || currentVariant?.colorName || product.defaultColor || 'Exclusive Saree';
  const colorCode = currentVariant?.color_code || currentVariant?.colorCode || '#073822';
  const sareeImage = currentVariant?.image_url || currentVariant?.image || product.image;

  // Resolve price from product, variant, or catalog lookup by product code
  const getResolvedPrice = () => {
    // 1. Check direct product / variant fields (basePrice, base_price, price)
    const direct = Number(
      product.basePrice ?? 
      product.base_price ?? 
      product.price ?? 
      selectedVariant?.basePrice ?? 
      selectedVariant?.base_price ?? 
      selectedVariant?.price ?? 
      0
    );
    if (direct > 0) return direct;

    // 2. Lookup in store catalog products by product code or variant code
    if (Array.isArray(products) && products.length > 0) {
      const cleanSareeCode = String(sareeCode || '').trim().toUpperCase();
      const cleanProdCode = String(product.code || '').trim().toUpperCase();
      const baseCodePrefix = cleanSareeCode.replace(/-\d+$/, '');

      const matched = products.find(p => {
        const pCode = String(p.code || '').trim().toUpperCase();
        const pId = String(p.id || '').trim().toUpperCase();
        if (pCode && (pCode === cleanProdCode || pCode === cleanSareeCode || pCode === baseCodePrefix)) return true;
        if (pId && (pId === cleanProdCode || pId === cleanSareeCode || pId === baseCodePrefix)) return true;
        if (Array.isArray(p.variants) && p.variants.some(v => {
          const vCode = String(v.code || v.productCode || v.product_code || '').trim().toUpperCase();
          return vCode && vCode === cleanSareeCode;
        })) return true;
        if (product.name && p.name && p.name.trim().toLowerCase() === product.name.trim().toLowerCase()) return true;
        return false;
      });

      if (matched) {
        const matchedPrice = Number(matched.basePrice ?? matched.base_price ?? matched.price ?? 0);
        if (matchedPrice > 0) return matchedPrice;
      }
    }

    return 0;
  };

  const [dynamicPrice, setDynamicPrice] = useState(() => getResolvedPrice());

  // Dynamic fallback: fetch from API if price could not be resolved from local state
  useEffect(() => {
    const initialPrice = getResolvedPrice();
    if (initialPrice > 0) {
      setDynamicPrice(initialPrice);
      return;
    }

    const codeToSearch = product.code || sareeCode.replace(/-\d+$/, '');
    if (codeToSearch) {
      api.getProducts().then(apiProds => {
        if (Array.isArray(apiProds)) {
          const match = apiProds.find(p => {
            const pCode = String(p.code || '').toUpperCase();
            const pId = String(p.id || '').toUpperCase();
            return pCode === String(codeToSearch).toUpperCase() || 
                   pId === String(codeToSearch).toUpperCase() ||
                   pCode === String(sareeCode).toUpperCase();
          });
          if (match) {
            const p = Number(match.basePrice ?? match.base_price ?? match.price ?? 0);
            if (p > 0) setDynamicPrice(p);
          }
        }
      }).catch(() => {});
    }
  }, [product, sareeCode, products]);

  const price = dynamicPrice > 0 ? dynamicPrice : getResolvedPrice();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      if (showToast) showToast('Please enter a valid 10-digit WhatsApp number');
      return;
    }

    setLoading(true);
    try {
      await api.submitRestockRequest({
        product_id: product.id,
        product_code: product.code,
        variant_code: sareeCode,
        color_name: colorName,
        customer_name: customerName.trim(),
        phone: cleanPhone,
        email: user?.email || null
      });

      setSubmitted(true);
      if (showToast) {
        showToast(language === 'ta' ? 'தகவல் பதிவு செய்யப்பட்டது! வாட்ஸ்அப் மூலம் உங்களுக்கு அறிவிக்கப்படும்.' : 'Restock alert registered! We will notify you on WhatsApp.');
      }
    } catch (err) {
      console.warn('Restock request error:', err);
      if (showToast) showToast('Failed to register. Please try WhatsApp directly.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappInquiryUrl = `https://wa.me/91${storeInfo.rawPhone || '6382218590'}?text=${encodeURIComponent(
    `Hello Thalir Boutique! 🌸\nI would love to purchase this currently Sold Out saree when restocked:\n\n` +
    `• *Saree Code:* ${sareeCode}\n` +
    `• *Design:* ${product.name}\n` +
    `• *Color:* ${colorName}\n` +
    `• *Price:* ₹${Number(price || 0).toLocaleString('en-IN')}\n` +
    (customerName ? `• *Customer:* ${customerName}\n` : '') +
    `\nPlease notify me when fresh pieces arrive!`
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#073822] text-white px-5 py-4 flex items-center justify-between border-b border-[#DFBA6D]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold border border-gold/40">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-white">
                {language === 'ta' ? 'மீண்டும் வரும்போது தகவல் பெற' : 'Notify Me When Available'}
              </h3>
              <p className="text-[11px] text-stone-300">
                {language === 'ta' ? 'இருப்பில் வந்தவுடன் வாட்ஸ்அப்பில் தகவல் வரும்' : 'Instant WhatsApp alert as soon as restocked'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Card Summary */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center gap-3.5">
          <div className="relative w-16 h-20 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-200 shadow-2xs">
            {sareeImage ? (
              <img src={sareeImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">📷</div>
            )}
            <span className="absolute bottom-0 inset-x-0 bg-red-800 text-white text-[8px] font-extrabold text-center py-0.5 uppercase tracking-wide">
              Sold Out
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 inline-block mb-1">
              {sareeCode}
            </span>
            <h4 className="text-xs font-bold text-stone-900 truncate">{product.name}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" style={{ backgroundColor: colorCode }} />
              <span className="text-[11px] text-stone-600 font-medium">{colorName}</span>
            </div>
            <div className="font-serif font-bold text-xs text-emerald-900 mt-1">
              ₹{Number(price).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-base text-stone-900">
                {language === 'ta' ? 'பதிவு செய்யப்பட்டது! 🌸' : 'Alert Request Registered! 🌸'}
              </h4>
              <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                {language === 'ta' 
                  ? `இந்த சேலை (${sareeCode}) புதிய இருப்பு வந்தவுடன் +91 ${phone}-க்கு வாட்ஸ்அப் மெசேஜ் அனுப்புவோம்.`
                  : `We will send a WhatsApp message to +91 ${phone} the moment this saree (${sareeCode}) is restocked in our boutique.`
                }
              </p>
              
              <div className="pt-3 flex flex-col gap-2">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-whatsapp hover:bg-whatsapp-dark text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  {language === 'ta' ? 'வாட்ஸ்அப்பில் இப்போதே பேசவும்' : 'Chat with Boutique on WhatsApp Now'}
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-stone-500 hover:text-stone-800 text-xs font-semibold py-1.5 cursor-pointer"
                >
                  {language === 'ta' ? 'மூடுக' : 'Close'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                {language === 'ta'
                  ? 'இந்த சேலை தற்போது விற்றுத் தீர்ந்துவிட்டது. உங்கள் வாட்ஸ்அப் எண்ணை பதிவு செய்தால், புதிய இருப்பு வந்ததும் உடனே தகவல் அனுப்புவோம்.'
                  : 'Exclusive boutique sarees sell out fast! Leave your WhatsApp number below to get priority alert the moment it is restocked.'}
              </p>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {language === 'ta' ? 'உங்கள் பெயர் (விருப்பத்திற்குரியது)' : 'Your Name (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {language === 'ta' ? 'வாட்ஸ்அப் மொபைல் எண் *' : 'WhatsApp Number *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white border border-stone-200 rounded-xl pl-11 pr-3 py-2 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="w-full bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  <Bell className="w-4 h-4 text-gold" />
                  {loading 
                    ? (language === 'ta' ? 'பதிவு செய்யப்படுகிறது...' : 'Registering Alert...')
                    : (language === 'ta' ? 'வாட்ஸ்அப்பில் தகவல் பெற பதிவு செய்' : 'Notify Me on WhatsApp')
                  }
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-stone-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-stone-400 uppercase font-semibold">
                    {language === 'ta' ? 'அல்லது' : 'or direct inquiry'}
                  </span>
                  <div className="flex-grow border-t border-stone-200"></div>
                </div>

                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all no-underline cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  {language === 'ta' ? 'வாட்ஸ்அப்பில் நேரடியாக கேட்கவும்' : 'Inquire Directly on WhatsApp'}
                </a>
              </div>
            </form>
          )}
        </div>

        <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 text-[10px] text-stone-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-dark" /> No spam guaranteed
          </span>
          <span>Thalir Boutique Priority Club</span>
        </div>

      </div>
    </div>
  );
};

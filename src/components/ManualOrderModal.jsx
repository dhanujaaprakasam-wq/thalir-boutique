import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingBag, Store, User, Phone, MapPin, IndianRupee, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ManualOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const { products, showToast, createManualOrder, language } = useStore();

  const [channel, setChannel] = useState('direct_shop'); // 'direct_shop' | 'whatsapp' | 'phone'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [city, setCity] = useState('Namakkal');
  const [pincode, setPincode] = useState('638008');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Counter');
  const [orderStatus, setOrderStatus] = useState('Payment Confirmed');
  const [orderNotes, setOrderNotes] = useState('Direct In-Store Walk-in Sale');

  // Multi-item cart for manual sale
  const [orderItems, setOrderItems] = useState([
    {
      id: 1,
      productId: products[0]?.id || '',
      name: products[0]?.name || 'Traditional Saree',
      color: products[0]?.defaultColor || 'Emerald Green',
      size: 'Free Size',
      price: products[0]?.basePrice || 1200, // Fully editable price
      qty: 1,
      image: products[0]?.variants?.[0]?.image || products[0]?.image || ''
    }
  ]);

  if (!isOpen) return null;

  const handleProductSelect = (index, prodId) => {
    const prod = products.find(p => p.id === prodId || String(p.id) === String(prodId));
    if (!prod) return;
    const firstVar = prod.variants?.[0];
    const initialCode = firstVar?.code || prod.code || prod.id;

    setOrderItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return {
        ...item,
        productId: prod.id,
        code: initialCode,
        productCode: initialCode,
        product_code: initialCode,
        name: prod.name,
        color: firstVar?.colorName || prod.defaultColor || 'Standard',
        size: prod.sizes ? prod.sizes[0] : 'Free Size',
        price: prod.basePrice, // Pre-fills base price, but still fully editable!
        image: firstVar?.image || prod.image || ''
      };
    }));
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const addItemRow = () => {
    const firstProd = products[0] || {};
    setOrderItems(prev => [
      ...prev,
      {
        id: Date.now(),
        productId: firstProd.id || '',
        name: firstProd.name || 'Boutique Item',
        color: firstProd.defaultColor || 'Standard',
        size: 'Free Size',
        price: firstProd.basePrice || 999,
        qty: 1,
        image: firstProd.variants?.[0]?.image || firstProd.image || ''
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (orderItems.length <= 1) {
      if (showToast) showToast('At least 1 item is required.');
      return;
    }
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 1)), 0);
  const deliveryFee = channel === 'direct_shop' ? 0 : 60;
  const grandTotal = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    if (!customerName || !customerName.trim()) {
      if (showToast) showToast('Please enter Customer Name.');
      return;
    }

    try {
      const cleanPhone = (customerPhone && customerPhone.trim()) ? customerPhone.trim() : 'Direct Walk-In';
      const prefix = channel === 'direct_shop' ? 'TB-DIR-' : channel === 'whatsapp' ? 'TB-WA-' : 'TB-MAN-';
      const orderId = `${prefix}${Date.now().toString().slice(-6)}`;

      const sanitizedItems = (orderItems || []).map(it => {
        const prod = products.find(p => p.id === it.productId || p.code === it.productId);
        const matchedV = prod?.variants?.find(v => 
          (v.colorName && v.colorName.toLowerCase() === (it.color || '').toLowerCase()) ||
          (v.color_name && v.color_name.toLowerCase() === (it.color || '').toLowerCase())
        );
        const itemCode = it.code || it.product_code || it.productCode || matchedV?.code || prod?.code || it.productId || 'TB-PRD-AUTO';
        const p = Number(it.price) || 0;
        const q = Math.max(1, Number(it.qty) || 1);
        return {
          id: it.productId || itemCode,
          code: itemCode,
          productCode: itemCode,
          product_code: itemCode,
          name: it.name || 'Boutique Saree',
          color: it.color || 'Standard',
          size: it.size || 'Free Size',
          price: p,
          customPrice: p,
          qty: q,
          image: it.image || ''
        };
      });

      const calcSubtotal = sanitizedItems.reduce((sum, it) => sum + (it.price * it.qty), 0);
      const calcDeliveryFee = channel === 'direct_shop' ? 0 : 60;
      const calcGrandTotal = calcSubtotal + calcDeliveryFee;

      const newOrder = {
        orderId,
        timestamp: new Date().toISOString(),
        channel: channel === 'direct_shop' ? 'direct' : channel === 'whatsapp' ? 'whatsapp' : 'manual',
        customer: {
          fullName: customerName.trim(),
          mobile: cleanPhone,
          address: (customerAddress && customerAddress.trim()) ? customerAddress.trim() : (channel === 'direct_shop' ? 'Direct In-Store Purchase (Veppadai Showroom)' : 'Direct Delivery Address'),
          city: (city && city.trim()) ? city.trim() : 'Namakkal',
          pincode: (pincode && pincode.trim()) ? pincode.trim() : '638008',
          landmark: ''
        },
        items: sanitizedItems,
        pricing: {
          subtotal: calcSubtotal,
          deliveryFee: calcDeliveryFee,
          grandTotal: calcGrandTotal
        },
        paymentMethod: paymentMethod || 'Cash on Counter',
        paymentProof: `Verified by Admin (${paymentMethod || 'Cash'})`,
        status: orderStatus || 'Payment Confirmed',
        orderNotes: orderNotes || 'Direct In-Store Sale'
      };

      if (createManualOrder) {
        await createManualOrder(newOrder);
      }
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }
      onClose();
    } catch (err) {
      console.error('Error recording manual order:', err);
      if (showToast) showToast('Could not record order. Please verify input fields.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-[#073822] text-white p-5 sm:px-6 flex items-center justify-between border-b border-[#DFBA6D]/30 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <Store className="w-5 h-5 text-gold" />
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg">
                {language === 'ta' ? 'நேரடி / கடை விற்பனை ஆர்டர் பதிவு' : 'Create In-Store / Direct Order'}
              </h2>
              <p className="text-[11px] text-stone-300">
                {language === 'ta'
                  ? 'நேரடி கடை விற்பனைகள் அல்லது தனிப்பயன் விலையுடன் ஆர்டர்களைப் பதிவு செய்யவும்'
                  : 'Record direct shop sales or manual orders with custom editable pricing'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-stone-900 text-xs sm:text-sm">
          
          {/* Sale Channel & Order Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setChannel('direct_shop');
                setPaymentMethod('Cash on Counter');
                setOrderStatus('Payment Confirmed');
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                channel === 'direct_shop'
                  ? 'bg-emerald-50 border-emerald-500 text-[#073822] shadow-xs'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-700" />
                <span>{language === 'ta' ? 'நேரடி கடை விற்பனை' : 'Direct Shop Walk-In'}</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {language === 'ta' ? 'வாடிக்கையாளர் கடையில் நேரடியாக வாங்குவது' : 'Customer in physical showroom'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setChannel('whatsapp');
                setOrderStatus('Payment Confirmed');
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                channel === 'whatsapp'
                  ? 'bg-green-50 border-green-500 text-green-900 shadow-xs'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-green-600" />
                <span>{language === 'ta' ? 'வாட்ஸ்அப் நேரடி ஆர்டர்' : 'WhatsApp Direct Deal'}</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {language === 'ta' ? 'வாட்ஸ்அப் மூலம் பெறப்பட்ட ஆர்டர்' : 'Negotiated or custom order'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setChannel('phone');
                setOrderStatus('Payment Confirmed');
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                channel === 'phone'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{language === 'ta' ? 'தொலைபேசி / சிறப்பு விற்பனை' : 'Phone / Custom Sale'}</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {language === 'ta' ? 'சிறப்பு பூட்டிக் கோரிக்கை' : 'Special boutique request'}
              </div>
            </button>
          </div>

          {/* Customer Details */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#073822] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold" />
              <span>{language === 'ta' ? 'வாடிக்கையாளர் தகவல்' : 'Customer Information'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'வாடிக்கையாளர் முழுப் பெயர்' : 'Customer Full Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sundaram"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'மொபைல் எண்' : 'Mobile Number'} <span className="text-stone-400">({language === 'ta' ? 'விருப்பத்தேர்வு' : 'Optional for Walk-ins'})</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9842100000"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'டெலிவரி / முகவரி' : 'Delivery / Billing Address'} <span className="text-stone-400 font-normal">({language === 'ta' ? 'கடை விற்பனைக்கு இயல்புநிலை விடலாம்' : 'Leave default for direct shop purchase'})</span>
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder={language === 'ta' ? 'நேரடி ஷோரூம் விற்பனை / டெலிவரி முகவரி' : 'Direct showroom sale / Delivery address'}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Itemized Products & Editable Price per item */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#073822] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-gold" />
                <span>{language === 'ta' ? 'தயாரிப்புகள் & தனிப்பயன் விலை' : 'Products & Custom Pricing'} ({orderItems.length})</span>
              </h3>
              <span className="text-[11px] text-emerald-800 font-medium">
                {language === 'ta' ? 'ஒவ்வொரு பொருளுக்கும் விலையை மாற்றியமைக்கலாம்' : 'Price is fully editable per item'}
              </span>
            </div>

            <div className="space-y-3">
              {orderItems.map((item, idx) => {
                const selectedProd = products.find(p => p.id === item.productId);
                const colorOptions = selectedProd?.variants?.map(v => v.colorName) || [item.color];

                return (
                  <div key={item.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-800">{language === 'ta' ? `பொருள் #${idx + 1}` : `Item #${idx + 1}`}</span>
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-stone-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> {language === 'ta' ? 'நீக்கு' : 'Remove'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Product Selector */}
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {language === 'ta' ? 'தயாரிப்பை தேர்வு செய்க' : 'Select Catalog Product'}
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-medium"
                        >
                          {products.map(p => {
                            const isSold = p.isSoldOut || (p.variants && p.variants.length > 0 && p.variants.every(v => (v.stockQty ?? v.stock_qty ?? 0) <= 0));
                            return (
                              <option key={p.id} value={p.id}>
                                [{p.code || p.id}] {p.name} (₹{p.basePrice}){isSold ? (language === 'ta' ? ' — [தீர்ந்தது]' : ' — [Sold Out]') : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Color Variant */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {language === 'ta' ? 'வண்ணம்' : 'Color'}
                        </label>
                        <select
                          value={item.color}
                          onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                        >
                          {colorOptions.map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Size */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {language === 'ta' ? 'அளவு' : 'Size'}
                        </label>
                        <input
                          type="text"
                          value={item.size}
                          onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                          placeholder="Free Size"
                        />
                      </div>

                      {/* EDITABLE PRICE (Per user request) */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-primary mb-1">
                          {language === 'ta' ? 'விற்பனை விலை (₹)' : 'Selling Price (₹)'}
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                          className="w-full text-xs px-2.5 py-2 rounded-xl border-2 border-primary/40 focus:border-primary bg-white outline-none font-bold text-stone-900"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {language === 'ta' ? 'எண்ணிக்கை' : 'Qty'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', Math.max(1, Number(e.target.value)))}
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="w-full py-2.5 border-2 border-dashed border-stone-300 hover:border-primary text-stone-600 hover:text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-stone-50/60"
            >
              <Plus className="w-4 h-4" /> {language === 'ta' ? '+ இந்த ஆர்டரில் மற்றொரு பொருளைச் சேர்க்க' : 'Add Another Item / Saree to this Order'}
            </button>
          </div>

          {/* Payment & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'ta' ? 'பணம் செலுத்திய முறை' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-medium"
              >
                <option value="Cash on Counter">{language === 'ta' ? '💵 கடையில் ரொக்கம்' : '💵 Cash on Counter'}</option>
                <option value="UPI QR (GPay / PhonePe)">{language === 'ta' ? '📱 UPI QR (GPay / PhonePe / Paytm)' : '📱 UPI QR (GPay / PhonePe / Paytm)'}</option>
                <option value="Debit / Credit Card">{language === 'ta' ? '💳 கார்டு ஸ்வைப்' : '💳 Card Swipe'}</option>
                <option value="Bank NEFT / IMPS">{language === 'ta' ? '🏦 நேரடி வங்கி பரிமாற்றம்' : '🏦 Direct Bank Transfer'}</option>
                <option value="Cash on Delivery (COD)">{language === 'ta' ? '📦 டெலிவரியில் பணம் (COD)' : '📦 Cash on Delivery'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'ta' ? 'ஆர்டர் நிலை' : 'Order Status'}
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-medium"
              >
                <option value="Payment Confirmed">{language === 'ta' ? '✅ கட்டணம் உறுதி செய்யப்பட்டது' : '✅ Payment Confirmed / Complete'}</option>
                <option value="Delivered">{language === 'ta' ? '🛍️ டெலிவரி செய்யப்பட்டது' : '🛍️ Delivered / Handed Over'}</option>
                <option value="Dispatched">{language === 'ta' ? '🚚 கூரியரில் அனுப்பப்பட்டது' : '🚚 Dispatched'}</option>
                <option value="Pending Verification">{language === 'ta' ? '⏳ சரிபார்ப்பு நிலுவையில்' : '⏳ Pending Verification'}</option>
              </select>
            </div>
          </div>

          {/* Total & Submit */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <span className="text-xs text-stone-500 font-medium">
                {language === 'ta' ? 'செலுத்த வேண்டிய மொத்தத் தொகை:' : 'Grand Total Payable:'}
              </span>
              <div className="font-serif font-extrabold text-2xl text-[#073822]">
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl border border-stone-300 hover:bg-stone-100 font-bold text-xs text-stone-700 cursor-pointer"
              >
                {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 sm:flex-initial bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-7 py-3 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-gold" />
                <span>{language === 'ta' ? 'ஆர்டரை பதிவு செய்' : 'Create & Record Order'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

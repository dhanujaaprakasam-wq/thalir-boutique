import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, User, Phone, MapPin, IndianRupee, ShoppingBag, CheckCircle2, MessageCircle, Globe, Store, Plus, Trash2, Tag, Truck, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';

export const OrderEditModal = ({ isOpen, onClose, order }) => {
  const { products, updateOrderDetails, showToast, language } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [status, setStatus] = useState('Pending Verification');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [channel, setChannel] = useState('site');
  const [items, setItems] = useState([]);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Courier & Tracking State
  const [courierPartner, setCourierPartner] = useState('ST Courier');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [shippingStatus, setShippingStatus] = useState('Order Placed');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  useEffect(() => {
    if (order) {
      setCustomerName(order.customer?.fullName || order.customer_name || '');
      setCustomerMobile(order.customer?.mobile || order.customer_phone || '');
      setCustomerAddress(order.customer?.address || order.delivery_address || '');
      setCity(order.customer?.city || order.city || 'Namakkal');
      setPincode(order.customer?.pincode || order.pincode || '638008');
      setLandmark(order.customer?.landmark || order.landmark || '');
      setStatus(order.status || 'Payment Confirmed');
      setPaymentMethod(order.paymentMethod || 'Prepaid / Verified');
      setOrderNotes(order.orderNotes || order.order_notes || '');
      setChannel(order.channel || 'whatsapp');
      setDeliveryFee(order.pricing?.shippingFee || order.pricing?.deliveryFee || 0);

      setCourierPartner(order.courier_partner || order.courierPartner || 'ST Courier');
      setTrackingNumber(order.tracking_number || order.trackingNumber || '');
      setTrackingUrl(order.tracking_url || order.trackingUrl || '');
      setShippingStatus(order.shipping_status || order.shippingStatus || (order.status === 'Dispatched' ? 'Dispatched' : 'Order Placed'));

      const mappedItems = (order.items || []).map((it, idx) => {
        const prod = products.find(p => p.id === it.id || p.code === it.id || p.id === it.productId || p.code === it.productId);
        const matchedV = prod?.variants?.find(v => 
          (v.colorName && v.colorName.toLowerCase() === (it.color || '').toLowerCase()) ||
          (v.color_name && v.color_name.toLowerCase() === (it.color || '').toLowerCase())
        );
        const itemCode = it.product_code || it.code || matchedV?.code || prod?.code || it.id || it.productId || '';
        return {
          id: it.id || idx,
          code: itemCode,
          productCode: itemCode,
          product_code: itemCode,
          productId: it.productId || prod?.id || it.id || '',
          name: it.name || it.product_name || 'Boutique Item',
          color: it.color || 'Standard',
          size: it.size || 'Free Size',
          price: Number(it.customPrice || it.price || it.unit_price || 0),
          qty: Number(it.qty || 1),
          image: it.image || it.image_url || ''
        };
      });
      setItems(mappedItems.length > 0 ? mappedItems : [
        {
          id: Date.now(),
          productId: products[0]?.id || '',
          code: products[0]?.code || products[0]?.id || '',
          productCode: products[0]?.code || products[0]?.id || '',
          product_code: products[0]?.code || products[0]?.id || '',
          name: products[0]?.name || 'Traditional Saree',
          color: products[0]?.defaultColor || 'Standard',
          size: 'Free Size',
          price: products[0]?.basePrice || 1200,
          qty: 1,
          image: products[0]?.variants?.[0]?.image || products[0]?.image || ''
        }
      ]);
    }
  }, [order, products]);

  if (!isOpen || !order) return null;

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const handleProductSelect = (index, prodId) => {
    const prod = products.find(p => p.id === prodId || String(p.id) === String(prodId));
    if (!prod) return;

    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const pCode = prod.code || prod.id || '';
      return {
        ...item,
        productId: prod.id,
        code: pCode,
        productCode: pCode,
        product_code: pCode,
        name: prod.name,
        color: prod.variants?.[0]?.colorName || prod.defaultColor || 'Standard',
        size: prod.sizes ? prod.sizes[0] : 'Free Size',
        price: prod.basePrice,
        image: prod.variants?.[0]?.image || prod.image || ''
      };
    }));
  };

  const handleAddProduct = () => {
    const firstProd = products[0] || {};
    const firstCode = firstProd.code || firstProd.id || '';
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        productId: firstProd.id || '',
        code: firstCode,
        productCode: firstCode,
        product_code: firstCode,
        name: firstProd.name || 'Boutique Item',
        color: firstProd.defaultColor || 'Standard',
        size: 'Free Size',
        price: firstProd.basePrice || 999,
        qty: 1,
        image: firstProd.variants?.[0]?.image || firstProd.image || ''
      }
    ]);
  };

  const handleRemoveProduct = (index) => {
    if (items.length <= 1) {
      if (showToast) showToast('Order must contain at least 1 product.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 1)), 0);
  const grandTotal = subtotal + Number(deliveryFee);

  const handleSendWhatsAppNotification = async () => {
    setIsSendingWhatsApp(true);
    try {
      const type = shippingStatus === 'Delivered' ? 'delivered' : (shippingStatus === 'Dispatched' ? 'dispatched' : 'confirmed');
      const res = await api.sendOrderWhatsAppNotification(order.orderId || order.order_id, type);
      if (res?.direct_whatsapp_url) {
        window.open(res.direct_whatsapp_url, '_blank');
      }
      if (showToast) showToast('WhatsApp message opened / dispatched! 💬');
    } catch (e) {
      if (showToast) showToast(e.message || 'Failed to dispatch WhatsApp alert');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    if (!customerName.trim()) {
      if (showToast) showToast('Please enter Customer Name.');
      return;
    }

    try {
      const updatedOrder = {
        ...order,
        channel: channel || order.channel || 'whatsapp',
        status: status || order.status || 'Payment Confirmed',
        paymentMethod: paymentMethod || order.paymentMethod || 'Cash on Counter',
        orderNotes: orderNotes || '',
        courier_partner: courierPartner,
        courierPartner: courierPartner,
        tracking_number: trackingNumber.trim(),
        trackingNumber: trackingNumber.trim(),
        tracking_url: trackingUrl.trim(),
        trackingUrl: trackingUrl.trim(),
        shipping_status: shippingStatus,
        shippingStatus: shippingStatus,
        customer: {
          ...order.customer,
          fullName: customerName.trim(),
          mobile: customerMobile.trim(),
          address: customerAddress.trim(),
          city: city.trim() || 'Namakkal',
          pincode: pincode.trim() || '638008',
          landmark: landmark.trim()
        },
        items: items.map(it => ({
          id: it.productId || it.id || 'TB-PRD-AUTO',
          code: it.code || it.productCode || it.product_code || it.productId || it.id || '',
          productCode: it.code || it.productCode || it.product_code || it.productId || it.id || '',
          product_code: it.product_code || it.code || it.productCode || it.productId || it.id || '',
          name: it.name || 'Boutique Saree',
          color: it.color || 'Standard',
          size: it.size || 'Free Size',
          price: Number(it.price) || 0,
          customPrice: Number(it.price) || 0,
          qty: Math.max(1, Number(it.qty) || 1),
          image: it.image || ''
        })),
        pricing: {
          ...order.pricing,
          subtotal: Number(subtotal) || 0,
          deliveryFee: Number(deliveryFee) || 0,
          grandTotal: Number(grandTotal) || 0
        }
      };

      if (updateOrderDetails) {
        await updateOrderDetails(order.orderId, updatedOrder);
      }
      if (showToast) showToast(`Order #${order.orderId} updated successfully! ✓`);
      onClose();
    } catch (err) {
      console.error('Error updating order details:', err);
      if (showToast) showToast('Could not save order updates. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-[#073822] text-white p-5 sm:px-6 flex items-center justify-between border-b border-[#DFBA6D]/30 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-5 h-5 text-gold" />
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg">
                {language === 'ta' ? `ஆர்டர் #${order.orderId} ஐ திருத்து` : `Edit Order #${order.orderId}`}
              </h2>
              <p className="text-[11px] text-stone-300">
                {language === 'ta'
                  ? 'தயாரிப்புகளைச் சேர்க்க, டெலிவரி முகவரியை மாற்ற, தனிப்பயன் விலைகள் & அளவுகளை திருத்தவும்'
                  : 'Add products, edit delivery address, modify custom prices & quantities'}
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
          
          {/* Customer Details & Delivery Address */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#073822] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold" />
              <span>{language === 'ta' ? 'வாடிக்கையாளர் & டெலிவரி முகவரி விவரங்கள்' : 'Customer & Delivery Address Details'}</span>
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
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'மொபைல் எண்' : 'Mobile Number'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'டெலிவரி முகவரி' : 'Delivery Address'} <span className="text-emerald-800 font-bold">({language === 'ta' ? 'வாட்ஸ்அப் / போனில் புதுப்பிக்கப்பட்டது' : 'Updated via WhatsApp / Phone'})</span>
                </label>
                <textarea
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Street address, house/flat #, locality..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'ஊர் / நகரம்' : 'City / Town'}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'அஞ்சல் குறியீடு (Pincode)' : 'Pincode'}
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
          </div>

          {/* Editable Products & Multi-Item Management */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#073822] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-gold" />
                <span>{language === 'ta' ? 'இந்த ஆர்டரில் உள்ள தயாரிப்புகள்' : 'Products in this Order'} ({items.length})</span>
              </h3>
              <span className="text-[11px] text-emerald-800 font-medium">
                {language === 'ta' ? 'மேலும் தயாரிப்புகளைச் சேர்க்கலாம் அல்லது விலையை மாற்றலாம்' : 'Add more products or edit price'}
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const selectedProd = products.find(p => p.id === item.productId);
                const colorOptions = selectedProd?.variants?.map(v => v.colorName) || [item.color];

                return (
                  <div key={item.id || idx} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-gold" /> {language === 'ta' ? `தயாரிப்பு #${idx + 1}` : `Product #${idx + 1}`}
                        </span>
                        {(item.code || item.product_code || item.productId) && (
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 border border-stone-300">
                            #{item.code || item.product_code || item.productId}
                          </span>
                        )}
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="text-stone-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> {language === 'ta' ? 'நீக்கு' : 'Remove'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      
                      {/* Catalog Selector */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {language === 'ta' ? 'தேர்வு / மாற்று' : 'Select / Change'}
                        </label>
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-medium"
                        >
                          <option value="">{language === 'ta' ? 'தனிப்பயன் பொருள்' : 'Custom Item / Hand Picked'}</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              [{p.code || p.id}] {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Product Code */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {language === 'ta' ? 'தயாரிப்பு குறியீடு' : 'Product Code'}
                        </label>
                        <input
                          type="text"
                          value={item.code || item.product_code || ''}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            handleItemChange(idx, 'code', val);
                            handleItemChange(idx, 'product_code', val);
                            handleItemChange(idx, 'productCode', val);
                          }}
                          placeholder="e.g. TB-SAR-001"
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-mono font-semibold uppercase"
                        />
                      </div>

                      {/* Custom Item Name */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {language === 'ta' ? 'தயாரிப்பு பெயர்' : 'Product Title'}
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                        />
                      </div>

                      {/* Color */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {language === 'ta' ? 'வண்ணம்' : 'Color / Variant'}
                        </label>
                        <input
                          type="text"
                          value={item.color}
                          onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                          className="w-full text-xs px-2 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                        />
                      </div>

                      {/* Editable Price */}
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-bold text-primary mb-1">
                          {language === 'ta' ? 'விலை (₹)' : 'Price (₹)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                          className="w-full text-xs px-1.5 py-2 rounded-xl border-2 border-primary/40 focus:border-primary bg-white outline-none font-bold text-stone-900"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {language === 'ta' ? 'எண்ணிக்கை' : 'Qty'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', Math.max(1, Number(e.target.value)))}
                          className="w-full text-xs px-2 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-bold text-center"
                        />
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* + Add Another Product to Existing Order */}
            <button
              type="button"
              onClick={handleAddProduct}
              className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-600 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-emerald-50/50 hover:bg-emerald-50"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>{language === 'ta' ? '+ இந்த ஆர்டரில் மற்றொரு சேலை / பொருளைச் சேர்க்க' : '+ Add Another Product / Saree to this Order'}</span>
            </button>
          </div>

          {/* Status & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'ta' ? 'ஆர்டர் நிலை' : 'Order Status'}
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const s = e.target.value;
                  setStatus(s);
                  if (s === 'Dispatched') setShippingStatus('Dispatched');
                  else if (s === 'Delivered') setShippingStatus('Delivered');
                }}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-medium"
              >
                <option value="Payment Confirmed">{language === 'ta' ? '✅ கட்டணம் உறுதி செய்யப்பட்டது' : '✅ Payment Confirmed'}</option>
                <option value="Dispatched">{language === 'ta' ? '🚚 கூரியரில் அனுப்பப்பட்டது' : '🚚 Dispatched'}</option>
                <option value="Delivered">{language === 'ta' ? '🛍️ டெலிவரி செய்யப்பட்டது' : '🛍️ Delivered'}</option>
                <option value="Pending Verification">{language === 'ta' ? '⏳ சரிபார்ப்பு நிலுவையில் (வலைத்தளம்)' : '⏳ Pending Verification (Website Only)'}</option>
                <option value="Cancelled">{language === 'ta' ? '❌ ரத்து செய்யப்பட்டது' : '❌ Cancelled'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'ta' ? 'ஆர்டர் சேனல்' : 'Order Channel'}
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-medium"
              >
                <option value="whatsapp">{language === 'ta' ? '💬 வாட்ஸ்அப் ஆர்டர்' : '💬 WhatsApp Order'}</option>
                <option value="direct">{language === 'ta' ? '🏬 நேரடி கடை விற்பனை' : '🏬 In-Store / Direct Sale'}</option>
                <option value="site">{language === 'ta' ? '🌐 வலைத்தள ஆர்டர்' : '🌐 Website Order'}</option>
                <option value="manual">{language === 'ta' ? '📞 தொலைபேசி / சிறப்பு' : '📞 Phone / Custom'}</option>
              </select>
            </div>
          </div>

          {/* Courier & Tracking Waybill Section */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border-2 border-primary/20 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="font-serif font-bold text-xs sm:text-sm text-[#073822] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-gold" />
                {language === 'ta' ? 'கூரியர் மற்றும் நேரடி டிராக்கிங் விவரங்கள்' : 'Courier & Tracking Waybill Details'}
              </span>
              <button
                type="button"
                onClick={handleSendWhatsAppNotification}
                disabled={isSendingWhatsApp}
                className="text-[11px] bg-whatsapp hover:bg-whatsapp-dark text-white font-bold px-3 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <Send className="w-3 h-3" />
                <span>{isSendingWhatsApp ? 'Sending...' : 'WhatsApp Tracking Alert'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'கூரியர் நிறுவனம்' : 'Courier Partner'}
                </label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                >
                  <option value="ST Courier">ST Courier</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="The Professional Couriers">The Professional Couriers</option>
                  <option value="India Post Speed Post">India Post Speed Post</option>
                  <option value="DTDC">DTDC</option>
                  <option value="Shiprocket">Shiprocket</option>
                  <option value="Direct Store Pickup">Direct Store Pickup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'டிராக்கிங் / AWB எண்' : 'Tracking / AWB Number'}
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. STC12948201"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'ஷிப்பிங் நிலை' : 'Shipping Status'}
                </label>
                <select
                  value={shippingStatus}
                  onChange={(e) => setShippingStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packed">Packed</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Summary & Save */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <span className="text-xs text-stone-500 font-medium">
                {language === 'ta' ? 'புதுப்பிக்கப்பட்ட மொத்தத் தொகை:' : 'Updated Grand Total:'}
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
                type="submit"
                className="flex-1 sm:flex-initial bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-7 py-3 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-gold" />
                <span>{language === 'ta' ? 'மாற்றங்களை சேமி' : 'Save All Order Changes'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  X, QrCode, Copy, Check, CheckCircle2, AlertCircle, MapPin, Navigation, 
  Loader2, Sparkles, Truck, Info, CreditCard, Smartphone, 
  Lock, ShieldCheck, MessageCircle, Tag, ExternalLink, ChevronRight
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import logoImg from '../assets/logo.jpg';
import arunaQrImg from '../assets/images/aruna_upi_qr.jpg';
import {
  SHOP_LOCATION,
  getBrowserLocation,
  calculateRoadPathDistanceKm,
  getShippingRateForDistance,
  geocodePincodeOrCity
} from '../utils/distanceCalculator';
import { formatTaxInvoiceReceipt } from '../utils/orderInvoiceFormatter';

export const CheckoutModal = () => {
  const {
    cart,
    isCheckoutOpen,
    setIsCheckoutOpen,
    cartSubtotal,
    cartDiscount,
    appliedCoupon,
    availableCoupons,
    applyCoupon,
    removeCoupon,
    couponError,
    deliveryCharge,
    shippingInfo,
    updateShippingByDistance,
    grandTotal,
    recordOrder,
    storeInfo,
    user,
    orders,
    showToast,
    setIsAuthModalOpen,
    language
  } = useStore();

  // Payment Mode: 'upi_qr' (Default: Aruna S QR Scanner) | 'razorpay'
  const [paymentMode, setPaymentMode] = useState('upi_qr');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [checkoutCouponInput, setCheckoutCouponInput] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLocationCaptured, setIsLocationCaptured] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    mobile: user?.phone || '',
    altMobile: '',
    email: user?.email || '',
    address: user?.addresses?.[0]?.address || '',
    city: user?.addresses?.[0]?.city || '',
    pincode: user?.addresses?.[0]?.pincode || '',
    landmark: user?.addresses?.[0]?.landmark || '',
    orderNotes: '',
    agreeTerms: true
  });

  // Sync user info when user logs in or modal opens
  useEffect(() => {
    if (isCheckoutOpen && !user) {
      setIsCheckoutOpen(false);
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      if (showToast) {
        showToast(language === 'ta' ? 'ஆர்டர் செய்ய தயவுசெய்து உள்நுழையவும் ✨' : 'Please sign in to place an order ✨');
      }
      return;
    }
    if (user) {
      const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        mobile: user.phone || prev.mobile,
        email: user.email || prev.email,
        address: defaultAddr?.address || prev.address,
        city: defaultAddr?.city || prev.city,
        pincode: defaultAddr?.pincode || prev.pincode,
        landmark: defaultAddr?.landmark || prev.landmark
      }));
      if (defaultAddr?.pincode) {
        handlePincodeLookup(defaultAddr.pincode, defaultAddr.city);
        setIsLocationCaptured(true);
      }
    }
  }, [user, isCheckoutOpen]);

  // Validate First-Order-Only Coupon when customer phone is entered
  useEffect(() => {
    if (!appliedCoupon) return;
    const isFirstOrderCoupon = Boolean(appliedCoupon.first_order_only);
    if (!isFirstOrderCoupon) return;

    const rawPhone = formData.mobile?.trim();
    if (rawPhone && rawPhone.replace(/\D/g, '').length >= 10) {
      const cleanP = rawPhone.replace(/\D/g, '').slice(-10);
      const hasOrder = (orders || []).some(o => {
        if (o.status === 'Cancelled') return false;
        const oP = String(o.customer?.mobile || o.customer_phone || o.customerPhone || '').replace(/\D/g, '').slice(-10);
        return oP === cleanP;
      });
      if (hasOrder) {
        removeCoupon();
        showToast(language === 'ta'
          ? `கூப்பன் "${appliedCoupon.code}" உங்கள் முதல் ஆர்டருக்கு மட்டுமே செல்லுபடியாகும்.`
          : `Coupon "${appliedCoupon.code}" is valid only on your first order. Past orders found for this mobile number.`);
      }
    }
  }, [formData.mobile, appliedCoupon?.code, orders, language]);

  // Auto-Detect Customer GPS Location & Calculate Exact Distance
  const handleAutoDetectLocation = async () => {
    setIsDetectingLocation(true);
    setFormError('');
    try {
      const userLoc = await getBrowserLocation();
      const distance = calculateRoadPathDistanceKm(
        SHOP_LOCATION.lat,
        SHOP_LOCATION.lng,
        userLoc.lat,
        userLoc.lng
      );
      const rate = getShippingRateForDistance(distance);
      updateShippingByDistance(distance, rate.fee, rate.tier);
      setIsLocationCaptured(true);

      // Reverse geocoding via OpenStreetMap Nominatim
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLoc.lat}&lon=${userLoc.lng}`
        );
        const data = await resp.json();
        if (data && data.address) {
          const addr = data.address;
          const detectedCity = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || '';
          const detectedPin = addr.postcode || '';
          const streetAddr = [
            addr.road,
            addr.suburb,
            addr.neighbourhood,
            addr.residential
          ].filter(Boolean).join(', ');

          setFormData(prev => ({
            ...prev,
            city: detectedCity || prev.city,
            pincode: detectedPin || prev.pincode,
            address: prev.address ? prev.address : streetAddr
          }));
        }
      } catch (geoErr) {
        console.warn('Reverse geocoding notice:', geoErr);
      }

      showToast(`GPS Location detected! Distance: ${distance} km (${rate.tier})`);
    } catch (err) {
      console.warn('Geolocation error:', err);
      showToast(err.message || 'Could not fetch GPS. Please enter your Pincode manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Automatic Pincode Geocoding & Distance Calculation
  const handlePincodeLookup = async (pincode, cityHint = '') => {
    const cleanPin = (pincode || '').replace(/\D/g, '');
    if (cleanPin.length !== 6) return;
    try {
      const coords = await geocodePincodeOrCity(cleanPin, cityHint);
      if (coords) {
        const dist = calculateRoadPathDistanceKm(
          SHOP_LOCATION.lat,
          SHOP_LOCATION.lng,
          coords.lat,
          coords.lng
        );
        const rate = getShippingRateForDistance(dist);
        updateShippingByDistance(dist, rate.fee, rate.tier);
      }
    } catch (err) {
      console.warn('Pincode distance calculation notice:', err);
    }
  };

  // UPI Details for Aruna S
  const UPI_ID = storeInfo.upiId || 'arunasakthivel02@okaxis';
  const UPI_PAYEE_NAME = storeInfo.upiPayeeName || 'Aruna S';
  const RAZORPAY_URL = storeInfo.razorpayUrl || 'https://razorpay.me/@thalirboutique';

  // Copy UPI ID to Clipboard
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    showToast(language === 'ta' ? 'UPI ID நகலெடுக்கப்பட்டது: ' + UPI_ID : 'UPI ID Copied: ' + UPI_ID);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Launch Universal UPI Intent on Mobile (GPay / PhonePe / Paytm / BHIM)
  const handleOpenMobileUpiApp = () => {
    const am = Number(grandTotal).toFixed(2);
    const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${am}&cu=INR&tn=Thalir%20Boutique`;
    window.location.href = upiUri;
  };

  // Process Order & Confirm
  const handleProcessOrder = async (channel = 'site') => {
    // 1. Validation
    if (!formData.fullName.trim() || !formData.mobile.trim() || !formData.address.trim()) {
      const msg = language === 'ta'
        ? 'தயவுசெய்து உங்கள் பெயர், மொபைல் எண் மற்றும் டெலிவரி முகவரியை பூர்த்தி செய்யவும்.'
        : 'Please enter your Full Name, Mobile Number, and Delivery Address.';
      setFormError(msg);
      if (showToast) showToast(msg);
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      const msg = language === 'ta' ? 'தயவுசெய்து செல்லுபடியாகும் 10-இலக்க மொபைல் எண்ணை உள்ளிடவும்.' : 'Please enter a valid 10-digit mobile number.';
      setFormError(msg);
      if (showToast) showToast(msg);
      return;
    }

    const cleanPin = (formData.pincode || '').replace(/\D/g, '');
    if (!cleanPin || cleanPin.length < 6) {
      const msg = language === 'ta' ? 'தயவுசெய்து 6-இலக்க பின்கோடை உள்ளிடவும்.' : 'Please enter your 6-digit Pincode.';
      setFormError(msg);
      if (showToast) showToast(msg);
      return;
    }

    if (!cart || cart.length === 0) {
      if (showToast) showToast(language === 'ta' ? 'ஷாப்பிங் பை காலியாக உள்ளது' : 'Your shopping bag is empty');
      return;
    }

    setFormError('');
    setIsProcessingPayment(true);

    const orderId = `TB-${Date.now().toString().slice(-6)}`;
    const liveKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || storeInfo.razorpayKeyId || 'rzp_live_U3ZuVy8lgIl7IW';

    const executeOrderFinalization = async (paymentRef = '') => {
      const paymentMethodLabel = paymentMode === 'upi_qr' 
        ? 'UPI QR Scanner (Aruna S)' 
        : 'Razorpay Online';

      // Build Complete Confirmed Order Object
      const finalizedOrder = {
        orderId,
        id: orderId,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-GB'),
        customer: {
          fullName: formData.fullName.trim(),
          mobile: cleanMobile.slice(-10),
          altMobile: formData.altMobile ? formData.altMobile.trim() : '',
          email: formData.email ? formData.email.trim() : '',
          address: formData.address.trim(),
          city: formData.city.trim(),
          pincode: cleanPin,
          landmark: formData.landmark ? formData.landmark.trim() : '',
          distance_km: shippingInfo?.distanceKm || null,
          delivery_tier: shippingInfo?.tier || 'Distance Delivery'
        },
        orderNotes: formData.orderNotes || '',
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          color: item.color,
          size: item.size || 'Free Size',
          qty: Number(item.qty || 1),
          price: Number(item.price),
          image: item.image,
          code: item.code || item.productCode || item.id
        })),
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        discount_amount: cartDiscount || 0,
        pricing: {
          subtotal: cartSubtotal,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          discountAmount: cartDiscount || 0,
          deliveryCharge,
          deliveryFee: deliveryCharge,
          shippingFee: deliveryCharge,
          distanceKm: shippingInfo?.distanceKm || null,
          grandTotal
        },
        paymentMethod: paymentMethodLabel,
        payment_method: paymentMethodLabel,
        paymentProof: paymentRef || (paymentMode === 'upi_qr' ? `UPI to ${UPI_ID}` : 'Razorpay Verified'),
        razorpay_payment_id: paymentMode === 'razorpay' ? paymentRef : null,
        channel,
        status: 'Payment Confirmed', // Auto-confirm order with admin!
        is_stock_deducted: true     // Deduct stock properly!
      };

      // 1. Deduct Stock & Record Confirmed Order in Store Context & Django DB
      await recordOrder(finalizedOrder);

      // 2. Auto-notify Admin on WhatsApp with full order details
      try {
        await api.sendWhatsAppNotification({
          phone: storeInfo.whatsappNumber || '916382218590',
          order_id: orderId,
          customer_name: formData.fullName,
          amount: grandTotal,
          tracking_url: `${window.location.origin}/orders/${orderId}`,
          event_type: 'order_confirmed'
        });
      } catch (e) {
        console.warn('Admin WA notice status:', e);
      }

      // 3. If ordered via WhatsApp, also trigger direct customer chat with invoice
      if (channel === 'whatsapp') {
        const taxInvoiceMsg = formatTaxInvoiceReceipt(finalizedOrder, {
          phone: storeInfo.phone || '+91 6382218590',
          paymentStatus: paymentMode === 'upi_qr' 
            ? `UPI Paid to ${UPI_ID} (Auto-Confirmed)` 
            : 'Prepaid via Razorpay (Auto-Confirmed)'
        });
        const waUrl = `https://wa.me/${storeInfo.whatsappNumber}?text=${encodeURIComponent(taxInvoiceMsg)}`;
        window.open(waUrl, '_blank');
      }

      // 4. Trigger celebratory confetti
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}

      setIsProcessingPayment(false);
    };

    // If channel is WhatsApp, finalize directly
    if (channel === 'whatsapp') {
      await executeOrderFinalization('WhatsApp Order');
      return;
    }

    // IF RAZORPAY MODE IS SELECTED:
    if (paymentMode === 'razorpay') {
      if (typeof window !== 'undefined' && window.Razorpay) {
        try {
          const rzpOptions = {
            key: liveKeyId,
            amount: Math.round(grandTotal * 100), // in paise
            currency: 'INR',
            name: 'Thalir Boutique',
            description: `Order #${orderId} - ${cart.length} Saree(s)`,
            image: logoImg,
            prefill: {
              name: formData.fullName.trim(),
              contact: cleanMobile.slice(-10),
              email: formData.email ? formData.email.trim() : ''
            },
            notes: {
              order_id: orderId,
              address: formData.address.trim(),
              city: formData.city.trim(),
              pincode: cleanPin
            },
            theme: {
              color: '#0b3b24'
            },
            modal: {
              ondismiss: function() {
                setIsProcessingPayment(false);
              }
            },
            handler: async function (response) {
              await executeOrderFinalization(response.razorpay_payment_id || 'RZP_PAID');
            }
          };

          const rzpInstance = new window.Razorpay(rzpOptions);
          rzpInstance.on('payment.failed', function (resp) {
            setIsProcessingPayment(false);
            const errDesc = resp?.error?.description || 'Transaction unsuccessful';
            setFormError(`Payment failed: ${errDesc}`);
            if (showToast) showToast(`Payment failed: ${errDesc}`);
          });

          rzpInstance.open();
          return;
        } catch (sdkErr) {
          console.warn('Razorpay SDK modal error, fallback to direct link:', sdkErr);
        }
      }
      window.open(RAZORPAY_URL, '_blank');
      await executeOrderFinalization('Direct Razorpay Link');
      return;
    }

    // IF UPI QR SCANNER (ARUNA S) MODE IS SELECTED:
    // 1-tap confirm order & deduct stock
    await executeOrderFinalization(`UPI Scanned: ${UPI_ID}`);
  };

  if (!isCheckoutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 my-auto overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[95vh]">
        
        {/* Header - Classic Boutique Green Branding */}
        <div className="bg-[#0b3b24] text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="Thalir Boutique Logo" 
              className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover shadow-xs"
            />
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{language === 'ta' ? 'தளிர்ப் பொட்டிக் செக்அவுட்' : 'Boutique Checkout & UPI Payment'}</span>
              </h2>
              <p className="text-[11px] text-emerald-200 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'ta' ? '100% பாதுகாப்பான & சரிபார்க்கப்பட்ட ஆர்டர்' : '100% Safe & Verified Order'}</span>
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setIsCheckoutOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-stone-800 text-sm">
          
          {/* Error Message */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Ordered Products List */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 uppercase tracking-wider">
              <span>{language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட ஆடைகள்' : 'Order Items'} ({cart.length})</span>
              <span className="text-[#0b3b24] font-semibold">Thalir Boutique</span>
            </div>
            
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-stone-200 shadow-xs">
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c'} 
                    alt={item.name} 
                    className="w-14 h-16 object-cover rounded-lg border border-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-stone-900 text-xs sm:text-sm truncate">{item.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                      {item.color && (
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                          {item.color}
                        </span>
                      )}
                      {item.size && (
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                          Size: {item.size}
                        </span>
                      )}
                      <span className="text-stone-400">Qty: {item.qty}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-[#0b3b24] text-sm">
                      ₹{(Number(item.price) * Number(item.qty)).toLocaleString('en-IN')}
                    </div>
                    {item.qty > 1 && (
                      <div className="text-[10px] text-stone-400">₹{Number(item.price).toLocaleString('en-IN')} each</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Customer Delivery Address Form */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0b3b24]" />
                <span>{language === 'ta' ? 'டெலிவரி முகவரி விவரங்கள்' : 'Delivery Address Details'}</span>
              </h3>
              
              {/* GPS Auto-Detect Button */}
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetectingLocation}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0b3b24] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                {isDetectingLocation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-[#0b3b24]" />
                )}
                <span>{isDetectingLocation ? 'Detecting...' : 'Auto-Detect GPS'}</span>
              </button>
            </div>

            {/* Address Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  {language === 'ta' ? 'முழுப் பெயர் *' : 'Full Name *'}
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Sudhi / Priyanga"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#0b3b24] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  {language === 'ta' ? '10-இலக்க மொபைல் எண் *' : '10-Digit Mobile Number *'}
                </label>
                <input 
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 6382218590"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#0b3b24] focus:outline-hidden font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-600 font-semibold mb-1">
                  {language === 'ta' ? 'வீட்டு எண் / தெரு / பகுதி *' : 'House / Flat No, Street, Area *'}
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 5/797, NC Colony, Kumarapalayam Main Road"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#0b3b24] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  {language === 'ta' ? 'ஊர் / நகரம் *' : 'City / Town *'}
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Veppadai / Namakkal / Erode"
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    if (formData.pincode && formData.pincode.length === 6) {
                      handlePincodeLookup(formData.pincode, e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#0b3b24] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  {language === 'ta' ? '6-இலக்க பின்கோடு *' : '6-Digit Pincode *'}
                </label>
                <input 
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 638008"
                  value={formData.pincode}
                  onChange={(e) => {
                    const pin = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, pincode: pin });
                    if (pin.length === 6) {
                      handlePincodeLookup(pin, formData.city);
                    }
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#0b3b24] focus:outline-hidden font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-600 font-semibold mb-1">
                  {language === 'ta' ? 'அடையாளக் குறி / Landmark (விருப்பமானது)' : 'Landmark (Optional)'}
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Near Bus Stop / Opposite Temple"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#0b3b24] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Distance / Shipping Rate Badge */}
            {shippingInfo?.distanceKm && (
              <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 px-3 py-2 rounded-xl text-xs text-emerald-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>Road Distance: <strong>{shippingInfo.distanceKm} km</strong> from Veppadai Boutique</span>
                </span>
                <span className="font-bold text-[#0b3b24]">
                  {deliveryCharge === 0 ? 'FREE DELIVERY' : `₹${deliveryCharge} Shipping`}
                </span>
              </div>
            )}
          </div>

          {/* 3. Coupon Code Section */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="ENTER COUPON CODE (e.g. WELCOME10)"
                  value={checkoutCouponInput}
                  onChange={(e) => setCheckoutCouponInput(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase font-mono font-bold focus:border-[#0b3b24] focus:outline-hidden"
                />
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (!checkoutCouponInput.trim()) return;
                  applyCoupon(checkoutCouponInput.trim(), formData.mobile);
                  setCheckoutCouponInput('');
                }}
                className="bg-[#0b3b24] hover:bg-[#072617] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-medium">
                <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-₹{cartDiscount})</span>
                <button 
                  type="button" 
                  onClick={removeCoupon}
                  className="text-emerald-700 hover:text-red-700 underline font-bold"
                >
                  Remove
                </button>
              </div>
            )}

            {couponError && (
              <p className="text-red-600 text-[11px] font-medium">{couponError}</p>
            )}
          </div>

          {/* 4. Payment Method Tabs: UPI QR Scanner (Default) & Razorpay */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              {language === 'ta' ? 'கட்டண முறை' : 'Payment Method'}
            </label>

            {/* Payment Method Switcher Tabs */}
            <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMode('upi_qr')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  paymentMode === 'upi_qr' 
                    ? 'bg-[#0b3b24] text-white shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Scan & Pay via UPI (Aruna S)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('razorpay')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  paymentMode === 'razorpay' 
                    ? 'bg-[#0c2340] text-white shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Razorpay (Cards / NetBanking)</span>
              </button>
            </div>

            {/* TAB A: ARUNA S UPI QR SCANNER (MATCHING UPLOADED IMAGE) */}
            {paymentMode === 'upi_qr' && (
              <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-4 sm:p-5 shadow-md space-y-4 animate-in fade-in duration-150">
                
                {/* Header Strip with Aruna S Avatar */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#345c7d] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      A
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm leading-tight">Aruna S</h4>
                      <p className="text-[11px] text-emerald-700 font-semibold">Official UPI QR Scanner</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">Payable Amount</div>
                    <div className="text-base font-extrabold text-[#0b3b24]">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* QR Code Card View */}
                <div className="flex flex-col items-center justify-center space-y-3 py-1">
                  <div className="bg-white p-3 rounded-2xl border-2 border-stone-200 shadow-md relative group">
                    <img 
                      src={arunaQrImg} 
                      alt="Aruna S UPI QR Scanner" 
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                    />
                  </div>

                  <p className="text-xs font-semibold text-stone-600">
                    Scan to pay with any UPI app
                  </p>

                  {/* UPI ID Strip with 1-Tap Copy */}
                  <div className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200/80 transition-colors px-3.5 py-2 rounded-xl border border-stone-200 max-w-sm w-full justify-between">
                    <div className="flex items-center gap-2 truncate text-xs">
                      <span className="text-stone-400 font-medium">UPI ID:</span>
                      <strong className="font-mono text-stone-900 select-all">{UPI_ID}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-[#0b3b24] bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Direct UPI Intent Button */}
                <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleOpenMobileUpiApp}
                    className="flex-1 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-800 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>Pay with GPay / PhonePe / Paytm</span>
                  </button>
                </div>

                {/* Accepted App Badges */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] text-stone-500 font-medium">
                  <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700">Google Pay</span>
                  <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700">PhonePe</span>
                  <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700">Paytm</span>
                  <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700">BHIM</span>
                  <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700">super.money</span>
                  <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700">Navi</span>
                </div>
              </div>
            )}

            {/* TAB B: RAZORPAY ONLINE CARD */}
            {paymentMode === 'razorpay' && (
              <div className="bg-linear-to-br from-[#0c2340] to-[#07192d] text-white p-4 sm:p-5 rounded-2xl border-2 border-sky-500/40 shadow-lg relative overflow-hidden animate-in fade-in duration-150">
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-300">
                        Razorpay Trusted Partner
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                      <span>Razorpay Secure Payment</span>
                      <Lock className="w-4 h-4 text-amber-400" />
                    </h4>
                    <p className="text-xs text-sky-100/80 leading-relaxed max-w-md">
                      Instant checkout with Cards (Credit/Debit), NetBanking, and Wallets.
                    </p>
                  </div>

                  <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-right shrink-0">
                    <div className="text-[10px] text-sky-200">Official Link</div>
                    <div className="font-mono text-xs font-bold text-amber-300">@thalirboutique</div>
                  </div>
                </div>

                {/* Supported Payment Logos strip */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-sky-200">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px]">Cards</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px]">NetBanking</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px]">UPI</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 5. Order Pricing Breakdown */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between text-stone-600">
              <span>{language === 'ta' ? 'மொத்த ஆடை விலை' : 'Items Subtotal'}</span>
              <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>
            
            {cartDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>{language === 'ta' ? 'கூப்பன் தள்ளுபடி' : 'Coupon Discount'} ({appliedCoupon?.code})</span>
                <span>-₹{cartDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>{language === 'ta' ? 'டெலிவரி கட்டணம்' : 'Delivery / Courier Fee'}</span>
              <span>{deliveryCharge === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryCharge}`}</span>
            </div>

            <div className="flex justify-between font-extrabold text-sm sm:text-base text-stone-900 pt-2 border-t border-stone-200">
              <span>{language === 'ta' ? 'செலுத்த வேண்டிய மொத்தத் தொகை' : 'Grand Total Payable'}</span>
              <span className="text-[#0b3b24]">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions Sticky Bar */}
        <div className="bg-white border-t border-stone-200 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="text-left w-full sm:w-auto">
            <div className="text-xs text-stone-400 font-medium">
              {language === 'ta' ? 'மொத்தத் தொகை' : 'Total Amount'}
            </div>
            <div className="text-xl font-black text-[#0b3b24]">
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* WhatsApp Alternative Order Button */}
            <button
              type="button"
              onClick={() => handleProcessOrder('whatsapp')}
              disabled={isProcessingPayment}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xs transition-colors cursor-pointer"
              title="Order & Send on WhatsApp"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
            </button>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleProcessOrder('site')}
              disabled={isProcessingPayment}
              className={`flex-1 sm:flex-none active:scale-[0.98] text-white font-extrabold py-3.5 px-7 rounded-2xl text-sm sm:text-base shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                paymentMode === 'upi_qr'
                  ? 'bg-[#0b3b24] hover:bg-[#072617] border border-emerald-400/30'
                  : 'bg-[#0c2340] hover:bg-[#07192d] border border-sky-400/30'
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Confirming Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>
                    {paymentMode === 'upi_qr' 
                      ? `I Have Paid ₹${grandTotal.toLocaleString('en-IN')} - Confirm Order` 
                      : `Pay ₹${grandTotal.toLocaleString('en-IN')} with Razorpay`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, QrCode, Copy, Check, Upload, Trash2, MessageCircle, 
  ShieldCheck, CheckCircle2, AlertCircle, MapPin, Navigation, 
  Loader2, Sparkles, Truck, Info, CreditCard, Smartphone, Banknote,
  ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Lock, Share2, Tag
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import logoImg from '../assets/logo.jpg';
import arunaQrImg from '../assets/images/media_1791352967848.jpg';
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

  // Step 1: Review Order & Delivery Address | Step 2: Payment Method (Meesho Flow)
  const [checkoutStep, setCheckoutStep] = useState(2);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [showPriceDetailsDrawer, setShowPriceDetailsDrawer] = useState(false);

  // Payment Selection: 'online' | 'qr' | 'cod'
  const [paymentMode, setPaymentMode] = useState('online');

  // Direct UPI App Selection: 'gpay' | 'phonepe' | 'paytm' | 'super_money' | 'navi' | 'more'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [showMoreUpiApps, setShowMoreUpiApps] = useState(false);

  const [checkoutCouponInput, setCheckoutCouponInput] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLocationCaptured, setIsLocationCaptured] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Cash on Delivery (COD) OTP Verification State
  const [codOtp, setCodOtp] = useState('');
  const [isCodOtpSent, setIsCodOtpSent] = useState(false);
  const [isCodOtpVerified, setIsCodOtpVerified] = useState(false);
  const [codSendingOtp, setCodSendingOtp] = useState(false);
  const [codVerifyingOtp, setCodVerifyingOtp] = useState(false);
  const [codOtpFeedback, setCodOtpFeedback] = useState('');

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
    upiUtr: '',
    agreeTerms: true
  });

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [screenshotProof, setScreenshotProof] = useState(null);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

  // Sync user info if user logs in
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
      // If no address saved, open Step 1 address form first
      if (!defaultAddr?.address) {
        setCheckoutStep(1);
        setIsEditingAddress(true);
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

  // Auto-Detect Customer GPS Location & Calculate Distance
  const handleAutoDetectLocation = async () => {
    setIsDetectingLocation(true);
    setFormError('');
    try {
      const coords = await getBrowserLocation();
      const distanceKm = await calculateRoadPathDistanceKm(
        SHOP_LOCATION.lat,
        SHOP_LOCATION.lng,
        coords.lat,
        coords.lng
      );

      updateShippingByDistance(distanceKm, { coords });
      setIsLocationCaptured(true);
      const rateInfo = getShippingRateForDistance(distanceKm);
      if (showToast) showToast(language === 'ta' ? `இருப்பிடம் உறுதி செய்யப்பட்டது! டெலிவரி கட்டணம் (₹${rateInfo.rate}) கணக்கிடப்பட்டது. ✓` : `Location verified! Delivery fee (₹${rateInfo.rate}) calculated. ✓`);
    } catch (err) {
      console.warn('GPS location error:', err);
      if (showToast) showToast(language === 'ta' ? 'இருப்பிடத்தை கண்டறிய முடியவில்லை. தயவுசெய்து பின்கோடை உள்ளிடவும்.' : (err.message || 'Could not detect location. Please enter your Pincode.'));
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Pincode / City Real-time Distance Calculator
  const handlePincodeLookup = async (pin, city) => {
    const cleanPin = pin ? pin.trim().replace(/\D/g, '') : '';
    if (cleanPin.length === 6 || (city && city.trim().length >= 3)) {
      const res = await geocodePincodeOrCity(cleanPin, city);
      if (res && res.rate !== undefined) {
        updateShippingByDistance(res.distanceKm, {
          resolvedPlace: res.resolvedPlace || (city ? `${city} (${cleanPin})` : `PIN: ${cleanPin}`)
        });
        setIsLocationCaptured(true);
      }
    }
  };

  if (!isCheckoutOpen) return null;

  // Copy UPI ID
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeInfo.upiId || 'arunasakthivel02@okaxis');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Share Aruna S QR Code via Web Share API
  const handleShareQr = async () => {
    const upiLink = `upi://pay?pa=${storeInfo.upiId || 'arunasakthivel02@okaxis'}&pn=${encodeURIComponent(storeInfo.upiPayeeName || 'Aruna S')}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('Thalir Boutique Order')}`;
    const shareText = `Pay ₹${grandTotal} to Thalir Boutique (Aruna S) via UPI ID: ${storeInfo.upiId || 'arunasakthivel02@okaxis'}\nLink: ${upiLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Thalir Boutique UPI QR',
          text: shareText
        });
      } catch (e) {}
    } else {
      navigator.clipboard?.writeText(shareText);
      if (showToast) showToast(language === 'ta' ? 'கட்டண விவரங்கள் நகலெடுக்கப்பட்டது! நண்பர்களுடன் பகிரவும்.' : 'Payment details copied! Share with friends to pay.');
    }
  };

  // Screenshot File Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setScreenshotProof({
        name: file.name,
        dataUrl: uploadEvent.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotProof(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send COD OTP
  const handleSendCodOtp = async () => {
    const rawP = (formData.mobile || '').replace(/\D/g, '');
    if (rawP.length < 10) {
      setCodOtpFeedback(language === 'ta' ? 'தயவுசெய்து சரியான 10-இலக்க மொபைல் எண்ணை உள்ளிடவும்' : 'Please enter a valid 10-digit mobile number');
      return;
    }
    setCodSendingOtp(true);
    setCodOtpFeedback('');
    try {
      const res = await api.sendCodOtp(rawP);
      setIsCodOtpSent(true);
      if (res.demo_otp) {
        setCodOtp(res.demo_otp);
        setCodOtpFeedback(language === 'ta' ? `சரிபார்ப்புக் குறியீடு அனுப்பப்பட்டது! (Demo Code: ${res.demo_otp})` : `OTP sent! (Demo Code: ${res.demo_otp})`);
      } else {
        setCodOtpFeedback(language === 'ta' ? 'சரிபார்ப்புக் குறியீடு உங்கள் மொபைலுக்கு SMS மூலம் அனுப்பப்பட்டது!' : 'Verification OTP sent to your mobile via SMS!');
      }
    } catch (err) {
      setCodOtpFeedback(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setCodSendingOtp(false);
    }
  };

  // Verify COD OTP
  const handleVerifyCodOtp = async () => {
    if (!codOtp || codOtp.trim().length < 4) {
      setCodOtpFeedback(language === 'ta' ? '4-இலக்க சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்' : 'Please enter the 4-digit OTP code');
      return;
    }
    setCodVerifyingOtp(true);
    try {
      const res = await api.verifyCodOtp(formData.mobile, codOtp.trim());
      if (res.verified) {
        setIsCodOtpVerified(true);
        setCodOtpFeedback(language === 'ta' ? '✓ மொபைல் எண் வெற்றிகரமாக சரிபார்க்கப்பட்டது!' : '✓ Phone verified successfully for Cash on Delivery!');
      }
    } catch (err) {
      setCodOtpFeedback(err.message || 'Incorrect OTP code');
    } finally {
      setCodVerifyingOtp(false);
    }
  };

  // Direct UPI Intent Generator for GPay, PhonePe, Paytm, super.money, Navi
  const getUpiIntentUrl = (appId, amount, orderId) => {
    const pa = storeInfo.upiId || 'arunasakthivel02@okaxis';
    const pn = encodeURIComponent(storeInfo.upiPayeeName || 'Aruna S');
    const am = Number(amount).toFixed(2);
    const tn = encodeURIComponent(`Thalir Boutique #${orderId}`);
    const upiQuery = `pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}&tr=${orderId}`;

    const isAndroid = /android/i.test(navigator.userAgent || '');

    switch (appId) {
      case 'gpay':
        return isAndroid 
          ? `intent://pay?${upiQuery}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
          : `tez://upi/pay?${upiQuery}`;
      case 'phonepe':
        return isAndroid 
          ? `intent://pay?${upiQuery}#Intent;scheme=upi;package=com.phonepe.app;end`
          : `phonepe://pay?${upiQuery}`;
      case 'paytm':
        return isAndroid 
          ? `intent://pay?${upiQuery}#Intent;scheme=upi;package=net.one97.paytm;end`
          : `paytmmp://pay?${upiQuery}`;
      case 'super_money':
        return isAndroid 
          ? `intent://pay?${upiQuery}#Intent;scheme=upi;package=com.supermoney.app;end`
          : `upi://pay?${upiQuery}`;
      case 'navi':
        return isAndroid 
          ? `intent://pay?${upiQuery}#Intent;scheme=upi;package=com.naviapp;end`
          : `upi://pay?${upiQuery}`;
      default:
        return `upi://pay?${upiQuery}`;
    }
  };

  // Main Meesho "Pay Now" Handler: Launches App Directly & Auto-Confirms Order with Admin
  const handlePayNow = async (channel = 'site') => {
    // 1. Validate Delivery Address
    if (!formData.fullName.trim() || !formData.mobile.trim() || !formData.address.trim()) {
      const msg = language === 'ta'
        ? 'தயவுசெய்து உங்கள் பெயர், மொபைல் எண் மற்றும் டெலிவரி முகவரியை பூர்த்தி செய்யவும்.'
        : 'Please complete your Full Name, Mobile Number, and Delivery Address.';
      setFormError(msg);
      if (showToast) showToast(msg);
      setCheckoutStep(1);
      setIsEditingAddress(true);
      return;
    }

    const cleanPin = (formData.pincode || '').replace(/\D/g, '');
    if (!cleanPin || cleanPin.length < 6) {
      const msg = language === 'ta' ? 'தயவுசெய்து 6-இலக்க பின்கோடை உள்ளிடவும்.' : 'Please enter your 6-digit Pincode.';
      setFormError(msg);
      if (showToast) showToast(msg);
      setCheckoutStep(1);
      setIsEditingAddress(true);
      return;
    }

    if (!cart || cart.length === 0) {
      if (showToast) showToast(language === 'ta' ? 'ஷாப்பிங் பை காலியாக உள்ளது' : 'Your shopping bag is empty');
      return;
    }

    setFormError('');

    // 2. Handle Cash on Delivery Flow
    if (paymentMode === 'cod') {
      if (!isCodOtpVerified) {
        const msg = language === 'ta'
          ? '⚠️ COD ஆர்டருக்கு உங்கள் மொபைல் எண்ணை SMS OTP மூலம் சரிபார்க்கவும்.'
          : '⚠️ Please verify your phone number with SMS OTP for Cash on Delivery.';
        setFormError(msg);
        if (showToast) showToast(msg);
        return;
      }
      setIsProcessingPayment(true);
      const orderId = `TB-${Date.now().toString().slice(-6)}`;
      const codOrder = {
        orderId,
        timestamp: new Date().toISOString(),
        customer: {
          fullName: formData.fullName,
          mobile: formData.mobile,
          altMobile: formData.altMobile,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          landmark: formData.landmark,
          distance_km: shippingInfo?.distanceKm || null,
          delivery_tier: shippingInfo?.tier || 'Distance Delivery'
        },
        orderNotes: formData.orderNotes,
        items: [...cart],
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
        paymentMethod: 'Cash on Delivery',
        codVerified: true,
        paymentProof: 'COD (SMS Phone Verified)',
        paymentProofImage: null,
        channel,
        status: 'Pending Verification'
      };
      finishOrder(codOrder, channel);
      return;
    }

    // 3. Handle Pay Online (GPay / PhonePe / Paytm / super.money / Navi / Aruna S QR)
    setIsProcessingPayment(true);
    const orderId = `TB-${Date.now().toString().slice(-6)}`;
    const appLabels = {
      gpay: 'Google Pay (GPay)',
      phonepe: 'PhonePe',
      paytm: 'Paytm UPI',
      super_money: 'super.money UPI',
      navi: 'Navi UPI',
      more: 'Online UPI Payment'
    };
    const paymentMethodLabel = paymentMode === 'qr'
      ? 'Aruna S QR Scanner'
      : (appLabels[selectedUpiApp] || 'Pay Online UPI');

    const finalizedOrder = {
      orderId,
      timestamp: new Date().toISOString(),
      customer: {
        fullName: formData.fullName,
        mobile: formData.mobile,
        altMobile: formData.altMobile,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        landmark: formData.landmark,
        distance_km: shippingInfo?.distanceKm || null,
        delivery_tier: shippingInfo?.tier || 'Distance Delivery'
      },
      orderNotes: formData.orderNotes,
      items: [...cart],
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
      paymentProof: screenshotProof ? screenshotProof.name : (formData.upiUtr ? `UTR: ${formData.upiUtr}` : `Auto-Confirmed via ${paymentMethodLabel}`),
      paymentProofImage: screenshotProof ? screenshotProof.dataUrl : null,
      paymentUtr: formData.upiUtr || '',
      channel,
      status: 'Payment Confirmed' // Automatically confirms order with admin!
    };

    // Auto-record order in Django DB and Admin Orders
    await recordOrder(finalizedOrder);

    // Auto-notify admin on WhatsApp
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

    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    // Construct and launch direct app intent on mobile
    if (paymentMode === 'online') {
      const intentUrl = getUpiIntentUrl(selectedUpiApp, grandTotal, orderId);
      try {
        const link = document.createElement('a');
        link.href = intentUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.warn('App intent launch notice:', err);
      }
    }

    if (channel === 'whatsapp') {
      const taxInvoiceMsg = formatTaxInvoiceReceipt(finalizedOrder, {
        phone: storeInfo.phone || '+91 6382218590',
        paymentStatus: 'Prepaid (Auto-Confirmed)'
      });
      const waUrl = `https://wa.me/${storeInfo.whatsappNumber}?text=${encodeURIComponent(taxInvoiceMsg)}`;
      window.open(waUrl, '_blank');
    }

    setIsProcessingPayment(false);
  };

  const finishOrder = (orderRecord, channel) => {
    setIsProcessingPayment(false);
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    if (channel === 'whatsapp') {
      const taxInvoiceMsg = formatTaxInvoiceReceipt(orderRecord, {
        phone: storeInfo.phone || '+91 6382218590',
        paymentStatus: orderRecord.paymentMethod === 'Cash on Delivery' 
          ? 'Cash on Delivery (OTP Verified)' 
          : 'Prepaid (Auto-Confirmed)'
      });
      const fullWaMessage = `${taxInvoiceMsg}\n\n*Payment Mode:* ${orderRecord.paymentMethod}\n*Order ID:* #${orderRecord.orderId}`;
      const waUrl = `https://wa.me/${storeInfo.whatsappNumber}?text=${encodeURIComponent(fullWaMessage)}`;
      recordOrder(orderRecord);
      window.open(waUrl, '_blank');
    } else {
      recordOrder(orderRecord);
    }
  };

  // UPI Apps Configuration (matching Meesho screenshots)
  const UPI_APPS = [
    {
      id: 'gpay',
      name: 'Google Pay',
      subtitle: 'Pay directly via GPay app',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-bold text-xs shadow-2xs">
          <span className="text-[#4285F4]">G</span>
          <span className="text-[#EA4335]">P</span>
          <span className="text-[#FBBC05]">a</span>
          <span className="text-[#34A853]">y</span>
        </div>
      )
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      subtitle: 'Pay directly via PhonePe app',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#5f259f] flex items-center justify-center text-white font-bold text-xs shadow-2xs">
          पे
        </div>
      )
    },
    {
      id: 'paytm',
      name: 'Paytm UPI',
      subtitle: 'Pay directly via Paytm app',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#00baf2] flex items-center justify-center text-white font-black text-[10px] shadow-2xs">
          paytm
        </div>
      )
    },
    {
      id: 'super_money',
      name: 'super.money UPI',
      subtitle: 'Flat 5% cashback on super.money',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#5832a8] flex items-center justify-center text-white font-black text-xs shadow-2xs">
          ⚡
        </div>
      )
    },
    {
      id: 'navi',
      name: 'Navi UPI',
      subtitle: 'Pay directly via Navi app',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#0066f5] flex items-center justify-center text-white font-black text-[10px] tracking-tight shadow-2xs">
          navi
        </div>
      )
    }
  ];

  const onlineDiscount = cartDiscount > 0 ? cartDiscount : 20;
  const originalCodTotal = cartSubtotal + deliveryCharge;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Main Meesho Checkout Card Container */}
      <div 
        id="checkout-scroll-container" 
        className="bg-[#f8f9fa] w-full max-w-lg min-h-screen sm:min-h-0 sm:max-h-[92vh] sm:rounded-3xl shadow-2xl flex flex-col relative overflow-y-auto pb-24"
      >
        
        {/* Top Header Bar (Meesho Step Indicator) */}
        <div className="sticky top-0 z-30 bg-white px-4 py-3.5 border-b border-stone-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            {checkoutStep === 2 && (
              <button
                type="button"
                onClick={() => setCheckoutStep(1)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
                title="Back to Review"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-bold text-sm sm:text-base text-stone-900 tracking-tight uppercase">
              {checkoutStep === 1 
                ? (language === 'ta' ? 'ஆர்டரை சரிபார்க்கவும்' : 'REVIEW YOUR ORDER')
                : (language === 'ta' ? 'கட்டண முறை' : 'PAYMENT METHOD')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              STEP {checkoutStep}/2
            </span>
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wavy Mint Savings Banner (Matching Meesho Screenshot) */}
        <div className="bg-[#e6f7f2] border-b border-[#a8ebd5] py-2 px-4 text-center text-[#03855a] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#03855a]" />
          <span>
            {language === 'ta'
              ? `இந்த ஆர்டரில் ₹${onlineDiscount} தள்ளுபடி!`
              : `₹${onlineDiscount} OFF on this order`}
          </span>
        </div>

        {/* Form Error Alert */}
        {formError && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 space-y-3.5">
          
          {/* STEP 1: REVIEW YOUR ORDER & DELIVERY ADDRESS */}
          {checkoutStep === 1 ? (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              
              {/* Product Items Summary Card */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                <div className="font-bold text-xs text-stone-900 border-b border-stone-100 pb-2 flex items-center justify-between">
                  <span>{language === 'ta' ? 'ஆர்டர் உருப்படிகள்' : 'Items in Bag'} ({cart.length})</span>
                  <span className="text-stone-500 font-normal text-[11px]">Sold by: {storeInfo.name}</span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.cartItemId} className="flex gap-3 items-center text-xs">
                      <img src={item.image} alt={item.name} className="w-12 h-14 rounded-lg object-cover bg-stone-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-stone-500">
                          {item.color} {item.size && `• Size: ${item.size}`} • Qty: {item.qty}
                        </div>
                        <div className="text-xs font-bold text-[#073822] mt-0.5">
                          ₹{(item.price * item.qty).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address Card with 1-Click Toggle */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-stone-900">
                      {language === 'ta' ? 'டெலிவரி முகவரி' : 'Estimated Delivery Address'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-xs font-bold text-[#9c1f60] hover:text-[#82144e] border border-[#9c1f60]/30 px-2.5 py-0.5 rounded-lg cursor-pointer"
                  >
                    {isEditingAddress ? 'Done' : 'Change'}
                  </button>
                </div>

                {!isEditingAddress && formData.address ? (
                  <div className="text-xs text-stone-700 space-y-1">
                    <div className="font-bold text-stone-900 text-sm">
                      {formData.fullName || 'Customer'} • <span className="font-mono">{formData.mobile}</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      {formData.address}, {formData.city} - <strong className="font-mono text-stone-900">{formData.pincode}</strong>
                    </p>
                    {formData.landmark && (
                      <p className="text-[11px] text-stone-500">Near: {formData.landmark}</p>
                    )}
                  </div>
                ) : (
                  /* Editable Address Inputs */
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-700">Enter Delivery Details</span>
                      <button
                        type="button"
                        onClick={handleAutoDetectLocation}
                        disabled={isDetectingLocation}
                        className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        {isDetectingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3 text-emerald-700" />}
                        <span>Auto-Detect GPS</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Full Name *"
                        className="text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        required
                      />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="10-Digit Mobile *"
                        className="text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white font-mono"
                        required
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="House / Flat No, Street, Area *"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      required
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City / Town *"
                        className="text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        required
                      />
                      <input
                        type="text"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, pincode: val });
                          handlePincodeLookup(val, formData.city);
                        }}
                        placeholder="6-Digit Pincode *"
                        className="text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white font-mono font-bold"
                        required
                      />
                    </div>

                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="Landmark (Optional)"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Coupon Section */}
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={checkoutCouponInput}
                    onChange={(e) => setCheckoutCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code"
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (checkoutCouponInput.trim()) {
                        await applyCoupon(checkoutCouponInput.trim(), formData.mobile);
                      }
                    }}
                    className="bg-[#9c1f60] hover:bg-[#82144e] text-white font-bold px-3 py-2 rounded-lg text-xs cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <span>🎟️ {appliedCoupon.code} Applied (Saved ₹{cartDiscount})</span>
                    <button type="button" onClick={removeCoupon} className="text-red-600 underline">Remove</button>
                  </div>
                )}
              </div>

              {/* Continue to Payment Method Button */}
              <button
                type="button"
                onClick={() => {
                  if (!formData.fullName.trim() || !formData.mobile.trim() || !formData.address.trim()) {
                    setFormError('Please enter Full Name, Mobile Number, and Address to continue.');
                    return;
                  }
                  setFormError('');
                  setCheckoutStep(2);
                }}
                className="w-full bg-[#9c1f60] hover:bg-[#82144e] text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Payment</span>
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>
          ) : (
            /* STEP 2: PAYMENT METHOD (MEESHO STYLE SCREENSHOTS) */
            <div className="space-y-3 animate-in fade-in duration-200">
              
              {/* Delivery Address Header Strip with [Change] Button */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs shadow-2xs">
                <div className="truncate pr-2">
                  <span className="text-stone-500">Deliver to: </span>
                  <strong className="text-stone-900">{formData.fullName || 'Customer'}</strong>
                  <span className="text-stone-500 font-mono"> ({formData.mobile})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutStep(1)}
                  className="text-xs font-bold text-[#9c1f60] hover:text-[#82144e] shrink-0 underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* CARD 1: PAY ONLINE (MEESHO FEATURED CARD) */}
              <div 
                className={`rounded-2xl transition-all border-2 bg-white shadow-xs overflow-hidden ${
                  paymentMode === 'online' ? 'border-[#9c1f60]' : 'border-stone-200'
                }`}
              >
                {/* Header Row: Prices + "Pay Online" + Checked circle */}
                <div 
                  onClick={() => setPaymentMode('online')}
                  className="p-3.5 sm:p-4 cursor-pointer border-b border-stone-100 flex items-start justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-stone-400 line-through">₹{originalCodTotal}</span>
                      <span className="font-extrabold text-base sm:text-lg text-stone-900">₹{grandTotal}</span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.5 rounded">
                        Save ₹{onlineDiscount}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1 ml-1">
                        Pay Online <span className="text-[#073822]">🇮🇳</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#03855a] font-medium pt-0.5">
                      <Tag className="w-3.5 h-3.5 text-[#03855a] shrink-0" />
                      <span>Extra discount with direct UPI & online payment</span>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    paymentMode === 'online' ? 'bg-[#9c1f60] text-white' : 'border border-stone-300'
                  }`}>
                    {paymentMode === 'online' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Direct UPI Apps Radio List (GPay, PhonePe, Paytm, super.money, Navi) */}
                {paymentMode === 'online' && (
                  <div className="p-3 bg-stone-50/60 divide-y divide-stone-100 animate-in fade-in">
                    {UPI_APPS.map(app => {
                      const isSelected = selectedUpiApp === app.id;
                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedUpiApp(app.id)}
                          className={`py-2.5 px-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#e6f7f2] border border-[#a8ebd5]' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {app.icon}
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-stone-900">{app.name}</div>
                              <div className="text-[10px] text-stone-500">{app.subtitle}</div>
                            </div>
                          </div>

                          {/* Custom Radio Button matching Meesho */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-[#9c1f60]' : 'border-stone-300'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#9c1f60]" />}
                          </div>
                        </div>
                      );
                    })}

                    {/* Dropdown: More UPI, Wallets & Cards */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowMoreUpiApps(!showMoreUpiApps)}
                        className="w-full py-2 px-3 text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center justify-between cursor-pointer"
                      >
                        <span>More UPI Apps, Net Banking & Cards</span>
                        {showMoreUpiApps ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                      </button>

                      {showMoreUpiApps && (
                        <div className="p-2.5 bg-white rounded-xl border border-stone-200 mt-1 space-y-2 text-xs animate-in fade-in">
                          <p className="text-[11px] text-stone-600">
                            You can also pay directly using any bank app, debit/credit card, or net banking via 256-bit secure gateway.
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={formData.upiUtr}
                              onChange={(e) => setFormData({ ...formData, upiUtr: e.target.value })}
                              placeholder="Optional UTR / Transaction ID"
                              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: ASK FRIENDS TO PAY / ARUNA S QR SCANNER (Matching Meesho Screenshot) */}
              <div 
                className={`rounded-2xl transition-all border-2 bg-white shadow-xs overflow-hidden ${
                  paymentMode === 'qr' ? 'border-[#9c1f60]' : 'border-stone-200'
                }`}
              >
                <div 
                  onClick={() => setPaymentMode('qr')}
                  className="p-3.5 sm:p-4 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-5 h-5 text-purple-700" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-stone-900">
                        {language === 'ta' ? 'அருணா QR ஸ்கேனர் / நண்பர்களுக்கு பகிர' : 'Ask Friends to Pay / QR Scanner'}
                      </div>
                      <div className="text-[10px] text-stone-500">Scan Aruna S QR or share payment link</div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paymentMode === 'qr' ? 'border-[#9c1f60]' : 'border-stone-300'
                  }`}>
                    {paymentMode === 'qr' && <div className="w-2.5 h-2.5 rounded-full bg-[#9c1f60]" />}
                  </div>
                </div>

                {/* Aruna S Official QR Code Card */}
                {paymentMode === 'qr' && (
                  <div className="p-4 bg-stone-50 border-t border-stone-100 text-center space-y-3 animate-in fade-in">
                    <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-stone-200">
                      <img
                        src={arunaQrImg || storeInfo.upiQrImage || "/assets/images/media_1791352967848.jpg"}
                        alt="Aruna S Official UPI QR"
                        className="w-40 h-auto object-contain mx-auto rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-stone-800">
                        Payee: <strong className="text-emerald-950 font-bold">{storeInfo.upiPayeeName || "Aruna S"}</strong>
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-stone-200 text-xs font-mono font-bold text-stone-800 shadow-2xs">
                        <span>{storeInfo.upiId || "arunasakthivel02@okaxis"}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="text-[#9c1f60] hover:text-[#82144e] font-sans font-bold text-[11px] ml-1 cursor-pointer"
                        >
                          {copiedUpi ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* SHARE 🔗 Button (Exact Meesho button) */}
                    <button
                      type="button"
                      onClick={handleShareQr}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-stone-50 text-[#9c1f60] border border-[#9c1f60] rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>SHARE 🔗</span>
                    </button>
                  </div>
                )}
              </div>

              {/* CARD 3: CASH ON DELIVERY (COD) */}
              <div 
                className={`rounded-2xl transition-all border-2 bg-white shadow-xs overflow-hidden ${
                  paymentMode === 'cod' ? 'border-[#9c1f60]' : 'border-stone-200'
                }`}
              >
                <div 
                  onClick={() => setPaymentMode('cod')}
                  className="p-3.5 sm:p-4 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Banknote className="w-5 h-5 text-amber-700" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-stone-900">
                        Cash on Delivery (₹{originalCodTotal})
                      </div>
                      <div className="text-[10px] text-stone-500">Pay cash upon parcel delivery</div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paymentMode === 'cod' ? 'border-[#9c1f60]' : 'border-stone-300'
                  }`}>
                    {paymentMode === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-[#9c1f60]" />}
                  </div>
                </div>

                {/* COD OTP Verification */}
                {paymentMode === 'cod' && (
                  <div className="p-4 bg-amber-50/50 border-t border-amber-200 space-y-2.5 animate-in fade-in text-xs">
                    <p className="text-amber-900 leading-snug">
                      To prevent bogus orders, verify your mobile number with a quick SMS OTP before confirming.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="10-digit mobile"
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white font-mono"
                        disabled={isCodOtpVerified}
                      />
                      <button
                        type="button"
                        onClick={handleSendCodOtp}
                        disabled={codSendingOtp || isCodOtpVerified}
                        className="bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap"
                      >
                        {codSendingOtp ? 'Sending...' : (isCodOtpSent ? 'Resend' : 'Send OTP')}
                      </button>
                    </div>

                    {isCodOtpSent && !isCodOtpVerified && (
                      <div className="flex gap-2 animate-in fade-in">
                        <input
                          type="text"
                          maxLength={6}
                          value={codOtp}
                          onChange={(e) => setCodOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="4-digit OTP"
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-amber-400 bg-white font-mono font-bold text-center"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCodOtp}
                          disabled={codVerifyingOtp}
                          className="bg-[#03855a] text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                        >
                          {codVerifyingOtp ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                    )}

                    {codOtpFeedback && (
                      <div className={`p-2 rounded-lg font-medium text-[11px] ${
                        isCodOtpVerified ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-950'
                      }`}>
                        {codOtpFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Price Details Breakdown Drawer / Collapsible Box */}
        {showPriceDetailsDrawer && (
          <div className="p-4 bg-white border-t border-stone-200 text-xs space-y-2 animate-in slide-in-from-bottom duration-200">
            <div className="font-bold text-stone-900 pb-1 border-b border-stone-100 flex items-center justify-between">
              <span>Price Details ({cart.length} Items)</span>
              <button 
                type="button" 
                onClick={() => setShowPriceDetailsDrawer(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Total Product Price</span>
              <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-[#03855a] font-semibold">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-₹{cartDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Delivery Fee</span>
              <span>{deliveryCharge === 0 ? <strong className="text-[#03855a]">FREE</strong> : `₹${deliveryCharge}`}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-stone-900 pt-1.5 border-t border-stone-100">
              <span>Order Total</span>
              <span className="text-[#9c1f60]">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* BOTTOM STICKY BAR (EXACT MEESHO BOTTOM BAR) */}
        <div className="fixed sm:absolute bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="space-y-0.5">
            <div className="text-base sm:text-lg font-extrabold text-stone-900">
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
            <button
              type="button"
              onClick={() => setShowPriceDetailsDrawer(!showPriceDetailsDrawer)}
              className="text-[11px] font-bold text-[#9c1f60] hover:text-[#82144e] flex items-center gap-0.5 cursor-pointer"
            >
              <span>VIEW PRICE DETAILS</span>
              {showPriceDetailsDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Alternative Button */}
            <button
              type="button"
              onClick={() => handlePayNow('whatsapp')}
              disabled={isProcessingPayment}
              className="p-3 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Order via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
            </button>

            {/* Meesho Signature Magenta CTA Button: Pay Now / Place Order */}
            <button
              type="button"
              onClick={() => handlePayNow('site')}
              disabled={isProcessingPayment}
              className="bg-[#9c1f60] hover:bg-[#82144e] active:scale-[0.98] text-white font-bold py-3 px-6 sm:px-8 rounded-xl text-sm sm:text-base shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {paymentMode === 'cod' ? 'Place Order' : 'Pay Now'}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

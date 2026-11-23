import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Eye, Phone, MessageCircle, 
  IndianRupee, ShieldCheck, ExternalLink, RefreshCw, ZoomIn, ZoomOut, User, MapPin,
  Send, Copy, FileText, Check
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatTaxInvoiceReceipt } from '../utils/orderInvoiceFormatter';
import { api } from '../services/api';

export const PaymentVerificationModal = ({ isOpen, onClose, order, onConfirmPayment, onRejectPayment }) => {
  const { storeInfo, showToast, updateOrderStatus, language } = useStore();
  const [isZoomed, setIsZoomed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isApprovedSuccess, setIsApprovedSuccess] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [dbProofImage, setDbProofImage] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);

  useEffect(() => {
    if (!order) {
      setDbProofImage(null);
      return;
    }
    const directProof = order.paymentProofImage || order.payment_proof_image;
    if (directProof && typeof directProof === 'string' && (directProof.startsWith('data:image') || directProof.startsWith('http') || directProof.startsWith('blob:'))) {
      setDbProofImage(directProof);
      return;
    }

    const orderId = order.orderId || order.id;
    if (orderId) {
      setLoadingProof(true);
      api.getOrder(orderId).then(dbOrder => {
        if (dbOrder && dbOrder.payment_proof_image) {
          setDbProofImage(dbOrder.payment_proof_image);
        }
      }).catch(() => {}).finally(() => {
        setLoadingProof(false);
      });
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const totalPayable = order.pricing?.grandTotal || order.pricing?.subtotal || order.grand_total || 0;
  const proofImage = dbProofImage || order.paymentProofImage || order.payment_proof_image || order.paymentProof;
  const isImageProof = proofImage && typeof proofImage === 'string' && (proofImage.startsWith('data:image') || proofImage.startsWith('http') || proofImage.startsWith('blob:'));
  const utrNumber = order.paymentUtr || order.payment_utr || '';

  const cleanMobile = (order.customer?.mobile || order.customer_phone || '').replace(/\D/g, '').slice(-10);
  const waMobile = cleanMobile ? (cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`) : '';

  // Generate the official Tax Invoice & Order Receipt message
  const confirmedInvoiceMessage = formatTaxInvoiceReceipt(order, {
    phone: storeInfo?.phone || '+91 6382218590',
    paymentStatus: 'Prepaid / Verified'
  });

  const customerWhatsAppInvoiceUrl = waMobile 
    ? `https://wa.me/${waMobile}?text=${encodeURIComponent(confirmedInvoiceMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(confirmedInvoiceMessage)}`;

  // SMS friendly format (plain text without emojis to prevent '' or '?' on basic phones)
  const confirmedSmsMessage = formatTaxInvoiceReceipt(order, {
    phone: storeInfo?.phone || '+91 6382218590',
    paymentStatus: 'Prepaid / Verified',
    forSms: true
  });

  const customerSmsUrl = cleanMobile
    ? `sms:+91${cleanMobile}?body=${encodeURIComponent(confirmedSmsMessage)}`
    : `sms:?body=${encodeURIComponent(confirmedSmsMessage)}`;

  const handleApprove = async () => {
    setIsConfirming(true);
    try {
      if (onConfirmPayment) {
        await onConfirmPayment(order.orderId || order.id);
      } else {
        await updateOrderStatus(order.orderId || order.id, 'Payment Confirmed');
      }
      
      // Auto-trigger WhatsApp dispatch to the customer with confirmed invoice
      if (waMobile) {
        window.open(customerWhatsAppInvoiceUrl, '_blank');
      }

      setIsApprovedSuccess(true);
      if (showToast) showToast(`Payment for Order #${order.orderId || order.id} verified & confirmed! ✅`);
    } catch (e) {
      if (showToast) showToast('Failed to update status.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async () => {
    try {
      if (onRejectPayment) {
        await onRejectPayment(order.orderId || order.id);
      } else {
        await updateOrderStatus(order.orderId || order.id, 'Cancelled');
      }
      if (showToast) showToast(`Order #${order.orderId || order.id} marked as Cancelled/Payment Rejected.`);
      onClose();
    } catch (e) {}
  };

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(confirmedInvoiceMessage);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
    if (showToast) showToast('Tax Invoice receipt copied to clipboard! 📋');
  };

  const handleWhatsAppInquiry = () => {
    const text = `Hi ${order.customer?.fullName || order.customer_name || 'Customer'}, this is Thalir Boutique regarding your order #${order.orderId || order.id} (₹${totalPayable}). We are verifying your UPI payment. Could you please share the clear payment screenshot or 12-digit UTR reference here? Thank you!`;
    window.open(`https://wa.me/${waMobile}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-[#073822] text-white p-5 sm:px-6 flex items-center justify-between border-b border-[#DFBA6D]/30 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-gold" />
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg">
                {language === 'ta' ? 'வாடிக்கையாளர் கட்டண ஆதாரத்தை சரிபார்க்கவும்' : 'Verify Customer Payment Proof'}
              </h2>
              <p className="text-[11px] text-stone-300">
                {language === 'ta' ? 'ஆர்டர்' : 'Order'} #{order.orderId || order.id} • {order.channel === 'whatsapp' ? (language === 'ta' ? 'வாட்ஸ்அப் ஆர்டர்' : 'WhatsApp Order') : (language === 'ta' ? 'வலைத்தள ஆர்டர்' : 'Website Order')}
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

        {/* Post-Approval Confirmation View */}
        {isApprovedSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl text-stone-900">
                {language === 'ta' ? 'கட்டணம் சரிபார்க்கப்பட்டு அங்கீகரிக்கப்பட்டது!' : 'Payment Verified & Approved!'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-md mx-auto leading-relaxed">
                {language === 'ta'
                  ? `ஆர்டர் #${order.orderId || order.id} நிலை இப்போது கட்டணம் உறுதி செய்யப்பட்டது என மாற்றப்பட்டுள்ளது.`
                  : `Order #${order.orderId || order.id} status is now Payment Confirmed (Prepaid / Verified).`}
              </p>
            </div>

            {/* Invoice Message Dispatched Preview Card */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs font-mono space-y-2 max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>{language === 'ta' ? 'அனுப்பப்பட்ட அதிகாரப்பூர்வ வரி இன்வாய்ஸ்:' : 'Official Tax Invoice Dispatched:'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyInvoice}
                  className="text-stone-600 hover:text-stone-900 flex items-center gap-1 font-sans text-xs bg-white px-2 py-1 rounded border border-stone-200 cursor-pointer"
                >
                  {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInvoice ? (language === 'ta' ? 'நகலெடுக்கப்பட்டது' : 'Copied') : (language === 'ta' ? 'நகலெடு' : 'Copy Invoice')}</span>
                </button>
              </div>
              <pre className="text-[11px] whitespace-pre-wrap text-stone-800 leading-relaxed font-sans">
                {confirmedInvoiceMessage}
              </pre>
            </div>

            {/* Quick Dispatch Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={customerWhatsAppInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all no-underline"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>{language === 'ta' ? `வாட்ஸ்அப்பில் அனுப்பு (+91 ${cleanMobile})` : `Send on WhatsApp (+91 ${cleanMobile})`}</span>
              </a>

              <a
                href={customerSmsUrl}
                className="bg-stone-800 hover:bg-stone-900 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all no-underline"
              >
                <Send className="w-4 h-4" />
                <span>{language === 'ta' ? 'சாதாரண SMS அனுப்பு' : 'Send Normal SMS to Customer'}</span>
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-stone-600 hover:text-stone-900 font-bold text-xs py-2 px-6 rounded-xl border border-stone-300 hover:bg-stone-100 cursor-pointer transition-colors"
              >
                {language === 'ta' ? 'மூடிவிட்டு ஆர்டர்களுக்கு திரும்புக' : 'Close & Return to Orders'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 text-stone-900 text-xs sm:text-sm">
            
            {/* Order & Customer Summary Card */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  {language === 'ta' ? 'வாடிக்கையாளர் விவரங்கள்' : 'Customer Information'}
                </span>
                <div className="font-bold text-stone-900 text-sm mt-0.5">{order.customer?.fullName || order.customer_name || 'Valued Customer'}</div>
                <div className="text-xs text-stone-600 flex items-center gap-1.5 mt-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-stone-400" /> +91 {cleanMobile || 'No mobile provided'}
                </div>
                {(order.customer?.address || order.delivery_address) && (
                  <div className="text-xs text-stone-500 mt-1 line-clamp-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 inline mr-1" />
                    {order.customer?.address || order.delivery_address}, {order.customer?.city || order.city} {(order.customer?.pincode || order.pincode) ? `- ${order.customer?.pincode || order.pincode}` : ''}
                  </div>
                )}
              </div>

              <div className="sm:border-l sm:border-stone-200 sm:pl-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                    {language === 'ta' ? 'சரிபார்க்க வேண்டிய மொத்தத் தொகை' : 'Total Amount to Verify'}
                  </span>
                  <div className="font-serif font-extrabold text-2xl text-primary mt-0.5">
                    ₹{Number(totalPayable).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {language === 'ta' ? 'கட்டண முறை: ' : 'Method: '}
                    <strong>{order.paymentMethod || 'UPI Payment (Direct QR)'}</strong>
                  </div>
                </div>

                {utrNumber && (
                  <div className="mt-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-bold block">
                      {language === 'ta' ? 'உள்ளிட்ட UPI UTR / பரிவர்த்தனை எண்:' : 'Entered UPI UTR / Ref ID:'}
                    </span>
                    <span className="font-mono text-xs font-extrabold text-emerald-950">{utrNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Screenshot Display Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-gold" />
                  <span>{language === 'ta' ? 'பதிவேற்றிய கட்டண ஸ்கிரீன்ஷாட் ஆதாரம்:' : 'Uploaded Payment Screenshot Proof:'}</span>
                </span>
                {isImageProof && (
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                    <span>{isZoomed ? (language === 'ta' ? 'இயல்பான அளவு' : 'Fit to View') : (language === 'ta' ? 'பெரிதாக்கு 100%' : 'Zoom 100%')}</span>
                  </button>
                )}
              </div>

              {loadingProof ? (
                <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto" />
                  <p className="text-xs text-stone-600 font-medium">
                    {language === 'ta' ? 'கட்டண ஸ்கிரீன்ஷாட் பெறப்படுகிறது...' : 'Fetching payment screenshot from secure storage...'}
                  </p>
                </div>
              ) : isImageProof ? (
                <div className={`p-2 bg-stone-900 rounded-2xl border border-stone-300 flex items-center justify-center overflow-auto ${isZoomed ? 'max-h-[650px]' : 'max-h-80'}`}>
                  <img
                    src={proofImage}
                    alt="Customer Payment Proof Screenshot"
                    className={`rounded-xl object-contain transition-all ${isZoomed ? 'w-full h-auto cursor-zoom-out' : 'max-h-72 w-auto cursor-zoom-in'}`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  />
                </div>
              ) : (
                <div className="p-8 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-300 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="font-bold text-amber-900 text-sm">
                    {language === 'ta' ? 'ஸ்கிரீன்ஷாட் படம் இணைக்கப்படவில்லை' : 'No Image Screenshot Attached'}
                  </h4>
                  <p className="text-xs text-amber-800 max-w-sm mx-auto">
                    {order.paymentProof || (language === 'ta' ? 'வாடிக்கையாளரிடம் வாட்ஸ்அப்பில் கட்டண ஸ்கிரீன்ஷாட்டை கேட்கவும்.' : 'Customer placed order without image. Ask customer on WhatsApp for payment screenshot.')}
                  </p>
                  <button
                    type="button"
                    onClick={handleWhatsAppInquiry}
                    className="mt-2 inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{language === 'ta' ? 'வாட்ஸ்அப்பில் ஸ்கிரீன்ஷாட் கேட்க' : 'Request Screenshot on WhatsApp'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Verification Checklist */}
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-[#073822]">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{language === 'ta' ? 'சரிபார்ப்பு வழிகாட்டுதல்:' : 'Verification & Auto-Dispatch Workflow:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-stone-700 text-[11px] pl-1">
                <li>
                  {language === 'ta' ? 'பரிவர்த்தனை தொகை ' : 'Verify the transfer amount matches '}
                  <strong>₹{Number(totalPayable).toLocaleString('en-IN')}</strong>
                  {language === 'ta' ? ' என்பதை உறுதிப்படுத்தவும்.' : ''}
                </li>
                <li>
                  {language === 'ta' ? 'பெறுநர் பெயர் ' : 'Verify the Payee Name shows '}
                  <strong>"{storeInfo?.upiPayeeName || 'Aruna S / Thalir Boutique'}"</strong>
                  {language === 'ta' ? ' என உள்ளதா என பார்க்கவும்.' : ''}
                </li>
                <li>
                  {language === 'ta'
                    ? `அங்கீகரித்தவுடன் அதிகாரப்பூர்வ வரி இன்வாய்ஸ் வாடிக்கையாளரின் வாட்ஸ்அப் (+91 ${cleanMobile}) மற்றும் SMS-க்கு தானாக அனுப்பப்படும்.`
                    : `Upon clicking Approve & Confirm Order, the official Tax Invoice & Order Receipt will be sent directly to customer's WhatsApp (+91 ${cleanMobile}) and SMS.`}
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleWhatsAppInquiry}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-green-600 text-green-700 hover:bg-green-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Message customer regarding payment"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span>{language === 'ta' ? 'வாட்ஸ்அப்பில் கேட்க' : 'Ask on WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  {language === 'ta' ? 'நிராகரி' : 'Reject Proof'}
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 font-bold text-xs text-stone-700 cursor-pointer"
                >
                  {language === 'ta' ? 'ரத்து' : 'Cancel'}
                </button>

                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={handleApprove}
                  className="flex-1 sm:flex-initial bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  <span>{isConfirming ? (language === 'ta' ? 'உறுதி செய்யப்படுகிறது...' : 'Confirming...') : (language === 'ta' ? '✅ கட்டணத்தை உறுதி செய்து இன்வாய்ஸ் அனுப்பு' : '✅ Approve Payment & Send Invoice')}</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

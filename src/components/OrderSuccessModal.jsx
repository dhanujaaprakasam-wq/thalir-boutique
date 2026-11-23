import React, { useState } from 'react';
import { CheckCircle2, ShoppingBag, ShieldCheck, Clock, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';

export const OrderSuccessModal = () => {
  const { completedOrder, setCompletedOrder, language } = useStore();
  const [showTracking, setShowTracking] = useState(false);

  if (!completedOrder) return null;

  const customerName = completedOrder.customer?.fullName || completedOrder.customer_name || 'Valued Customer';
  const customerMobile = (completedOrder.customer?.mobile || completedOrder.customer_phone || '').replace(/\D/g, '').slice(-10);
  const grandTotal = completedOrder.pricing?.grandTotal || completedOrder.grand_total || completedOrder.pricing?.subtotal || 0;
  const orderId = completedOrder.orderId || completedOrder.id;
  const paymentMethod = completedOrder.paymentMethod || 'UPI QR Payment';
  const isPaid = completedOrder.status === 'Payment Confirmed' || paymentMethod === 'Razorpay Online';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-gold/40 text-center space-y-5 my-auto animate-in zoom-in-95 duration-150">
          
          {/* Success Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          {/* Heading */}
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary mb-1">
              {language === 'ta' ? 'ஆர்டர் வெற்றிகரமாக பதிவு செய்யப்பட்டது!' : 'Order Placed Successfully!'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              {language === 'ta' 
                ? `நன்றி, ${customerName}! உங்கள் ஆர்டர் #${orderId} வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது.`
                : `Thank you, ${customerName}! Your order #${orderId} has been placed successfully.`
              }
            </p>
          </div>

          {/* Order Details Summary Card */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-stone-500 font-medium">
                {language === 'ta' ? 'ஆர்டர் எண்:' : 'Order Reference:'}
              </span>
              <strong className="text-primary font-mono text-sm font-extrabold">#{orderId}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">
                {language === 'ta' ? 'மொத்தத் தொகை:' : 'Total Payable:'}
              </span>
              <strong className="text-emerald-900 text-sm font-bold">₹{Number(grandTotal).toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">
                {language === 'ta' ? 'கட்டண முறை:' : 'Payment Method:'}
              </span>
              <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-300">
                {paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">
                {language === 'ta' ? 'நிலை:' : 'Status:'}
              </span>
              <span className={`font-semibold px-2 py-0.5 rounded text-[11px] border flex items-center gap-1 ${
                isPaid ? 'text-emerald-900 bg-emerald-100 border-emerald-300' : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}>
                {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                <span>{isPaid ? 'Payment Confirmed' : (paymentMethod === 'Cash on Delivery' ? 'COD Verified' : 'Pending Verification')}</span>
              </span>
            </div>
          </div>

          {/* Informative Note for User */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-[11px] text-emerald-950 text-left space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[#073822]">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{language === 'ta' ? 'அடுத்த கட்ட நடவடிக்கை:' : 'What happens next?'}</span>
            </div>
            <p className="text-stone-600 leading-relaxed text-[11px]">
              {language === 'ta'
                ? `உங்கள் ஆர்டர் கைவினைச் சேலைகள் சரிபார்க்கப்பட்டு அனுப்பப்படும். வாட்ஸ்அப் (+91 ${customerMobile}) எண்ணிற்கு கூரியர் கண்காணிப்பு விவரங்கள் தானாக அனுப்பப்படும்.`
                : `Our team will carefully pack and dispatch your sarees. Courier dispatch and live tracking details will be sent to your WhatsApp (+91 ${customerMobile}).`
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => setShowTracking(true)}
              className="w-full bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4 text-gold" />
              <span>{language === 'ta' ? 'நேரலை பார்சல் டிராக்கிங்' : 'Track Live Parcel Status'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCompletedOrder(null)}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 px-6 rounded-2xl text-xs transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-stone-600 inline mr-1.5" />
              <span>{language === 'ta' ? 'தொடர்ந்து ஷாப்பிங் செய்ய' : 'Continue Shopping'}</span>
            </button>
          </div>

        </div>
      </div>

      {showTracking && (
        <OrderTrackingTimeline
          order={completedOrder}
          onClose={() => setShowTracking(false)}
        />
      )}
    </>
  );
};

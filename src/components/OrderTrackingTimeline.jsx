import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, CheckCircle2, Clock, MapPin, 
  ExternalLink, Copy, Check, MessageCircle, X, Navigation 
} from 'lucide-react';
import { api } from '../services/api';

export const OrderTrackingTimeline = ({ order, onClose }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedAwb, setCopiedAwb] = useState(false);

  useEffect(() => {
    if (!order?.orderId && !order?.order_id) return;
    const oId = order.orderId || order.order_id;
    
    api.getOrderTracking(oId)
      .then(res => {
        if (res) {
          setTrackingData(res);
        } else {
          // Fallback tracking data from local order object
          setTrackingData({
            order_id: oId,
            customer_name: order.customer_name || order.customer?.fullName,
            courier_partner: order.courier_partner || 'ST Courier',
            tracking_number: order.tracking_number || '',
            tracking_url: order.tracking_url || '',
            shipping_status: order.shipping_status || 'Order Placed',
            timeline: [
              { status: 'Order Placed', completed: true, time: order.created_at || 'Just now' },
              { status: 'Packed', completed: ['Packed', 'Dispatched', 'In Transit', 'Delivered'].includes(order.shipping_status), time: null },
              { status: 'Dispatched', completed: ['Dispatched', 'In Transit', 'Delivered'].includes(order.shipping_status), time: order.dispatched_at },
              { status: 'In Transit', completed: ['In Transit', 'Delivered'].includes(order.shipping_status), time: null },
              { status: 'Delivered', completed: order.shipping_status === 'Delivered', time: order.delivered_at }
            ]
          });
        }
      })
      .finally(() => setLoading(false));
  }, [order]);

  const copyAwb = () => {
    const awb = trackingData?.tracking_number || order?.tracking_number;
    if (awb) {
      navigator.clipboard.writeText(awb);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    }
  };

  const courier = trackingData?.courier_partner || order?.courier_partner || 'ST Courier';
  const trackingNumber = trackingData?.tracking_number || order?.tracking_number || '';
  const trackingUrl = trackingData?.tracking_url || order?.tracking_url || (trackingNumber ? `https://stcourier.com/track/search?awb=${trackingNumber}` : '');
  const shippingStatus = trackingData?.shipping_status || order?.shipping_status || 'Order Placed';

  const milestones = trackingData?.timeline || [
    { status: 'Order Placed', completed: true },
    { status: 'Packed', completed: ['Packed', 'Dispatched', 'In Transit', 'Delivered'].includes(shippingStatus) },
    { status: 'Dispatched', completed: ['Dispatched', 'In Transit', 'Delivered'].includes(shippingStatus) },
    { status: 'In Transit', completed: ['In Transit', 'Delivered'].includes(shippingStatus) },
    { status: 'Delivered', completed: shippingStatus === 'Delivered' }
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-gold/40 flex flex-col relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#073822]" />
            <div>
              <h3 className="font-serif font-bold text-base text-[#073822]">Live Parcel Tracking</h3>
              <p className="text-[11px] text-stone-500 font-mono">Order #{order.orderId || order.order_id}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Courier Details Card */}
        <div className="my-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">Courier Partner:</span>
            <span className="font-bold text-[#073822] bg-[#073822]/10 px-2 py-0.5 rounded-full">{courier}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">Tracking / AWB No:</span>
            {trackingNumber ? (
              <div className="flex items-center gap-1.5 font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                <span>{trackingNumber}</span>
                <button
                  type="button"
                  onClick={copyAwb}
                  className="text-gold hover:text-gold-dark p-0.5 rounded"
                  title="Copy Tracking Number"
                >
                  {copiedAwb ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <span className="text-stone-400 italic text-[11px]">Generating upon packing...</span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60">
            <span className="text-stone-500">Current Status:</span>
            <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
              shippingStatus === 'Delivered' 
                ? 'bg-emerald-100 text-emerald-800' 
                : (shippingStatus === 'Dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900')
            }`}>
              {shippingStatus}
            </span>
          </div>
        </div>

        {/* Visual Milestones Timeline */}
        <div className="space-y-4 py-2 px-1">
          {milestones.map((step, idx) => {
            const isLast = idx === milestones.length - 1;
            const isDone = step.completed;

            return (
              <div key={step.status} className="flex items-start gap-3 relative">
                {!isLast && (
                  <div className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-px ${
                    isDone ? 'bg-[#073822]' : 'bg-stone-200'
                  }`} />
                )}

                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  isDone 
                    ? 'bg-[#073822] text-white shadow-sm ring-4 ring-[#073822]/10' 
                    : 'bg-stone-100 text-stone-400 border border-stone-300'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-gold" /> : <Clock className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isDone ? 'text-stone-900' : 'text-stone-400'}`}>
                      {step.status}
                    </span>
                    {step.time && (
                      <span className="text-[10px] text-stone-400 font-mono">{step.time}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-500">
                    {step.status === 'Order Placed' && 'Your order was verified and received by our boutique team.'}
                    {step.status === 'Packed' && 'Handcrafted sarees inspected, steam pressed & packed.'}
                    {step.status === 'Dispatched' && `Handed over to ${courier} for express transit.`}
                    {step.status === 'In Transit' && 'Parcel is moving through the courier distribution network.'}
                    {step.status === 'Delivered' && 'Parcel successfully delivered to your doorstep.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* External Courier Link & WhatsApp Support */}
        <div className="mt-5 pt-3.5 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Track on {courier} Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <a
            href={`https://wa.me/916382218590?text=${encodeURIComponent(`Vanakkam Thalir Boutique! Please share an update regarding tracking for Order #${order.orderId || order.order_id}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Helpline</span>
          </a>
        </div>

      </div>
    </div>
  );
};

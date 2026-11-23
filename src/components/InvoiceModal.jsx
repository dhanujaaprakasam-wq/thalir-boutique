import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Printer, Download, Truck, ShieldCheck, FileText, CheckCircle2, 
  QrCode, MessageCircle, Package, MapPin, Phone, Building, Hash, Copy
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import logoImg from '../assets/logo.jpg';
import { generateBarcodeSvgPath, generateQrDataUrl } from '../utils/barcodeGenerator';
import { formatTaxInvoiceReceipt } from '../utils/orderInvoiceFormatter';

export const InvoiceModal = ({ isOpen, onClose, order, storeInfo = {}, isAdmin }) => {
  const { language, user, isAdminDemoMode } = useStore();
  const [viewMode, setViewMode] = useState('invoice'); // 'invoice' | 'packingslip'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const invoiceRef = useRef(null);

  const isStoreAdmin = isAdmin !== undefined
    ? Boolean(isAdmin)
    : (user?.role === 'Admin' || isAdminDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tb_admin_authenticated') === 'true'));

  const effectiveViewMode = isStoreAdmin ? viewMode : 'invoice';

  const grandTotal = order?.pricing?.grandTotal || order?.pricing?.subtotal || order?.grand_total || order?.total_amount || 0;
  const subtotal = order?.pricing?.subtotal || order?.subtotal || grandTotal;
  const shipping = order?.pricing?.shippingFee ?? order?.pricing?.deliveryFee ?? order?.delivery_charge ?? (order?.pricing?.shipping === 0 ? 0 : 30);
  const distanceKm = order?.customer?.distance_km || order?.pricing?.distanceKm || null;
  const gstRate = 5; // 5% GST on ethnic apparel
  const taxableAmount = Math.round((subtotal * 100) / (100 + gstRate));
  const gstAmount = subtotal - taxableAmount;
  const cgst = Math.round(gstAmount / 2);
  const sgst = Math.round(gstAmount / 2);

  const formattedDate = new Date(order?.timestamp || order?.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const awbNumber = order?.awb || `TB-EXP-${String(order?.orderId || order?.id || '984210').replace(/[^0-9]/g, '').slice(-6) || '984210'}`;
  const barcode = generateBarcodeSvgPath(awbNumber, 2, 40);

  // Generate QR Code for live order tracking / invoice confirmation
  useEffect(() => {
    if (!isOpen || !order) return;
    let isMounted = true;
    async function loadQr() {
      const trackingUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/#order=${order.orderId || order.id}`
        : `https://thalirboutique.in/#order=${order.orderId || order.id}`;
      const url = await generateQrDataUrl(trackingUrl, { width: 110, margin: 0 });
      if (isMounted) setQrDataUrl(url);
    }
    loadQr();
    return () => { isMounted = false; };
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const customerPhone = (order.customer?.mobile || order.customer?.phone || order.customer_phone || '').replace(/[^0-9]/g, '').slice(-10);
  const customerName = order.customer?.fullName || order.customer?.name || order.customer_name || 'Valued Customer';

  // Official Tax Invoice & Order Receipt message
  const invoiceReceiptText = formatTaxInvoiceReceipt(order, {
    phone: storeInfo?.phone || '+91 6382218590',
    paymentStatus: order.paymentMethod || 'Prepaid / Verified'
  });

  const invoiceWhatsAppMsg = encodeURIComponent(invoiceReceiptText);
  const whatsappInvoiceUrl = `https://wa.me/91${customerPhone || '6382218590'}?text=${invoiceWhatsAppMsg}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:max-w-none print:w-full">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-[#073822] text-white p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#DFBA6D]/30 print:hidden">
          
          {/* Mode Switcher (Visible ONLY to Admin) */}
          <div className="flex items-center gap-2">
            {isStoreAdmin ? (
              <div className="bg-white/10 p-1 rounded-xl flex items-center gap-1 border border-white/20">
                <button
                  type="button"
                  onClick={() => setViewMode('invoice')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    effectiveViewMode === 'invoice' 
                      ? 'bg-gold text-stone-950 shadow-sm' 
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'அதிகாரப்பூர்வ வரி இன்வாய்ஸ்' : 'Official Tax Invoice'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('packingslip')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    effectiveViewMode === 'packingslip' 
                      ? 'bg-gold text-stone-950 shadow-sm' 
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'கூரியர் பேக்கிங் ஸ்லிப்' : 'Courier Packing Slip'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-white tracking-wide">
                    {language === 'ta' ? 'அதிகாரப்பூர்வ வரி இன்வாய்ஸ்' : 'Official Tax Invoice'}
                  </h3>
                  <span className="text-[10px] text-stone-300 font-mono">
                    Order #{order.orderId || order.id}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {isStoreAdmin && (
              <a
                href={whatsappInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-whatsapp hover:bg-whatsapp-dark text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer no-underline"
                title="Send itemized receipt directly to customer's WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>{language === 'ta' ? 'வாட்ஸ்அப் இன்வாய்ஸ்' : 'WhatsApp Invoice'}</span>
              </a>
            )}

            <button
              onClick={handlePrint}
              className="bg-gold hover:bg-gold-light text-stone-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'ta' ? 'அச்சிடு / PDF சேமி' : 'Print / Save PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: OFFICIAL TAX INVOICE                             */}
        {/* ========================================================= */}
        {effectiveViewMode === 'invoice' && (
          <div ref={invoiceRef} className="p-6 sm:p-10 text-stone-900 bg-white font-sans text-xs sm:text-sm space-y-6 print:p-6">
            
            {/* Top Brand & Invoice Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-stone-200 gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={logoImg}
                  alt="Thalir Boutique Logo"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gold shadow-sm"
                />
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#073822]">
                    Thalir Boutique
                  </h1>
                  <p className="text-[11px] text-stone-600 font-medium">
                    5/797, NC Colony, Kumarapalayam Main Rd, Veppadai, Namakkal 638008, TN
                  </p>
                  <p className="text-[11px] text-stone-600">
                    GSTIN: <span className="font-bold text-stone-800">33AABCT8921K1ZZ</span> • Mobile: +91 6382218590
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right bg-stone-50 p-3 rounded-2xl border border-stone-200 shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold-dark block">
                  TAX INVOICE / CASH BILL
                </span>
                <div className="font-serif font-extrabold text-lg text-[#073822]">
                  #{order.orderId || order.id}
                </div>
                <div className="text-xs text-stone-500 font-medium">
                  Date: {formattedDate}
                </div>
                <div className="text-[10px] text-stone-500">
                  Channel: <span className="font-semibold capitalize text-stone-800">{order.channel || 'Website Order'}</span>
                </div>
              </div>
            </div>

            {/* Billed To & Courier Delivery Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#073822] mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Billed To (Customer)
                </h3>
                <p className="font-bold text-stone-900 text-sm">{customerName}</p>
                <p className="text-xs text-stone-600 mt-0.5">{order.customer?.address || order.delivery_address || 'Direct Order Address'}</p>
                <p className="text-xs text-stone-600 font-medium">
                  {order.customer?.city || order.city || 'Namakkal'}, {order.customer?.pincode || order.pincode || '638008'}
                </p>
                <p className="text-xs text-stone-800 font-semibold mt-1">
                  Phone: +91 {customerPhone || '9342665700'}
                </p>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l sm:pl-6 border-stone-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#073822] mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-gold" /> Shipping & Courier Details
                  </h3>
                  {order.courierPartner && (
                    <p className="text-xs text-stone-600">
                      Courier Partner: <span className="font-bold text-stone-900">{order.courierPartner}</span>
                    </p>
                  )}
                  <p className="text-xs text-stone-600 font-mono mt-0.5">
                    AWB Tracking #: <span className="font-bold text-emerald-800">{awbNumber}</span>
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Payment Status: <span className="font-bold uppercase text-emerald-700">{order.paymentMethod || 'Prepaid / Verified'}</span>
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Dispatch Mode: Surface Express</span>
                  <span className="font-semibold text-[#073822]">Delivery in 2-4 Days</span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#073822] text-white text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-xl">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Saree SKU / Code</th>
                    <th className="py-2.5 px-3">Color / Variant</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right rounded-r-xl">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs sm:text-sm">
                  {(order.items || []).map((item, idx) => {
                    const itemCode = item.product_code || item.code || item.productCode || item.id || `TB-${idx + 1}`;
                    return (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-3 px-3 text-stone-400 font-semibold">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-stone-900">
                          <div>{item.productName || item.product_name || item.name}</div>
                          <span className="text-[10px] text-stone-400 font-normal">HSN: 5208 (Ethnic Apparel)</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {itemCode}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-stone-600">{item.color || 'Standard'}</td>
                        <td className="py-3 px-3 text-center font-bold text-stone-900">{item.qty || 1}</td>
                        <td className="py-3 px-3 text-right text-stone-700">₹{Number(item.price || item.unit_price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right font-bold text-stone-900">
                          ₹{Number((item.price || item.unit_price || 0) * (item.qty || 1)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown & Tax Calculation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-4 border-t-2 border-stone-200 gap-6">
              <div className="max-w-xs space-y-1.5 text-xs text-stone-500">
                <p className="font-semibold text-stone-700">GST Breakdown (5% Apparel Tax):</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span>Taxable Value: ₹{taxableAmount.toLocaleString('en-IN')}</span>
                  <span>CGST (2.5%): ₹{cgst.toLocaleString('en-IN')}</span>
                  <span>SGST (2.5%): ₹{sgst.toLocaleString('en-IN')}</span>
                  <span>Total Tax: ₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] italic text-stone-400">
                  * All prices are inclusive of GST as per Indian Tax Norms.
                </p>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-stone-800">₹{Number(subtotal).toLocaleString('en-IN')}</span>
                </div>
                {((order.coupon_code || order.pricing?.couponCode) || (order.discount_amount > 0 || order.pricing?.discountAmount > 0)) && (
                  <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <span>Coupon Discount:</span>
                    <span>-₹{Number(order.discount_amount || order.pricing?.discountAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Courier Shipping {distanceKm ? `(~${distanceKm} km)` : ''}:</span>
                  <span className="font-semibold text-stone-800">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between text-base font-serif font-extrabold text-[#073822] pt-2 border-t border-stone-300">
                  <span>Grand Total:</span>
                  <span>₹{Number(grandTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Signature & Barcode Section */}
            <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center text-xs text-stone-500 gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-gold shrink-0" />
                <div>
                  <p className="font-bold text-stone-800">100% Quality Handcrafted Guarantee</p>
                  <p className="text-[10px] text-stone-500">Thank you for supporting Thalir Boutique!</p>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <div className="font-serif italic font-bold text-sm text-[#073822] mb-1">Thalir Boutique</div>
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Authorized Signatory</p>
              </div>
            </div>

            {/* Linear Barcode & Tracking Routing */}
            <div className="pt-4 border-t border-dashed border-stone-300 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <svg 
                  viewBox={`0 0 ${barcode.width} ${barcode.height}`}
                  className="h-9 w-44"
                  preserveAspectRatio="none"
                >
                  <path d={barcode.path} fill="#000000" />
                </svg>
                <span className="font-mono text-xs font-bold text-stone-700 tracking-wider">
                  {awbNumber}
                </span>
              </div>
              <div className="text-[11px] text-stone-400">
                Routing: SOUTH-TN-HUB-{order.customer?.pincode || order.pincode || '638008'}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: COURIER SHIPPING LABEL / PACKING SLIP (ADMIN ONLY) */}
        {/* ========================================================= */}
        {effectiveViewMode === 'packingslip' && isStoreAdmin && (
          <div className="p-6 sm:p-10 bg-stone-50 text-stone-900 font-sans text-xs space-y-6 print:p-4 print:bg-white">
            
            {/* Courier Sticker Card (Standard 4" x 6" / Shipping Flyer Dimensions) */}
            <div className="max-w-xl mx-auto bg-white border-2 border-stone-900 rounded-2xl p-5 shadow-lg print:shadow-none print:border-black space-y-4">
              
              {/* Header with Courier Partner & AWB */}
              <div className="flex items-center justify-between border-b-2 border-stone-900 pb-3">
                <div className="flex items-center gap-2.5">
                  <img src={logoImg} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-gold" />
                  <div>
                    <h2 className="font-serif font-black text-sm uppercase text-[#073822] tracking-wider">
                      THALIR BOUTIQUE EXPRESS
                    </h2>
                    <span className="text-[9px] uppercase font-bold text-stone-500">Surface Priority Courier</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="bg-emerald-900 text-white font-black text-[11px] px-2.5 py-1 rounded-md uppercase tracking-wider block">
                    {order.paymentMethod === 'Cash on Delivery' ? 'CASH ON DELIVERY (COD)' : 'PREPAID SHIPMENT'}
                  </span>
                  <span className="font-mono text-[10px] text-stone-500 font-bold mt-1 block">
                    Order: #{order.orderId || order.id}
                  </span>
                </div>
              </div>

              {/* Scannable Barcode & QR Code */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-300 flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col items-center">
                  <svg 
                    viewBox={`0 0 ${barcode.width} ${barcode.height}`}
                    className="w-full h-11 max-w-[280px]"
                    preserveAspectRatio="none"
                  >
                    <path d={barcode.path} fill="#000000" />
                  </svg>
                  <span className="font-mono font-extrabold text-sm tracking-widest text-stone-900 mt-1">
                    AWB: {awbNumber}
                  </span>
                </div>

                {qrDataUrl && (
                  <div className="shrink-0 text-center">
                    <img src={qrDataUrl} alt="Order QR" className="w-14 h-14 object-contain rounded border border-stone-300 p-0.5 bg-white" />
                    <span className="text-[7px] text-stone-400 block mt-0.5">Scan to Track</span>
                  </div>
                )}
              </div>

              {/* DELIVERY ADDRESS (TO) - Big, Bold, Courier-Ready */}
              <div className="border-2 border-stone-800 rounded-xl p-4 bg-stone-50/50">
                <div className="text-[10px] uppercase font-black tracking-widest text-emerald-900 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> DELIVER TO (RECIPIENT):
                </div>
                <div className="font-bold text-base text-stone-950 uppercase">
                  {customerName}
                </div>
                <div className="text-xs text-stone-800 font-medium mt-1 leading-relaxed">
                  {order.customer?.address || order.delivery_address || 'Customer Delivery Address'}
                </div>
                <div className="text-sm font-extrabold text-stone-950 mt-1">
                  {order.customer?.city || order.city || 'Namakkal'}, TAMIL NADU - <span className="text-base text-primary underline underline-offset-2">{order.customer?.pincode || order.pincode || '638008'}</span>
                </div>
                <div className="text-xs font-bold text-stone-900 mt-2 bg-yellow-100 px-2 py-1 rounded inline-block border border-yellow-300">
                  📞 Contact Mobile: +91 {customerPhone || '9342665700'}
                </div>
              </div>

              {/* RETURN ADDRESS (FROM) */}
              <div className="p-3 bg-white rounded-xl border border-stone-300 text-[11px] text-stone-600">
                <span className="font-bold text-[10px] uppercase text-stone-800 block mb-0.5">
                  RETURN IF UNDELIVERED (SHIPPER):
                </span>
                <p className="font-semibold text-stone-800">Thalir Boutique (Attn: Dispatch Team)</p>
                <p>5/797, NC Colony, Kumarapalayam Main Rd, Veppadai, Namakkal 638008, Tamil Nadu</p>
                <p>Phone: +91 6382218590 • GSTIN: 33AABCT8921K1ZZ</p>
              </div>

              {/* PACKAGE CONTENTS & SAREE CODES */}
              <div className="border-t-2 border-dashed border-stone-300 pt-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-stone-700 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" /> Package Contents ({order.items?.length || 1} Item):
                  </span>
                  <span className="font-bold text-xs text-stone-900">
                    Grand Total: ₹{Number(grandTotal).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-1 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  {(order.items || []).map((it, idx) => {
                    const itemCode = it.product_code || it.code || it.productCode || it.id || `TB-${idx + 1}`;
                    return (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="font-medium text-stone-800">
                          {idx + 1}. {it.productName || it.product_name || it.name} ({it.color || 'Standard'})
                        </span>
                        <span className="font-mono font-bold text-primary">
                          [{itemCode}] x{it.qty || 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Courier Instruction */}
              <div className="text-[10px] text-center text-stone-400 italic pt-1">
                * Handle with care. Ethnic Silk/Cotton Apparel. Waterproof packaging verified.
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

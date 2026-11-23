import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, X, Tag, Sparkles, CheckSquare, Square, 
  Settings2, Eye, Copy, RefreshCw, Scissors, QrCode as QrIcon
} from 'lucide-react';
import { generateBarcodeSvgPath, generateQrDataUrl } from '../utils/barcodeGenerator';
import { useStore } from '../context/StoreContext';
import logoImg from '../assets/logo.jpg';

export const BoutiqueTagPrinterModal = ({ isOpen, onClose, products = [], initialProduct = null, initialVariant = null }) => {
  const { language } = useStore();
  const [selectedFormat, setSelectedFormat] = useState('hangtag'); // 'hangtag' | 'thermal' | 'a4sheet'
  const [selectedProductId, setSelectedProductId] = useState(initialProduct?.id || (products[0]?.id || ''));
  const [selectedVariantIds, setSelectedVariantIds] = useState([]);
  const [copiesCount, setCopiesCount] = useState(1);
  const [showPrice, setShowPrice] = useState(true);
  const [showMrp, setShowMrp] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [qrCodes, setQrCodes] = useState({});

  const printRef = useRef(null);

  // Sync initial product/variant when modal opens
  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      if (initialVariant) {
        setSelectedVariantIds([initialVariant.id || initialVariant.code]);
      } else {
        const vIds = (initialProduct.variants || []).map(v => v.id || v.code);
        setSelectedVariantIds(vIds.length > 0 ? vIds : ['default']);
      }
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      const vIds = (products[0].variants || []).map(v => v.id || v.code);
      setSelectedVariantIds(vIds);
    }
  }, [isOpen, initialProduct, initialVariant, products]);

  // When selected product changes, select all its variants by default
  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => String(p.id) === String(prodId) || p.code === prodId);
    if (prod && prod.variants) {
      setSelectedVariantIds(prod.variants.map(v => v.id || v.code));
    } else {
      setSelectedVariantIds(['default']);
    }
  };

  const currentProduct = products.find(p => String(p.id) === String(selectedProductId) || p.code === selectedProductId) || products[0];

  // Build the list of active tag items to print
  const tagItems = React.useMemo(() => {
    if (!currentProduct) return [];
    const variants = currentProduct.variants || [];
    
    if (variants.length === 0) {
      return [{
        key: `${currentProduct.code || currentProduct.id}-0`,
        code: currentProduct.code || `TB-${currentProduct.id}`,
        name: currentProduct.name,
        color: currentProduct.defaultColor || 'Standard',
        price: currentProduct.base_price || currentProduct.price,
        originalPrice: currentProduct.original_price || Math.round((currentProduct.base_price || 999) * 1.3),
        fabric: currentProduct.fabric || 'Pure Ethnic Saree',
        category: currentProduct.category || 'Sarees'
      }];
    }

    return variants
      .filter(v => selectedVariantIds.includes(v.id || v.code))
      .map((v, idx) => {
        const sareeCode = v.code || (currentProduct.code ? `${currentProduct.code}-${String(idx + 1).padStart(2, '0')}` : `TB-${v.id}`);
        return {
          key: `${v.id || v.code}-${idx}`,
          variantId: v.id,
          code: sareeCode,
          name: currentProduct.name,
          color: v.color_name || v.colorName || 'Exclusive Shade',
          colorCode: v.color_code || v.colorCode || '#073822',
          price: currentProduct.base_price || currentProduct.price,
          originalPrice: currentProduct.original_price || Math.round((currentProduct.base_price || 999) * 1.3),
          fabric: currentProduct.fabric || 'Pure Ethnic Saree',
          category: currentProduct.category || 'Sarees'
        };
      });
  }, [currentProduct, selectedVariantIds]);

  // Generate QR codes for each tag item
  useEffect(() => {
    if (!isOpen || tagItems.length === 0) return;
    let isMounted = true;

    async function loadQRs() {
      const map = {};
      for (const item of tagItems) {
        // Encode deep link URL or saree SKU
        const targetUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/#product=${encodeURIComponent(item.code)}`
          : `https://thalirboutique.in/#product=${item.code}`;
        const dataUrl = await generateQrDataUrl(targetUrl, { width: 100, margin: 0 });
        map[item.code] = dataUrl;
      }
      if (isMounted) setQrCodes(map);
    }

    loadQRs();
    return () => { isMounted = false; };
  }, [isOpen, tagItems]);

  const toggleVariant = (id) => {
    setSelectedVariantIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!currentProduct?.variants) return;
    const allIds = currentProduct.variants.map(v => v.id || v.code);
    if (selectedVariantIds.length === allIds.length) {
      setSelectedVariantIds([]);
    } else {
      setSelectedVariantIds(allIds);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:w-full">
        
        {/* Header - Hidden on Print */}
        <div className="bg-[#073822] text-white px-6 py-4 flex items-center justify-between border-b border-[#DFBA6D]/30 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-gold/30">
              <Tag className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                {language === 'ta' ? 'சேலை குறிச்சொல் & பார்-கோடு அச்சுப்பொறி' : 'Physical Boutique Tag & Barcode Printer'}
              </h2>
              <p className="text-xs text-stone-300">
                {language === 'ta'
                  ? 'ஸ்கேன் செய்யக்கூடிய QR மற்றும் Code128 பார்கோடுகளுடன் தொங்கு குறிச்சொற்கள், தெர்மல் ஸ்டிக்கர்கள் மற்றும் A4 தாள்களை அச்சிடலாம்'
                  : 'Generate printable boutique hang-tags, thermal stickers & A4 sheets with scannable QR and Code128 barcodes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={tagItems.length === 0}
              className="bg-gold hover:bg-gold-light text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-40"
            >
              <Printer className="w-4 h-4" /> {language === 'ta' ? `லேபிள்களை அச்சிடு (${tagItems.length * copiesCount} குறிச்சொற்கள்)` : `Print Labels (${tagItems.length * copiesCount} tags)`}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Columns on Desktop */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 print:block">
          
          {/* Left Column: Tag Controls & Selection (Hidden in Print) */}
          <div className="lg:col-span-4 p-5 space-y-5 bg-stone-50/70 overflow-y-auto print:hidden">
            
            {/* Format Selector */}
            <div>
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
                {language === 'ta' ? 'லேபிள் வடிவம் & தளவமைப்பு' : 'Label Format & Layout'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('hangtag')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedFormat === 'hangtag' 
                      ? 'bg-[#073822] text-white border-[#073822] shadow-sm' 
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="font-bold text-xs">{language === 'ta' ? '📇 தொங்கு அட்டை' : '📇 Hang Tag'}</span>
                  <span className={`text-[10px] ${selectedFormat === 'hangtag' ? 'text-gold' : 'text-stone-400'}`}>Luxury Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat('thermal')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedFormat === 'thermal' 
                      ? 'bg-[#073822] text-white border-[#073822] shadow-sm' 
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="font-bold text-xs">{language === 'ta' ? '🏷️ தெர்மல்' : '🏷️ Thermal'}</span>
                  <span className={`text-[10px] ${selectedFormat === 'thermal' ? 'text-gold' : 'text-stone-400'}`}>50x30mm Roll</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat('a4sheet')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedFormat === 'a4sheet' 
                      ? 'bg-[#073822] text-white border-[#073822] shadow-sm' 
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="font-bold text-xs">{language === 'ta' ? '📑 A4 தாள்' : '📑 A4 Sheet'}</span>
                  <span className={`text-[10px] ${selectedFormat === 'a4sheet' ? 'text-gold' : 'text-stone-400'}`}>24 Per Page</span>
                </button>
              </div>
            </div>

            {/* Product Selector */}
            <div>
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                {language === 'ta' ? 'சேலை வடிவமைப்பைத் தேர்ந்தெடுக்கவும்' : 'Select Saree Design'}
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} (₹{p.base_price || p.price})
                  </option>
                ))}
              </select>
            </div>

            {/* Variant / Saree Code Checkbox List */}
            {currentProduct && currentProduct.variants && currentProduct.variants.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {language === 'ta' ? 'சேலை குறியீடுகள்' : 'Saree Codes'} ({selectedVariantIds.length}/{currentProduct.variants.length})
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                  >
                    {selectedVariantIds.length === currentProduct.variants.length
                      ? (language === 'ta' ? 'அனைத்தையும் நீக்கு' : 'Deselect All')
                      : (language === 'ta' ? 'அனைத்தையும் தேர்ந்தெடு' : 'Select All')}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-stone-200">
                  {currentProduct.variants.map((v, idx) => {
                    const sareeCode = v.code || (currentProduct.code ? `${currentProduct.code}-${String(idx + 1).padStart(2, '0')}` : `TB-${v.id}`);
                    const isChecked = selectedVariantIds.includes(v.id || v.code);

                    return (
                      <div
                        key={v.id || idx}
                        onClick={() => toggleVariant(v.id || v.code)}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-primary/5 text-stone-900 font-semibold' : 'hover:bg-stone-50 text-stone-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-300 shrink-0" />
                          )}
                          <span 
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: v.color_code || v.colorCode || '#000' }}
                          />
                          <span className="font-mono font-bold">{sareeCode}</span>
                        </div>
                        <span className="text-[11px] text-stone-500 truncate max-w-[110px]">
                          {v.color_name || v.colorName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Copies & Toggles */}
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">
                  {language === 'ta' ? 'ஒரு குறிச்சொல்லுக்கான பிரதிகள்:' : 'Copies Per Tag:'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCopiesCount(Math.max(1, copiesCount - 1))}
                    className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm w-6 text-center">{copiesCount}</span>
                  <button
                    type="button"
                    onClick={() => setCopiesCount(copiesCount + 1)}
                    className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>{language === 'ta' ? 'விற்பனை விலையைக் காட்டு' : 'Show Selling Price'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                  <input
                    type="checkbox"
                    checked={showQr}
                    onChange={(e) => setShowQr(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>{language === 'ta' ? 'QR குறியீட்டைக் காட்டு' : 'Show QR Code'}</span>
                </label>
              </div>
            </div>

            {/* Print Instructions */}
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1 text-amber-800">
                <Scissors className="w-3.5 h-3.5" /> {language === 'ta' ? 'குறிச்சொல் அச்சிடும் குறிப்பு:' : 'Boutique Tag Printing Tip:'}
              </span>
              <p>
                {language === 'ta'
                  ? 'அச்சு உரையாடலில் "Save as PDF" அல்லது உங்கள் தெர்மல் பிரிண்டரைத் தேர்ந்தெடுக்கவும். சுத்தமான விளிம்புகளுக்கு "Headers and Footers" ஐ தேர்வுநீக்கவும்.'
                  : 'In the print dialog, select "Save as PDF" or your thermal label printer. Uncheck "Headers and Footers" for clean edges.'}
              </p>
            </div>

          </div>

          {/* Right Column: Live Printable Preview */}
          <div className="lg:col-span-8 p-6 bg-stone-100 overflow-y-auto flex flex-col items-center print:bg-white print:p-0 print:m-0 print:w-full">
            
            <div className="w-full mb-3 flex items-center justify-between text-xs text-stone-500 font-medium print:hidden">
              <span>{language === 'ta' ? 'முன்னோட்டம்:' : 'Previewing:'} <strong className="text-stone-800">{tagItems.length * copiesCount} {language === 'ta' ? 'குறிச்சொற்கள்' : 'Label(s)'}</strong></span>
              <span className="text-[11px] bg-white px-2.5 py-1 rounded-md border border-stone-200 font-mono">
                {selectedFormat === 'hangtag' ? (language === 'ta' ? 'தொங்கு அட்டை (60mm x 95mm)' : 'Hang Tag (60mm x 95mm)') : selectedFormat === 'thermal' ? (language === 'ta' ? 'தெர்மல் (50mm x 30mm)' : 'Thermal (50mm x 30mm)') : (language === 'ta' ? 'A4 தாள் (3 x 8)' : 'A4 Sheet (3 x 8)')}
              </span>
            </div>

            {/* Print Container with custom media styling */}
            <div 
              ref={printRef}
              className={`print-sheet ${selectedFormat === 'hangtag' ? 'flex flex-wrap gap-4 justify-center' : selectedFormat === 'thermal' ? 'flex flex-col gap-3 items-center' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full'}`}
            >
              {tagItems.flatMap((item) => 
                Array.from({ length: copiesCount }).map((_, cIdx) => (
                  <SingleTagPreview
                    key={`${item.key}-copy-${cIdx}`}
                    item={item}
                    format={selectedFormat}
                    showPrice={showPrice}
                    showMrp={showMrp}
                    showQr={showQr}
                    qrDataUrl={qrCodes[item.code]}
                  />
                ))
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Embedded Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-sheet, .print-sheet * {
            visibility: visible;
          }
          .print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          @page {
            margin: 4mm;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Single Tag Renderer based on selected format
 */
const SingleTagPreview = ({ item, format, showPrice, showMrp, showQr, qrDataUrl }) => {
  const barcode = generateBarcodeSvgPath(item.code, format === 'thermal' ? 1.5 : 2, format === 'thermal' ? 32 : 44);

  // FORMAT 1: Luxury Boutique Hang Tag (Jewelry/Saree Tag)
  if (format === 'hangtag') {
    return (
      <div className="w-[230px] h-[360px] bg-white rounded-2xl border-2 border-stone-800 p-3.5 flex flex-col justify-between shadow-md print:shadow-none print:border-stone-900 relative break-inside-avoid">
        {/* Punch Hole Guide */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-dashed border-stone-400 bg-stone-50 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 inline-block" />
        </div>

        {/* Brand Header */}
        <div className="pt-3 text-center border-b border-stone-200 pb-2">
          <div className="font-serif font-black text-sm tracking-wider text-[#073822] uppercase">
            Thalir Boutique
          </div>
          <div className="text-[8px] text-stone-500 uppercase tracking-widest font-semibold">
            Veppadai, Namakkal • Tamil Nadu
          </div>
        </div>

        {/* Saree Code (SKU) Prominent */}
        <div className="text-center py-1 bg-stone-50 rounded-lg border border-stone-200">
          <div className="text-[8px] uppercase tracking-wider text-stone-400 font-bold">Saree SKU Code</div>
          <div className="font-mono font-extrabold text-sm text-[#073822] tracking-wider">
            {item.code}
          </div>
        </div>

        {/* Specs Table */}
        <div className="text-[10px] space-y-1 text-stone-700">
          <div className="line-clamp-1 font-semibold text-stone-900">{item.name}</div>
          <div className="flex justify-between">
            <span className="text-stone-400">Color:</span>
            <span className="font-semibold text-stone-800">{item.color}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Fabric:</span>
            <span className="font-semibold text-stone-800">{item.fabric}</span>
          </div>
        </div>

        {/* Barcode & QR Code */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200">
          {showQr && qrDataUrl ? (
            <div className="shrink-0 text-center">
              <img src={qrDataUrl} alt="QR Code" className="w-14 h-14 object-contain rounded border border-stone-200 p-0.5" />
              <span className="text-[7px] text-stone-400 block mt-0.5">Scan to View</span>
            </div>
          ) : null}

          {/* Code128 Linear Barcode */}
          <div className="flex-1 flex flex-col items-center overflow-hidden">
            <svg 
              viewBox={`0 0 ${barcode.width} ${barcode.height}`}
              className="w-full h-8 max-w-[130px]"
              preserveAspectRatio="none"
            >
              <path d={barcode.path} fill="#000000" />
            </svg>
            <span className="font-mono text-[9px] text-stone-700 tracking-wider font-bold">
              *{item.code}*
            </span>
          </div>
        </div>

        {/* Price & Guarantee Footer */}
        {showPrice && (
          <div className="pt-2 border-t-2 border-dashed border-stone-200 flex items-center justify-between">
            <div>
              {showMrp && (
                <span className="text-[9px] text-stone-400 line-through mr-1 font-medium">
                  MRP ₹{item.originalPrice}
                </span>
              )}
              <div className="font-serif font-black text-base text-[#073822]">
                ₹{Number(item.price).toLocaleString('en-IN')}
              </div>
            </div>
            <span className="text-[8px] font-bold text-stone-500 uppercase bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
              Incl. GST
            </span>
          </div>
        )}
      </div>
    );
  }

  // FORMAT 2: Thermal Barcode Sticker (50mm x 30mm / 2" x 1")
  if (format === 'thermal') {
    return (
      <div className="w-[200px] h-[120px] bg-white border border-black p-2 flex flex-col justify-between text-black font-sans shadow-xs print:shadow-none break-inside-avoid">
        <div className="flex items-center justify-between border-b border-black/40 pb-0.5">
          <span className="font-bold text-[9px] uppercase tracking-wide">THALIR BOUTIQUE</span>
          <span className="font-mono font-extrabold text-[10px]">{item.code}</span>
        </div>

        <div className="flex items-center justify-between gap-1 my-0.5">
          <div className="text-[8px] leading-tight overflow-hidden max-w-[110px]">
            <div className="font-bold truncate">{item.name}</div>
            <div className="text-stone-700">{item.color} • {item.fabric}</div>
            {showPrice && (
              <div className="font-black text-xs mt-0.5">₹{Number(item.price).toLocaleString('en-IN')}</div>
            )}
          </div>

          {showQr && qrDataUrl && (
            <img src={qrDataUrl} alt="QR" className="w-10 h-10 shrink-0" />
          )}
        </div>

        {/* Code128 Barcode */}
        <div className="flex flex-col items-center">
          <svg 
            viewBox={`0 0 ${barcode.width} ${barcode.height}`}
            className="w-full h-5 max-w-[170px]"
            preserveAspectRatio="none"
          >
            <path d={barcode.path} fill="#000000" />
          </svg>
          <span className="font-mono text-[8px] font-bold tracking-widest leading-none mt-0.5">
            {item.code}
          </span>
        </div>
      </div>
    );
  }

  // FORMAT 3: Standard A4 Sheet Label (24 per page / 3 columns)
  return (
    <div className="bg-white rounded-xl border border-stone-300 p-3 flex flex-col justify-between text-stone-800 shadow-xs print:shadow-none print:border-black break-inside-avoid min-h-[140px]">
      <div className="flex justify-between items-start border-b border-stone-200 pb-1">
        <div>
          <span className="font-serif font-black text-xs text-[#073822] uppercase tracking-wide block">
            Thalir Boutique
          </span>
          <span className="text-[10px] font-bold text-stone-800 line-clamp-1">{item.name}</span>
        </div>
        <span className="font-mono font-extrabold text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
          {item.code}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 py-1 text-[10px]">
        <div>
          <div>Color: <strong className="text-stone-900">{item.color}</strong></div>
          <div>Fabric: <span className="text-stone-600">{item.fabric}</span></div>
          {showPrice && (
            <div className="font-serif font-bold text-sm text-[#073822] mt-0.5">
              ₹{Number(item.price).toLocaleString('en-IN')}
            </div>
          )}
        </div>

        {showQr && qrDataUrl && (
          <img src={qrDataUrl} alt="QR" className="w-11 h-11 shrink-0 rounded border border-stone-200 p-0.5" />
        )}
      </div>

      <div className="flex flex-col items-center pt-1 border-t border-stone-200">
        <svg 
          viewBox={`0 0 ${barcode.width} ${barcode.height}`}
          className="w-full h-6 max-w-[150px]"
          preserveAspectRatio="none"
        >
          <path d={barcode.path} fill="#000000" />
        </svg>
        <span className="font-mono text-[8px] text-stone-600 tracking-wider">
          *{item.code}*
        </span>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Boxes, AlertTriangle, ArrowUpDown, Plus, Minus, Search, 
  CheckCircle2, RefreshCw, Layers, Sparkles, Filter, ShoppingBag, Eye, XCircle,
  ZoomIn, X, Tag, Bell, MessageCircle, Printer, Edit3, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { BoutiqueTagPrinterModal } from './BoutiqueTagPrinterModal';
import { ProductEditModal } from './ProductEditModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const InventoryManager = () => {
  const { showToast, language, products, deleteProduct } = useStore();
  const [inventory, setInventory] = useState({ products: [], total_products: 0, total_units: 0, low_stock_count: 0, sold_out_count: 0, total_views: 0 });
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterSoldOut, setFilterSoldOut] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  // Modify & Delete Modals State
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Boutique Tag Printing State
  const [isTagPrinterOpen, setIsTagPrinterOpen] = useState(false);
  const [tagPrintProduct, setTagPrintProduct] = useState(null);
  const [tagPrintVariant, setTagPrintVariant] = useState(null);

  // Restock Notification Requests State
  const [restockRequests, setRestockRequests] = useState([]);
  const [showRestockDrawer, setShowRestockDrawer] = useState(false);
  const [updatingRestockId, setUpdatingRestockId] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setZoomImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [res, restockRes] = await Promise.allSettled([
        api.getInventory(),
        api.getRestockRequests()
      ]);

      if (res.status === 'fulfilled' && res.value) {
        setInventory(res.value);
      }
      if (restockRes.status === 'fulfilled' && restockRes.value) {
        setRestockRequests(restockRes.value);
      }
    } catch (err) {
      console.warn('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRestockNotified = async (reqId) => {
    setUpdatingRestockId(reqId);
    try {
      await api.updateRestockRequest(reqId, 'Notified');
      if (showToast) showToast('Restock alert marked as notified! ✅');
      setRestockRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Notified' } : r));
    } catch (e) {
      if (showToast) showToast('Failed to update status');
    } finally {
      setUpdatingRestockId(null);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockDelta = async (variantId, delta) => {
    setUpdatingId(variantId);
    try {
      await api.updateInventoryStock({ variant_id: variantId, delta });
      if (showToast) showToast(`Stock updated! (${delta > 0 ? `+${delta}` : delta} units)`);
      fetchInventory();
    } catch (err) {
      if (showToast) showToast('Failed to update stock.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = (inventory.products || []).filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = !filterLowStock || p.is_low_stock;
    const matchesSoldOut = !filterSoldOut || p.is_sold_out || p.stock_qty <= 0;
    return matchesSearch && matchesLowStock && matchesSoldOut;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Inventory KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              {language === 'ta' ? 'மொத்த வடிவமைப்புகள்' : 'Total Designs'}
            </span>
            <div className="text-2xl font-serif font-extrabold text-[#073822] mt-1">
              {inventory.total_products} {language === 'ta' ? 'தயாரிப்புகள்' : 'Products'}
            </div>
            <span className="text-[11px] text-stone-400">
              {language === 'ta' ? 'விற்பனையில் உள்ள சேலைகள்' : 'Active catalog items'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              {language === 'ta' ? 'கையிருப்பு இருப்பு' : 'Total Physical Stock'}
            </span>
            <div className="text-2xl font-serif font-extrabold text-[#073822] mt-1">
              {inventory.total_units} {language === 'ta' ? 'எண்ணிக்கை' : 'Units'}
            </div>
            <span className="text-[11px] text-stone-400">
              {language === 'ta' ? 'நேரடி சேமிப்புக் கிடங்கு இருப்பு' : 'In-hand physical inventory'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gold/20 text-[#073822] flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              {language === 'ta' ? 'விற்றுத் தீர்ந்தவை' : 'Sold Out Products'}
            </span>
            <div className="text-2xl font-serif font-extrabold text-rose-700 mt-1">
              {inventory.sold_out_count ?? (inventory.products || []).filter(p => p.is_sold_out || p.stock_qty <= 0).length} {language === 'ta' ? 'பொருட்கள்' : 'Items'}
            </div>
            <span className="text-[11px] text-stone-400">
              {language === 'ta' ? 'இருப்பு இல்லை (0 Stock)' : '0 stock available'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              {language === 'ta' ? 'பார்வையிட்டவர்கள்' : 'Total Product Views'}
            </span>
            <div className="text-2xl font-serif font-extrabold text-blue-700 mt-1">
              {inventory.total_views ?? (inventory.products || []).reduce((acc, p) => acc + (p.views_count || 0), 0)} {language === 'ta' ? 'பார்வைகள்' : 'Views'}
            </div>
            <span className="text-[11px] text-stone-400">
              {language === 'ta' ? 'வாடிக்கையாளர் பார்வை எண்ணிக்கை' : 'Customer views & impressions'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'ta' ? 'தயாரிப்பு குறியீடு அல்லது பெயரைத் தேடுங்கள்...' : 'Search product code or title...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          {/* Print Saree Tags Button */}
          <button
            type="button"
            onClick={() => {
              setTagPrintProduct(filteredProducts[0] || null);
              setTagPrintVariant(null);
              setIsTagPrinterOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#073822] hover:bg-[#0a4d2f] text-white flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer"
            title="Generate printable boutique hang-tags, thermal stickers & barcodes"
          >
            <Tag className="w-4 h-4 text-gold" />
            <span>{language === 'ta' ? 'விலைப்பட்டியல் அச்சிடு' : 'Print Saree Tags'}</span>
          </button>

          {/* Restock Alerts Button */}
          <button
            type="button"
            onClick={() => setShowRestockDrawer(true)}
            className="relative px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-stone-200 hover:border-stone-300 text-stone-800 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="View customer WhatsApp restock requests"
          >
            <Bell className="w-4 h-4 text-primary" />
            <span>{language === 'ta' ? 'மறுஇருப்பு கோரிக்கைகள்' : 'Restock Alerts'}</span>
            {restockRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {restockRequests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setFilterSoldOut(!filterSoldOut);
              if (!filterSoldOut) setFilterLowStock(false);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterSoldOut
                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>{filterSoldOut 
              ? (language === 'ta' ? 'விற்றுத் தீர்ந்தவை (0 Stock)' : 'Showing Sold Out (0 Stock)')
              : (language === 'ta' ? 'விற்றுத் தீர்ந்தவை வடிகட்டு' : 'Filter Sold Out')}</span>
          </button>

          <button
            onClick={() => {
              setFilterLowStock(!filterLowStock);
              if (!filterLowStock) setFilterSoldOut(false);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterLowStock
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{filterLowStock 
              ? (language === 'ta' ? 'குறைந்த இருப்பு (< 5)' : 'Showing Low Stock (< 5)')
              : (language === 'ta' ? 'குறைந்த இருப்பு வடிகட்டு' : 'Filter Low Stock')}</span>
          </button>

          <button
            onClick={fetchInventory}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer"
            title={language === 'ta' ? 'இருப்பை புதுப்பிக்கவும்' : 'Refresh Inventory'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <th className="py-3.5 px-4">{language === 'ta' ? 'தயாரிப்பு & SKU' : 'Product & SKU'}</th>
                <th className="py-3.5 px-4">{language === 'ta' ? 'பிரிவு' : 'Category'}</th>
                <th className="py-3.5 px-4">{language === 'ta' ? 'விற்பனை விலை' : 'Selling Price'}</th>
                <th className="py-3.5 px-4">{language === 'ta' ? 'குறியீடு, புகைப்படம் & வண்ண இருப்பு' : 'Saree Codes, Photos & Stock Levels'}</th>
                <th className="py-3.5 px-4 text-center">{language === 'ta' ? 'மொத்த இருப்பு' : 'Total In Stock'}</th>
                <th className="py-3.5 px-4 text-center">{language === 'ta' ? 'பார்வைகள்' : 'User Views'}</th>
                <th className="py-3.5 px-4 text-center">{language === 'ta' ? 'நிலை' : 'Status'}</th>
                <th className="py-3.5 px-4 text-center">{language === 'ta' ? 'நடவடிக்கைகள்' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    {language === 'ta' ? 'பூட்டிக் சரக்கு இருப்பு ஏற்றப்படுகிறது...' : 'Loading boutique inventory...'}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    {language === 'ta' ? 'வடிகட்டிகளுக்கு தயாரிப்புகள் எதுவும் கிடைக்கவில்லை.' : 'No products found matching filters.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {prod.image && (
                          <button
                            type="button"
                            onClick={() => setZoomImage({
                              url: prod.image,
                              code: prod.code,
                              name: prod.name,
                              price: prod.base_price,
                              stockQty: prod.stock_qty,
                              category: prod.category
                            })}
                            className="relative w-10 h-10 rounded-xl overflow-hidden border border-stone-200 shrink-0 cursor-zoom-in bg-stone-100 hover:ring-2 hover:ring-primary/40 transition-all group/pimg shadow-2xs"
                            title={language === 'ta' ? 'படத்தை பெரிதாக்க கிளிக் செய்யவும்' : 'Click to Zoom product'}
                          >
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/pimg:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow" />
                            </div>
                          </button>
                        )}
                        <div>
                          <strong className="text-stone-900 block font-semibold text-sm">{prod.name}</strong>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-primary font-bold">{prod.code}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setTagPrintProduct(prod);
                                setTagPrintVariant(null);
                                setIsTagPrinterOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-1.5 py-0.5 rounded border border-stone-200 cursor-pointer transition-colors"
                              title="Print Saree Barcode & Price Tags"
                            >
                              <Tag className="w-2.5 h-2.5 text-primary" /> {language === 'ta' ? 'லேபிள் அச்சிடு' : 'Print Tags'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      ₹{prod.base_price.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-2.5">
                        {prod.variants?.map((v, idx) => {
                          const itemCode = v.code || (prod.code ? `${prod.code}-${String(idx + 1).padStart(2, '0')}` : `TB-${v.id}`);
                          const imgSrc = v.image_url || prod.image;

                          return (
                            <div 
                              key={v.id} 
                              className="group flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-stone-50 hover:bg-stone-100/90 border border-stone-200 text-xs shadow-2xs transition-all hover:border-stone-300"
                            >
                              {/* Tiny Picture of Saree (Click to Zoom) */}
                              <button
                                type="button"
                                onClick={() => setZoomImage({
                                  url: imgSrc,
                                  code: itemCode,
                                  name: prod.name,
                                  colorName: v.color_name,
                                  colorCode: v.color_code,
                                  stockQty: v.stock_qty,
                                  variantId: v.id,
                                  price: prod.base_price,
                                  category: prod.category
                                })}
                                className="relative w-8 h-8 rounded-lg overflow-hidden border border-stone-200 shrink-0 cursor-zoom-in bg-stone-100 transition-transform hover:scale-105 active:scale-95 shadow-2xs group/vimg"
                                title={`Click to Zoom saree: ${itemCode}`}
                              >
                                {imgSrc ? (
                                  <img 
                                    src={imgSrc} 
                                    alt={itemCode} 
                                    className="w-full h-full object-cover" 
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[11px] text-stone-400 font-mono">
                                    📷
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/vimg:opacity-100 transition-opacity flex items-center justify-center">
                                  <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow" />
                                </div>
                              </button>

                              {/* Saree Code & Stock */}
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block shrink-0" 
                                    style={{ backgroundColor: v.color_code }} 
                                    title={v.color_name}
                                  />
                                  <span className="font-mono font-bold text-stone-800 tracking-tight text-[11px] sm:text-xs">
                                    {itemCode}:
                                  </span>
                                  <span className={`font-mono font-bold ${v.stock_qty <= 0 ? 'text-rose-700' : (v.stock_qty < 5 ? 'text-amber-700' : 'text-emerald-700')}`}>
                                    {v.stock_qty}
                                  </span>
                                </div>
                                <span className="text-[10px] text-stone-400 truncate max-w-[95px] leading-tight">
                                  {v.color_name}
                                </span>
                              </div>
                              
                              {/* Fast adjust stock */}
                              <div className="flex items-center gap-0.5 ml-1">
                                <button
                                  onClick={() => handleStockDelta(v.id, -1)}
                                  disabled={updatingId === v.id || v.stock_qty <= 0}
                                  className="w-4 h-4 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center text-[10px] font-bold cursor-pointer disabled:opacity-40 transition-colors"
                                  title="Decrease stock -1"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => handleStockDelta(v.id, 1)}
                                  disabled={updatingId === v.id}
                                  className="w-4 h-4 rounded bg-[#073822] hover:bg-[#0a4d2f] text-white flex items-center justify-center text-[10px] font-bold cursor-pointer disabled:opacity-40 transition-colors"
                                  title="Add stock +1 (Restock)"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTagPrintProduct(prod);
                                    setTagPrintVariant(v);
                                    setIsTagPrinterOpen(true);
                                  }}
                                  className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-[9px] cursor-pointer transition-colors border border-stone-200 ml-0.5"
                                  title={`Print physical boutique tag for ${itemCode}`}
                                >
                                  🏷️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-mono text-base font-extrabold ${prod.stock_qty <= 0 ? 'text-rose-700' : 'text-[#073822]'}`}>
                        {prod.stock_qty}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>{prod.views_count || 0}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {(prod.is_sold_out || prod.stock_qty <= 0) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" /> {language === 'ta' ? 'தீர்ந்தது' : 'Sold Out'}
                        </span>
                      ) : prod.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> {language === 'ta' ? 'குறைவு' : 'Low Stock'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {language === 'ta' ? 'இருப்பு உள்ளது' : 'Healthy'}
                        </span>
                      )}
                    </td>

                    {/* Actions: Modify & Delete Product */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const matched = (products || []).find(p => String(p.id) === String(prod.id) || String(p.code).toUpperCase() === String(prod.code).toUpperCase() || (prod.db_id && p.dbId === prod.db_id)) || prod;
                            setEditingProduct(matched);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#073822] hover:bg-[#0a4d2f] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-1 cursor-pointer"
                          title="Modify Product Details, Prices & Variants"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-gold" />
                          <span>{language === 'ta' ? 'மாற்று' : 'Modify'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProduct(prod)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-1 cursor-pointer"
                          title="Delete Product Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'ta' ? 'நீக்கு' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saree Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomImage(null)}
        >
          <div 
            className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-100 flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/80">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#073822] text-white font-mono font-bold text-xs tracking-wider shadow-xs">
                  {zoomImage.code}
                </span>
                <span className="text-xs font-semibold text-stone-700 truncate max-w-[200px]">
                  {zoomImage.name}
                </span>
              </div>
              <button
                onClick={() => setZoomImage(null)}
                className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Zoomed Saree Image */}
            <div className="relative bg-stone-950 flex items-center justify-center overflow-hidden max-h-[65vh]">
              {zoomImage.url ? (
                <img 
                  src={zoomImage.url} 
                  alt={zoomImage.code}
                  className="w-full h-full max-h-[65vh] object-contain select-none transition-transform duration-300"
                />
              ) : (
                <div className="py-24 text-stone-400 text-center">
                  No image preview available for this saree
                </div>
              )}
            </div>

            {/* Modal Footer / Details & Stock Control */}
            <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
              <div className="flex items-center gap-2.5">
                {zoomImage.colorCode && (
                  <span 
                    className="w-4 h-4 rounded-full border border-black/20 shadow-xs inline-block shrink-0"
                    style={{ backgroundColor: zoomImage.colorCode }}
                    title={zoomImage.colorName}
                  />
                )}
                <div>
                  <div className="text-xs font-bold text-stone-800">{zoomImage.colorName || zoomImage.code}</div>
                  {zoomImage.price && (
                    <div className="text-[11px] font-semibold text-emerald-800">₹{zoomImage.price.toLocaleString('en-IN')}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    {language === 'ta' ? 'தற்போதைய இருப்பு' : 'Current Stock'}
                  </div>
                  <div className={`font-mono font-extrabold text-sm ${zoomImage.stockQty <= 0 ? 'text-rose-600' : 'text-[#073822]'}`}>
                    {zoomImage.stockQty} {language === 'ta' ? 'இருப்பில் உள்ளது' : 'in stock'}
                  </div>
                </div>

                {zoomImage.variantId && (
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 shadow-2xs">
                    <button
                      onClick={async () => {
                        await handleStockDelta(zoomImage.variantId, -1);
                        setZoomImage(prev => prev ? ({ ...prev, stockQty: Math.max(0, prev.stockQty - 1) }) : null);
                      }}
                      disabled={updatingId === zoomImage.variantId || zoomImage.stockQty <= 0}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40 transition-colors"
                      title={language === 'ta' ? 'இருப்பை குறைக்க -1' : 'Decrease stock -1'}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        await handleStockDelta(zoomImage.variantId, 1);
                        setZoomImage(prev => prev ? ({ ...prev, stockQty: prev.stockQty + 1 }) : null);
                      }}
                      disabled={updatingId === zoomImage.variantId}
                      className="w-7 h-7 rounded-lg bg-[#073822] hover:bg-[#0a4d2f] text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40 transition-colors"
                      title={language === 'ta' ? 'இருப்பை அதிகரிக்க +1' : 'Add stock +1 (Restock)'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saree Boutique Physical Tag & Barcode Printer Modal */}
      {isTagPrinterOpen && (
        <BoutiqueTagPrinterModal
          isOpen={isTagPrinterOpen}
          onClose={() => {
            setIsTagPrinterOpen(false);
            setTagPrintProduct(null);
            setTagPrintVariant(null);
          }}
          products={inventory.products || []}
          initialProduct={tagPrintProduct}
          initialVariant={tagPrintVariant}
        />
      )}

      {/* Customer Restock Alerts & Notification Drawer */}
      {showRestockDrawer && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowRestockDrawer(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="bg-[#073822] text-white px-6 py-4 flex items-center justify-between border-b border-[#DFBA6D]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-gold border border-gold/30">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                    {language === 'ta' ? 'வாடிக்கையாளர் மறுஇருப்பு எச்சரிக்கைகள்' : 'Customer Restock Alerts'} ({restockRequests.length})
                  </h3>
                  <p className="text-xs text-stone-300">
                    {language === 'ta'
                      ? 'தீர்ந்துபோன சேலைகளுக்கு காத்திருக்கும் வாடிக்கையாளர்கள். இருப்பு வந்ததும் வாட்ஸ்அப் அறிவிப்பு அனுப்பவும்!'
                      : 'Customers waiting for sold-out sarees to be restocked. Send instant WhatsApp alerts when ready!'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRestockDrawer(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Requests */}
            <div className="p-6 overflow-y-auto space-y-3.5 bg-stone-50 flex-1">
              {restockRequests.length === 0 ? (
                <div className="py-16 text-center text-stone-400 space-y-2">
                  <Bell className="w-10 h-10 mx-auto text-stone-300 stroke-1" />
                  <p className="text-sm font-semibold">
                    {language === 'ta' ? 'தற்போது நிலுவையில் உள்ள மறுஇருப்பு கோரிக்கைகள் இல்லை.' : 'No pending restock requests right now.'}
                  </p>
                  <p className="text-xs">
                    {language === 'ta' ? 'சேலை தீர்ந்துபோன போது வாடிக்கையாளர்கள் "Notify Me" கிளிக் செய்தால் இங்கு தோன்றும்!' : 'When shoppers click "Notify Me" on sold-out sarees, they will appear here!'}
                  </p>
                </div>
              ) : (
                restockRequests.map((req) => {
                  const isPending = req.status === 'Pending';
                  const waRestockMsg = encodeURIComponent(
                    `Hello ${req.customer_name || 'valued customer'}! 🌸\n` +
                    `Great news from *Thalir Boutique*! The saree design you requested is now *BACK IN STOCK*:\n\n` +
                    `• *Saree SKU:* ${req.variant_code || req.product_code}\n` +
                    `• *Design:* ${req.product_name}\n` +
                    `• *Color:* ${req.color_name || 'Exclusive Shade'}\n\n` +
                    `Since exclusive handloom pieces sell out quickly, secure yours now on our store:\n` +
                    `${typeof window !== 'undefined' ? window.location.origin : 'https://thalirboutique.in'}/#product=${encodeURIComponent(req.variant_code || req.product_code)}\n\n` +
                    `Thank you for shopping with Thalir Boutique!`
                  );
                  const waUrl = `https://wa.me/91${req.phone}?text=${waRestockMsg}`;

                  return (
                    <div 
                      key={req.id}
                      className={`p-4 rounded-2xl bg-white border transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isPending ? 'border-amber-200 hover:border-amber-300' : 'border-stone-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          {req.product_image ? (
                            <img src={req.product_image} alt={req.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">📷</div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                              {req.variant_code || req.product_code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                              {language === 'ta' ? (isPending ? 'நிலுவையில்' : 'அறிவிக்கப்பட்டது') : req.status}
                            </span>
                          </div>

                          <h4 className="font-bold text-stone-900 text-xs sm:text-sm mt-1">{req.product_name}</h4>
                          <p className="text-xs text-stone-600">
                            {language === 'ta' ? 'வண்ணம்:' : 'Color:'} <strong className="text-stone-800">{req.color_name || 'Standard'}</strong> • {language === 'ta' ? 'தேதி:' : 'Requested on'} {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-xs text-stone-700 font-semibold mt-0.5 flex items-center gap-2">
                            <span>👤 {req.customer_name || (language === 'ta' ? 'வாடிக்கையாளர்' : 'Shopper')}</span>
                            <span>•</span>
                            <span className="font-mono text-primary font-bold">📞 +91 {req.phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleMarkRestockNotified(req.id)}
                          className="bg-whatsapp hover:bg-whatsapp-dark text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all no-underline"
                          title="Open WhatsApp to send restock alert message"
                        >
                          <MessageCircle className="w-4 h-4 fill-white" />
                          <span>{language === 'ta' ? 'வாட்ஸ்அப் தகவல்' : 'WhatsApp Alert'}</span>
                        </a>

                        {isPending ? (
                          <button
                            onClick={() => handleMarkRestockNotified(req.id)}
                            disabled={updatingRestockId === req.id}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 transition-colors cursor-pointer"
                          >
                            {language === 'ta' ? 'அனுப்பியதாக குறிக்க' : 'Mark Notified'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 px-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {language === 'ta' ? 'அனுப்பப்பட்டது' : 'Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <span>{restockRequests.filter(r => r.status === 'Pending').length} {language === 'ta' ? 'நிலுவையில் உள்ள கோரிக்கைகள்' : 'Pending Restock Request(s)'}</span>
              <button
                onClick={() => setShowRestockDrawer(false)}
                className="font-bold text-stone-700 hover:text-stone-950 px-4 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer"
              >
                {language === 'ta' ? 'மூடுக' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Product Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          isOpen={Boolean(editingProduct)}
          onClose={() => {
            setEditingProduct(null);
            fetchInventory();
          }}
        />
      )}

      {/* Confirm Delete Product Modal */}
      {deletingProduct && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingProduct)}
          title={language === 'ta' ? 'தயாரிப்பை நீக்கு' : 'Delete Product'}
          itemName={deletingProduct.name}
          itemDetails={`SKU: #${deletingProduct.code} • Base Price: ₹${deletingProduct.base_price}`}
          itemImage={deletingProduct.image}
          warningText={language === 'ta' ? `"${deletingProduct.name}" தயாரிப்பை நிரந்தரமாக நீக்க விரும்புகிறீர்களா? இது உங்கள் பட்டியல் மற்றும் தரவுத்தளத்திலிருந்து அகற்றப்படும்.` : `Are you sure you want to permanently delete "${deletingProduct.name}"? It will be removed from your catalog and database.`}
          confirmBtnText={language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete Product'}
          onConfirm={async () => {
            await deleteProduct(deletingProduct.id);
            setDeletingProduct(null);
            fetchInventory();
          }}
          onClose={() => setDeletingProduct(null)}
        />
      )}

    </div>
  );
};

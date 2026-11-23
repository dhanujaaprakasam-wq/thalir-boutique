import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, ShoppingBag, Zap, MessageCircle, Truck, ShieldCheck, RefreshCw, 
  Edit3, Trash2, Eye, Bell, Share2, Heart, ChevronLeft, ChevronRight, 
  Camera, Star, Upload, CheckCircle2, Image as ImageIcon 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import { ProductEditModal } from './ProductEditModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { RestockNotifyModal } from './RestockNotifyModal';
import { ShareProductModal } from './ShareProductModal';

export const ProductDetailModal = () => {
  const {
    selectedProductForModal,
    setSelectedProductForModal,
    products,
    addToCart,
    buyNow,
    setIsCheckoutOpen,
    toggleWishlist,
    isWishlisted,
    storeInfo,
    isAdminDemoMode,
    deleteProduct,
    recordWhatsAppInquiry,
    user,
    language,
    setIsAuthModalOpen,
    showToast,
    isStoreAdminMode = false
  } = useStore();

  const product = products?.find(p => 
    (selectedProductForModal?.id && (p.id === selectedProductForModal.id || p.code === selectedProductForModal.id)) ||
    (selectedProductForModal?.code && (p.code === selectedProductForModal.code || p.id === selectedProductForModal.code)) ||
    (p.dbId && selectedProductForModal?.dbId && p.dbId === selectedProductForModal.dbId)
  ) || selectedProductForModal;

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(() => product?.sizes ? product.sizes[0] : null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const allVariants = product?.variants || [];
  const availableVariants = allVariants.length > 0 ? allVariants : [];
  const activeVariant = availableVariants[selectedVariantIndex] || availableVariants[0] || null;

  // Customer Product Reviews with Photo Uploads
  const [reviewsData, setReviewsData] = useState({ reviews: [], total_reviews: 0, average_rating: 5.0 });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewerName, setReviewerName] = useState(user?.name || '');
  const [reviewerLocation, setReviewerLocation] = useState('Namakkal');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImage, setReviewImage] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const reviewFileRef = useRef(null);

  useEffect(() => {
    if (!product) return;
    const pCode = product.code || product.id;
    setLoadingReviews(true);
    api.getProductReviews(pCode)
      .then(res => {
        if (res && res.reviews) {
          setReviewsData(res);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [product?.id, product?.code]);

  const handleReviewPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReviewImage(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      if (showToast) showToast('Please write a comment for your review.');
      return;
    }
    setSubmittingReview(true);
    try {
      const pCode = product.code || product.id;
      const res = await api.submitProductReview(pCode, {
        name: reviewerName || user?.name || 'Boutique Customer',
        location: reviewerLocation || 'Tamil Nadu',
        rating: reviewRating,
        comment: reviewComment.trim(),
        image: reviewImage
      });
      if (res?.review) {
        setReviewsData(prev => ({
          ...prev,
          reviews: [res.review, ...prev.reviews],
          total_reviews: (prev.total_reviews || 0) + 1
        }));
        setShowReviewForm(false);
        setReviewComment('');
        setReviewImage(null);
        if (showToast) showToast('Thank you! Your photo review has been published ✨');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeImages = useMemo(() => {
    if (!product) return [];
    // 1. If active variant has multiple photos of its specific color, use them
    if (activeVariant?.images && Array.isArray(activeVariant.images) && activeVariant.images.length > 1) {
      return activeVariant.images.filter(Boolean);
    }
    // 2. If product has multiple gallery photos (Pallu, Blouse, Border, Angles), use them
    if (product.images && Array.isArray(product.images) && product.images.length > 1) {
      return product.images.filter(Boolean);
    }
    // 3. If active variant has at least 1 photo
    if (activeVariant?.images && Array.isArray(activeVariant.images) && activeVariant.images.length > 0) {
      return activeVariant.images.filter(Boolean);
    }
    // 4. If product has at least 1 photo
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    const fallback = activeVariant?.image || activeVariant?.image_url || product.image;
    return fallback ? [fallback] : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c'];
  }, [activeVariant, product]);

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [selectedVariantIndex, product?.id, product?.code]);

  if (!product) return null;

  const totalStock = allVariants.reduce((sum, v) => sum + Number(v.stockQty ?? v.stock_qty ?? 0), 0);
  const isProductSoldOut = Boolean(product.isSoldOut) || (allVariants.length > 0 && totalStock <= 0);

  const activeVariantQty = activeVariant 
    ? Number(activeVariant.stockQty !== undefined ? activeVariant.stockQty : (activeVariant.stock_qty !== undefined ? activeVariant.stock_qty : 1)) 
    : 1;
  const isVariantSoldOut = activeVariant 
    ? (activeVariantQty <= 0 || activeVariant.inStock === false || activeVariant.in_stock === false) 
    : isProductSoldOut;

  const currentImage = activeVariant?.image || activeVariant?.image_url || product.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c';
  const currentColorName = activeVariant?.colorName || activeVariant?.color_name || product.defaultColor || 'Standard';
  const currentProductCode = activeVariant?.code || activeVariant?.productCode || activeVariant?.product_code || product.code || product.id;

  const currentDisplayImage = activeImages[activePhotoIndex] || activeImages[0] || currentImage;

  const saved = isWishlisted(product.id);

  const handleCloseModal = () => {
    setSelectedProductForModal(null);
    if (typeof window !== 'undefined' && window.location.search.includes('product=')) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('product');
        url.searchParams.delete('p');
        const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
        window.history.replaceState({}, '', cleanUrl);
      } catch (e) {}
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      if (showToast) {
        showToast(language === 'ta' ? 'தயாரிப்பை கூடையில் சேர்க்க தயவுசெய்து உள்நுழையவும் 🛍️' : 'Please sign in to add items to your shopping bag 🛍️');
      }
      return;
    }
    addToCart(product, currentColorName, selectedSize, currentDisplayImage);
  };

  const handleBuyNow = () => {
    if (!user) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      if (showToast) {
        showToast(language === 'ta' ? 'ஆர்டர் செய்ய தயவுசெய்து உள்நுழையவும் ✨' : 'Please sign in to place an order ✨');
      }
      return;
    }
    buyNow(product, currentColorName, selectedSize, currentDisplayImage);
    setSelectedProductForModal(null);
  };

  const handleWishlist = () => {
    if (!user && !isStoreAdminMode) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      if (showToast) {
        showToast(language === 'ta' ? 'விருப்பப்பட்டியலில் சேர்க்க தயவுசெய்து உள்நுழையவும் 💖' : 'Please sign in to save items to your wishlist 💖');
      }
      return;
    }
    toggleWishlist(product);
  };

  const whatsappMessageText = [
    `🌸 *THALIR BOUTIQUE - PRODUCT INQUIRY* 🌸`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🔖 *Product Code / ID:* ${currentProductCode}`,
    `✨ *Item:* ${product.name}`,
    `💰 *Price:* ₹${Number(product.basePrice || 0).toLocaleString('en-IN')}`,
    `🎨 *Selected Color:* ${currentColorName}`,
    selectedSize ? `📏 *Size:* ${selectedSize}` : null,
    product.fabric ? `🧵 *Fabric:* ${product.fabric}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👋 Hi Thalir Boutique! I am interested in ordering this product (Code: ${currentProductCode}). Please confirm availability and how to place my order!`
  ].filter(Boolean).join('\n');

  const rawPhone = (storeInfo?.whatsappNumber || '916382218590').replace(/\D/g, '');
  const whatsappInquiryUrl = `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(whatsappMessageText)}`;

  const handleWhatsAppClick = (e) => {
    try {
      if (typeof recordWhatsAppInquiry === 'function') {
        recordWhatsAppInquiry(product, currentColorName, selectedSize, currentImage);
      }
    } catch (err) {
      console.warn('WhatsApp inquiry logging note:', err);
    }
  };

  const confirmDeleteProduct = async () => {
    await deleteProduct(product.id);
    setSelectedProductForModal(null);
  };

  return (
    <>
      <div 
        onClick={handleCloseModal}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gold/30 relative"
        >
          
          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
            
            {/* Left Column: Image & Multi-Picture Saree Gallery */}
            <div className="space-y-4">
              <div className="w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner relative group">
                <img
                  src={currentDisplayImage}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${(isProductSoldOut || isVariantSoldOut) ? 'grayscale-[25%]' : ''}`}
                />

                {/* Multi-Photo Carousel Arrows */}
                {activeImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex(prev => (prev === 0 ? activeImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-lg flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-110 active:scale-95"
                      title={language === 'ta' ? 'முந்தைய படம்' : 'Previous Photo'}
                      aria-label="Previous Photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex(prev => (prev === activeImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-lg flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-110 active:scale-95"
                      title={language === 'ta' ? 'அடுத்த படம்' : 'Next Photo'}
                      aria-label="Next Photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Photo index counter badge */}
                    <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md z-10 select-none">
                      <Camera className="w-3.5 h-3.5 text-gold-shimmer" />
                      <span>{activePhotoIndex + 1} / {activeImages.length} {language === 'ta' ? 'படங்கள்' : 'Photos'}</span>
                    </div>
                  </>
                )}

                {/* Floating Share & Wishlist Buttons (Exact Amazon Layout) */}
                {!isStoreAdminMode && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs text-stone-700 hover:text-primary hover:bg-white flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-108 active:scale-95"
                      title={language === 'ta' ? 'தயாரிப்பை பகிரவும்' : 'Share Product'}
                      aria-label="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleWishlist}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-108 active:scale-95 ${
                        saved
                          ? 'bg-pink-600 text-white'
                          : 'bg-white/95 backdrop-blur-xs text-stone-700 hover:text-pink-600 hover:bg-white'
                      }`}
                      title={saved ? (language === 'ta' ? 'விருப்பப்பட்டியலில் இருந்து நீக்கு' : 'Remove from Wishlist') : (language === 'ta' ? 'விருப்பப்பட்டியலில் சேர்' : 'Add to Wishlist')}
                      aria-label="Wishlist"
                    >
                      <Heart className={`w-5 h-5 ${saved ? 'fill-white text-white' : ''}`} />
                    </button>
                  </div>
                )}

                {(isProductSoldOut || isVariantSoldOut) && (
                  <span className="absolute top-3 left-3 bg-rose-700 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-10">
                    {language === 'ta' ? 'விற்பனையானது' : 'Sold Out'}
                  </span>
                )}
                {isStoreAdminMode && (
                  <span className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded shadow z-10">
                    👑 Admin Preview
                  </span>
                )}
              </div>

              {/* Multi-Photo Gallery Strip (Same Product Views: Pallu, Blouse, Border, Drape) */}
              {activeImages.length > 1 && (
                <div className="space-y-1.5 p-2 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 px-1">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Camera className="w-3.5 h-3.5 text-primary" />
                      {language === 'ta' ? `அனைத்து படங்கள் (${activeImages.length} கோணங்கள்)` : `All Saree Views (${activeImages.length} Photos)`}
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      {language === 'ta' ? 'பல்லு / பிளவுஸ் / வேலைப்பாடுகள்' : 'Pallu • Blouse • Border • Draping'}
                    </span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5">
                    {activeImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer relative shadow-2xs ${
                          activePhotoIndex === idx 
                            ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-md' 
                            : 'border-stone-200 opacity-70 hover:opacity-100 hover:border-stone-400'
                        }`}
                      >
                        <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white font-bold text-center py-0.2">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Thumbnail Color Variant Selector */}
              {availableVariants && availableVariants.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                    <span className="uppercase tracking-wider">
                      {language === 'ta' ? `கிடைக்கும் வண்ணங்கள் (${availableVariants.length}):` : `Color Options (${availableVariants.length}):`}
                    </span>
                    <span className="text-primary font-serif font-bold">
                      {currentColorName}
                    </span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-2">
                    {availableVariants.map((v, idx) => {
                      const isSoldOut = Number(v.stockQty !== undefined ? v.stockQty : (v.stock_qty !== undefined ? v.stock_qty : 1)) <= 0;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariantIndex(idx)}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer relative ${
                            selectedVariantIndex === idx ? 'border-primary shadow-md scale-105 ring-2 ring-primary/30' : 'border-stone-200 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={v.image || v.image_url} alt={v.colorName || v.color_name} className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-60' : ''}`} />
                          {isSoldOut && (
                            <span className="absolute inset-0 bg-black/60 text-white text-[9px] font-bold flex items-center justify-center text-center p-0.5 leading-tight">
                              {language === 'ta' ? 'தீர்ந்தது' : 'Sold Out'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Information & Actions */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gold">
                      {product.categoryName || product.category}
                    </span>
                    {product.tag && String(product.tag).toLowerCase() === 'new arrival' && (
                      <span className="bg-[#073822] text-gold-light border border-gold/40 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                        <span>✨</span>
                        <span>{language === 'ta' ? 'புதிய வரவு' : 'New Arrival'}</span>
                      </span>
                    )}
                  </div>
                  {currentProductCode && (
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
                      {language === 'ta' ? 'குறியீடு' : 'Product Code'}: {currentProductCode}
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight mb-2">
                  {product.name}
                </h2>

                {product.isSpecialEvent && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-amber-50 to-red-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🪔</span>
                      <div>
                        <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1">
                          <span>{product.eventBadge || 'FESTIVAL SPECIAL'}</span>
                          <span className="text-[10px] bg-red-600 text-white px-2 py-0.2 rounded-full font-bold">SPECIAL DEAL</span>
                        </span>
                        <p className="text-[11px] text-stone-600 font-medium">
                          {product.eventName || (language === 'ta' ? 'பண்டிகை கால சிறப்பு தள்ளுபடி விலை' : 'Festival Special Pricing Active')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price & Views Row */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-primary">
                    ₹{product.basePrice.toLocaleString('en-IN')}
                  </span>
                  
                  {/* Views count - Visible ONLY to Admin */}
                  {isStoreAdminMode && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-xs font-bold text-amber-800 shadow-2xs" title="Only visible to Admin">
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>{product.viewsCount || product.views || 0} views</span>
                    </span>
                  )}

                  {(isProductSoldOut || isVariantSoldOut) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-xs font-extrabold uppercase tracking-wider">
                      {language === 'ta' ? 'விற்பனையானது' : 'Sold Out'}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-stone-600 text-sm leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Color Swatches */}
                {availableVariants && availableVariants.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-700">
                          {language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட வண்ணம்:' : 'Selected Color:'} <strong className="text-primary">{currentColorName}</strong>
                        </span>
                        {currentProductCode && (
                          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            #{currentProductCode}
                          </span>
                        )}
                      </div>
                      {activeVariant && Number(activeVariant.stockQty !== undefined ? activeVariant.stockQty : (activeVariant.stock_qty !== undefined ? activeVariant.stock_qty : 1)) <= 0 && (
                        <span className="text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          {language === 'ta' ? 'விற்பனையானது' : 'Sold Out (0 Stock)'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {availableVariants.map((v, idx) => {
                        const isSoldOut = Number(v.stockQty !== undefined ? v.stockQty : (v.stock_qty !== undefined ? v.stock_qty : 1)) <= 0;
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedVariantIndex(idx)}
                            style={{ backgroundColor: v.colorCode || v.color_code }}
                            className={`w-7 h-7 rounded-full border-2 border-white transition-all cursor-pointer relative ${
                              selectedVariantIndex === idx ? 'ring-2 ring-primary scale-110' : 'ring-1 ring-stone-300'
                            }`}
                            title={`${v.colorName || v.color_name}${isSoldOut ? ' (Sold Out)' : ''}`}
                          >
                            {isSoldOut && (
                              <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✕</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-6">
                    <span className="text-xs font-bold text-stone-700 block mb-2">
                      {language === 'ta' ? 'அளவைத் தேர்ந்தெடுக்கவும்:' : 'Select Size:'} <strong className="text-primary">{selectedSize}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      {product.sizes.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSize(s)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            selectedSize === s
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fabric Specs */}
                {product.fabric && (
                  <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-xs space-y-1 text-stone-600 mb-6">
                    <div><strong>{language === 'ta' ? 'துணி வகை:' : 'Fabric:'}</strong> {product.fabric}</div>
                    {product.length && <div><strong>{language === 'ta' ? 'நீளம்:' : 'Length:'}</strong> {product.length}</div>}
                    {product.cutLength && <div><strong>{language === 'ta' ? 'வெட்டு நீளம்:' : 'Cut Length:'}</strong> {product.cutLength}</div>}
                    {product.care && <div><strong>{language === 'ta' ? 'பராமரிப்பு:' : 'Care:'}</strong> {product.care}</div>}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                {isStoreAdminMode ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        👑 Admin Product Controls
                      </span>
                      <span className="text-amber-800 font-medium">
                        Stock: <strong className="font-bold text-stone-900">{totalStock}</strong> units {isProductSoldOut ? '(Sold Out)' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                      >
                        <Edit3 className="w-4 h-4" /> {language === 'ta' ? 'தயாரிப்பை மாற்று' : 'Modify Product'}
                      </button>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> {language === 'ta' ? 'தயாரிப்பை நீக்கு' : 'Delete Product'}
                      </button>
                    </div>
                  </div>
                ) : (isProductSoldOut || isVariantSoldOut) ? (
                  <>
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-center space-y-1.5">
                      <span className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                        <Bell className="w-4 h-4 text-amber-700" /> {language === 'ta' ? `தற்போது விற்பனையானது (${currentColorName})` : `Currently Sold Out (${currentColorName})`}
                      </span>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        {language === 'ta'
                          ? 'இந்த புடவை தற்போது கையிருப்பில் இல்லை. வாட்ஸ்அப்பில் தகவல் பெற கீழே பதிவு செய்யவும்!'
                          : 'This saree design is currently sold out. Register below to receive an instant WhatsApp alert when fresh stock arrives!'
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsRestockModalOpen(true)}
                      className="w-full bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-gold" />
                      <span>{language === 'ta' ? 'மீண்டும் வரும்போது தகவல் பெற' : 'Notify Me When Available'}</span>
                    </button>

                    <a
                      href={whatsappInquiryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleWhatsAppClick}
                      className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md cursor-pointer text-center no-underline"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" /> {language === 'ta' ? 'வாட்ஸ்அப் மூலம் விசாரிக்கவும்' : 'Inquire on WhatsApp'}
                    </a>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleAddToCart}
                        className="bg-primary-pale hover:bg-primary text-primary hover:text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{language === 'ta' ? 'பையில் சேர்க்க' : 'Add to Bag'}</span>
                      </button>
                      <button
                        onClick={handleBuyNow}
                        className="bg-gradient-to-r from-[#DFBA6D] to-[#C5A059] hover:from-[#E5C67F] hover:to-[#AF8B43] text-stone-900 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Zap className="w-4 h-4" />
                        <span>{language === 'ta' ? 'இப்போதே வாங்க' : 'Instant Buy Now'}</span>
                      </button>
                    </div>

                    <a
                      href={whatsappInquiryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleWhatsAppClick}
                      className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md cursor-pointer text-center no-underline"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>{language === 'ta' ? 'வாட்ஸ்அப் மூலம் ஆர்டர் செய்ய' : 'Inquire & Order on WhatsApp'}</span>
                    </a>
                  </>
                )}
              </div>

            </div>

          </div>

          {/* Customer Reviews & Photos Section */}
          <div className="border-t-2 border-stone-100 bg-stone-50/70 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#073822] flex items-center gap-2">
                  <span>Customer Reviews & Photos</span>
                  <span className="text-xs font-sans font-bold bg-[#DFBA6D]/20 text-[#073822] px-2.5 py-0.5 rounded-full border border-gold/40">
                    ★ {reviewsData.average_rating || 5.0} ({reviewsData.total_reviews || reviewsData.reviews?.length || 0})
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  {language === 'ta'
                    ? 'எங்கள் வாடிக்கையாளர்கள் தளிர்பொட்டிக் சேலைகளை அணிந்து பகிர்ந்த உண்மையான கருத்துக்கள் & புகைப்படங்கள்'
                    : 'Real feedback & photos shared by customers wearing Thalir Boutique collections'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Camera className="w-4 h-4 text-gold" />
                <span>{showReviewForm ? 'Cancel Review' : 'Write a Review & Add Photo'}</span>
              </button>
            </div>

            {/* Inline Review Form with Photo Upload */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="bg-white p-5 rounded-2xl border-2 border-primary/20 shadow-sm space-y-4 animate-in fade-in">
                <div className="font-serif font-bold text-sm text-[#073822] border-b border-stone-100 pb-2">
                  Share Your Experience with {product.name}
                </div>

                {/* Rating Selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">Rating (1 to 5 Stars):</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-stone-300'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-stone-700 ml-2">{reviewRating} Stars</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Your Name:</label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Priya Sundaram"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Your City / Location:</label>
                    <input
                      type="text"
                      value={reviewerLocation}
                      onChange={(e) => setReviewerLocation(e.target.value)}
                      placeholder="e.g. Namakkal / Coimbatore"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Your Review & Fabric Feedback:</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the saree softness, pallu design, color accuracy, and wear comfort..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none focus:border-primary"
                  />
                </div>

                {/* Photo Upload Input */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    📸 Add a Photo of You Wearing This Saree (Optional):
                  </label>
                  <input
                    type="file"
                    ref={reviewFileRef}
                    onChange={handleReviewPhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {!reviewImage ? (
                    <button
                      type="button"
                      onClick={() => reviewFileRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-stone-300 hover:border-primary bg-stone-50 hover:bg-stone-100 text-xs text-stone-600 font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 text-stone-500" />
                      <span>Upload Saree Photo from Device</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-emerald-300 text-xs">
                      <div className="flex items-center gap-2.5">
                        <img src={reviewImage} alt="Review Preview" className="w-12 h-12 object-cover rounded-lg border border-emerald-400" />
                        <span className="text-emerald-900 font-bold">✓ Photo Attached</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReviewImage(null)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold p-1 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-[#073822] hover:bg-[#0a4d2f] disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    {submittingReview ? 'Publishing Review...' : 'Publish Review'}
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-3.5">
              {loadingReviews ? (
                <div className="text-center py-6 text-stone-400 text-xs">Loading customer reviews...</div>
              ) : reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                reviewsData.reviews.map((r, idx) => (
                  <div key={r.id || idx} className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-stone-900 font-bold">{r.name}</strong>
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Buyer
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-medium">
                          {r.location || 'Tamil Nadu'} • {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified Review'}
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (r.rating || 5) ? 'fill-amber-400 text-amber-500' : 'text-stone-200'}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed font-normal">
                      "{r.comment}"
                    </p>

                    {/* Customer Photo */}
                    {r.image_url && (
                      <div className="pt-1">
                        <img
                          src={r.image_url}
                          alt={`${r.name}'s saree photo`}
                          className="w-20 h-24 object-cover rounded-xl border border-stone-200 shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(r.image_url, '_blank')}
                          title="Click to view full photo"
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-stone-300 text-center space-y-2">
                  <Star className="w-7 h-7 text-gold mx-auto fill-gold/20" />
                  <p className="text-xs font-bold text-stone-700">Be the first to review {product.name}!</p>
                  <p className="text-[11px] text-stone-500">Share your thoughts or upload a saree photo to help fellow shoppers.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <ProductEditModal
          product={product}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Themed Confirm Delete Modal */}
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          title={language === 'ta' ? 'தயாரிப்பை நீக்கு' : 'Delete Product'}
          itemName={product.name}
          itemDetails={`Price: ₹${product.basePrice} • Category: ${product.categoryName || product.category}`}
          itemImage={currentImage}
          warningText={language === 'ta' ? `"${product.name}" ஐ நிச்சயமாக நீக்க விரும்புகிறீர்களா? இந்த தயாரிப்பு நிரந்தரமாக அகற்றப்படும்.` : `Are you sure you want to delete "${product.name}"? This product will be permanently removed.`}
          confirmBtnText={language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete Product'}
          onConfirm={confirmDeleteProduct}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

      {/* Restock Notification Request Modal */}
      {isRestockModalOpen && (
        <RestockNotifyModal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          product={product}
          selectedVariant={activeVariant}
        />
      )}

      {/* Share Product Sheet Modal */}
      {isShareModalOpen && (
        <ShareProductModal
          product={product}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </>
  );
};

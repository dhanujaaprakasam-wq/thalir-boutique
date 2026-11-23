import React, { useState } from 'react';
import { ShoppingBag, Zap, Eye, Check, Heart, Edit3, Trash2, Bell, Share2, Camera } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductEditModal } from './ProductEditModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { RestockNotifyModal } from './RestockNotifyModal';
import { ShareProductModal } from './ShareProductModal';

export const ProductCard = ({ product }) => {
  const {
    addToCart,
    buyNow,
    setIsCheckoutOpen,
    setSelectedProductForModal,
    toggleWishlist,
    isWishlisted,
    isAdminDemoMode,
    deleteProduct,
    recordProductView,
    user,
    language,
    setIsAuthModalOpen,
    showToast,
    isStoreAdminMode = false
  } = useStore();

  const allVariants = product.variants || [];
  const inStockVariants = allVariants.filter(v => {
    const qty = v.stockQty !== undefined ? Number(v.stockQty) : (v.stock_qty !== undefined ? Number(v.stock_qty) : 1);
    return qty > 0 && v.inStock !== false && v.in_stock !== false;
  });

  const availableVariants = allVariants.length > 0 ? allVariants : [];
  const totalStock = allVariants.reduce((sum, v) => sum + Number(v.stockQty ?? v.stock_qty ?? 0), 0);
  const isProductSoldOut = Boolean(product.isSoldOut) || (allVariants.length > 0 && totalStock <= 0);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes ? product.sizes[0] : null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const activeVariant = availableVariants[selectedVariantIndex] || availableVariants[0] || null;
  const isCurrentVariantSoldOut = activeVariant 
    ? (Number(activeVariant.stockQty ?? activeVariant.stock_qty ?? 0) <= 0 || activeVariant.inStock === false || activeVariant.in_stock === false)
    : isProductSoldOut;

  const currentImage = activeVariant?.image || activeVariant?.image_url || product.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c';
  const currentColorName = activeVariant?.colorName || activeVariant?.color_name || product.defaultColor || 'Standard';
  const currentProductCode = activeVariant?.code || activeVariant?.productCode || activeVariant?.product_code || product.code || product.id;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      if (showToast) {
        showToast(language === 'ta' ? 'தயாரிப்பை கூடையில் சேர்க்க தயவுசெய்து உள்நுழையவும் 🛍️' : 'Please sign in to add items to your shopping bag 🛍️');
      }
      return;
    }
    addToCart(product, currentColorName, selectedSize, currentImage);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (!user) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      if (showToast) {
        showToast(language === 'ta' ? 'ஆர்டர் செய்ய தயவுசெய்து உள்நுழையவும் ✨' : 'Please sign in to place an order ✨');
      }
      return;
    }
    buyNow(product, currentColorName, selectedSize, currentImage);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!user && !isStoreAdminMode) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      if (showToast) {
        showToast(language === 'ta' ? 'விருப்பப்பட்டியலில் சேர்க்க தயவுசெய்து உள்நுழையவும் 💖' : 'Please sign in to save items to your wishlist 💖');
      }
      return;
    }
    toggleWishlist(product);
  };

  const handleAdminEdit = (e) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleAdminDelete = (e) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAction = async () => {
    await deleteProduct(product.id);
  };

  const saved = isWishlisted(product.id);

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-gold/50 transition-all duration-300 flex flex-col group relative">
        
        {/* Product Image Showcase */}
        <div
          onClick={() => setSelectedProductForModal(product)}
          className="relative w-full h-80 bg-stone-100 overflow-hidden cursor-pointer"
        >
          <img
            src={currentImage}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isProductSoldOut ? 'grayscale-[35%] opacity-90' : ''}`}
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            {product.isSpecialEvent && (
              <span className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-lg flex items-center gap-1 border border-gold/40 animate-pulse">
                <span>🔥</span>
                <span>{product.eventBadge || product.eventName || (language === 'ta' ? 'சிறப்பு விழா சலுகை' : 'FESTIVAL SPECIAL')}</span>
              </span>
            )}
            {isProductSoldOut ? (
              <span className="bg-rose-700 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md">
                {language === 'ta' ? 'விற்பனையானது' : 'Sold Out'}
              </span>
            ) : isCurrentVariantSoldOut ? (
              <span className="bg-amber-700 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md">
                {language === 'ta' ? 'வண்ணம் தீர்ந்தது' : 'Color Sold Out'}
              </span>
            ) : product.tag ? (
              <span className="bg-gradient-to-r from-[#041D12] to-[#0A4D2E] text-white text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md border border-gold/40 flex items-center gap-1">
                {String(product.tag).toLowerCase() === 'new arrival' ? (
                  <>
                    <span>✨</span>
                    <span>{language === 'ta' ? 'புதிய வரவு' : 'New Arrival'}</span>
                  </>
                ) : (
                  product.tag
                )}
              </span>
            ) : null}

            {isStoreAdminMode && (
              <span className="bg-amber-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm">
                👑 Admin View
              </span>
            )}
          </div>

          {/* View Count Badge - Visible ONLY in Admin Mode */}
          {isStoreAdminMode && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white/20">
                <Eye className="w-3 h-3 text-gold" />
                <span>{product.viewsCount || product.views || 0} views</span>
              </span>
            </div>
          )}

          {/* Multiple Photos Pill */}
          {((activeVariant?.images?.length > 1) || (product.images?.length > 1)) && (
            <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
              <span className="bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Camera className="w-2.5 h-2.5 text-gold-shimmer" />
                <span>{activeVariant?.images?.length || product.images?.length}</span>
              </span>
            </div>
          )}

          {/* Top Right: Actions (Share & Wishlist side-by-side like Amazon) */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {!isStoreAdminMode ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShareModalOpen(true);
                  }}
                  className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-stone-700 hover:text-primary hover:bg-white flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-108 active:scale-95"
                  title={language === 'ta' ? 'தயாரிப்பை பகிரவும்' : 'Share Product'}
                  aria-label="Share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleWishlist}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-108 active:scale-95 ${
                    saved
                      ? 'bg-pink-600 text-white'
                      : 'bg-white/95 backdrop-blur-xs text-stone-700 hover:text-pink-600 hover:bg-white'
                  }`}
                  title={saved ? (language === 'ta' ? 'விருப்பப்பட்டியலில் இருந்து நீக்கு' : 'Remove from Wishlist') : (language === 'ta' ? 'விருப்பப்பட்டியலில் சேர்' : 'Add to Wishlist')}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-white text-white' : ''}`} />
                </button>
              </>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={handleAdminEdit}
                  className="w-8 h-8 rounded-full bg-white text-stone-700 hover:text-primary hover:bg-primary-pale flex items-center justify-center transition-all shadow-md cursor-pointer"
                  title="Modify Product"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleAdminDelete}
                  className="w-8 h-8 rounded-full bg-white text-stone-700 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all shadow-md cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Quick View Button on Hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-white/90 backdrop-blur text-primary font-bold text-xs px-3.5 py-2 rounded-full shadow flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {language === 'ta' ? 'விரைவுப் பார்வை' : 'Quick View'}
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-5 flex flex-col flex-grow">
          
          {/* Category & Title */}
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold truncate">
              {product.categoryName || product.category}
            </span>
            {currentProductCode && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded border border-stone-200 shrink-0">
                #{currentProductCode}
              </span>
            )}
          </div>
          <h3
            onClick={() => setSelectedProductForModal(product)}
            className="font-serif font-bold text-stone-900 text-base line-clamp-1 hover:text-primary cursor-pointer mb-2"
          >
            {product.name}
          </h3>

          {/* Price Row & Star Badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xl font-extrabold text-primary">
              ₹{product.basePrice.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-2xs">
              <span className="text-amber-500 font-extrabold">★</span>
              <span>4.9</span>
            </span>
          </div>

          {/* Multi-Color Swatches Selector */}
          {availableVariants && availableVariants.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5 font-medium">
                <span>{language === 'ta' ? 'வண்ணம்:' : 'Color:'} <strong className="text-stone-800">{currentColorName}</strong></span>
                <span className="text-[11px] text-primary font-bold">
                  {availableVariants.length} {language === 'ta' ? 'வண்ணங்கள்' : 'Colors'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {availableVariants.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVariantIndex(idx);
                    }}
                    style={{ backgroundColor: v.colorCode || v.color_code }}
                    title={v.colorName || v.color_name}
                    className={`w-5 h-5 rounded-full border-2 border-white transition-all cursor-pointer ${
                      selectedVariantIndex === idx
                        ? 'ring-2 ring-primary scale-110 shadow-sm'
                        : 'ring-1 ring-stone-300 hover:scale-105'
                    }`}
                    aria-label={`Select ${v.colorName || v.color_name}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Pills */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-stone-500 mb-1.5 font-medium">
                <span>{language === 'ta' ? 'அளவு:' : 'Size:'} <strong className="text-stone-800">{selectedSize}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSize(s);
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
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

          {/* Action CTA Buttons */}
          <div className="mt-auto pt-4 border-t border-stone-100">
            {isStoreAdminMode ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAdminEdit}
                  className="w-full bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold text-xs py-2.5 px-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer hover:shadow"
                  title="Modify Product Details & Stock"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gold" />
                  <span>{language === 'ta' ? 'மாற்று' : 'Modify'}</span>
                  <span className="hidden sm:inline">{language === 'ta' ? '' : ' Product'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdminDelete}
                  className="w-full bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 font-bold text-xs py-2.5 px-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                  title="Delete Product Permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'நீக்கு' : 'Delete'}</span>
                  <span className="hidden sm:inline">{language === 'ta' ? '' : ' Product'}</span>
                </button>
              </div>
            ) : (isProductSoldOut || isCurrentVariantSoldOut) ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRestockModalOpen(true);
                  }}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                  title="Receive instant WhatsApp alert when restocked"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-700" />
                  <span>{language === 'ta' ? 'அறிவிப்பு' : 'Notify Me'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProductForModal(product);
                  }}
                  className="w-full bg-[#073822] hover:bg-[#0a4d2f] text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-gold" />
                  <span>{language === 'ta' ? 'பார்வை' : 'View Saree'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-primary-pale hover:bg-primary text-primary hover:text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'பையில் சேர்க்க' : 'Add to Bag'}</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-gradient-to-r from-[#DFBA6D] to-[#C5A059] hover:from-[#E5C67F] hover:to-[#AF8B43] text-stone-900 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'இப்போதே வாங்க' : 'Buy Now'}</span>
                </button>
              </div>
            )}
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

      {/* Custom Themed Confirm Delete Modal */}
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          title={language === 'ta' ? 'தயாரிப்பை நீக்கு' : 'Delete Product'}
          itemName={product.name}
          itemDetails={`Price: ₹${product.basePrice} • Category: ${product.categoryName || product.category}`}
          itemImage={currentImage}
          warningText={language === 'ta' ? `"${product.name}" தயாரிப்பை நிரந்தரமாக நீக்க விரும்புகிறீர்களா? இது உங்கள் பட்டியல் மற்றும் தரவுத்தளத்திலிருந்து அகற்றப்படும்.` : `Are you sure you want to permanently delete "${product.name}"? It will be removed from your catalog and database.`}
          confirmBtnText={language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete Product'}
          onConfirm={confirmDeleteAction}
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

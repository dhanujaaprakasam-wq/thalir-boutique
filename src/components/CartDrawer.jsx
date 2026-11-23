import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck, Tag, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    getAvailableStock,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDiscount,
    appliedCoupon,
    availableCoupons,
    applyCoupon,
    removeCoupon,
    couponError,
    deliveryCharge,
    shippingInfo,
    grandTotal,
    setIsCheckoutOpen,
    storeInfo,
    language,
    user,
    setIsAuthModalOpen,
    showToast
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [showOffersList, setShowOffersList] = useState(false);

  if (!isCartOpen) return null;

  const handleProceedCheckout = () => {
    if (!user) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      if (showToast) {
        showToast(language === 'ta' ? 'ஆர்டர் செய்ய தயவுசெய்து உள்நுழையவும் ✨' : 'Please sign in to place an order ✨');
      }
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleApplyInputCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim());
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
          
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#073822] to-[#0D5C3A] text-white flex items-center justify-between border-b border-gold/30">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gold" />
              <h3 className="font-serif font-bold text-lg">
                {language === 'ta' ? 'உங்கள் ஷாப்பிங் பை' : 'Your Shopping Bag'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-stone-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer"
                  title="Empty Bag"
                >
                  {language === 'ta' ? 'பையை காலி செய்' : 'Empty Bag'}
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-stone-400 space-y-3">
                <ShoppingBag className="w-16 h-16 mx-auto stroke-1 text-stone-300" />
                <h4 className="font-serif text-lg font-bold text-stone-700">
                  {language === 'ta' ? 'உங்கள் பை காலியாக உள்ளது' : 'Your bag is empty'}
                </h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  {language === 'ta'
                    ? 'சேலைகள், குர்திகள் மற்றும் துணிகளை உங்கள் பையில் சேர்க்கவும்.'
                    : 'Explore our sarees, kurtis, and designer materials to add items to your bag.'}
                </p>
              </div>
            ) : (
              <>
                {cart.map((item) => {
                  const maxStock = Number(item.stockQty ?? getAvailableStock(item.id, item.color) ?? 1);
                  const isMaxStockReached = item.qty >= maxStock;

                  return (
                    <div
                      key={item.cartItemId}
                      className="flex gap-3.5 p-3 rounded-xl border border-stone-200 bg-white hover:border-gold/30 transition-all"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-18 h-20 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-100"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-stone-900 text-sm truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-stone-500 font-medium">
                            {(item.code || item.productCode || item.id) && (
                              <span className="font-mono text-[10px] text-primary font-bold mr-1.5 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                #{item.code || item.productCode || item.id}
                              </span>
                            )}
                            Color: <strong className="text-stone-700">{item.color}</strong> {item.size && `| Size: ${item.size}`}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-2 border border-stone-200 rounded-md bg-stone-50 px-1.5 py-0.5">
                            <button
                              onClick={() => updateCartQty(item.cartItemId, -1)}
                              className="text-stone-600 hover:text-primary p-0.5 cursor-pointer"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-stone-800 w-4 text-center">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateCartQty(item.cartItemId, 1)}
                              disabled={isMaxStockReached}
                              className="text-stone-600 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed p-0.5 cursor-pointer"
                              title={isMaxStockReached ? `Only ${maxStock} piece${maxStock > 1 ? 's' : ''} in stock` : 'Add one more'}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-sm font-extrabold text-primary">
                            ₹{(item.price * item.qty).toLocaleString('en-IN')}
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-stone-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* --- COUPONS & OFFERS SECTION --- */}
                <div className="bg-gradient-to-br from-amber-50/70 to-emerald-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        {language === 'ta' ? 'கூப்பன்கள் & சலுகைகள்' : 'Coupons & Offers'}
                      </span>
                    </div>
                    {availableCoupons.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOffersList(!showOffersList)}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                      >
                        <span>
                          {showOffersList
                            ? (language === 'ta' ? 'சலுகைகளை மறை' : 'Hide Offers')
                            : `${availableCoupons.length} ${language === 'ta' ? 'சலுகைகள் உள்ளன' : 'Offers Available'}`
                          }
                        </span>
                        {showOffersList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Active Applied Coupon Pill */}
                  {appliedCoupon ? (
                    <div className="bg-emerald-100/90 border border-emerald-300 text-emerald-950 p-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                        <div>
                          <strong className="font-mono font-bold tracking-wider">{appliedCoupon.code}</strong>
                          <span className="block text-[11px] text-emerald-800 font-medium">
                            {language === 'ta'
                              ? `ரூ.${cartDiscount.toLocaleString('en-IN')} சேமிக்கப்பட்டது!`
                              : `Saved ₹${cartDiscount.toLocaleString('en-IN')}! (${appliedCoupon.title})`
                            }
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-stone-500 hover:text-red-600 text-xs font-bold px-2 py-1 bg-white rounded-lg border border-stone-200 shadow-2xs cursor-pointer"
                      >
                        {language === 'ta' ? 'நீக்கு' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    /* Coupon Input Form */
                    <div className="space-y-1.5">
                      <form onSubmit={handleApplyInputCoupon} className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder={language === 'ta' ? 'கூப்பன் குறியீடு (எ.கா. DIWALI20)' : 'Enter coupon code (e.g. DIWALI20)'}
                          className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#073822]/20"
                        />
                        <button
                          type="submit"
                          disabled={!couponInput.trim()}
                          className="bg-[#073822] hover:bg-[#0a4d2f] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                        >
                          {language === 'ta' ? 'பயன்படுத்து' : 'Apply'}
                        </button>
                      </form>

                      {couponError && (
                        <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 p-2 rounded-lg font-medium animate-in fade-in">
                          {couponError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Available Coupons Drawer/List */}
                  {showOffersList && (
                    <div className="space-y-2 pt-2 border-t border-amber-200/50 animate-in fade-in">
                      {availableCoupons.map((c) => {
                        const minSpend = Number(c.min_order_value) || 0;
                        const isEligible = cartSubtotal >= minSpend;
                        const isCurrentlyApplied = appliedCoupon?.code === c.code;

                        return (
                          <div
                            key={c.id || c.code}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                              isCurrentlyApplied
                                ? 'bg-emerald-100 border-emerald-400'
                                : 'bg-white border-stone-200 hover:border-amber-300 shadow-2xs'
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-extrabold text-primary bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                                  {c.code}
                                </span>
                                {Boolean(c.first_order_only) && (
                                  <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                    {language === 'ta' ? 'முதல் ஆர்டர் மட்டும்' : '1st Order Only'}
                                  </span>
                                )}
                                <span className="font-bold text-stone-800 text-[11px]">{c.title}</span>
                              </div>
                              <p className="text-[10px] text-stone-500">
                                {c.discount_type === 'percentage' 
                                  ? `${c.discount_value}% ${language === 'ta' ? 'தள்ளுபடி' : 'OFF'}` 
                                  : `₹${Math.round(c.discount_value)} ${language === 'ta' ? 'நேரடி தள்ளுபடி' : 'Flat OFF'}`
                                }
                                {minSpend > 0 && (language === 'ta' ? ` (குறைந்தபட்ச ஆர்டர் ₹${minSpend.toLocaleString('en-IN')})` : ` on orders above ₹${minSpend.toLocaleString('en-IN')}`)}
                              </p>
                              {!isEligible && (
                                <span className="text-[10px] text-amber-700 font-semibold block">
                                  {language === 'ta'
                                    ? `• பயன்படுத்த இன்னும் ₹${(minSpend - cartSubtotal).toLocaleString('en-IN')} சேர்க்கவும்`
                                    : `• Add ₹${(minSpend - cartSubtotal).toLocaleString('en-IN')} more to unlock`}
                                </span>
                              )}
                            </div>

                            {isCurrentlyApplied ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                                {language === 'ta' ? 'பயன்படுத்தப்பட்டது ✓' : 'Applied ✓'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => applyCoupon(c.code)}
                                disabled={!isEligible}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                  isEligible
                                    ? 'bg-[#073822] hover:bg-[#0a4d2f] text-white shadow-2xs'
                                    : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                                }`}
                              >
                                {isEligible 
                                  ? (language === 'ta' ? 'பயன்படுத்து' : 'Apply') 
                                  : (language === 'ta' ? 'பூட்டப்பட்டது' : 'Locked')
                                }
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer & Checkout Button */}
          {cart.length > 0 && (
            <div className="p-5 bg-stone-50 border-t border-stone-200 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>{language === 'ta' ? 'பையின் மொத்தத் தொகை:' : 'Bag Subtotal:'}</span>
                  <span className="font-bold text-stone-800">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
                
                {/* Coupon Discount Row */}
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-700" />
                      {language === 'ta' ? 'கூப்பன் தள்ளுபடி' : 'Coupon Discount'} ({appliedCoupon?.code}):
                    </span>
                    <span className="font-bold">-₹{cartDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                  <span>{language === 'ta' ? 'செலுத்த வேண்டிய தொகை:' : 'Total Payable:'}</span>
                  <span className="text-primary text-lg">₹{Math.max(0, cartSubtotal - cartDiscount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={handleProceedCheckout}
                className="w-full bg-gradient-to-r from-[#DFBA6D] via-[#C5A059] to-[#AF8B43] hover:from-[#E5C67F] hover:to-[#C5A059] text-stone-900 font-bold py-3.5 px-4 rounded-xl text-sm shadow-gold flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{language === 'ta' ? 'ஆர்டர் செய்ய தொடரவும்' : 'Proceed to Boutique Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

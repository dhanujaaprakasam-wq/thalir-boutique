import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, Menu, X, Shield, Phone, Sparkles, User, Heart, ArrowLeft, Eye, Globe } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import logoImg from '../assets/logo.jpg';

export const Navbar = ({ currentView, setCurrentView }) => {
  const {
    cartCount,
    setIsCartOpen,
    storeInfo,
    user,
    setIsUserPanelOpen,
    setIsAuthModalOpen,
    setAuthDefaultTab,
    wishlist,
    isAdminDemoMode,
    setIsAdminDemoMode,
    showToast,
    language,
    changeLanguage,
    t,
    availableCoupons
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setCurrentView('store');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleReturnToAdmin = () => {
    if (setIsAdminDemoMode) setIsAdminDemoMode(false);
    window.location.hash = '#admin';
    setCurrentView('admin');
  };

  return (
    <>
      {/* Top Announcement Bar with Live Coupon Highlights */}
      <div className="bg-[#073822] text-[#F9F5EC] text-xs py-2 border-b border-[#DFBA6D]/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-1.5">
          <div className="flex items-center gap-2 font-medium flex-wrap justify-center sm:justify-start">
            <span className="text-gold font-bold">Thalir Boutique</span>
            <span className="hidden sm:inline">•</span>
            {availableCoupons && availableCoupons.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] bg-gold/15 text-gold px-2 py-0.5 rounded-full border border-gold/30">
                ✨ Use code <strong className="font-mono font-extrabold text-white">{availableCoupons[0].code}</strong> for {availableCoupons[0].discount_type === 'percentage' ? `${availableCoupons[0].discount_value}% OFF` : `₹${availableCoupons[0].discount_value} OFF`}!
              </span>
            ) : (
              <span>Handcrafted Sarees, Designer Kurtis & Ethnic Wear</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a
              href={storeInfo.whatsappGroupUrl}
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:text-white transition-colors flex items-center gap-1 font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5 text-whatsapp" /> Join VIP WhatsApp Group
            </a>
            <a
              href={`tel:${storeInfo.rawPhone}`}
              className="text-[#E2E8F0] hover:text-white transition-colors flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-gold" /> {storeInfo.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Official Logo & Branding */}
          <div
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <img
                src={logoImg}
                alt="Thalir Boutique Logo"
                className="w-14 h-14 rounded-full object-cover border-2 border-gold shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-primary tracking-tight leading-tight">
                Thalir Boutique
              </h1>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-gold block">
                Veppadai • Namakkal
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <button
              onClick={() => scrollToSection('home')}
              className="text-sm font-medium transition-colors text-primary font-semibold hover:text-primary cursor-pointer"
            >
              {language === 'ta' ? 'முகப்பு' : 'Home'}
            </button>
            <button
              onClick={() => scrollToSection('catalog')}
              className="text-sm font-medium text-stone-700 hover:text-primary transition-colors cursor-pointer"
            >
              {language === 'ta' ? 'புடவை ரகங்கள்' : 'Collections'}
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-stone-700 hover:text-primary transition-colors cursor-pointer"
            >
              {language === 'ta' ? 'கடை & இருப்பிடம்' : 'About & Store'}
            </button>
          </nav>

          {/* Action Hub */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher Pill */}
            <button
              type="button"
              onClick={() => changeLanguage(language === 'ta' ? 'en' : 'ta')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                language === 'ta'
                  ? 'bg-[#073822] text-white border-gold/60 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200 hover:border-gold'
              }`}
              title={language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
            >
              <Globe className={`w-3.5 h-3.5 ${language === 'ta' ? 'text-gold' : 'text-gold-dark'}`} />
              <span>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
            </button>

            {/* User Account / Sign In Button */}
            {user ? (
              <button
                onClick={() => setIsUserPanelOpen(true)}
                className="flex items-center gap-2 p-1 sm:pr-3 rounded-full border border-gold/40 hover:border-gold bg-gold/10 hover:bg-gold/20 transition-all text-xs font-bold text-stone-800 cursor-pointer"
                title="Open Account"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-gold object-cover bg-white"
                />
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
              </button>
            ) : currentView === 'demo' ? (
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#admin';
                  setCurrentView('admin');
                }}
                className="text-xs font-bold text-primary hover:text-white bg-primary-pale hover:bg-primary border border-primary/30 px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Return to Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5 text-gold" />
                <span className="hidden sm:inline">{language === 'ta' ? 'நிர்வாக மையம்' : 'Admin Hub'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthDefaultTab('phone');
                  setIsAuthModalOpen(true);
                }}
                className="text-xs sm:text-sm font-bold text-primary hover:text-white bg-primary-pale hover:bg-primary border border-primary/30 px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-4 h-4 text-gold" />
                <span className="hidden sm:inline">{language === 'ta' ? 'உள்நுழைக' : 'Sign In'}</span>
              </button>
            )}

            {/* Wishlist Button */}
            <button
              onClick={() => {
                if (user) {
                  setIsUserPanelOpen(true);
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="relative w-10 h-10 rounded-full border border-stone-200 bg-stone-50 hover:bg-pink-50 hover:border-pink-300 text-stone-700 hover:text-pink-600 flex items-center justify-center transition-colors cursor-pointer"
              title={language === 'ta' ? 'விருப்பப்பட்டியல்' : 'My Wishlist'}
            >
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-stone-200 bg-stone-50 hover:bg-primary-pale hover:border-primary text-stone-800 hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-lg border border-stone-200 flex items-center justify-center text-stone-800 hover:text-primary cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-200 px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200 shadow-xl">
            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-500">
                {language === 'ta' ? 'மொழி தேர்வு' : 'Choose Language'}:
              </span>
              <button
                type="button"
                onClick={() => changeLanguage(language === 'ta' ? 'en' : 'ta')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/40 bg-gold/10 text-stone-900 text-xs font-bold"
              >
                <Globe className="w-3.5 h-3.5 text-gold-dark" />
                <span>{language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}</span>
              </button>
            </div>

            <button
              onClick={() => scrollToSection('home')}
              className="block w-full text-left py-2 font-medium text-stone-800 hover:text-primary border-b border-stone-100"
            >
              {language === 'ta' ? 'முகப்பு' : 'Home'}
            </button>
            <button
              onClick={() => scrollToSection('catalog')}
              className="block w-full text-left py-2 font-medium text-stone-800 hover:text-primary border-b border-stone-100"
            >
              {language === 'ta' ? 'புடவை ரகங்கள்' : 'Collections'}
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left py-2 font-medium text-stone-800 hover:text-primary"
            >
              {language === 'ta' ? 'கடை & இருப்பிடம்' : 'About & Physical Store'}
            </button>
          </div>
        )}
      </header>
    </>
  );
};

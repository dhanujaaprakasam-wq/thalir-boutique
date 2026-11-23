import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FestivalCountdownBanner } from './components/FestivalCountdownBanner';
import { CategoryTabs } from './components/CategoryTabs';
import { CatalogFilterBar } from './components/CatalogFilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AuthModal } from './components/AuthModal';
import { UserPanel } from './components/UserPanel';
import { StoreLocation } from './components/StoreLocation';
import { InstagramShowcase } from './components/InstagramShowcase';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Footer } from './components/Footer';
import { FloatingQuickHub } from './components/FloatingQuickHub';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sparkles, ShieldCheck, HeartHandshake, Truck, Search } from 'lucide-react';

function MainApp() {
  const [currentView, setCurrentView] = useState('store'); // 'store' | 'admin'
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('tb_admin_authenticated') === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced Filter States
  const [priceRange, setPriceRange] = useState(10000);
  const [selectedFabric, setSelectedFabric] = useState('All Fabrics');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price_low' | 'price_high' | 'bestseller'
  const [inStockOnly, setInStockOnly] = useState(false);

  const { 
    products, 
    activeCategory, 
    setActiveCategory, 
    setSelectedProductForModal,
    toastMessage, 
    showToast, 
    user, 
    logout, 
    language 
  } = useStore();

  // Handle Deep-linked Product URL (?product=CODE or #product=CODE)
  useEffect(() => {
    if (!products || products.length === 0) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      let targetCode = urlParams.get('product') || urlParams.get('p');

      if (!targetCode && window.location.hash) {
        const hashMatch = window.location.hash.match(/product=([^&]+)/i);
        if (hashMatch) {
          targetCode = decodeURIComponent(hashMatch[1]);
        }
      }

      if (targetCode) {
        const cleanTarget = targetCode.trim().toLowerCase();
        const matched = products.find(p => {
          const pCode = String(p.code || '').toLowerCase();
          const pId = String(p.id || '').toLowerCase();
          const pDbId = String(p.dbId || '').toLowerCase();
          return pCode === cleanTarget || pId === cleanTarget || pDbId === cleanTarget;
        });

        if (matched) {
          setSelectedProductForModal(matched);
        }
      }
    } catch (e) {
      console.warn('Deep link resolution notice:', e);
    }
  }, [products, setSelectedProductForModal]);

  const handleResetFilters = () => {
    setPriceRange(10000);
    setSelectedFabric('All Fabrics');
    setSortBy('newest');
    setInStockOnly(false);
    setSearchQuery('');
  };

  // When user logs in or hash changes, route appropriately
  useEffect(() => {
    const hash = (window.location.hash || '').toLowerCase();
    const isDemo = hash.includes('demo') || hash.includes('view-store') || window.location.pathname.toLowerCase().includes('view-store');

    if (isDemo) {
      setCurrentView('demo');
    } else if (user) {
      if (user.role === 'Admin' && hash === '#admin') {
        setCurrentView('admin');
      } else if (user.role !== 'Admin') {
        setCurrentView('store');
      }
    } else {
      if (hash === '#admin' && isAdminAuthenticated) {
        setCurrentView('admin');
      } else if (!hash.startsWith('#admin')) {
        setCurrentView('store');
      }
    }
  }, [user, isAdminAuthenticated]);

  // Listen for #admin / #view-store-demo / #store URL hash or ?login=admin
  useEffect(() => {
    const handleHash = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('login') === 'admin' || urlParams.get('admin') === 'login') {
          // Clean the query param from address bar so it only triggers the prompt once
          const url = new URL(window.location.href);
          url.searchParams.delete('login');
          url.searchParams.delete('admin');
          window.history.replaceState({}, '', url.pathname + '#admin');

          setIsAdminAuthenticated(false);
          localStorage.removeItem('tb_admin_authenticated');
          setCurrentView('store');
          setIsAdminLoginOpen(true);
          return;
        }
      } catch (e) {}

      const hash = (window.location.hash || '').toLowerCase();
      const path = (window.location.pathname || '').toLowerCase();

      if (hash === '#admin') {
        if (isAdminAuthenticated || user?.role === 'Admin') {
          setCurrentView('admin');
        } else {
          setIsAdminLoginOpen(true);
        }
      } else if (hash.includes('view-store-demo') || hash.includes('demo') || path.includes('view-store-demo') || path.includes('demo')) {
        setCurrentView('demo');
      } else if (hash === '' || hash === '#' || hash === '#store') {
        setCurrentView('store');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, [isAdminAuthenticated, user]);

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    localStorage.setItem('tb_admin_authenticated', 'true');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('login');
      url.searchParams.delete('admin');
      window.history.replaceState({}, '', url.pathname + '#admin');
    } catch (e) {
      window.location.hash = '#admin';
    }
    setCurrentView('admin');
    showToast('Admin logged in successfully! 👑');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('tb_admin_authenticated');
    logout();
    setCurrentView('store');
    window.location.hash = '';
  };

  const specialProducts = (products || []).filter(p => p.isSpecialEvent);

  useEffect(() => {
    if (activeCategory === 'festival' && specialProducts.length === 0) {
      setActiveCategory('all');
    }
  }, [activeCategory, specialProducts.length, setActiveCategory]);

  const activeSpecial = specialProducts.find(p => p.eventName) || specialProducts[0];
  const activeEventName = activeSpecial?.eventName || (language === 'ta' ? 'சிறப்பு விழா சேலைகள்' : 'Special Occasion Collection');
  const activeEventSubtitle = activeSpecial?.eventName
    ? (language === 'ta'
        ? `${activeSpecial.eventName} - பிரத்யேக கைத்தறி சேலைகள் மற்றும் பண்டிகை கால சலுகைகள்!`
        : `Exclusive festive collection for ${activeSpecial.eventName} with special boutique pricing.`)
    : (language === 'ta'
        ? 'பண்டிகை மற்றும் விசேஷங்களுக்கு ஏற்ற பிரத்யேக கைத்தறி சேலைகள்.'
        : 'Handcrafted festive & occasion wear sarees available for celebrations.');

  // Filter products by category, search query, price, fabric, and stock options
  const filteredProducts = products
    .filter(product => {
      const inStockVariants = (product.variants || []).filter(v => {
        const qty = v.stockQty !== undefined ? Number(v.stockQty) : (v.stock_qty !== undefined ? Number(v.stock_qty) : 1);
        return qty > 0 && v.inStock !== false && v.in_stock !== false;
      });

      const matchesCategory = activeCategory === 'all' 
        ? true 
        : activeCategory === 'festival' 
          ? Boolean(product.isSpecialEvent)
          : product.category === activeCategory;
      const cleanQuery = searchQuery.trim().toLowerCase().replace(/^#/, '');
      const matchesSearch = !searchQuery.trim() || 
                            (product.code && product.code.toLowerCase().includes(cleanQuery)) ||
                            (product.id && String(product.id).toLowerCase().includes(cleanQuery)) ||
                            product.name.toLowerCase().includes(cleanQuery) ||
                            product.categoryName?.toLowerCase().includes(cleanQuery) ||
                            product.description?.toLowerCase().includes(cleanQuery) ||
                            product.fabric?.toLowerCase().includes(cleanQuery);
      
      const matchesPrice = Number(product.basePrice || 0) <= priceRange;
      
      const matchesFabric = selectedFabric === 'All Fabrics' || 
                            product.fabric?.toLowerCase().includes(selectedFabric.toLowerCase()) ||
                            product.name?.toLowerCase().includes(selectedFabric.toLowerCase());
      
      const matchesStock = !inStockOnly || inStockVariants.length > 0;

      return matchesCategory && matchesSearch && matchesPrice && matchesFabric && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return Number(a.basePrice || 0) - Number(b.basePrice || 0);
      if (sortBy === 'price_high') return Number(b.basePrice || 0) - Number(a.basePrice || 0);
      if (sortBy === 'bestseller') {
        const aScore = (a.tag?.toLowerCase().includes('best') ? 2 : 0) + (a.variants?.length || 0);
        const bScore = (b.tag?.toLowerCase().includes('best') ? 2 : 0) + (b.variants?.length || 0);
        return bScore - aScore;
      }
      return 0; // Default newest
    });

  const isUserAdmin = isAdminAuthenticated || user?.role === 'Admin';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-primary selection:text-white">
      
      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-[#073822] text-white px-5 py-3 rounded-full text-xs sm:text-sm font-semibold border border-gold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300">
          <Sparkles className="w-4 h-4 text-gold shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {currentView === 'admin' && isUserAdmin ? (
        <AdminDashboard setCurrentView={setCurrentView} onLogoutAdmin={handleAdminLogout} />
      ) : (
        <>
          {/* Top Sticky Banner in Demo Mode */}
          {currentView === 'demo' && (
            <div className="bg-[#073822] text-white py-2 px-4 border-b border-gold/40 shadow-sm sticky top-0 z-50">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-gold text-sm">👑</span>
                  <span>{language === 'ta' ? 'கடை டெமோ பார்வை (தயாரிப்பு மாற்று & நீக்கு இயக்கத்தில் உள்ளது)' : 'Store Demo View — Modify & Delete Product Enabled'}</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-mono">
                    /#view-store-demo
                  </span>
                </div>
                <button
                  onClick={() => {
                    window.location.hash = '#admin';
                    setCurrentView('admin');
                  }}
                  className="bg-gold hover:bg-[#c5a059] text-stone-900 font-extrabold px-3 py-1 rounded-full text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'நிர்வாகத்திற்கு திரும்ப' : 'Back to Admin'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Navbar (User & Guest) */}
          <Navbar currentView={currentView} setCurrentView={setCurrentView} />

          {/* Hero Banner */}
          <Hero />

          {/* Festival Flash Sale Countdown Banner */}
          <FestivalCountdownBanner />

          {/* Catalog Section */}
          <section id="catalog" className="py-16 max-w-7xl mx-auto px-4 w-full">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-xs uppercase tracking-widest font-bold text-gold block mb-1">
                {language === 'ta' ? 'பாரம்பரிய கைத்தறி ஆடைகள்' : 'Exquisite Handpicked Collections'}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary">
                {activeCategory === 'festival' 
                  ? activeEventName
                  : (language === 'ta' ? 'வகைகள் வாரியாக உலாவுக' : 'Shop by Category')}
              </h2>
              <p className="text-stone-500 text-xs sm:text-sm mt-2">
                {activeCategory === 'festival'
                  ? activeEventSubtitle
                  : (language === 'ta' 
                    ? 'சேலைகள், குர்திகள் மற்றும் ஆடைகளை வண்ணங்கள் வாரியாக தேர்ந்தெடுக்கவும்.' 
                    : 'Discover our 6 dedicated boutique collections with real-time color swatches and size pickers.')}
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ta' ? 'சேலைகள், குர்திகள், துணிகளை தேடவும்...' : 'Search sarees, kurtis, fabrics...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-stone-200 bg-white text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm outline-none"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            </div>

            {/* 6 Category Tabs */}
            <CategoryTabs />

            {/* Advanced Filters & Sorting */}
            <CatalogFilterBar
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedFabric={selectedFabric}
              setSelectedFabric={setSelectedFabric}
              sortBy={sortBy}
              setSortBy={setSortBy}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              totalResults={filteredProducts.length}
              onResetFilters={handleResetFilters}
            />

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-stone-200 p-8">
                  <Sparkles className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h3 className="font-serif font-bold text-lg text-stone-700">
                    {language === 'ta' ? 'ஆடைகள் எதுவும் காணப்படவில்லை' : 'No items found'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    {language === 'ta' ? 'வேறு வகையை தேர்ந்தெடுக்கவும் அல்லது தேடலை அழிக்கவும்.' : 'Try selecting another category or clear your search.'}
                  </p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>

          </section>

          {/* Boutique Quality Assurance Features */}
          <section className="py-12 bg-primary text-white">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    {language === 'ta' ? '100% தரப் பரிசோதனை' : '100% Quality Inspected'}
                  </h4>
                  <p className="text-xs text-stone-300">
                    {language === 'ta' ? 'ஒவ்வொரு சேலையும் அனுப்பும் முன் கையால் சரிபார்க்கப்படுகிறது.' : 'Each saree and kurti is hand-checked before dispatch.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    {language === 'ta' ? 'விரைவு கூரியர் டெலிவரி' : 'Fast Courier Dispatch'}
                  </h4>
                  <p className="text-xs text-stone-300">
                    {language === 'ta' ? 'அகில இந்திய விரைவு ஷிப்பிங் மற்றும் பார்சல் கண்காணிப்பு.' : 'Quick all-India shipping with instant tracking updates.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    {language === 'ta' ? 'நேரடி வாட்ஸ்அப் உதவி' : 'Direct WhatsApp Support'}
                  </h4>
                  <p className="text-xs text-stone-300">
                    {language === 'ta' ? 'முந்தானை மற்றும் வண்ணங்களை வீடியோ காலில் காணும் வசதி.' : 'Personal video call assistance to view saree pallu & colors.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Live Instagram Showcase */}
          <InstagramShowcase />

          {/* Physical Store & Google Maps */}
          <StoreLocation />

          {/* Footer (with discreet Admin Login trigger) */}
          <Footer onOpenAdminLogin={() => setIsAdminLoginOpen(true)} />

          {/* Floating Action Hub */}
          <FloatingQuickHub />
        </>
      )}

      {/* Global Interactive Modals */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderSuccessModal />
      <AuthModal />
      <UserPanel />
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm bg-stone-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-gold/40 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-gold shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <MainApp />
      </StoreProvider>
    </ErrorBoundary>
  );
}

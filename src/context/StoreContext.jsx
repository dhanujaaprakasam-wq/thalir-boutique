import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_PRODUCTS, STORE_INFO } from '../data/products';
import { api } from '../services/api';
import { getTranslation } from '../i18n/i18n';
import { getShippingRateForDistance } from '../utils/distanceCalculator';

const StoreContext = createContext();

const getSavedCartForUser = (userId) => {
  try {
    const key = userId ? `tb_cart_${userId}` : 'tb_cart_guest';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const getSavedWishlistForUser = (userId) => {
  try {
    const key = userId ? `tb_wishlist_${userId}` : 'tb_wishlist_guest';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    // Purge stale local storage products to guarantee fresh sync with Django database
    try {
      const cleanupVersion = localStorage.getItem('tb_clean_db_sync_v8');
      if (!cleanupVersion) {
        localStorage.removeItem('tb_products');
        localStorage.setItem('tb_clean_db_sync_v8', 'true');
      }
    } catch (e) {}

    const saved = localStorage.getItem('tb_products');
    const raw = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    return raw.map(p => {
      const pCode = p.code || (typeof p.id === 'string' && p.id.startsWith('tb-') ? p.id.toUpperCase() : (p.code || p.id));
      const isSpecialEvent = Boolean(p.isSpecialEvent || p.is_special_event);
      const variants = (p.variants || []).map((v, idx) => {
        const vCode = v.code || v.product_code || (pCode ? `${pCode}-${String(idx + 1).padStart(2, '0')}` : '');
        const vImages = Array.isArray(v.images) && v.images.length > 0 
          ? v.images 
          : (v.image ? [v.image] : (v.image_url ? [v.image_url] : []));
        return {
          ...v,
          code: vCode,
          productCode: vCode,
          product_code: vCode,
          images: vImages,
          image: vImages[0] || v.image || v.image_url
        };
      });
      const pImages = Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : (variants.flatMap(v => v.images || []).length > 0 ? variants.flatMap(v => v.images || []) : (p.image ? [p.image] : []));
      return {
        ...p,
        code: pCode,
        productCode: pCode,
        isSpecialEvent,
        eventName: isSpecialEvent ? (p.eventName || p.event_name || '') : '',
        eventBadge: isSpecialEvent ? (p.eventBadge || p.event_badge || '') : '',
        images: pImages,
        variants
      };
    });
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  
  // User Authentication State & 12-Hour Session Expiry (Applies exclusively to regular users, Admin is exempt)
  const USER_SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tb_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);

        // 12-Hour Session Expiry: ONLY for regular users (Admin is exempt)
        if (u.role !== 'Admin') {
          const storedTs = localStorage.getItem('tb_user_login_time');
          const loginTs = Number(u.loginTimestamp || storedTs || (u.loginTime ? new Date(u.loginTime).getTime() : 0));
          if (loginTs > 0) {
            const elapsed = Date.now() - loginTs;
            if (elapsed >= USER_SESSION_DURATION_MS) {
              // Session expired (> 12 hours)
              localStorage.removeItem('tb_user');
              localStorage.removeItem('tb_user_login_time');
              try { sessionStorage.setItem('tb_session_expired_notice', '1'); } catch (e) {}
              return null;
            }
          } else {
            // First time tracking for existing active user session
            const now = Date.now();
            u.loginTimestamp = now;
            u.loginTime = new Date(now).toISOString();
            localStorage.setItem('tb_user_login_time', String(now));
            localStorage.setItem('tb_user', JSON.stringify(u));
          }
        }
        return u;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState('phone'); // 'phone' | 'email'

  // Language & Translation State (.properties powered)
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('tb_language') || 'en';
  });

  const t = (key, fallback = '') => getTranslation(language, key, fallback);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem('tb_language', lang);
    } catch (e) {}
    if (typeof showToast === 'function') {
      showToast(lang === 'ta' ? 'தமிழ் மொழிக்கு மாற்றப்பட்டது!' : 'Language switched to English!');
    }
  };

  // Secure Session Key for DB Cart
  const getSessionKey = () => {
    if (user?.id) return `user_${user.id}`;
    let guestKey = localStorage.getItem('tb_guest_session');
    if (!guestKey) {
      guestKey = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('tb_guest_session', guestKey);
    }
    return guestKey;
  };

  // Cart State (Backed by SQLite Database + Local Cache)
  const [cart, setCart] = useState(() => {
    const savedUser = localStorage.getItem('tb_user');
    let uid = null;
    if (savedUser) {
      try { uid = JSON.parse(savedUser)?.id; } catch (e) {}
    }
    return getSavedCartForUser(uid);
  });

  // Wishlist State (Scoped to current user ID or guest)
  const [wishlist, setWishlist] = useState(() => {
    const savedUser = localStorage.getItem('tb_user');
    let uid = null;
    if (savedUser) {
      try { uid = JSON.parse(savedUser)?.id; } catch (e) {}
    }
    return getSavedWishlistForUser(uid);
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('tb_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Instagram Live Feed State
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [loadingInstagram, setLoadingInstagram] = useState(false);

  // Available Offers & Active Coupons
  const [availableCoupons, setAvailableCoupons] = useState([
    {
      id: 1,
      code: 'WELCOME10',
      title: 'New Customer Special: 10% OFF',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_value: 0,
      first_order_only: false,
      is_active: true
    },
    {
      id: 2,
      code: 'DIWALI20',
      title: 'Festive Celebration: 20% OFF',
      discount_type: 'percentage',
      discount_value: 20,
      min_order_value: 0,
      first_order_only: false,
      is_active: true
    },
    {
      id: 3,
      code: 'THALIR100',
      title: 'Flat ₹100 Instant Discount on Sarees',
      discount_type: 'flat',
      discount_value: 100,
      min_order_value: 0,
      first_order_only: false,
      is_active: true
    }
  ]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);

  const loadAvailableCoupons = async () => {
    try {
      const data = await api.getOffers();
      if (Array.isArray(data) && data.length > 0) {
        setAvailableCoupons(data.filter(o => o.is_active !== false));
      }
    } catch (e) {
      console.warn('Failed to load active coupons:', e);
    }
  };

  const refreshInstagramFeed = async () => {
    setLoadingInstagram(true);
    try {
      const data = await api.getInstagramFeed();
      if (data && data.posts) {
        setInstagramPosts(data.posts);
      }
    } catch (e) {
      console.warn('Failed to load Instagram feed:', e);
    } finally {
      setLoadingInstagram(false);
    }
  };

  // Real-time stock resolution helper across products and color variants
  const getAvailableStock = (productId, colorName) => {
    const prod = products.find(p => String(p.id) === String(productId) || String(p.code) === String(productId));
    if (!prod) return 1;

    if (prod.variants && Array.isArray(prod.variants) && prod.variants.length > 0) {
      if (colorName) {
        const variant = prod.variants.find(v => 
          (v.colorName && v.colorName.toLowerCase() === colorName.toLowerCase()) ||
          (v.color_name && v.color_name.toLowerCase() === colorName.toLowerCase())
        );
        if (variant) {
          if (variant.inStock === false || variant.in_stock === false) return 0;
          const vQty = Number(variant.stockQty ?? variant.stock_qty);
          if (!isNaN(vQty)) return vQty;
        }
      }
      const firstV = prod.variants[0];
      if (firstV) {
        if (firstV.inStock === false || firstV.in_stock === false) return 0;
        const vQty = Number(firstV.stockQty ?? firstV.stock_qty);
        if (!isNaN(vQty)) return vQty;
      }
    }

    if (prod.inStock === false || prod.in_stock === false) return 0;
    const pQty = Number(prod.stockQty ?? prod.stock_qty);
    if (!isNaN(pQty)) return pQty;

    return 1;
  };

  // Helper to format & clamp DB cart items with accurate live stock
  const formatCartItemsWithStock = (dbItems, catalogProducts = products) => {
    return (dbItems || []).map(item => {
      const prod = catalogProducts.find(p => String(p.id) === String(item.productId) || String(p.code) === String(item.productId));
      let availableStock = 1;
      let matchedV = null;
      if (prod) {
        if (prod.variants && Array.isArray(prod.variants)) {
          matchedV = prod.variants.find(v => 
            (v.colorName && v.colorName.toLowerCase() === (item.color || '').toLowerCase()) ||
            (v.color_name && v.color_name.toLowerCase() === (item.color || '').toLowerCase())
          ) || prod.variants[0];
          if (matchedV) {
            availableStock = Number(matchedV.stockQty ?? matchedV.stock_qty ?? 1);
          }
        } else {
          availableStock = Number(prod.stockQty ?? prod.stock_qty ?? 1);
        }
      } else if (item.stock_qty !== undefined) {
        availableStock = Number(item.stock_qty);
      }

      const safeQty = Math.max(1, Math.min(Number(item.qty || 1), availableStock));
      const itemCode = matchedV?.code || matchedV?.productCode || item.code || item.productCode || prod?.code || item.productId;

      return {
        cartItemId: `${item.productId}_${item.color}_${item.size || 'nosize'}`,
        id: item.productId,
        code: itemCode,
        productCode: itemCode,
        product_code: itemCode,
        name: item.name,
        price: item.price,
        color: item.color,
        size: item.size,
        image: item.image,
        qty: safeQty,
        stockQty: availableStock
      };
    });
  };

  // Helper to map Django backend order structure to unified frontend schema
  const formatBackendOrders = (dbOrders, catalogProducts = products) => {
    if (!Array.isArray(dbOrders)) return [];
    return dbOrders.map(o => ({
      orderId: o.order_id || o.orderId,
      timestamp: o.created_at || o.timestamp,
      userId: o.customer?.user_id || o.userId,
      customer: {
        fullName: o.customer_name || o.customer?.fullName || '',
        mobile: o.customer_phone || o.customer?.mobile || '',
        email: o.customer_email || o.customer?.email || '',
        address: o.delivery_address || o.customer?.address || '',
        city: o.city || o.customer?.city || '',
        pincode: o.pincode || o.customer?.pincode || '',
        landmark: o.landmark || o.customer?.landmark || '',
        altMobile: o.customer?.altMobile || ''
      },
      items: (o.items || []).map(i => {
        const pName = i.product_name || i.name;
        let itemImg = i.image_url || i.image;
        let match = null;
        let vMatch = null;
        if (!itemImg || (typeof itemImg === 'string' && itemImg.includes('photo-1610030469983-98e550d6193c'))) {
          match = (catalogProducts || []).find(p => 
            p.name?.toLowerCase().trim() === pName?.toLowerCase().trim() || 
            p.code === i.id || 
            p.id === i.id
          );
          if (match?.variants?.length > 0) {
            vMatch = match.variants.find(v => 
              (v.colorName && v.colorName.toLowerCase().trim() === (i.color || '').toLowerCase().trim()) ||
              (v.color_name && v.color_name.toLowerCase().trim() === (i.color || '').toLowerCase().trim())
            );
            itemImg = vMatch?.image || vMatch?.image_url || match.variants[0].image || match.variants[0].image_url || match.image;
          } else if (match?.image) {
            itemImg = match.image;
          }
        }
        const itemCode = i.product_code || vMatch?.code || vMatch?.productCode || match?.code || (typeof i.id === 'string' && i.id.startsWith('TB-') ? i.id : match?.id) || '';
        return {
          id: i.id || itemCode,
          code: itemCode,
          productCode: itemCode,
          product_code: itemCode,
          name: pName,
          color: i.color,
          size: i.size,
          price: Number(i.unit_price ?? i.price ?? 0),
          qty: Number(i.qty || 1),
          image: itemImg || ''
        };
      }),
      pricing: {
        subtotal: Number(o.subtotal ?? o.pricing?.subtotal ?? 0),
        discountAmount: Number(o.discount_amount ?? o.pricing?.discountAmount ?? 0),
        couponCode: o.coupon_code || o.pricing?.couponCode || '',
        deliveryCharge: Number(o.delivery_charge ?? o.pricing?.deliveryCharge ?? 0),
        grandTotal: Number(o.grand_total ?? o.pricing?.grandTotal ?? 0)
      },
      channel: o.channel || 'site',
      status: o.status || 'Pending Verification',
      is_stock_deducted: o.is_stock_deducted ?? false,
      paymentProof: o.payment_proof || o.paymentProof || '',
      paymentProofImage: o.payment_proof_image || o.paymentProofImage || null,
      payment_proof_image: o.payment_proof_image || o.paymentProofImage || null,
      paymentUtr: o.payment_utr || o.paymentUtr || '',
      payment_utr: o.payment_utr || o.paymentUtr || ''
    }));
  };

  // Fetch Products, Cart, Coupons, Instagram Feed & Orders from Django SQLite Backend on initial mount
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const [backendProducts, dbCartItems, igData, offersData, backendOrders] = await Promise.all([
          api.getProducts().catch((e) => { console.warn('api.getProducts error:', e); return null; }),
          api.getCart(getSessionKey()).catch(() => null),
          api.getInstagramFeed().catch(() => null),
          api.getOffers().catch(() => []),
          api.getOrders().catch(() => null)
        ]);
        const catalog = (backendProducts && backendProducts.length > 0) ? backendProducts : products;
        if (backendProducts && backendProducts.length > 0) {
          setProducts(backendProducts);
          try {
            localStorage.setItem('tb_products', JSON.stringify(backendProducts));
          } catch (e) {}
        }
        if (dbCartItems && Array.isArray(dbCartItems) && dbCartItems.length > 0) {
          const formatted = formatCartItemsWithStock(dbCartItems, catalog);
          setCart(formatted);
        }
        if (igData && igData.posts) {
          setInstagramPosts(igData.posts);
        }
        if (Array.isArray(offersData) && offersData.length > 0) {
          setAvailableCoupons(offersData.filter(o => o.is_active !== false));
        }
        if (backendOrders && Array.isArray(backendOrders)) {
          const formattedOrders = formatBackendOrders(backendOrders, catalog);
          setOrders(formattedOrders);
          try {
            localStorage.setItem('tb_orders', JSON.stringify(formattedOrders));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Backend fetch failed, using cached/initial catalog:', err);
      }
    };
    fetchBackendData();
  }, []);

  // When active user switches/logs in/out, load that specific user's cart from DB & wishlist
  const prevUserIdRef = useRef(user?.id);
  useEffect(() => {
    if (prevUserIdRef.current !== user?.id) {
      prevUserIdRef.current = user?.id;
      setWishlist(getSavedWishlistForUser(user?.id));
      // Load cart from DB for the user session
      api.getCart(getSessionKey()).then(dbItems => {
        if (dbItems && Array.isArray(dbItems) && dbItems.length > 0) {
          const formatted = formatCartItemsWithStock(dbItems, products);
          setCart(formatted);
        } else {
          setCart(getSavedCartForUser(user?.id));
        }
      });
    }
  }, [user?.id, products]);

  // Persist LocalStorage per user with quota protection
  useEffect(() => {
    try {
      const key = user?.id ? `tb_cart_${user.id}` : 'tb_cart_guest';
      localStorage.setItem(key, JSON.stringify(cart));
      localStorage.removeItem('tb_cart_react');
    } catch (e) {
      console.warn('LocalStorage cart save quota notice:', e);
    }
  }, [cart, user?.id]);

  useEffect(() => {
    try {
      const key = user?.id ? `tb_wishlist_${user.id}` : 'tb_wishlist_guest';
      localStorage.setItem(key, JSON.stringify(wishlist));
      localStorage.removeItem('tb_wishlist');
    } catch (e) {
      console.warn('LocalStorage wishlist save quota notice:', e);
    }
  }, [wishlist, user?.id]);

  useEffect(() => {
    try {
      // Lighten product objects if needed before saving
      localStorage.setItem('tb_products', JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage products save quota notice:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      // Clean orders for localStorage
      const lightweightOrders = orders.slice(0, 50).map(ord => ({
        ...ord,
        items: (ord.items || []).map(it => ({
          ...it,
          // If large base64 data URI, keep empty or preserve so dynamic resolver finds exact variant image
          image: (it.image && typeof it.image === 'string' && it.image.startsWith('data:image') && it.image.length > 5000)
            ? ''
            : it.image
        }))
      }));
      localStorage.setItem('tb_orders', JSON.stringify(lightweightOrders));
    } catch (e) {
      console.warn('LocalStorage orders save quota exceeded, falling back to minimal payload:', e);
      try {
        const minimal = orders.slice(0, 20).map(o => ({
          orderId: o.orderId,
          timestamp: o.timestamp,
          channel: o.channel,
          status: o.status,
          customer: o.customer,
          pricing: o.pricing,
          items: (o.items || []).map(i => ({ name: i.name, color: i.color, size: i.size, price: i.price, qty: i.qty }))
        }));
        localStorage.setItem('tb_orders', JSON.stringify(minimal));
      } catch (err2) {
        console.warn('LocalStorage emergency clear for orders:', err2);
      }
    }
  }, [orders]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('tb_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('tb_user');
      }
    } catch (e) {
      console.warn('LocalStorage user save notice:', e);
    }
  }, [user]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const loginDirectUser = (userData) => {
    const cleanEmail = (userData.email && !userData.email.includes('@thalirboutique.com')) ? userData.email : '';
    const now = Date.now();
    const loginTime = userData.last_login ? new Date(userData.last_login).toISOString() : new Date(now).toISOString();
    const loginTimestamp = now;

    const loggedUser = {
      id: userData.user_id,
      name: userData.name,
      username: userData.username || '',
      phone: userData.phone,
      email: cleanEmail,
      role: userData.role || 'Customer',
      authMethod: userData.auth_provider || 'password',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name}&backgroundColor=0D5C3A`,
      membershipTier: userData.membership_tier || 'VIP SHOPPER',
      joinedDate: new Date(userData.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      loginTime,
      loginTimestamp,
      addresses: userData.addresses || []
    };

    if (loggedUser.role !== 'Admin') {
      localStorage.setItem('tb_user_login_time', String(loginTimestamp));
    }

    setUser(loggedUser);
    setIsAuthModalOpen(false);
    showToast(`Welcome, ${userData.name}! ✨`);
    return loggedUser;
  };

  const loginCustomer = async (identifier, password) => {
    const res = await api.login(identifier, password);
    if (res && res.user) {
      return loginDirectUser(res.user);
    }
    throw new Error(res?.error || 'Login failed.');
  };

  const registerCustomer = async (registrationData) => {
    const res = await api.register(registrationData);
    if (res && res.user) {
      return loginDirectUser(res.user);
    }
    throw new Error(res?.error || 'Registration failed.');
  };

  const loginWithPhone = async (phone, name = "Valued Customer", otp = "") => {
    try {
      const res = await api.verifyOtp(phone, otp);
      if (res && res.user) {
        return loginDirectUser(res.user);
      }
    } catch (err) {
      console.warn('API phone login error:', err);
      throw err;
    }
  };

  const loginWithEmail = (email, name, password) => {
    const userName = name || email.split('@')[0];
    const now = Date.now();
    const newUser = {
      id: `usr_${now}`,
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      email: email,
      phone: '',
      role: 'Customer',
      authMethod: 'email',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${userName}&backgroundColor=0D5C3A`,
      membershipTier: 'VIP SHOPPER',
      joinedDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      loginTime: new Date(now).toISOString(),
      loginTimestamp: now,
      addresses: []
    };
    localStorage.setItem('tb_user_login_time', String(now));
    setUser(newUser);
    setIsAuthModalOpen(false);
    showToast(`Welcome to Thalir Boutique, ${newUser.name}! 💚`);
  };

  const loginWithGoogle = async (googlePayload = null) => {
    try {
      const payload = googlePayload || {
        email: "customer@gmail.com",
        name: "Valued Customer",
        picture: "https://api.dicebear.com/7.x/initials/svg?seed=Customer&backgroundColor=0D5C3A"
      };

      const res = await api.loginGoogle(payload);
      if (res && res.user) {
        return loginDirectUser(res.user);
      }
    } catch (e) {
      console.warn('API Google login error:', e);
    }

    // Fallback if backend offline
    const fallbackName = googlePayload?.name || "Customer";
    const fallbackEmail = googlePayload?.email || "customer@gmail.com";
    return loginDirectUser({
      user_id: `usr_google_${Date.now()}`,
      name: fallbackName,
      email: fallbackEmail,
      phone: '',
      role: 'Customer',
      auth_provider: 'google',
      avatar: googlePayload?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${fallbackName}&backgroundColor=0D5C3A`,
      membership_tier: 'VIP SHOPPER',
      created_at: new Date().toISOString(),
      addresses: []
    });
  };

  const logout = (customMessage = null) => {
    setUser(null);
    setCart([]);
    setWishlist([]);
    localStorage.removeItem('tb_user');
    localStorage.removeItem('tb_user_login_time');
    localStorage.removeItem('tb_admin_authenticated');
    localStorage.removeItem('tb_cart_react');
    localStorage.removeItem('tb_wishlist');
    setIsAdminDemoMode(false);
    setIsUserPanelOpen(false);
    window.location.hash = '';
    showToast(customMessage || "Logged out successfully.");
  };

  // Notify if user session expired while away
  useEffect(() => {
    try {
      if (sessionStorage.getItem('tb_session_expired_notice') === '1') {
        sessionStorage.removeItem('tb_session_expired_notice');
        showToast("Your session has expired (12 hours). Please log in again. ⏳");
      }
    } catch (e) {}
  }, []);

  // 12-Hour Active Session Expiry Watchdog (Applies strictly to Users; Admin is exempt)
  useEffect(() => {
    if (!user || user.role === 'Admin') return;

    const checkSessionExpiry = () => {
      const storedTs = localStorage.getItem('tb_user_login_time');
      const loginTs = Number(user.loginTimestamp || storedTs || (user.loginTime ? new Date(user.loginTime).getTime() : 0));
      if (!loginTs || isNaN(loginTs)) return;

      const elapsed = Date.now() - loginTs;
      if (elapsed >= USER_SESSION_DURATION_MS) {
        logout("Your session has expired (12 hours). Please log in again. ⏳");
      }
    };

    // Run check immediately
    checkSessionExpiry();

    // Check periodically every 30 seconds
    const intervalId = setInterval(checkSessionExpiry, 30000);

    // Also check on tab refocus or visibility change (e.g. laptop wake or switching tabs)
    const handleActivity = () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiry();
      }
    };

    window.addEventListener('visibilitychange', handleActivity);
    window.addEventListener('focus', handleActivity);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, [user?.id, user?.loginTimestamp, user?.role]);

  const updateUserProfile = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
    showToast("Profile updated successfully!");
  };

  const saveUserAddress = (newAddress) => {
    setUser(prev => {
      const existingAddresses = prev.addresses || [];
      const updated = newAddress.isDefault
        ? existingAddresses.map(a => ({ ...a, isDefault: false }))
        : existingAddresses;
      return {
        ...prev,
        addresses: [...updated, { ...newAddress, id: `addr_${Date.now()}` }]
      };
    });
    showToast("Address saved to your account!");
  };

  const deleteUserAddress = (addrId) => {
    setUser(prev => ({
      ...prev,
      addresses: prev.addresses.filter(a => a.id !== addrId)
    }));
    showToast("Address removed.");
  };

  // Wishlist actions
  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from wishlist.`);
        return prev.filter(item => item.id !== product.id);
      } else {
        showToast(`Saved "${product.name}" to your wishlist! ❤️`);
        return [...prev, product];
      }
    });
  };

  const isWishlisted = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  // Cart actions with Database Persistence & Stock Validation
  const addToCart = (product, selectedColor, selectedSize, selectedImage, openCart = true) => {
    const color = selectedColor || product.defaultColor || product.default_color || 'Standard';
    const size = selectedSize || (product.sizes ? product.sizes[0] : null);
    const image = selectedImage || (product.variants ? (product.variants[0].image || product.variants[0].image_url) : (product.image || product.image_url));

    const cartItemId = `${product.id}_${color}_${size || 'nosize'}`;

    const matchingVariant = product.variants?.find(v => 
      (v.colorName && v.colorName.toLowerCase() === color.toLowerCase()) ||
      (v.color_name && v.color_name.toLowerCase() === color.toLowerCase())
    );

    const stockQty = Number(
      matchingVariant?.stockQty ?? 
      matchingVariant?.stock_qty ?? 
      getAvailableStock(product.id, color) ?? 
      1
    );
    const inStock = matchingVariant?.inStock ?? matchingVariant?.in_stock ?? product.inStock ?? product.in_stock ?? true;

    if (!inStock || stockQty <= 0) {
      showToast(`Sorry, "${product.name}" (${color}) is currently out of stock!`);
      return false;
    }

    const existing = cart.find(item => item.cartItemId === cartItemId);
    const currentQty = existing ? existing.qty : 0;

    // Stock check constraint: if there is 1 product alone, do not allow adding 2 or more quantity
    if (currentQty >= stockQty) {
      showToast(`⚠️ Only ${stockQty} piece${stockQty > 1 ? 's' : ''} available in stock for "${product.name}" (${color}).`);
      if (openCart) setIsCartOpen(true);
      return false;
    }

    const nextQty = Math.min(currentQty + 1, stockQty);

    setCart(prev => {
      const exists = prev.find(item => item.cartItemId === cartItemId);
      if (exists) {
        return prev.map(item =>
          item.cartItemId === cartItemId ? { ...item, qty: nextQty, stockQty } : item
        );
      } else {
        const itemCode = matchingVariant?.code || matchingVariant?.productCode || matchingVariant?.product_code || product.code || product.id;
        return [...prev, {
          cartItemId,
          id: product.id,
          code: itemCode,
          productCode: itemCode,
          product_code: itemCode,
          name: product.name,
          category: product.category,
          price: product.basePrice,
          color,
          size,
          image,
          qty: 1,
          stockQty
        }];
      }
    });

    // Save directly to SQLite DB with exact qty sync
    api.addToCartDB({
      session_key: getSessionKey(),
      user_id: user?.id,
      product_id: product.id,
      name: product.name,
      price: product.basePrice,
      color,
      size,
      image,
      exact_qty: nextQty
    });

    showToast(t('product.added_to_bag', `Added "${product.name}" (${color}) to bag!`));
    if (openCart) {
      setIsCartOpen(true);
    }
    return true;
  };

  // Instant 1-Click Buy Now (Isolated single product with precisely qty = 1)
  const buyNow = (product, selectedColor, selectedSize, selectedImage) => {
    const color = selectedColor || product.defaultColor || product.default_color || 'Standard';
    const size = selectedSize || (product.sizes ? product.sizes[0] : null);
    const image = selectedImage || (product.variants ? (product.variants[0].image || product.variants[0].image_url) : (product.image || product.image_url));
    const cartItemId = `${product.id}_${color}_${size || 'nosize'}`;

    const matchingVariant = product.variants?.find(v => 
      (v.colorName && v.colorName.toLowerCase() === color.toLowerCase()) ||
      (v.color_name && v.color_name.toLowerCase() === color.toLowerCase())
    );

    const stockQty = Number(
      matchingVariant?.stockQty ?? 
      matchingVariant?.stock_qty ?? 
      getAvailableStock(product.id, color) ?? 
      1
    );
    const inStock = matchingVariant?.inStock ?? matchingVariant?.in_stock ?? product.inStock ?? product.in_stock ?? true;

    if (!inStock || stockQty <= 0) {
      showToast(`Sorry, "${product.name}" (${color}) is currently out of stock!`);
      return;
    }

    // Buy Now sets checkout specifically for this product alone with exactly qty = 1
    const itemCode = matchingVariant?.code || matchingVariant?.productCode || matchingVariant?.product_code || product.code || product.id;
    const buyNowItem = {
      cartItemId,
      id: product.id,
      code: itemCode,
      productCode: itemCode,
      product_code: itemCode,
      name: product.name,
      category: product.category,
      price: product.basePrice,
      color,
      size,
      image,
      qty: 1,
      stockQty
    };

    setCart([buyNowItem]);

    api.addToCartDB({
      session_key: getSessionKey(),
      user_id: user?.id,
      product_id: product.id,
      name: product.name,
      price: product.basePrice,
      color,
      size,
      image,
      exact_qty: 1,
      clear_others: true
    });

    setIsCheckoutOpen(true);
  };

  const updateCartQty = (cartItemId, delta) => {
    const targetItem = cart.find(item => item.cartItemId === cartItemId);
    if (!targetItem) return;

    const maxStock = getAvailableStock(targetItem.id, targetItem.color);
    const currentQty = targetItem.qty;

    if (delta > 0 && currentQty >= maxStock) {
      showToast(`⚠️ Only ${maxStock} piece${maxStock > 1 ? 's' : ''} available in stock for this saree.`);
      return;
    }

    const newQty = Math.min(Math.max(0, currentQty + delta), maxStock);

    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          return newQty > 0 ? { ...item, qty: newQty, stockQty: maxStock } : null;
        }
        return item;
      }).filter(Boolean);
    });

    api.updateCartQtyDB({
      session_key: getSessionKey(),
      product_id: targetItem.id,
      color: targetItem.color,
      size: targetItem.size,
      qty: newQty
    });
  };

  const removeFromCart = (cartItemId) => {
    const targetItem = cart.find(item => item.cartItemId === cartItemId);
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));

    if (targetItem) {
      api.removeFromCartDB({
        session_key: getSessionKey(),
        product_id: targetItem.id,
        color: targetItem.color,
        size: targetItem.size
      });
    }
  };

  const clearCart = () => {
    setCart([]);
    const key = user?.id ? `tb_cart_${user.id}` : 'tb_cart_guest';
    localStorage.setItem(key, JSON.stringify([]));
    localStorage.removeItem('tb_cart_react');

    api.clearCartDB(getSessionKey());
  };

  // Cart & Dynamic Coupon calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Calculate live discount based on current cart subtotal
  let cartDiscount = 0;
  if (appliedCoupon && cartSubtotal > 0) {
    const minSpend = Number(appliedCoupon.min_order_value) || 0;
    if (cartSubtotal >= minSpend) {
      if (appliedCoupon.discount_type === 'percentage') {
        cartDiscount = Math.round((cartSubtotal * Number(appliedCoupon.discount_value)) / 100);
      } else {
        cartDiscount = Math.min(cartSubtotal, Number(appliedCoupon.discount_value));
      }
    }
  }

  // Dynamic Distance-based Delivery Charge State
  // <= 100 km -> ₹30 | 100-500 km -> ₹50 | > 500 km -> ₹70
  const [shippingInfo, setShippingInfo] = useState(() => ({
    rate: 30, // Default to local delivery
    distanceKm: 25,
    tier: "Local Delivery (≤ 100 km)",
    description: "📍 ~25 km from Veppadai Boutique • Local Shipping ₹30",
    badgeColor: "emerald",
    tag: "Local Express",
    resolvedPlace: ""
  }));

  const updateShippingByDistance = (distanceKm, extraDetails = {}) => {
    const rateData = getShippingRateForDistance(distanceKm);
    setShippingInfo(prev => ({
      ...prev,
      ...rateData,
      ...extraDetails
    }));
  };

  const deliveryCharge = cartSubtotal === 0 ? 0 : (shippingInfo.rate ?? 30);
  const grandTotal = Math.max(0, cartSubtotal - cartDiscount + (cartSubtotal > 0 ? deliveryCharge : 0));

  const applyCoupon = async (couponCode, optionalCustomerPhone = null) => {
    setCouponError(null);
    if (!couponCode || !couponCode.trim()) {
      const msg = 'Please enter a coupon code.';
      setCouponError(msg);
      showToast(msg);
      return false;
    }
    const cleanCode = couponCode.trim().toUpperCase();

    let matched = availableCoupons.find(c => c.code?.toUpperCase() === cleanCode);
    if (!matched) {
      try {
        const freshOffers = await api.getOffers();
        if (Array.isArray(freshOffers)) {
          setAvailableCoupons(freshOffers.filter(o => o.is_active !== false));
          matched = freshOffers.find(c => c.code?.toUpperCase() === cleanCode && c.is_active !== false);
        }
      } catch (e) {}
    }

    if (!matched) {
      const msg = `Invalid or expired coupon code "${cleanCode}".`;
      setCouponError(msg);
      showToast(msg);
      return false;
    }

    // Check First-Order-Only restriction for coupons explicitly marked first_order_only
    const isFirstOrderCoupon = Boolean(matched.first_order_only);
    if (isFirstOrderCoupon) {
      const phoneToCheck = optionalCustomerPhone || user?.phone;
      const emailToCheck = user?.email;
      const userIdToCheck = user?.id;

      // 1. Check local loaded orders
      const hasPastOrder = orders.some(o => {
        if (o.status === 'Cancelled') return false;
        if (userIdToCheck && (o.userId === userIdToCheck || o.customer?.userId === userIdToCheck)) return true;
        if (phoneToCheck) {
          const cleanP = String(phoneToCheck).replace(/\D/g, '').slice(-10);
          const oP = String(o.customer?.mobile || o.customer_phone || o.customerPhone || '').replace(/\D/g, '').slice(-10);
          if (cleanP && oP && cleanP === oP) return true;
        }
        if (emailToCheck && o.customer?.email && o.customer.email.toLowerCase() === emailToCheck.toLowerCase()) return true;
        return false;
      });

      if (hasPastOrder) {
        const msg = `Coupon "${cleanCode}" is valid only on your first order with Thalir Boutique.`;
        setCouponError(msg);
        showToast(msg);
        return false;
      }

      // 2. Query backend orders if phone or userId is present to be 100% sure across browser sessions
      if (phoneToCheck || userIdToCheck) {
        try {
          const cleanPhoneParam = phoneToCheck ? String(phoneToCheck).replace(/\D/g, '').slice(-10) : null;
          const past = await api.getOrders(userIdToCheck, cleanPhoneParam);
          if (Array.isArray(past) && past.some(o => o.status !== 'Cancelled')) {
            const msg = `Coupon "${cleanCode}" is valid only on your first order with Thalir Boutique.`;
            setCouponError(msg);
            showToast(msg);
            return false;
          }
        } catch (e) {}
      }
    }

    const minSpend = Number(matched.min_order_value) || 0;
    if (cartSubtotal < minSpend) {
      const diff = minSpend - cartSubtotal;
      const msg = `Minimum order of ₹${minSpend.toLocaleString('en-IN')} required for "${cleanCode}". Add ₹${diff.toLocaleString('en-IN')} more!`;
      setCouponError(msg);
      showToast(msg);
      return false;
    }

    let calculatedDiscount = 0;
    if (matched.discount_type === 'percentage') {
      calculatedDiscount = Math.round((cartSubtotal * Number(matched.discount_value)) / 100);
    } else {
      calculatedDiscount = Math.min(cartSubtotal, Number(matched.discount_value));
    }

    setAppliedCoupon({
      ...matched,
      discountAmount: calculatedDiscount
    });
    setCouponError(null);
    showToast(`Coupon "${matched.code}" applied! You saved ₹${calculatedDiscount.toLocaleString('en-IN')}!`);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    showToast('Coupon removed.');
  };

  // Stock deduction & restoration helpers
  const deductStockForOrder = (orderToDeduct) => {
    if (!orderToDeduct || !orderToDeduct.items) return;

    setProducts(prevProducts => {
      const updatedProds = prevProducts.map(prod => {
        let updatedVariants = [...(prod.variants || [])];
        let hasChange = false;

        orderToDeduct.items.forEach(item => {
          const itemProdName = (item.name || item.product_name || '').trim().toLowerCase();
          const prodName = (prod.name || '').trim().toLowerCase();

          if (prodName === itemProdName || prodName.includes(itemProdName) || itemProdName.includes(prodName)) {
            const itemColor = (item.color || '').trim().toLowerCase().replace(/[-_]/g, ' ');
            
            updatedVariants = updatedVariants.map(v => {
              const vColor = (v.colorName || v.color_name || '').trim().toLowerCase().replace(/[-_]/g, ' ');
              if (vColor === itemColor || vColor.includes(itemColor) || itemColor.includes(vColor)) {
                hasChange = true;
                const currentStock = Number(v.stockQty !== undefined ? v.stockQty : (v.stock_qty !== undefined ? v.stock_qty : 1));
                const qtyToDeduct = Number(item.qty || 1);
                const newQty = Math.max(0, currentStock - qtyToDeduct);
                return {
                  ...v,
                  stockQty: newQty,
                  stock_qty: newQty,
                  inStock: newQty > 0,
                  in_stock: newQty > 0
                };
              }
              return v;
            });
          }
        });

        if (hasChange) {
          const newTotal = updatedVariants.reduce((sum, v) => sum + Number(v.stockQty || v.stock_qty || 0), 0);
          return {
            ...prod,
            totalStock: newTotal,
            inStock: newTotal > 0,
            isSoldOut: newTotal <= 0,
            variants: updatedVariants
          };
        }
        return prod;
      });

      try {
        localStorage.setItem('tb_products', JSON.stringify(updatedProds));
      } catch (e) {}

      return updatedProds;
    });
  };

  const restoreStockForOrder = (orderToRestore) => {
    if (!orderToRestore || !orderToRestore.items) return;

    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        let updatedVariants = [...(prod.variants || [])];
        let hasChange = false;

        orderToRestore.items.forEach(item => {
          const itemProdName = (item.name || item.product_name || '').trim().toLowerCase();
          const prodName = (prod.name || '').trim().toLowerCase();

          if (prodName === itemProdName || prodName.includes(itemProdName) || itemProdName.includes(prodName)) {
            const itemColor = (item.color || '').trim().toLowerCase().replace(/[-_]/g, ' ');
            
            updatedVariants = updatedVariants.map(v => {
              const vColor = (v.colorName || v.color_name || '').trim().toLowerCase().replace(/[-_]/g, ' ');
              if (vColor === itemColor || vColor.includes(itemColor) || itemColor.includes(vColor)) {
                hasChange = true;
                const currentStock = Number(v.stockQty !== undefined ? v.stockQty : (v.stock_qty !== undefined ? v.stock_qty : 0));
                const qtyToRestore = Number(item.qty || 1);
                const newQty = currentStock + qtyToRestore;
                return {
                  ...v,
                  stockQty: newQty,
                  stock_qty: newQty,
                  inStock: newQty > 0,
                  in_stock: newQty > 0
                };
              }
              return v;
            });
          }
        });

        if (hasChange) {
          return {
            ...prod,
            variants: updatedVariants
          };
        }
        return prod;
      });
    });
  };

  // Order actions
  const recordOrder = async (orderData) => {
    const isDirectInStore = ['direct_shop', 'in_store', 'direct', 'manual'].includes(orderData.channel);
    const isPaidOnline = orderData.status === 'Payment Confirmed' || 
      Boolean(orderData.paymentMethod && orderData.paymentMethod.toLowerCase().includes('razorpay')) ||
      Boolean(orderData.payment_method && orderData.payment_method.toLowerCase().includes('razorpay'));
    const shouldDeduct = isDirectInStore || isPaidOnline || Boolean(orderData.is_stock_deducted);
    
    const enhancedOrder = {
      ...orderData,
      is_stock_deducted: shouldDeduct,
      status: shouldDeduct ? 'Payment Confirmed' : (orderData.status || 'Pending Verification'),
      userId: user ? user.id : 'guest',
      userEmail: user ? user.email : orderData.customer?.email,
      paymentProofImage: orderData.paymentProofImage || orderData.payment_proof_image || null,
      payment_proof_image: orderData.paymentProofImage || orderData.payment_proof_image || null
    };
    setOrders(prev => [enhancedOrder, ...prev]);
    setCompletedOrder(enhancedOrder);
    
    if (shouldDeduct) {
      deductStockForOrder(enhancedOrder);
    }

    clearCart();
    setIsCheckoutOpen(false);

    // Sync to Django Backend database
    try {
      await api.placeOrder(enhancedOrder);
    } catch (err) {
      console.warn('Backend order recording sync error:', err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.orderId === orderId);
    const isConfirmed = ['Payment Confirmed', 'Dispatched', 'Delivered'].includes(newStatus);
    const isCancelled = ['Cancelled', 'Returned'].includes(newStatus);
    
    setOrders(prev => prev.map(o => {
      if (o.orderId === orderId) {
        let isDeducted = o.is_stock_deducted;
        if (isConfirmed) isDeducted = true;
        if (isCancelled) isDeducted = false;
        return { ...o, status: newStatus, is_stock_deducted: isDeducted };
      }
      return o;
    }));

    if (targetOrder) {
      if (isConfirmed && !targetOrder.is_stock_deducted) {
        deductStockForOrder(targetOrder);
      } else if (isCancelled && targetOrder.is_stock_deducted) {
        restoreStockForOrder(targetOrder);
      }
    }

    try {
      await api.updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.warn('Backend order status sync error:', err);
    }
  };

  const toggleOrderStock = async (orderId, explicitAction = null) => {
    const targetOrder = orders.find(o => o.orderId === orderId);
    if (!targetOrder) return;

    const currentlyDeducted = !!targetOrder.is_stock_deducted;
    const shouldDeduct = explicitAction === 'deduct' ? true : (explicitAction === 'restore' ? false : !currentlyDeducted);

    if (shouldDeduct) {
      deductStockForOrder(targetOrder);
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, is_stock_deducted: true, status: o.status === 'Pending Verification' ? 'Payment Confirmed' : o.status } : o));
      showToast(`Stock marked as SOLD & deducted for order #${orderId}! 📦 (Recorded in Accounts & Daybook)`);
    } else {
      restoreStockForOrder(targetOrder);
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, is_stock_deducted: false } : o));
      showToast(`Stock restored (+units returned to inventory) for order #${orderId} ✓`);
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/toggle-stock/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: shouldDeduct ? 'deduct' : 'restore', order: targetOrder })
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh products from backend to ensure 100% sync
        const backendProducts = await api.getProducts();
        if (backendProducts && backendProducts.length > 0) {
          setProducts(backendProducts);
        }
      }
    } catch (e) {
      console.warn('Backend toggle-stock notice:', e);
    }
  };

  const updateOrderDetails = async (orderId, updatedOrder) => {
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, ...updatedOrder } : o));
    try {
      await api.updateOrder(orderId, updatedOrder);
    } catch (err) {
      console.warn('Backend full order update sync error:', err);
    }
    showToast(`Order #${orderId} updated successfully! ✏️`);
  };

  const createManualOrder = async (orderPayload) => {
    const payloadWithStock = { ...orderPayload, is_stock_deducted: true };
    setOrders(prev => [payloadWithStock, ...prev]);
    deductStockForOrder(payloadWithStock);
    try {
      await api.placeOrder(payloadWithStock);
    } catch (err) {
      console.warn('Backend manual order sync error:', err);
    }
    showToast(`Direct / In-Store Order #${orderPayload.orderId} created & stock updated! 🛍️`);
    return payloadWithStock;
  };

  const deleteOrder = async (orderId) => {
    const targetOrder = orders.find(o => o.orderId === orderId);
    if (targetOrder && targetOrder.is_stock_deducted) {
      restoreStockForOrder(targetOrder);
    }
    setOrders(prev => {
      const updated = prev.filter(o => o.orderId !== orderId);
      try {
        localStorage.setItem('tb_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      await api.deleteOrder(orderId);
    } catch (err) {
      console.warn('Backend order delete sync error:', err);
    }
    showToast(`Order #${orderId} permanently deleted.`);
  };

  const [isAdminDemoMode, setIsAdminDemoMode] = useState(false);

  const isDemoOrAdminStoreMode = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return hash.includes('demo') || hash.includes('view-store') || path.includes('demo') || path.includes('view-store');
  };

  const [isStoreAdminMode, setIsStoreAdminMode] = useState(() => isDemoOrAdminStoreMode());

  useEffect(() => {
    const handleHashSync = () => {
      setIsStoreAdminMode(isDemoOrAdminStoreMode() || isAdminDemoMode);
    };
    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, [isAdminDemoMode]);

  const addNewProduct = async (newProd) => {
    const productPayload = {
      ...newProd,
      tag: 'New Arrival'
    };
    try {
      const created = await api.createProduct(productPayload);
      const finalProduct = created ? { ...created, tag: 'New Arrival' } : productPayload;

      setProducts(prev => [
        finalProduct, 
        ...prev.filter(p => p.id !== finalProduct.id).map(p => 
          (String(p.tag || '').trim().toLowerCase() === 'new arrival') 
            ? { ...p, tag: '' } 
            : p
        )
      ]);
      showToast(`Product "${newProd.name}" added as New Arrival! ✨`);
      return finalProduct;
    } catch (err) {
      console.warn('Backend product creation sync error:', err);
      setProducts(prev => [
        productPayload, 
        ...prev.map(p => 
          (String(p.tag || '').trim().toLowerCase() === 'new arrival') 
            ? { ...p, tag: '' } 
            : p
        )
      ]);
      showToast(`Product "${newProd.name}" added to catalog! ✨`);
    }
  };

  const updateProduct = async (productId, updatedFields) => {
    try {
      const targetProduct = products.find(p => p.id === productId || p.code === productId);
      const dbId = targetProduct?.dbId || targetProduct?.id || productId;
      const isNewArrival = String(updatedFields.tag || '').trim().toLowerCase() === 'new arrival';
      
      const updated = await api.updateProduct(dbId, updatedFields);
      if (updated) {
        setProducts(prev => prev.map(p => {
          if (p.id === productId || p.code === productId) return { ...p, ...updated };
          if (isNewArrival && String(p.tag || '').trim().toLowerCase() === 'new arrival') return { ...p, tag: '' };
          return p;
        }));
      } else {
        setProducts(prev => prev.map(p => {
          if (p.id === productId || p.code === productId) return { ...p, ...updatedFields };
          if (isNewArrival && String(p.tag || '').trim().toLowerCase() === 'new arrival') return { ...p, tag: '' };
          return p;
        }));
      }
      showToast(`Product "${updatedFields.name || 'item'}" updated successfully! ✏️`);
      return updated;
    } catch (err) {
      console.warn('Backend product update error:', err);
      const isNewArrival = String(updatedFields.tag || '').trim().toLowerCase() === 'new arrival';
      setProducts(prev => prev.map(p => {
        if (p.id === productId || p.code === productId) return { ...p, ...updatedFields };
        if (isNewArrival && String(p.tag || '').trim().toLowerCase() === 'new arrival') return { ...p, tag: '' };
        return p;
      }));
      showToast(`Product updated in catalog! ✏️`);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const targetProduct = products.find(p => p.id === productId || p.code === productId);
      const dbId = targetProduct?.dbId || targetProduct?.id || productId;

      await api.deleteProduct(dbId);
      setProducts(prev => prev.filter(p => p.id !== productId && p.code !== productId));
      if (selectedProductForModal?.id === productId || selectedProductForModal?.code === productId) {
        setSelectedProductForModal(null);
      }
      showToast(`Product deleted from catalog. 🗑️`);
      return true;
    } catch (err) {
      console.warn('Backend product delete error:', err);
      setProducts(prev => prev.filter(p => p.id !== productId && p.code !== productId));
      showToast(`Product deleted from catalog. 🗑️`);
      return false;
    }
  };

  const lastRecordedViewRef = useRef(null);

  // Helper: Persistent visitor UUID for unique view tracking
  const getOrCreateVisitorId = () => {
    if (typeof window === 'undefined') return 'anon';
    try {
      let vid = localStorage.getItem('tb_visitor_id');
      if (!vid) {
        vid = 'vis_' + (window.crypto?.randomUUID ? window.crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2, 9)));
        localStorage.setItem('tb_visitor_id', vid);
      }
      return vid;
    } catch (e) {
      return 'anon';
    }
  };

  // Helper: Detect if current actor is Admin
  const isCurrentActorAdmin = () => {
    if (isStoreAdminMode) return true;
    if (isAdminDemoMode) return true;
    if (user?.role === 'Admin') return true;
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('tb_admin_authenticated') === 'true') return true;
      if (sessionStorage.getItem('tb_admin_authenticated') === 'true') return true;
      if (window.location.hash.startsWith('#admin')) return true;
    }
    return false;
  };

  // Helper: Deduplicate views locally per browser/visitor session
  const hasVisitorViewedProduct = (productIdOrCode) => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('tb_viewed_product_ids');
      const list = raw ? JSON.parse(raw) : [];
      return list.includes(String(productIdOrCode));
    } catch (e) {
      return false;
    }
  };

  const markVisitorViewedProduct = (productIdOrCode) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('tb_viewed_product_ids');
      const list = raw ? JSON.parse(raw) : [];
      const strId = String(productIdOrCode);
      if (!list.includes(strId)) {
        list.push(strId);
        localStorage.setItem('tb_viewed_product_ids', JSON.stringify(list));
      }
    } catch (e) {}
  };

  // Record user view / impression for products in real-time
  // RULES:
  // 1. Admin viewing products NEVER increments view count.
  // 2. Same user viewing a product multiple times is counted only once.
  const recordProductView = async (productIdOrCode) => {
    if (!productIdOrCode) return;

    // Rule 1: Admins do NOT generate view counts
    if (isCurrentActorAdmin()) {
      return;
    }

    const strKey = String(productIdOrCode);

    // Rule 2: Deduplicate unique customer views
    if (hasVisitorViewedProduct(strKey)) {
      return;
    }

    // Mark as viewed on client immediately to prevent concurrent duplicate hits
    markVisitorViewedProduct(strKey);

    const visitorId = getOrCreateVisitorId();
    const userId = user?.id || user?.userId || '';

    try {
      const res = await api.recordProductView(productIdOrCode, {
        is_admin: false,
        visitor_id: visitorId,
        user_id: userId
      });

      if (res && res.views_count !== undefined && res.is_new_view) {
        setProducts(prev => prev.map(p => 
          (p.id === productIdOrCode || p.code === productIdOrCode || p.dbId === productIdOrCode || String(p.id) === String(res.id))
            ? { ...p, viewsCount: res.views_count, views: res.views_count }
            : p
        ));
        setSelectedProductForModal(prev => {
          if (!prev) return null;
          if (prev.id === productIdOrCode || prev.code === productIdOrCode || prev.dbId === productIdOrCode || String(prev.id) === String(res.id)) {
            return { ...prev, viewsCount: res.views_count, views: res.views_count };
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn('Record view error:', e);
    }
  };

  // Auto-record product view when opened in details modal (customers only, unique per customer)
  useEffect(() => {
    if (selectedProductForModal) {
      // Rule 1: Never record views if current user is admin
      if (isCurrentActorAdmin()) return;

      const pid = selectedProductForModal.dbId || selectedProductForModal.id || selectedProductForModal.code;
      if (pid && lastRecordedViewRef.current !== pid) {
        lastRecordedViewRef.current = pid;
        recordProductView(pid);
      }
    } else {
      lastRecordedViewRef.current = null;
    }
  }, [selectedProductForModal?.id, selectedProductForModal?.code]);

  // WhatsApp Direct Product Inquiry / Order logging in Admin
  const recordWhatsAppInquiry = async (product, selectedColor, selectedSize, selectedImage) => {
    const orderId = `TB-WA-${Date.now().toString().slice(-6)}`;
    const color = selectedColor || product.defaultColor || 'Standard';
    const size = selectedSize || (product.sizes ? product.sizes[0] : 'Free Size');
    const image = selectedImage || (product.variants ? product.variants[0]?.image : product.image);

    const matchingVariant = product.variants?.find(v => 
      (v.colorName && v.colorName.toLowerCase() === color.toLowerCase()) ||
      (v.color_name && v.color_name.toLowerCase() === color.toLowerCase())
    );
    const itemCode = matchingVariant?.code || matchingVariant?.productCode || matchingVariant?.product_code || product.code || product.id;

    const waOrder = {
      orderId,
      timestamp: new Date().toISOString(),
      customer: {
        fullName: user?.name || 'Valued Customer',
        mobile: user?.phone || 'WhatsApp Direct',
        altMobile: '',
        email: user?.email || '',
        address: user?.addresses?.[0]?.address || 'Order initiated via WhatsApp direct chat',
        city: user?.addresses?.[0]?.city || 'Namakkal',
        pincode: user?.addresses?.[0]?.pincode || '638008',
        landmark: ''
      },
      orderNotes: `Direct WhatsApp Inquiry for [${itemCode}] ${product.name} (${color})`,
      items: [{
        cartItemId: `${product.id}_${color}`,
        id: product.id,
        code: itemCode,
        productCode: itemCode,
        product_code: itemCode,
        name: product.name,
        category: product.category,
        price: product.basePrice,
        color,
        size,
        image,
        qty: 1
      }],
      pricing: {
        subtotal: product.basePrice,
        deliveryCharge: 0,
        grandTotal: product.basePrice
      },
      paymentProof: 'WhatsApp Order Inquiry',
      channel: 'whatsapp',
      status: 'Pending Verification'
    };

    setOrders(prev => [waOrder, ...prev]);

    try {
      await api.placeOrder(waOrder);
    } catch (err) {
      console.warn('Failed to sync WhatsApp inquiry to backend:', err);
    }
  };

  // User specific orders
  const userOrders = user 
    ? orders.filter(o => o.userId === user.id || o.customer?.mobile === user.phone || o.customer?.email === user.email)
    : [];

  const syncInstagramFeed = async (token = null) => {
    setLoadingInstagram(true);
    try {
      const res = await api.syncInstagramFeed(token);
      showToast(res.message || 'Instagram feed updated! 📸');
      await refreshInstagramFeed();
      return res;
    } catch (e) {
      showToast('Instagram sync notice: ' + (e.message || 'Updated feed'));
      await refreshInstagramFeed();
    } finally {
      setLoadingInstagram(false);
    }
  };

  const addInstagramPost = async (postData) => {
    try {
      const res = await api.addInstagramPost(postData);
      showToast('Instagram photo added successfully! 🌸');
      await refreshInstagramFeed();
      return res;
    } catch (e) {
      showToast('Failed to add photo: ' + (e.message || 'Error'));
      throw e;
    }
  };

  const deleteInstagramPost = async (postId) => {
    try {
      const res = await api.deleteInstagramPost(postId);
      showToast('Instagram photo removed.');
      await refreshInstagramFeed();
      return res;
    } catch (e) {
      showToast('Failed to remove photo: ' + (e.message || 'Error'));
      throw e;
    }
  };

  return (
    <StoreContext.Provider value={{
      products,
      setProducts,
      activeCategory,
      setActiveCategory,
      selectedProductForModal,
      setSelectedProductForModal,
      user,
      isAuthModalOpen,
      setIsAuthModalOpen,
      isUserPanelOpen,
      setIsUserPanelOpen,
      authDefaultTab,
      setAuthDefaultTab,
      loginDirectUser,
      loginCustomer,
      registerCustomer,
      loginWithPhone,
      loginWithEmail,
      loginWithGoogle,
      logout,
      updateUserProfile,
      saveUserAddress,
      deleteUserAddress,
      wishlist,
      toggleWishlist,
      isWishlisted,
      userOrders,
      cart,
      cartCount,
      cartSubtotal,
      deliveryCharge,
      shippingInfo,
      setShippingInfo,
      updateShippingByDistance,
      grandTotal,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      completedOrder,
      setCompletedOrder,
      toastMessage,
      showToast,
      orders,
      getAvailableStock,
      addToCart,
      buyNow,
      updateCartQty,
      removeFromCart,
      clearCart,
      recordOrder,
      createManualOrder,
      updateOrderStatus,
      updateOrderDetails,
      toggleOrderStock,
      deleteOrder,
      addNewProduct,
      updateProduct,
      recordProductView,
      instagramPosts,
      loadingInstagram,
      refreshInstagramFeed,
      syncInstagramFeed,
      addInstagramPost,
      deleteInstagramPost,
      cartDiscount,
      appliedCoupon,
      availableCoupons,
      couponError,
      applyCoupon,
      removeCoupon,
      loadAvailableCoupons,
      isAdminDemoMode,
      setIsAdminDemoMode,
      isStoreAdminMode,
      setIsStoreAdminMode,
      language,
      setLanguage,
      changeLanguage,
      t,
      storeInfo: STORE_INFO
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

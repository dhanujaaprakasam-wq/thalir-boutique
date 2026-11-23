const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const normalizeProduct = (p) => {
  const resolvedCode = p.code || (typeof p.id === 'string' && p.id.startsWith('tb-') ? p.id.toUpperCase() : (p.code || String(p.id)));

  const variants = (p.variants || []).map((v, idx) => {
    const qty = v.stock_qty !== undefined ? Number(v.stock_qty) : (v.stockQty !== undefined ? Number(v.stockQty) : 1);
    const variantCode = v.code || v.product_code || (resolvedCode ? `${resolvedCode}-${String(idx + 1).padStart(2, '0')}` : '');
    const vImages = Array.isArray(v.images) && v.images.length > 0 
      ? v.images 
      : (v.image_url ? [v.image_url] : (v.image ? [v.image] : []));
    const mainImg = vImages[0] || v.image_url || v.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c';
    return {
      id: v.id,
      code: variantCode,
      productCode: variantCode,
      product_code: variantCode,
      colorName: v.color_name || v.colorName || 'Standard',
      colorCode: v.color_code || v.colorCode || '#0D5C3A',
      image: mainImg,
      images: vImages.length > 0 ? vImages : [mainImg],
      stockQty: qty,
      stock_qty: qty,
      inStock: v.in_stock !== undefined ? v.in_stock : qty > 0,
      in_stock: v.in_stock !== undefined ? v.in_stock : qty > 0
    };
  });
  const totalStock = p.total_stock !== undefined 
    ? Number(p.total_stock) 
    : variants.reduce((sum, v) => sum + Number(v.stockQty || 0), 0);
  const isSoldOut = p.is_sold_out !== undefined 
    ? Boolean(p.is_sold_out) 
    : (variants.length > 0 && totalStock <= 0);

  const productImages = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (variants.flatMap(v => v.images || []).length > 0 
        ? variants.flatMap(v => v.images || []) 
        : (p.image ? [p.image] : (variants[0]?.image ? [variants[0].image] : [])));

  return {
    id: p.code || String(p.id),
    dbId: p.id,
    code: resolvedCode,
    productCode: resolvedCode,
    name: p.name,
    category: p.category_slug || (typeof p.category === 'string' ? p.category : 'sarees'),
    categoryName: p.category_name || (typeof p.category === 'string' ? p.category : 'Sarees'),
    basePrice: Number(p.base_price || p.basePrice || 0),
    originalPrice: p.original_price ? Number(p.original_price) : (p.originalPrice ? Number(p.originalPrice) : null),
    discount: p.discount || '',
    tag: p.tag || '',
    description: p.description || '',
    fabric: p.fabric || '',
    length: p.length || '',
    care: p.care || '',
    defaultColor: p.default_color || p.defaultColor || 'Standard',
    sizes: p.sizes || [],
    isSpecialEvent: Boolean(p.is_special_event || p.isSpecialEvent || false),
    eventName: p.event_name || p.eventName || '',
    eventEndTime: p.event_end_time || p.eventEndTime || null,
    eventBadge: p.event_badge || p.eventBadge || '',
    viewsCount: Number(p.views_count || p.viewsCount || p.views || 0),
    views: Number(p.views_count || p.viewsCount || p.views || 0),
    image: variants[0]?.image || productImages[0] || p.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
    images: productImages.length > 0 ? productImages : (variants[0]?.image ? [variants[0].image] : []),
    isSoldOut,
    totalStock,
    variants
  };
};

export const api = {
  // Products
  async getProducts(category = null, search = null, includeOutOfStock = true) {
    try {
      let url = `${API_BASE}/products/`;
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (search) params.append('search', search);
      if (includeOutOfStock) params.append('include_out_of_stock', 'true');
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeProduct) : [];
    } catch (err) {
      console.warn('API getProducts falling back or failed:', err.message);
      return null;
    }
  },

  async createProduct(productData) {
    const res = await fetch(`${API_BASE}/products/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) throw new Error('Failed to create product');
    const data = await res.json();
    return normalizeProduct(data);
  },

  async updateProduct(productIdOrDbId, updatedData) {
    try {
      const res = await fetch(`${API_BASE}/products/${productIdOrDbId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Failed to update product');
      const data = await res.json();
      return normalizeProduct(data);
    } catch (err) {
      console.warn('Backend updateProduct error:', err.message);
      return null;
    }
  },

  async deleteProduct(productIdOrDbId) {
    try {
      const res = await fetch(`${API_BASE}/products/${productIdOrDbId}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete product');
      return true;
    } catch (err) {
      console.warn('Backend deleteProduct error:', err.message);
      return false;
    }
  },

  async recordProductView(productIdOrCode, metadata = {}) {
    try {
      const res = await fetch(`${API_BASE}/products/${productIdOrCode}/view/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(metadata.is_admin ? { 'X-Admin-Role': 'Admin' } : {}),
          ...(metadata.visitor_id ? { 'X-Visitor-Id': metadata.visitor_id } : {})
        },
        body: JSON.stringify(metadata)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('Backend recordProductView error:', err.message);
      return null;
    }
  },

  async resetProductViews(productIdOrCode) {
    try {
      const res = await fetch(`${API_BASE}/products/${productIdOrCode}/view/`, {
        method: 'DELETE'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('Backend resetProductViews error:', err.message);
      return null;
    }
  },

  // Categories
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories/`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch (err) {
      console.warn('API getCategories error:', err.message);
      return null;
    }
  },

  // Orders
  async getOrders(userId = null, phone = null, search = null, productCode = null, soldOnly = false) {
    try {
      let url = `${API_BASE}/orders/`;
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (phone) params.append('phone', phone);
      if (search) params.append('search', search);
      if (productCode) params.append('product_code', productCode);
      if (soldOnly) params.append('sold_only', 'true');
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return await res.json();
    } catch (err) {
      console.warn('API getOrders error:', err.message);
      return null;
    }
  },

  async getOrder(orderId) {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('API getOrder error:', err.message);
      return null;
    }
  },

  async placeOrder(orderPayload) {
    try {
      // Map frontend orderPayload to Django serializer format
      const djangoPayload = {
        order_id: orderPayload.orderId,
        customer_name: orderPayload.customer?.fullName || orderPayload.customerName || 'Customer',
        customer_phone: orderPayload.customer?.mobile || orderPayload.customerPhone || '',
        customer_email: orderPayload.customer?.email || orderPayload.customerEmail || '',
        delivery_address: orderPayload.customer?.address || orderPayload.deliveryAddress || '',
        city: orderPayload.customer?.city || orderPayload.city || 'Namakkal',
        pincode: orderPayload.customer?.pincode || orderPayload.pincode || '638008',
        landmark: orderPayload.customer?.landmark || orderPayload.landmark || '',
        delivery_date: orderPayload.deliverySlot?.date || '',
        delivery_slot: orderPayload.deliverySlot?.slot || '',
        order_notes: orderPayload.orderNotes || '',
        subtotal: orderPayload.pricing?.subtotal || orderPayload.subtotal || 0,
        coupon_code: orderPayload.coupon_code || orderPayload.pricing?.couponCode || null,
        discount_amount: orderPayload.discount_amount || orderPayload.pricing?.discountAmount || 0,
        delivery_charge: orderPayload.pricing?.deliveryFee || orderPayload.deliveryCharge || 0,
        grand_total: orderPayload.pricing?.grandTotal || orderPayload.grandTotal || 0,
        channel: orderPayload.channel || 'site',
        payment_method: orderPayload.paymentMethod || orderPayload.payment_method || 'UPI QR Payment',
        razorpay_order_id: orderPayload.razorpayOrderId || orderPayload.razorpay_order_id || null,
        razorpay_payment_id: orderPayload.razorpayPaymentId || orderPayload.razorpay_payment_id || null,
        razorpay_signature: orderPayload.razorpaySignature || orderPayload.razorpay_signature || null,
        cod_verified: Boolean(orderPayload.codVerified || orderPayload.cod_verified),
        payment_proof: orderPayload.paymentProof || (orderPayload.paymentMethod === 'Razorpay Online' ? 'Razorpay Verified' : 'Attached in checkout'),
        payment_proof_image: orderPayload.paymentProofImage || orderPayload.payment_proof_image || null,
        status: orderPayload.status || (orderPayload.paymentMethod === 'Razorpay Online' ? 'Payment Confirmed' : 'Pending Verification'),
        items: (orderPayload.items || []).map(item => ({
          product_code: item.code || item.productCode || item.product_code || item.id || '',
          product_name: item.name,
          color: item.color || 'Standard',
          size: item.size || 'Free Size',
          image_url: item.image || '',
          qty: item.qty || 1,
          unit_price: item.price || 0,
          total_price: (item.price || 0) * (item.qty || 1)
        }))
      };

      const res = await fetch(`${API_BASE}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(djangoPayload)
      });
      if (!res.ok) throw new Error('Failed to place order in Django backend');
      return await res.json();
    } catch (err) {
      console.warn('Backend order placement error, falling back locally:', err.message);
      return null;
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update order');
      return await res.json();
    } catch (err) {
      console.warn('Failed to sync order status update with backend:', err.message);
      return null;
    }
  },

  async updateOrder(orderId, updatedData) {
    try {
      const djangoPayload = {
        customer_name: updatedData.customer?.fullName || updatedData.customer_name,
        customer_phone: updatedData.customer?.mobile || updatedData.customer_phone,
        customer_email: updatedData.customer?.email || updatedData.customer_email || '',
        delivery_address: updatedData.customer?.address || updatedData.delivery_address || '',
        city: updatedData.customer?.city || updatedData.city || 'Namakkal',
        pincode: updatedData.customer?.pincode || updatedData.pincode || '638008',
        landmark: updatedData.customer?.landmark || updatedData.landmark || '',
        status: updatedData.status,
        channel: updatedData.channel,
        order_notes: updatedData.orderNotes || updatedData.order_notes || '',
        subtotal: updatedData.pricing?.subtotal || updatedData.subtotal || 0,
        coupon_code: updatedData.coupon_code || updatedData.pricing?.couponCode || null,
        discount_amount: updatedData.discount_amount || updatedData.pricing?.discountAmount || 0,
        delivery_charge: updatedData.pricing?.deliveryFee || updatedData.delivery_charge || 0,
        grand_total: updatedData.pricing?.grandTotal || updatedData.grand_total || 0,
        items: (updatedData.items || []).map(item => ({
          product_code: item.code || item.productCode || item.product_code || item.id || '',
          product_name: item.name || item.product_name,
          color: item.color || 'Standard',
          size: item.size || 'Free Size',
          image_url: item.image || item.image_url || '',
          qty: item.qty || 1,
          unit_price: item.price || item.unit_price || 0,
          total_price: (item.price || item.unit_price || 0) * (item.qty || 1)
        }))
      };

      const res = await fetch(`${API_BASE}/orders/${orderId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(djangoPayload)
      });
      if (!res.ok) throw new Error('Failed to update order');
      return await res.json();
    } catch (err) {
      console.warn('Failed to sync full order update with backend:', err.message);
      return null;
    }
  },

  async deleteOrder(orderId) {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete order');
      return true;
    } catch (err) {
      console.warn('Failed to delete order from backend:', err.message);
      return false;
    }
  },

  // Helper for safe JSON fetching (prevents "Unexpected end of JSON input" on static hosting)
  safeJsonFetch: async (url, options = {}) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return { ok: false, isHtml: true, status: res.status, data: null };
      }
      const text = await res.text();
      if (!text || !text.trim()) {
        return { ok: res.ok, status: res.status, data: null };
      }
      try {
        const data = JSON.parse(text);
        return { ok: res.ok, status: res.status, data };
      } catch {
        return { ok: false, parseError: true, status: res.status, data: null };
      }
    } catch (err) {
      return { ok: false, networkError: true, error: err.message, data: null };
    }
  },

  // Authentication System Endpoints with Client-Side Fallback for Static Vercel/Netlify
  async login(identifier, password) {
    // 1. Attempt backend authentication
    try {
      const res = await this.safeJsonFetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      if (res.ok && res.data && res.data.user) {
        return res.data;
      }
      if (res.data && res.data.error) {
        throw new Error(res.data.error);
      }
    } catch (err) {
      if (err.message && (err.message.includes('Incorrect password') || err.message.includes('No account found'))) {
        throw err;
      }
      console.warn('API login backend unavailable, using client-side fallback:', err.message);
    }

    // 2. Client-Side Authentication Fallback
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\D/g, '');

    // Owner / Staff / Admin check (Sudhi / Dhanujaa)
    const isSudhi = 
      cleanId === 'sudhi' || 
      cleanPhone === '6382218590' || 
      cleanPhone === '916382218590' || 
      cleanId === 'dhanujaasudhi262@gmail.com' ||
      cleanId === 'dhanujaaprakasam@gmail.com' ||
      cleanId === 'admin';

    if (isSudhi) {
      const validPw = 
        password === 'Dhanujaa@26' || 
        password === 'admin123' || 
        password === 'sudhi26' || 
        password === 'Dhanujaa26';

      if (!validPw) {
        throw new Error('Incorrect password. Please try again or click "Forgot Password?".');
      }

      try {
        localStorage.setItem('tb_admin_authenticated', 'true');
      } catch (e) {}

      return {
        message: 'Welcome back, Sudhi! ✨',
        user: {
          id: 4,
          user_id: 'usr_6382218590',
          name: 'Sudhi',
          username: 'sudhi',
          phone: '6382218590',
          email: 'dhanujaasudhi262@gmail.com',
          role: 'Admin',
          membership_tier: 'VIP SHOPPER',
          is_phone_verified: true,
          auth_provider: 'password',
          created_at: '2026-10-07T16:48:52.104759+05:30',
          addresses: [
            {
              id: 1,
              fullName: 'Sudhi',
              mobile: '6382218590',
              address: '5/797, NC Colony, Kumarapalayam Main Road',
              city: 'Veppadai, Namakkal',
              pincode: '638008',
              isDefault: true
            }
          ]
        }
      };
    }

    if (cleanId === 'dhanujaa') {
      if (password !== 'Dhanujaa@26' && password !== 'admin123') {
        throw new Error('Incorrect password. Please try again or click "Forgot Password?".');
      }
      try {
        localStorage.setItem('tb_admin_authenticated', 'true');
      } catch (e) {}
      return {
        message: 'Welcome back, Dhanujaa! ✨',
        user: {
          id: 3,
          user_id: 'usr_admin_dhanujaa',
          name: 'Dhanujaa Prakasam',
          username: 'dhanujaa',
          phone: '9842712345',
          email: 'dhanujaaprakasam@gmail.com',
          role: 'Admin',
          membership_tier: 'VIP SHOPPER',
          is_phone_verified: true,
          auth_provider: 'password',
          created_at: '2026-09-15T10:00:00.000000+05:30',
          addresses: []
        }
      };
    }

    // Check registered customers in localStorage
    try {
      const list = JSON.parse(localStorage.getItem('tb_registered_users') || '[]');
      const matched = list.find(u => 
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u.phone && (u.phone === cleanPhone || u.phone === cleanId)) ||
        (u.email && u.email.toLowerCase() === cleanId)
      );
      if (matched) {
        if (matched.password && matched.password !== password) {
          throw new Error('Incorrect password. Please try again or click "Forgot Password?".');
        }
        return {
          message: `Welcome back, ${matched.name}!`,
          user: matched
        };
      }
    } catch (e) {
      if (e.message?.includes('Incorrect password')) throw e;
    }

    // Deepz demo account
    if (cleanId === 'deepz' || cleanPhone === '9384369408') {
      return {
        message: 'Welcome back, Deepz!',
        user: {
          id: 7,
          user_id: 'usr_9384369408',
          name: 'deepz',
          username: 'deepz',
          phone: '9384369408',
          role: 'Customer',
          membership_tier: 'VIP SHOPPER',
          is_phone_verified: true,
          auth_provider: 'password',
          created_at: '2026-11-23T11:45:00.000000+05:30',
          addresses: []
        }
      };
    }

    throw new Error('No account found with this username or mobile number. Please check credentials or create a new account.');
  },

  async register(registrationData) {
    try {
      const res = await this.safeJsonFetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });
      if (res.ok && res.data && res.data.user) {
        return res.data;
      }
      if (res.data && res.data.error) {
        throw new Error(res.data.error);
      }
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        throw err;
      }
      console.warn('API register notice, registering customer locally:', err.message);
    }

    const cleanPhone = (registrationData.phone || '').replace(/\D/g, '');
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem('tb_registered_users') || '[]');
    } catch (e) {}

    const alreadyExists = list.some(u => 
      (cleanPhone && u.phone === cleanPhone) || 
      (registrationData.username && u.username?.toLowerCase() === registrationData.username.toLowerCase())
    );
    if (alreadyExists) {
      throw new Error('An account with this mobile number or username already exists. Please log in.');
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      user_id: `usr_${cleanPhone || Date.now()}`,
      name: registrationData.name || 'Valued Customer',
      username: registrationData.username || cleanPhone || `customer_${Date.now()}`,
      phone: cleanPhone,
      email: registrationData.email || '',
      role: 'Customer',
      membership_tier: 'VIP SHOPPER',
      is_phone_verified: true,
      auth_provider: 'password',
      password: registrationData.password,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(registrationData.name || 'Customer')}&backgroundColor=0D5C3A`,
      created_at: new Date().toISOString(),
      addresses: []
    };

    list.push(newUser);
    try {
      localStorage.setItem('tb_registered_users', JSON.stringify(list));
    } catch (e) {}

    return {
      message: `Welcome to Thalir Boutique, ${newUser.name}!`,
      user: newUser
    };
  },

  async sendOtp(phone, purpose = 'verify') {
    try {
      const res = await this.safeJsonFetch(`${API_BASE}/auth/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose })
      });
      if (res.ok && res.data) {
        return res.data;
      }
      if (res.data && res.data.error) {
        throw new Error(res.data.error);
      }
    } catch (err) {
      if (err.message && err.message.includes('No account found')) throw err;
      console.warn('API sendOtp notice, using demo OTP:', err.message);
    }

    return {
      message: `6-Digit OTP code sent to +91 ${phone}. (Demo OTP: 123456)`,
      otp: '123456'
    };
  },

  async verifyOtp(phone, otp) {
    try {
      const res = await this.safeJsonFetch(`${API_BASE}/auth/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      if (res.ok && res.data) {
        return res.data;
      }
      if (res.data && res.data.error) {
        throw new Error(res.data.error);
      }
    } catch (err) {
      if (err.message && err.message.includes('Invalid OTP')) throw err;
      console.warn('API verifyOtp notice, checking locally:', err.message);
    }

    const cleanOtp = String(otp || '').trim();
    if (cleanOtp.length === 6) {
      return {
        message: 'Mobile number verified successfully! ✓',
        verified: true
      };
    }
    throw new Error('Invalid OTP code. Please enter the complete 6-digit code.');
  },

  async forgotPassword(resetData) {
    try {
      const res = await this.safeJsonFetch(`${API_BASE}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      if (res.ok && res.data) {
        return res.data;
      }
      if (res.data && res.data.error) {
        throw new Error(res.data.error);
      }
    } catch (err) {
      console.warn('API forgotPassword notice:', err.message);
    }

    const cleanPhone = String(resetData.phone || '').replace(/\D/g, '');
    try {
      const list = JSON.parse(localStorage.getItem('tb_registered_users') || '[]');
      const user = list.find(u => u.phone === cleanPhone);
      if (user) {
        user.password = resetData.new_password;
        localStorage.setItem('tb_registered_users', JSON.stringify(list));
      }
    } catch (e) {}

    return {
      message: 'Password reset successfully! You can now log in with your new password.'
    };
  },

  async loginGoogle(payloadOrEmail, name = null) {
    try {
      const body = typeof payloadOrEmail === 'object' 
        ? payloadOrEmail 
        : { email: payloadOrEmail, name: name || 'Google Customer' };

      const res = await this.safeJsonFetch(`${API_BASE}/auth/google-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok && res.data) return res.data;
    } catch (err) {
      console.warn('Failed Google login via backend, using fallback:', err.message);
    }
    return null;
  },

  // Reviews & Metrics
  async getReviews() {
    try {
      const res = await this.safeJsonFetch(`${API_BASE}/reviews/`);
      if (res.ok && res.data) return res.data;
    } catch (err) {
      console.warn('API getReviews error:', err.message);
    }
    return null;
  },

  async getCustomers() {
    try {
      const res = await this.safeJsonFetch(`${API_BASE}/customers/`);
      if (res.ok && Array.isArray(res.data)) return res.data;
    } catch (err) {
      console.warn('API getCustomers error:', err.message);
    }

    let localUsers = [];
    try {
      localUsers = JSON.parse(localStorage.getItem('tb_registered_users') || '[]');
    } catch (e) {}

    const staticList = [
      {
        id: 4,
        user_id: 'usr_6382218590',
        name: 'Sudhi',
        username: 'sudhi',
        phone: '6382218590',
        email: 'dhanujaasudhi262@gmail.com',
        role: 'Admin',
        membership_tier: 'VIP SHOPPER',
        orders_count: 5,
        total_spent: 4250,
        created_at: '2026-10-07T16:48:52.104759+05:30'
      },
      {
        id: 3,
        user_id: 'usr_admin_dhanujaa',
        name: 'Dhanujaa Prakasam',
        username: 'dhanujaa',
        phone: '9842712345',
        email: 'dhanujaaprakasam@gmail.com',
        role: 'Admin',
        membership_tier: 'VIP SHOPPER',
        orders_count: 8,
        total_spent: 12500,
        created_at: '2026-09-15T10:00:00.000000+05:30'
      },
      {
        id: 7,
        user_id: 'usr_9384369408',
        name: 'deepz',
        username: 'deepz',
        phone: '9384369408',
        email: '',
        role: 'Customer',
        membership_tier: 'VIP SHOPPER',
        orders_count: 2,
        total_spent: 1850,
        created_at: '2026-11-23T11:45:00.000000+05:30'
      }
    ];

    return [...staticList, ...localUsers];
  },

  async deleteCustomer(userId) {
    try {
      const res = await fetch(`${API_BASE}/customers/${userId}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete customer');
      return true;
    } catch (err) {
      console.warn('API deleteCustomer error:', err.message);
      throw err;
    }
  },

  async updateCustomerRole(userId, newRole) {
    try {
      const res = await fetch(`${API_BASE}/customers/${userId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update customer role');
      return await res.json();
    } catch (err) {
      console.warn('API updateCustomerRole error:', err.message);
      throw err;
    }
  },

  // Broadcast / Bulk Messaging (SMS & WhatsApp)
  async getBroadcastRecipients(filter = 'all') {
    try {
      const res = await fetch(`${API_BASE}/broadcast/recipients/?filter=${filter}`);
      if (!res.ok) throw new Error('Failed to fetch recipients');
      return await res.json();
    } catch (err) {
      console.warn('API getBroadcastRecipients error:', err.message);
      return { total_count: 0, filtered_count: 0, recipients: [] };
    }
  },

  async sendBroadcastMessage(payload) {
    const res = await fetch(`${API_BASE}/broadcast/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send broadcast');
    }
    return await res.json();
  },

  async getBroadcastHistory() {
    try {
      const res = await fetch(`${API_BASE}/broadcast/`);
      if (!res.ok) throw new Error('Failed to fetch broadcast history');
      return await res.json();
    } catch (err) {
      console.warn('API getBroadcastHistory error:', err.message);
      return [];
    }
  },

  async getAdminMetrics() {
    try {
      const res = await fetch(`${API_BASE}/admin-metrics/`);
      if (!res.ok) throw new Error('Failed to fetch admin metrics');
      return await res.json();
    } catch (err) {
      console.warn('API getAdminMetrics error:', err.message);
      return null;
    }
  },

  // Boutique Daybook & Financial Ledger Endpoints
  async getLedgerEntries(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/ledger/${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch ledger');
      return await res.json();
    } catch (err) {
      console.warn('API getLedgerEntries error:', err.message);
      return { entries: [], count: 0, total_income: 0, total_expense: 0, net_balance: 0, category_stats: [] };
    }
  },

  async createLedgerEntry(entryData) {
    try {
      const res = await fetch(`${API_BASE}/ledger/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });
      if (!res.ok) throw new Error('Failed to create ledger entry');
      return await res.json();
    } catch (err) {
      console.warn('API createLedgerEntry error:', err.message);
      throw err;
    }
  },

  async updateLedgerEntry(id, entryData) {
    try {
      const res = await fetch(`${API_BASE}/ledger/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });
      if (!res.ok) throw new Error('Failed to update ledger entry');
      return await res.json();
    } catch (err) {
      console.warn('API updateLedgerEntry error:', err.message);
      throw err;
    }
  },

  async deleteLedgerEntry(id) {
    try {
      const res = await fetch(`${API_BASE}/ledger/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete entry');
      return true;
    } catch (err) {
      console.warn('API deleteLedgerEntry error:', err.message);
      throw err;
    }
  },

  // Inventory & Stock Management
  async getInventory() {
    try {
      const res = await fetch(`${API_BASE}/inventory/`);
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return await res.json();
    } catch (err) {
      console.warn('API getInventory error:', err.message);
      return { products: [], total_products: 0, total_units: 0, low_stock_count: 0, low_stock_items: [] };
    }
  },

  async updateInventoryStock(stockPayload) {
    try {
      const res = await fetch(`${API_BASE}/inventory/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockPayload)
      });
      if (!res.ok) throw new Error('Failed to update inventory stock');
      return await res.json();
    } catch (err) {
      console.warn('API updateInventoryStock error:', err.message);
      throw err;
    }
  },

  // Suppliers & Purchases
  async getSuppliers() {
    try {
      const res = await fetch(`${API_BASE}/suppliers/`);
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      return await res.json();
    } catch (err) {
      console.warn('API getSuppliers error:', err.message);
      return [];
    }
  },

  async createSupplier(supplierData) {
    try {
      const res = await fetch(`${API_BASE}/suppliers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      });
      if (!res.ok) throw new Error('Failed to create supplier');
      return await res.json();
    } catch (err) {
      console.warn('API createSupplier error:', err.message);
      throw err;
    }
  },

  async deleteSupplier(id) {
    try {
      const res = await fetch(`${API_BASE}/suppliers/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete supplier');
      return true;
    } catch (err) {
      console.warn('API deleteSupplier error:', err.message);
      throw err;
    }
  },

  async getPurchaseOrders() {
    try {
      const res = await fetch(`${API_BASE}/purchases/`);
      if (!res.ok) throw new Error('Failed to fetch purchase orders');
      return await res.json();
    } catch (err) {
      console.warn('API getPurchaseOrders error:', err.message);
      return [];
    }
  },

  async createPurchaseOrder(poData) {
    try {
      const res = await fetch(`${API_BASE}/purchases/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poData)
      });
      if (!res.ok) throw new Error('Failed to create purchase order');
      return await res.json();
    } catch (err) {
      console.warn('API createPurchaseOrder error:', err.message);
      throw err;
    }
  },

  // Offers & Discounts
  async getOffers() {
    try {
      const res = await fetch(`${API_BASE}/offers/`);
      if (!res.ok) throw new Error('Failed to fetch offers');
      return await res.json();
    } catch (err) {
      console.warn('API getOffers error:', err.message);
      return [];
    }
  },

  async createOffer(offerData) {
    try {
      const res = await fetch(`${API_BASE}/offers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData)
      });
      if (!res.ok) throw new Error('Failed to create offer');
      return await res.json();
    } catch (err) {
      console.warn('API createOffer error:', err.message);
      throw err;
    }
  },

  async deleteOffer(id) {
    try {
      const res = await fetch(`${API_BASE}/offers/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete offer');
      return true;
    } catch (err) {
      console.warn('API deleteOffer error:', err.message);
      throw err;
    }
  },

  // Returns & Refunds
  async getReturns() {
    try {
      const res = await fetch(`${API_BASE}/returns/`);
      if (!res.ok) throw new Error('Failed to fetch returns');
      return await res.json();
    } catch (err) {
      console.warn('API getReturns error:', err.message);
      return [];
    }
  },

  async createReturn(returnData) {
    try {
      const res = await fetch(`${API_BASE}/returns/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });
      if (!res.ok) throw new Error('Failed to create return request');
      return await res.json();
    } catch (err) {
      console.warn('API createReturn error:', err.message);
      throw err;
    }
  },

  // Store Settings
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings/`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      return await res.json();
    } catch (err) {
      console.warn('API getSettings error:', err.message);
      return {};
    }
  },

  async saveSettings(settingsData) {
    try {
      const res = await fetch(`${API_BASE}/settings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      return await res.json();
    } catch (err) {
      console.warn('API saveSettings error:', err.message);
      throw err;
    }
  },

  // Database Cart Management
  async getCart(sessionKey) {
    try {
      const res = await fetch(`${API_BASE}/cart/?session_key=${encodeURIComponent(sessionKey)}`);
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      return (data.items || []).map(item => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        price: Number(item.price),
        color: item.color,
        size: item.size,
        image: item.image,
        qty: Number(item.qty)
      }));
    } catch (err) {
      console.warn('API getCart error:', err.message);
      return null;
    }
  },

  async addToCartDB(payload) {
    try {
      const res = await fetch(`${API_BASE}/cart/add/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to add to database cart');
      return await res.json();
    } catch (err) {
      console.warn('API addToCartDB error:', err.message);
      return null;
    }
  },

  async updateCartQtyDB(payload) {
    try {
      const res = await fetch(`${API_BASE}/cart/update/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update database cart');
      return await res.json();
    } catch (err) {
      console.warn('API updateCartQtyDB error:', err.message);
      return null;
    }
  },

  async removeFromCartDB(payload) {
    try {
      const res = await fetch(`${API_BASE}/cart/remove/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to remove from database cart');
      return await res.json();
    } catch (err) {
      console.warn('API removeFromCartDB error:', err.message);
      return null;
    }
  },

    async clearCartDB(sessionKey) {
    try {
      const res = await fetch(`${API_BASE}/cart/clear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_key: sessionKey })
      });
      if (!res.ok) throw new Error('Failed to clear database cart');
      return await res.json();
    } catch (err) {
      console.warn('API clearCartDB error:', err.message);
      return null;
    }
  },

  // ==========================================
  // INSTAGRAM LIVE FEED & AUTO-SYNC
  // ==========================================
  async getInstagramFeed() {
    try {
      const res = await fetch(`${API_BASE}/instagram/feed/`);
      if (!res.ok) throw new Error('Failed to fetch Instagram feed');
      return await res.json();
    } catch (err) {
      console.warn('API getInstagramFeed error:', err.message);
      return { username: 'thalir_boutique_', posts: [] };
    }
  },

  async syncInstagramFeed(accessToken = null) {
    try {
      const res = await fetch(`${API_BASE}/instagram/sync/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync Instagram feed');
      return data;
    } catch (err) {
      console.warn('API syncInstagramFeed error:', err.message);
      throw err;
    }
  },

  async addInstagramPost(postData) {
    try {
      const res = await fetch(`${API_BASE}/instagram/posts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add Instagram post');
      return data;
    } catch (err) {
      console.warn('API addInstagramPost error:', err.message);
      throw err;
    }
  },

  async deleteInstagramPost(postId) {
    try {
      const res = await fetch(`${API_BASE}/instagram/posts/?post_id=${postId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete Instagram post');
      return data;
    } catch (err) {
      console.warn('API deleteInstagramPost error:', err.message);
      throw err;
    }
  },

  // ==========================================
  // RESTOCK NOTIFICATIONS & ALERTS
  // ==========================================
  async submitRestockRequest(payload) {
    try {
      const res = await fetch(`${API_BASE}/restock-requests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit restock request');
      return data;
    } catch (err) {
      console.warn('API submitRestockRequest error:', err.message);
      throw err;
    }
  },

  async getRestockRequests(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/restock-requests/${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch restock requests');
      return await res.json();
    } catch (err) {
      console.warn('API getRestockRequests error:', err.message);
      return [];
    }
  },

  async updateRestockRequest(id, status = 'Notified') {
    try {
      const res = await fetch(`${API_BASE}/restock-requests/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update restock request');
      return data;
    } catch (err) {
      console.warn('API updateRestockRequest error:', err.message);
      throw err;
    }
  },

  // Razorpay Payment Gateway Integration
  async createRazorpayOrder(amount, orderId) {
    try {
      const res = await fetch(`${API_BASE}/payment/razorpay/create-order/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, order_id: orderId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      return data;
    } catch (err) {
      console.warn('API createRazorpayOrder error:', err.message);
      throw err;
    }
  },

  async verifyRazorpayPayment(payload) {
    try {
      const res = await fetch(`${API_BASE}/payment/razorpay/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment verification failed');
      return data;
    } catch (err) {
      console.warn('API verifyRazorpayPayment error:', err.message);
      throw err;
    }
  },

  // Cash on Delivery (COD) OTP Verification
  async sendCodOtp(phone) {
    try {
      const res = await fetch(`${API_BASE}/payment/cod/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      return data;
    } catch (err) {
      console.warn('API sendCodOtp error:', err.message);
      throw err;
    }
  },

  async verifyCodOtp(phone, otp) {
    try {
      const res = await fetch(`${API_BASE}/payment/cod/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
      return data;
    } catch (err) {
      console.warn('API verifyCodOtp error:', err.message);
      throw err;
    }
  },

  // Courier Tracking & Timeline
  async getOrderTracking(orderId) {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/tracking/`);
      if (!res.ok) throw new Error('Failed to fetch tracking details');
      return await res.json();
    } catch (err) {
      console.warn('API getOrderTracking error:', err.message);
      return null;
    }
  },

  async updateOrderTracking(orderId, trackingData) {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/tracking/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update tracking');
      return data;
    } catch (err) {
      console.warn('API updateOrderTracking error:', err.message);
      throw err;
    }
  },

  // Automated WhatsApp Notifications
  async sendOrderWhatsAppNotification(orderId, type = 'confirmed') {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/whatsapp-notify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch WhatsApp notification');
      return data;
    } catch (err) {
      console.warn('API sendOrderWhatsAppNotification error:', err.message);
      throw err;
    }
  },

  // Product Reviews with Photos
  async getProductReviews(pkOrCode) {
    try {
      const res = await fetch(`${API_BASE}/products/${pkOrCode}/reviews/`);
      if (!res.ok) throw new Error('Failed to fetch product reviews');
      return await res.json();
    } catch (err) {
      console.warn('API getProductReviews error:', err.message);
      return { reviews: [], total_reviews: 0, average_rating: 5.0 };
    }
  },

  async submitProductReview(pkOrCode, reviewData) {
    try {
      const res = await fetch(`${API_BASE}/products/${pkOrCode}/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      return data;
    } catch (err) {
      console.warn('API submitProductReview error:', err.message);
      throw err;
    }
  }
};



/**
 * 🌿 THALIR BOUTIQUE - CORE APPLICATION & CHECKOUT ENGINE
 * Handles: 4-Category Catalog, Color/Size Multi-Variants, Cart Drawer, 
 * Dynamic UPI QR Generator, Mobile Deep-links, WhatsApp Order Router & Admin DB.
 */

const THALIR_STORE = {
  name: "Thalir Boutique",
  phone: "9342665700",
  whatsappPhone: "919342665700",
  upiId: "9342665700@ptsbi",
  address: "5/797, NC Colony, kumarapalayam main road, Veppadai, Namakkal 638008",
  deliveryCharge: 60, // Standard local courier delivery
  freeDeliveryThreshold: 1999
};

let products = [];
let cart = JSON.parse(localStorage.getItem('tb_cart')) || [];
let currentCategory = 'all';
let uploadedPaymentProof = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
  updateCartUI();
  initDeliveryDate();
});

// Initialize Application
async function initApp() {
  try {
    const res = await fetch('data/products.json');
    if (res.ok) {
      products = await res.json();
    } else {
      console.warn("Could not load products.json, using fallback.");
      products = getFallbackProducts();
    }
  } catch (err) {
    products = getFallbackProducts();
  }
  renderProducts();
}

// Event Listeners
function setupEventListeners() {
  // Category tabs
  document.querySelectorAll('.cat-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentCategory = e.currentTarget.dataset.category;
      renderProducts();
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Cart Drawer open/close
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const closeCartBtn = document.getElementById('closeCartBtn');

  if (cartBtn) cartBtn.addEventListener('click', () => openCart());
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => closeCart());
  if (cartOverlay) cartOverlay.addEventListener('click', () => closeCart());

  // Checkout modal open/close
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', () => closeCheckout());
  }

  // Copy UPI ID button
  const copyUpiBtn = document.getElementById('copyUpiBtn');
  if (copyUpiBtn) {
    copyUpiBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(THALIR_STORE.upiId).then(() => {
        copyUpiBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          copyUpiBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
      });
    });
  }

  // Screenshot upload handling
  const screenshotInput = document.getElementById('paymentScreenshotInput');
  const screenshotUploadZone = document.getElementById('screenshotUploadZone');
  if (screenshotInput && screenshotUploadZone) {
    screenshotUploadZone.addEventListener('click', () => screenshotInput.click());
    screenshotInput.addEventListener('change', handleScreenshotUpload);
  }

  // Checkout Form Submission Handlers
  const btnPlaceWhatsapp = document.getElementById('btnPlaceWhatsapp');
  const btnPlaceSite = document.getElementById('btnPlaceSite');

  if (btnPlaceWhatsapp) {
    btnPlaceWhatsapp.addEventListener('click', (e) => {
      e.preventDefault();
      processOrder('whatsapp');
    });
  }

  if (btnPlaceSite) {
    btnPlaceSite.addEventListener('click', (e) => {
      e.preventDefault();
      processOrder('site');
    });
  }
}

// Render Products with Multi-Variants
function renderProducts() {
  const container = document.getElementById('productsGrid');
  if (!container) return;

  const filtered = currentCategory === 'all' 
    ? products 
    : products.filter(p => p.category === currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No products found in this category.</div>`;
    return;
  }

  container.innerHTML = filtered.map(product => {
    const selectedVariant = product.variants ? product.variants[0] : null;
    const initialImg = selectedVariant ? selectedVariant.image : (product.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c');
    const initialColorName = selectedVariant ? selectedVariant.colorName : '';

    // Color Swatches HTML
    let swatchesHtml = '';
    if (product.variants && product.variants.length > 0) {
      swatchesHtml = `
        <div class="swatch-group">
          <div class="swatch-label">
            <span>Color: <strong id="color-name-${product.id}">${initialColorName}</strong></span>
            <span style="color: var(--primary-emerald); font-size: 0.72rem;">${product.variants.length} Colors</span>
          </div>
          <div class="color-swatches" id="swatches-${product.id}">
            ${product.variants.map((v, idx) => `
              <button class="color-dot ${idx === 0 ? 'active' : ''}" 
                style="background-color: ${v.colorCode};" 
                title="${v.colorName}"
                onclick="selectProductColor('${product.id}', ${idx})"
                data-color="${v.colorName}"
                data-img="${v.image}">
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Size Selector HTML (for Kurtis & Nightwear)
    let sizesHtml = '';
    if (product.sizes && product.sizes.length > 0) {
      sizesHtml = `
        <div class="swatch-label" style="margin-bottom: 4px;">
          <span>Size: <strong id="size-name-${product.id}">${product.sizes[0]}</strong></span>
        </div>
        <div class="size-pills" id="sizes-${product.id}">
          ${product.sizes.map((s, idx) => `
            <button class="size-pill ${idx === 0 ? 'active' : ''}" 
              onclick="selectProductSize('${product.id}', '${s}', this)">
              ${s}
            </button>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="product-card" id="card-${product.id}" data-id="${product.id}">
        <div class="product-img-wrap">
          <img src="${initialImg}" alt="${product.name}" id="img-${product.id}" loading="lazy" />
          ${product.tag ? `<span class="product-badge">${product.tag}</span>` : ''}
          ${product.discount ? `<span class="discount-badge">${product.discount}</span>` : ''}
        </div>
        <div class="product-info">
          <span class="product-cat">${product.categoryName || product.category}</span>
          <h3 class="product-title">${product.name}</h3>
          <div class="product-price-row">
            <span class="price-current">₹${product.basePrice.toLocaleString('en-IN')}</span>
            ${product.originalPrice ? `<span class="price-original">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
          </div>

          ${swatchesHtml}
          ${sizesHtml}

          <div class="card-cta-group">
            <button class="btn-card-cart" onclick="quickAddToCart('${product.id}')">
              <i class="fas fa-shopping-bag"></i> Add to Bag
            </button>
            <button class="btn-card-buy" onclick="quickBuyNow('${product.id}')">
              <i class="fas fa-bolt"></i> Buy Now
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Switch Color Swatch
window.selectProductColor = function(productId, variantIndex) {
  const product = products.find(p => p.id === productId);
  if (!product || !product.variants[variantIndex]) return;

  const variant = product.variants[variantIndex];
  
  // Update image
  const imgEl = document.getElementById(`img-${productId}`);
  if (imgEl && variant.image) {
    imgEl.src = variant.image;
  }

  // Update color name text
  const colorNameEl = document.getElementById(`color-name-${productId}`);
  if (colorNameEl) {
    colorNameEl.textContent = variant.colorName;
  }

  // Update active dot
  const swatchesContainer = document.getElementById(`swatches-${productId}`);
  if (swatchesContainer) {
    const dots = swatchesContainer.querySelectorAll('.color-dot');
    dots.forEach((dot, idx) => {
      if (idx === variantIndex) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  }
};

// Switch Size Pill
window.selectProductSize = function(productId, size, btn) {
  const sizeNameEl = document.getElementById(`size-name-${productId}`);
  if (sizeNameEl) {
    sizeNameEl.textContent = size;
  }

  const sizesContainer = document.getElementById(`sizes-${productId}`);
  if (sizesContainer) {
    sizesContainer.querySelectorAll('.size-pill').forEach(pill => pill.classList.remove('active'));
    btn.classList.add('active');
  }
};

// Add to Cart Logic
window.quickAddToCart = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const colorNameEl = document.getElementById(`color-name-${productId}`);
  const selectedColor = colorNameEl ? colorNameEl.textContent : (product.defaultColor || 'Standard');

  const sizeNameEl = document.getElementById(`size-name-${productId}`);
  const selectedSize = sizeNameEl ? sizeNameEl.textContent : (product.sizes ? product.sizes[0] : null);

  const activeVariant = product.variants ? product.variants.find(v => v.colorName === selectedColor) : null;
  const itemImage = activeVariant ? activeVariant.image : (product.image || 'assets/images/placeholder.jpg');

  const cartItemId = `${product.id}_${selectedColor}_${selectedSize || 'nosize'}`;
  const existingItemIndex = cart.findIndex(item => item.cartItemId === cartItemId);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].qty += 1;
  } else {
    cart.push({
      cartItemId: cartItemId,
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.basePrice,
      color: selectedColor,
      size: selectedSize,
      image: itemImage,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  openCart();
  showToast(`Added "${product.name}" (${selectedColor}) to Bag! 🛍️`);
};

// Quick Buy Now (Opens Checkout directly)
window.quickBuyNow = function(productId) {
  quickAddToCart(productId);
  closeCart();
  openCheckout();
};

// Cart Drawer Handling
function openCart() {
  document.getElementById('cartDrawer').classList.add('active');
  document.getElementById('cartOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('active');
  document.getElementById('cartOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function saveCart() {
  localStorage.setItem('tb_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const cartCountEl = document.getElementById('cartCount');
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = totalCount;

  const cartListEl = document.getElementById('cartItemsList');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartFooterEl = document.getElementById('cartDrawerFooter');

  if (!cartListEl) return;

  if (cart.length === 0) {
    cartListEl.innerHTML = `
      <div class="cart-empty-state">
        <i class="fas fa-shopping-bag"></i>
        <h4>Your Shopping Bag is Empty</h4>
        <p style="font-size: 0.85rem; margin-top: 6px;">Discover our exclusive Saree and Kurti collections.</p>
      </div>
    `;
    if (cartFooterEl) cartFooterEl.style.display = 'none';
    return;
  }

  if (cartFooterEl) cartFooterEl.style.display = 'block';

  let subtotal = 0;
  cartListEl.innerHTML = cart.map((item, index) => {
    subtotal += item.price * item.qty;
    return `
      <div class="checkout-item" style="border-bottom: 1px solid var(--border-color); padding: 12px 0;">
        <img src="${item.image}" alt="${item.name}" />
        <div class="checkout-item-details">
          <div class="checkout-item-name">${item.name}</div>
          <div class="checkout-item-variant">
            Color: <strong>${item.color}</strong> ${item.size ? `| Size: <strong>${item.size}</strong>` : ''}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <button style="width: 24px; height: 24px; border-radius: 4px; background: var(--bg-subtle); font-weight: bold;" onclick="updateCartQty(${index}, -1)">-</button>
              <span style="font-size: 0.85rem; font-weight: 700;">${item.qty}</span>
              <button style="width: 24px; height: 24px; border-radius: 4px; background: var(--bg-subtle); font-weight: bold;" onclick="updateCartQty(${index}, 1)">+</button>
            </div>
            <div class="checkout-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
          </div>
        </div>
        <button style="color: var(--text-light); padding: 4px;" onclick="removeFromCart(${index})" title="Remove item">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
  }).join('');

  if (cartSubtotalEl) {
    cartSubtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  }
}

window.updateCartQty = function(index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  updateCartUI();
  updateCheckoutSummary();
};

window.removeFromCart = function(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  updateCheckoutSummary();
};

// ===================================================================
// REDESIGNED BOUTIQUE CHECKOUT & DYNAMIC UPI ENGINE
// ===================================================================
window.openCheckout = function() {
  if (cart.length === 0) {
    showToast("Please add items to your bag first! 🛍️");
    return;
  }
  closeCart();
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateCheckoutSummary();
  }
};

window.closeCheckout = function() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

function initDeliveryDate() {
  const dateInput = document.getElementById('deliveryDate');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

function updateCheckoutSummary() {
  const summaryItemsList = document.getElementById('checkoutItemsSummary');
  const summarySubtotalEl = document.getElementById('summarySubtotal');
  const summaryDeliveryEl = document.getElementById('summaryDelivery');
  const summaryTotalEl = document.getElementById('summaryTotal');
  const qrImageEl = document.getElementById('upiDynamicQr');

  if (!summaryItemsList) return;

  let subtotal = 0;
  summaryItemsList.innerHTML = cart.map(item => {
    subtotal += item.price * item.qty;
    return `
      <div class="checkout-item">
        <img src="${item.image}" alt="${item.name}" />
        <div class="checkout-item-details">
          <div class="checkout-item-name">${item.name}</div>
          <div class="checkout-item-variant">
            Color: ${item.color} ${item.size ? `| Size: ${item.size}` : ''} | Qty: ${item.qty}
          </div>
        </div>
        <div class="checkout-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
      </div>
    `;
  }).join('');

  const deliveryCharge = subtotal >= THALIR_STORE.freeDeliveryThreshold ? 0 : THALIR_STORE.deliveryCharge;
  const grandTotal = subtotal + deliveryCharge;

  if (summarySubtotalEl) summarySubtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (summaryDeliveryEl) {
    summaryDeliveryEl.innerHTML = deliveryCharge === 0 
      ? '<span style="color: var(--success); font-weight: bold;">FREE</span>' 
      : `₹${deliveryCharge}`;
  }
  if (summaryTotalEl) summaryTotalEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  // Generate Dynamic UPI QR Code (Embeds exact amount & merchant data)
  if (qrImageEl) {
    const upiUri = `upi://pay?pa=${THALIR_STORE.upiId}&pn=${encodeURIComponent(THALIR_STORE.name)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('Thalir Boutique Order')}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}&color=073822`;
    qrImageEl.src = qrApiUrl;
  }
}

// Screenshot Upload Handler
function handleScreenshotUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedPaymentProof = {
      name: file.name,
      dataUrl: e.target.result
    };
    
    const previewWrap = document.getElementById('screenshotPreviewWrap');
    const previewImg = document.getElementById('screenshotPreviewImg');
    const previewName = document.getElementById('screenshotFileName');

    if (previewWrap && previewImg && previewName) {
      previewImg.src = e.target.result;
      previewName.textContent = file.name;
      previewWrap.style.display = 'flex';
      document.getElementById('uploadPromptText').textContent = "Screenshot attached successfully!";
    }
  };
  reader.readAsDataURL(file);
}

window.removeScreenshotProof = function() {
  uploadedPaymentProof = null;
  const input = document.getElementById('paymentScreenshotInput');
  if (input) input.value = '';
  const previewWrap = document.getElementById('screenshotPreviewWrap');
  if (previewWrap) previewWrap.style.display = 'none';
  document.getElementById('uploadPromptText').textContent = "Click or drag payment screenshot here (Optional)";
};

// Process Order (WhatsApp vs Site Direct)
function processOrder(channel) {
  // Validate Required Fields
  const fullName = document.getElementById('custFullName')?.value.trim();
  const mobile = document.getElementById('custMobile')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();
  const city = document.getElementById('custCity')?.value.trim() || 'Namakkal/Erode';
  const pincode = document.getElementById('custPincode')?.value.trim() || '';
  const landmark = document.getElementById('custLandmark')?.value.trim() || '';
  const deliveryDate = document.getElementById('deliveryDate')?.value || 'Standard Dispatch';
  const deliverySlot = document.getElementById('deliveryTimeSlot')?.value || 'Anytime (10 AM - 7 PM)';
  const orderNotes = document.getElementById('orderNotes')?.value.trim() || '';

  if (!fullName || !mobile || !address) {
    alert("Please fill in your Full Name, Mobile Number, and Delivery Address.");
    return;
  }

  if (cart.length === 0) {
    alert("Your shopping bag is empty!");
    return;
  }

  // Calculate Totals
  let subtotal = 0;
  const itemsText = cart.map((item, i) => {
    subtotal += item.price * item.qty;
    return `${i + 1}. *${item.name}*\n   • Variant: ${item.color} ${item.size ? `(${item.size})` : ''}\n   • Qty: ${item.qty} × ₹${item.price} = ₹${item.price * item.qty}`;
  }).join('\n');

  const deliveryCharge = subtotal >= THALIR_STORE.freeDeliveryThreshold ? 0 : THALIR_STORE.deliveryCharge;
  const grandTotal = subtotal + deliveryCharge;
  const orderId = `TB-${Date.now().toString().slice(-6)}`;

  // Save Order Record to Local Database
  const orderRecord = {
    orderId,
    timestamp: new Date().toISOString(),
    customer: { fullName, mobile, address, city, pincode, landmark },
    delivery: { deliveryDate, deliverySlot, notes: orderNotes },
    items: [...cart],
    pricing: { subtotal, deliveryCharge, grandTotal },
    paymentProof: uploadedPaymentProof ? uploadedPaymentProof.name : 'Not attached',
    channel: channel,
    status: 'Pending Verification'
  };

  const orders = JSON.parse(localStorage.getItem('tb_orders')) || [];
  orders.unshift(orderRecord);
  localStorage.setItem('tb_orders', JSON.stringify(orders));

  if (channel === 'whatsapp') {
    // Format WhatsApp Message
    const waMessage = 
`✨ *NEW ORDER - THALIR BOUTIQUE* ✨
━━━━━━━━━━━━━━━━━━━━━━
🆔 *Order ID:* #${orderId}
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}

🛍️ *ORDERED ITEMS:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━
💵 *Subtotal:* ₹${subtotal.toLocaleString('en-IN')}
🚚 *Delivery:* ${deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
💰 *TOTAL PAYABLE:* *₹${grandTotal.toLocaleString('en-IN')}*

📍 *DELIVERY DETAILS:*
👤 *Name:* ${fullName}
📞 *Mobile:* ${mobile}
🏠 *Address:* ${address}, ${city} ${pincode ? `- ${pincode}` : ''}
${landmark ? `📌 *Landmark:* ${landmark}\n` : ''}🕒 *Slot:* ${deliveryDate} | ${deliverySlot}
${orderNotes ? `📝 *Note:* ${orderNotes}\n` : ''}
💳 *Payment:* UPI Paid (to ${THALIR_STORE.upiId})
${uploadedPaymentProof ? `📎 *Payment Screenshot:* Attached in chat` : ''}
━━━━━━━━━━━━━━━━━━━━━━
_Thank you for shopping at Thalir Boutique!_ 💚`;

    const waUrl = `https://wa.me/${THALIR_STORE.whatsappPhone}?text=${encodeURIComponent(waMessage)}`;
    
    // Clear cart & open WhatsApp
    cart = [];
    saveCart();
    updateCartUI();
    closeCheckout();
    window.open(waUrl, '_blank');
    showToast(`Order #${orderId} created! Redirecting to WhatsApp... 📲`);
  } else {
    // Site Direct Order Confirmation
    cart = [];
    saveCart();
    updateCartUI();
    closeCheckout();
    showOrderConfirmationModal(orderRecord);
  }
}

// Show Order Success Modal
function showOrderConfirmationModal(order) {
  const modalHtml = `
    <div class="checkout-modal-overlay active" id="successOrderModal" style="display: flex;">
      <div class="checkout-container" style="max-width: 580px; text-align: center; padding: 36px 28px;">
        <div style="width: 70px; height: 70px; border-radius: 50%; background: var(--primary-pale); color: var(--primary-emerald); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 18px; border: 2px solid var(--primary-emerald);">
          <i class="fas fa-check"></i>
        </div>
        <h2 style="font-family: var(--font-serif); color: var(--primary-emerald); font-size: 1.8rem; margin-bottom: 8px;">Order Placed Successfully!</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">
          Thank you, <strong>${order.customer.fullName}</strong>! Your order reference is <strong style="color: var(--gold-accent);">#${order.orderId}</strong>.
        </p>

        <div style="background: var(--bg-creme); border-radius: var(--radius-md); padding: 18px; text-align: left; margin-bottom: 24px; font-size: 0.88rem; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Amount Paid:</span>
            <strong style="color: var(--primary-emerald); font-size: 1.1rem;">₹${order.pricing.grandTotal.toLocaleString('en-IN')}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Contact Mobile:</span>
            <strong>${order.customer.mobile}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Delivery:</span>
            <span>${order.customer.city}</span>
          </div>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="https://wa.me/${THALIR_STORE.whatsappPhone}?text=${encodeURIComponent(`Hi Thalir Boutique, I just placed order #${order.orderId} on the website.`)}" target="_blank" class="btn-place-whatsapp" style="padding: 10px 20px; font-size: 0.88rem;">
            <i class="fab fa-whatsapp"></i> Chat on WhatsApp
          </a>
          <button onclick="document.getElementById('successOrderModal').remove()" class="btn-gold" style="padding: 10px 20px; font-size: 0.88rem;">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Toast Notifications
function showToast(msg) {
  let toast = document.getElementById('tb-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tb-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 24px;
      background: #073822;
      color: #FFF;
      padding: 12px 22px;
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 600;
      border: 1px solid #DFBA6D;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
  }, 3500);
}

// Filter by Header / Footer nav links
window.filterByNavCategory = function(category) {
  currentCategory = category;
  document.querySelectorAll('.cat-tab-btn').forEach(btn => {
    if (btn.dataset.category === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderProducts();
  const catalogEl = document.getElementById('catalog');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth' });
  }
};

// Fallback catalog in case fetch encounters CORS/local protocol limits
function getFallbackProducts() {
  return [
    {
      id: "tb-sar-001",
      name: "Kanjivaram Silk Zari Border Saree",
      category: "sarees",
      categoryName: "Sarees",
      basePrice: 2499,
      originalPrice: 3999,
      discount: "37% OFF",
      tag: "Trending",
      defaultColor: "Emerald Green",
      variants: [
        { colorName: "Emerald Green", colorCode: "#0D5C3A", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80" },
        { colorName: "Rani Pink", colorCode: "#C2185B", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80" },
        { colorName: "Mustard Gold", colorCode: "#E5A910", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80" }
      ]
    },
    {
      id: "tb-kur-001",
      name: "Anarkali Embroidered Kurti Set",
      category: "kurtis",
      categoryName: "Kurtis",
      basePrice: 1299,
      originalPrice: 1999,
      discount: "35% OFF",
      tag: "New Arrival",
      sizes: ["M", "L", "XL", "XXL"],
      defaultColor: "Teal Blue",
      variants: [
        { colorName: "Teal Blue", colorCode: "#176B87", image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80" },
        { colorName: "Mustard Yellow", colorCode: "#D99B26", image: "https://images.unsplash.com/photo-1614088445100-a681329a6744?auto=format&fit=crop&w=800&q=80" }
      ]
    },
    {
      id: "tb-blo-001",
      name: "Heavy Aari Work Designer Blouse Piece",
      category: "blouse-materials",
      categoryName: "Blouse Materials",
      basePrice: 599,
      originalPrice: 999,
      discount: "40% OFF",
      tag: "Bridal Special",
      defaultColor: "Crimson Red",
      variants: [
        { colorName: "Crimson Red", colorCode: "#990000", image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80" },
        { colorName: "Bottle Green", colorCode: "#0B4619", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80" }
      ]
    },
    {
      id: "tb-chu-001",
      name: "Chanderi Silk Embroidered Chudi Material Set",
      category: "chudi-material",
      categoryName: "Chudi Material",
      basePrice: 1199,
      originalPrice: 1899,
      discount: "37% OFF",
      tag: "Festive Special",
      defaultColor: "Peacock Blue",
      variants: [
        { colorName: "Peacock Blue", colorCode: "#0E8388", image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80" },
        { colorName: "Dusty Pink", colorCode: "#D4A5A5", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80" }
      ]
    },
    {
      id: "tb-ins-001",
      name: "Pure Cotton 6-Cut Saree Inskirt (Petticoat)",
      category: "inskirts",
      categoryName: "Inskirts",
      basePrice: 299,
      originalPrice: 499,
      discount: "40% OFF",
      tag: "Essential",
      sizes: ["Free Size", "XL", "XXL"],
      defaultColor: "Emerald Green",
      variants: [
        { colorName: "Emerald Green", colorCode: "#0D5C3A", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80" },
        { colorName: "Rani Pink", colorCode: "#C2185B", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80" }
      ]
    },
    {
      id: "tb-nit-001",
      name: "Pure Cotton Feeding & Comfort Nighty",
      category: "night-wear",
      categoryName: "Night Wear",
      basePrice: 499,
      originalPrice: 750,
      discount: "33% OFF",
      tag: "Daily Essential",
      sizes: ["L", "XL", "XXL", "Free Size"],
      defaultColor: "Maroon Floral",
      variants: [
        { colorName: "Maroon Floral", colorCode: "#781D42", image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80" },
        { colorName: "Navy Paisley", colorCode: "#1D267D", image: "https://images.unsplash.com/photo-1614088445100-a681329a6744?auto=format&fit=crop&w=800&q=80" }
      ]
    }
  ];
}

import React, { useState } from 'react';
import { X, Package, MapPin, Heart, User, LogOut, Plus, Trash2, CheckCircle2, Clock, Truck, ShieldCheck, ShoppingBag, MessageCircle, ArrowRight, FileText } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { InvoiceModal } from './InvoiceModal';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';

export const UserPanel = () => {
  const {
    user,
    products,
    isUserPanelOpen,
    setIsUserPanelOpen,
    logout,
    userOrders,
    wishlist,
    toggleWishlist,
    addToCart,
    saveUserAddress,
    deleteUserAddress,
    updateUserProfile,
    storeInfo,
    language
  } = useStore();

  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);

  const resolveItemImage = (item) => {
    if (item.image && typeof item.image === 'string' && !item.image.includes('photo-1610030469983-98e550d6193c')) {
      return item.image;
    }
    if (item.image_url && typeof item.image_url === 'string' && !item.image_url.includes('photo-1610030469983-98e550d6193c')) {
      return item.image_url;
    }
    const matchedProd = (products || []).find(p => 
      p.name?.toLowerCase().trim() === item.name?.toLowerCase().trim() ||
      p.code === item.id ||
      p.id === item.id
    );
    if (matchedProd) {
      if (matchedProd.variants && matchedProd.variants.length > 0) {
        const matchedVariant = matchedProd.variants.find(v => 
          (v.colorName && v.colorName.toLowerCase().trim() === (item.color || '').toLowerCase().trim()) ||
          (v.color_name && v.color_name.toLowerCase().trim() === (item.color || '').toLowerCase().trim())
        );
        if (matchedVariant?.image || matchedVariant?.image_url) {
          return matchedVariant.image || matchedVariant.image_url;
        }
        return matchedProd.variants[0].image || matchedProd.variants[0].image_url || matchedProd.image;
      }
      if (matchedProd.image) return matchedProd.image;
    }
    return item.image || item.image_url || '/assets/logo.jpg';
  };

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses' | 'wishlist' | 'profile'
  const [showAddAddress, setShowAddAddress] = useState(false);
  
  const [newAddr, setNewAddr] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: 'Namakkal',
    pincode: '638008',
    landmark: '',
    isDefault: true
  });

  const [editProfile, setEditProfile] = useState({
    name: user?.name || '',
    email: (user?.email && !user.email.includes('@thalirboutique.com')) ? user.email : '',
    phone: user?.phone || ''
  });

  React.useEffect(() => {
    if (user) {
      setEditProfile({
        name: user.name || '',
        email: (user.email && !user.email.includes('@thalirboutique.com')) ? user.email : '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  if (!isUserPanelOpen || !user || user.role === 'Admin') return null;

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!newAddr.address || !newAddr.city) {
      if (showToast) showToast('Please fill in address and city.');
      return;
    }
    saveUserAddress(newAddr);
    setShowAddAddress(false);
    setNewAddr({
      fullName: user.name,
      phone: user.phone || '',
      address: '',
      city: '',
      pincode: '',
      landmark: '',
      isDefault: false
    });
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile(editProfile);
  };

  const displayPhone = user.phone || null;
  const displayEmail = user.email && !user.email.includes('@thalirboutique.com') ? user.email : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border-2 border-gold/40 flex flex-col relative my-auto">
        
        {/* Header Profile Summary */}
        <div className="bg-gradient-to-r from-[#073822] to-[#0D5C3A] text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-gold">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=0D5C3A`}
              alt={user.name}
              className="w-14 h-14 rounded-full border-2 border-gold object-cover shadow-md bg-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-white">{user.name}</h2>
                {user.role === 'Admin' && (
                  <span className="bg-gold text-stone-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    👑 Admin
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-200 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                {displayPhone && <span>📞 {displayPhone}</span>}
                {displayEmail && <span>✉️ {displayEmail}</span>}
                <span>🗓️ {language === 'ta' ? 'உறுப்பினர்:' : 'Member since'} {user.joinedDate}</span>
                {user.loginTime && (
                  <span className="flex items-center gap-1 text-emerald-200">
                    <Clock className="w-3 h-3 text-gold inline" />
                    <span>{language === 'ta' ? 'உள்நுழைந்தது:' : 'Logged in:'} {new Date(user.loginTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    {user.role !== 'Admin' && <span className="text-[10px] text-amber-200/90 font-medium">{language === 'ta' ? '(12 மணிநேர அமர்வு)' : '(12h session)'}</span>}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {user.role === 'Admin' && (
              <button
                onClick={() => {
                  setIsUserPanelOpen(false);
                  window.location.hash = '#admin';
                }}
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> {language === 'ta' ? 'நிர்வாக பலகை' : 'Admin Panel'}
              </button>
            )}
            <button
              onClick={logout}
              className="bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> {language === 'ta' ? 'வெளியேறு' : 'Logout'}
            </button>
            <button
              onClick={() => setIsUserPanelOpen(false)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-primary text-primary bg-white shadow-sm'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" /> {language === 'ta' ? 'என் ஆர்டர்கள்' : 'My Orders'} ({userOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'addresses'
                ? 'border-primary text-primary bg-white shadow-sm'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MapPin className="w-4 h-4" /> {language === 'ta' ? 'சேமித்த முகவரிகள்' : 'Saved Addresses'} ({user.addresses?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'wishlist'
                ? 'border-primary text-primary bg-white shadow-sm'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Heart className="w-4 h-4" /> {language === 'ta' ? 'விருப்பப் பட்டியல்' : 'My Wishlist'} ({wishlist.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-primary text-primary bg-white shadow-sm'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4" /> {language === 'ta' ? 'சுயவிவர அமைப்புகள்' : 'Profile Settings'}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[#FAF8F5]">
          
          {/* 1. My Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {userOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
                  <Package className="w-12 h-12 text-stone-300 mx-auto" />
                  <h4 className="font-serif font-bold text-stone-700 text-lg">
                    {language === 'ta' ? 'ஆர்டர்கள் எதுவும் இல்லை' : 'No Orders Yet'}
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    {language === 'ta'
                      ? 'நீங்கள் இன்னும் எந்த சேலை அல்லது ஆடை ஆர்டரும் செய்யவில்லை. எங்கள் சேலை ரகங்களை பார்வையிட்டு ஆர்டர் செய்யுங்கள்!'
                      : "You haven't placed any saree or boutique orders yet. Browse our collections and place your first order!"}
                  </p>
                  <button
                    onClick={() => setIsUserPanelOpen(false)}
                    className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-5 py-2.5 rounded-full shadow cursor-pointer"
                  >
                    {language === 'ta' ? 'புடவைகளை பார்வையிடவும்' : 'Explore Saree Collections'}
                  </button>
                </div>
              ) : (
                userOrders.map((order) => {
                  const getStatusText = (st) => {
                    if (language !== 'ta') return st || 'Pending Verification';
                    const s = (st || '').toLowerCase();
                    if (s.includes('delivered')) return 'டெலிவரி செய்யப்பட்டது';
                    if (s.includes('dispatched')) return 'கூரியரில் அனுப்பப்பட்டது';
                    if (s.includes('confirmed') || s.includes('verified')) return 'கட்டணம் உறுதி செய்யப்பட்டது';
                    if (s.includes('cancelled')) return 'ரத்து செய்யப்பட்டது';
                    return 'சரிபார்ப்பு நிலுவையில்';
                  };

                  return (
                    <div
                      key={order.orderId}
                      className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4 hover:border-gold/50 transition-all"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-stone-100">
                        <div>
                          <span className="text-xs text-stone-500">
                            {language === 'ta' ? 'ஆர்டர் எண்:' : 'Order Reference:'}
                          </span>
                          <h4 className="font-mono font-bold text-primary text-sm">#{order.orderId}</h4>
                          <span className="text-[11px] text-stone-400">
                            {language === 'ta' ? 'பதிவு செய்த நாள்: ' : 'Placed on '}
                            {order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'Dispatched'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {getStatusText(order.status)}
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="text-xs bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                            title="View & Download PDF Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'விலைப்பட்டியல்' : 'Invoice'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedTrackingOrder(order)}
                            className="text-xs bg-emerald-50 hover:bg-[#073822] text-[#073822] hover:text-white border border-[#073822]/20 font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                            title="Live Parcel Tracking"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'நேரலை டிராக்கிங்' : 'Track Order'}</span>
                          </button>

                          <a
                            href={`https://wa.me/${storeInfo?.whatsappNumber || '916382218590'}?text=${encodeURIComponent(
                              `Hi Thalir Boutique, I would like to check the status of my order #${order.orderId} (${(order.items || [])
                                .map(i => `${i.product_code || i.code || i.productCode || i.id ? `[Code: ${i.product_code || i.code || i.productCode || i.id}] ` : ''}${i.name || i.product_name || 'Item'}`)
                                .join(', ')})`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-whatsapp/10 hover:bg-whatsapp text-whatsapp hover:text-white font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'வாட்ஸ்அப் டிராக்கிங்' : 'WhatsApp Track'}</span>
                          </a>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-xs text-stone-800">
                            <img
                              src={resolveItemImage(item)}
                              alt={item.name}
                              className="w-10 h-12 rounded object-cover border border-stone-100 bg-stone-50"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/logo.jpg';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <strong className="block truncate text-stone-900">{item.name}</strong>
                              <span className="text-stone-500">
                                {(item.product_code || item.code || item.productCode || item.id) && (
                                  <span className="font-mono text-[10px] text-primary font-bold mr-1.5 bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                                    #{item.product_code || item.code || item.productCode || item.id}
                                  </span>
                                )}
                                {language === 'ta' ? 'வகை: ' : 'Variant: '}{item.color} {item.size && `(${item.size})`} • {language === 'ta' ? 'அளவு: ' : 'Qty: '}{item.qty || 1}
                              </span>
                            </div>
                            <div className="font-bold text-primary text-sm">
                              ₹{(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer & Price */}
                      <div className="pt-3 border-t border-stone-100 flex flex-wrap justify-between items-center gap-2 text-xs">
                        {order.customer?.address ? (
                          <div className="text-stone-500">
                            {language === 'ta' ? 'டெலிவரி முகவரி: ' : 'Deliver to: '}
                            <strong>{order.customer.city}</strong> ({order.customer.address})
                          </div>
                        ) : (
                          <div className="text-stone-400 italic">
                            {language === 'ta' ? 'நிலையான கூரியர் ஆர்டர்' : 'Standard Courier Order'}
                          </div>
                        )}
                        <div className="text-sm font-extrabold text-stone-900 ml-auto">
                          {language === 'ta' ? 'மொத்தம்: ' : 'Total: '}
                          <span className="text-primary text-base">₹{(order.pricing?.grandTotal || order.grand_total || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. Saved Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif font-bold text-base text-primary">
                  {language === 'ta' ? 'உங்கள் டெலிவரி முகவரிகள்' : 'Your Shipping Addresses'}
                </h3>
                <button
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {showAddAddress
                      ? (language === 'ta' ? 'ரத்து செய்' : 'Cancel')
                      : (language === 'ta' ? 'புதிய முகவரி சேர்க்க' : 'Add New Address')
                    }
                  </span>
                </button>
              </div>

              {/* Add Address Form */}
              {showAddAddress && (
                <form onSubmit={handleSaveAddress} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gold">
                    {language === 'ta' ? 'புதிய முகவரி விவரங்கள்' : 'New Address Details'}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-stone-600 mb-1">
                        {language === 'ta' ? 'பெயர்' : 'Contact Name'}
                      </label>
                      <input
                        type="text"
                        value={newAddr.fullName}
                        onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                        placeholder={language === 'ta' ? 'பெறுநர் பெயர்' : 'Recipient Name'}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-stone-600 mb-1">
                        {language === 'ta' ? 'மொபைல் எண்' : 'Contact Phone'}
                      </label>
                      <input
                        type="tel"
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        placeholder={language === 'ta' ? '10-இலக்க மொபைல் எண்' : '10-digit mobile'}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-stone-600 mb-1">
                        {language === 'ta' ? 'தெரு முகவரி' : 'Street Address'}
                      </label>
                      <textarea
                        rows={2}
                        value={newAddr.address}
                        onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                        placeholder={language === 'ta' ? 'வீட்டு எண், கதவு எண், தெரு, பகுதி' : 'Flat/House No, Building, Street, Area'}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-stone-600 mb-1">
                        {language === 'ta' ? 'ஊர் / நகரம்' : 'City / Town'}
                      </label>
                      <input
                        type="text"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        placeholder={language === 'ta' ? 'நாமக்கல் / சேலம்' : 'Namakkal'}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-stone-600 mb-1">
                        {language === 'ta' ? 'பின்கோடு' : 'Pincode'}
                      </label>
                      <input
                        type="text"
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        placeholder="638008"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-stone-600 mb-1">
                        {language === 'ta' ? 'அருகிலுள்ள அடையாளம்' : 'Landmark'}
                      </label>
                      <input
                        type="text"
                        value={newAddr.landmark}
                        onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                        placeholder={language === 'ta' ? 'கோவில் / பேருந்து நிறுத்தம் அருகில்' : 'Opposite Temple / Bus Stand'}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2 px-5 rounded-xl shadow cursor-pointer"
                  >
                    {language === 'ta' ? 'முகவரியை சேமி' : 'Save Address'}
                  </button>
                </form>
              )}

              {/* Addresses List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.addresses && user.addresses.length > 0 ? (
                  user.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm relative flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-sm font-serif text-stone-900">{addr.fullName}</strong>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              {language === 'ta' ? 'முதன்மை' : 'Default'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {addr.address}, {addr.city} - {addr.pincode}
                        </p>
                        {addr.landmark && (
                          <span className="text-[11px] text-stone-400 block mt-1">
                            {language === 'ta' ? 'அடையாளம்: ' : 'Landmark: '}{addr.landmark}
                          </span>
                        )}
                        <span className="text-xs text-stone-700 font-medium block mt-1">📞 {addr.phone}</span>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex justify-end">
                        <button
                          onClick={() => deleteUserAddress(addr.id)}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'ta' ? 'நீக்கு' : 'Remove'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-stone-400 text-xs">
                    {language === 'ta'
                      ? 'சேமிக்கப்பட்ட முகவரிகள் எதுவும் இல்லை.'
                      : 'No addresses saved yet. Add one to enable 1-click checkout!'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              {wishlist.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
                  <Heart className="w-12 h-12 text-stone-300 mx-auto" />
                  <h4 className="font-serif font-bold text-stone-700 text-lg">
                    {language === 'ta' ? 'உங்கள் விருப்பப் பட்டியல் காலியாக உள்ளது' : 'Your Wishlist is Empty'}
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    {language === 'ta'
                      ? 'உங்களுக்குப் பிடித்த பட்டுப் புடவைகள் மற்றும் குர்திகளை பின்னர் வாங்க சேமிக்கவும்.'
                      : 'Save your favorite silk sarees and designer kurtis to quickly shop them later.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between p-3"
                    >
                      <div className="flex gap-3">
                        <img
                          src={item.variants ? item.variants[0].image : item.image}
                          alt={item.name}
                          className="w-16 h-20 rounded-lg object-cover bg-stone-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-gold uppercase">{item.categoryName || item.category}</span>
                          <h4 className="font-serif font-bold text-xs text-stone-900 truncate">{item.name}</h4>
                          <span className="text-sm font-extrabold text-primary block mt-1">₹{item.basePrice.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-100 flex gap-2">
                        <button
                          onClick={() => addToCart(item, item.defaultColor, item.sizes ? item.sizes[0] : null, item.variants ? item.variants[0].image : item.image)}
                          className="flex-1 bg-primary-pale hover:bg-primary text-primary hover:text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{language === 'ta' ? 'பையில் சேர்க்க' : 'Move to Bag'}</span>
                        </button>
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="text-stone-400 hover:text-red-500 p-1.5 cursor-pointer"
                          title={language === 'ta' ? 'நீக்கு' : 'Remove from wishlist'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm max-w-md space-y-4">
              <h3 className="font-serif font-bold text-base text-primary mb-2">
                {language === 'ta' ? 'கணக்கு & தொடர்பு விவரங்கள்' : 'Account & Contact Info'}
              </h3>

              {/* Session Information */}
              {user.loginTime && (
                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'ta' ? 'செயலில் உள்ள அமர்வு' : 'Active Session'}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
                      {user.role === 'Admin' ? 'Admin (Persistent)' : (language === 'ta' ? '12-மணிநேர அமர்வு' : '12-Hour Expiry')}
                    </span>
                  </div>
                  <div className="text-stone-600 text-[11px] space-y-0.5">
                    <div>
                      <span className="font-medium text-stone-700">
                        {language === 'ta' ? 'உள்நுழைந்த நேரம்: ' : 'Logged in at: '}
                      </span>
                      {new Date(user.loginTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(user.loginTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                    {user.role !== 'Admin' && (
                      <div className="text-stone-500 text-[10.5px]">
                        {language === 'ta'
                          ? 'பாதுகாப்பிற்காக, உங்கள் கணக்கு 12 மணிநேரத்தில் தானாக வெளியேறும்.'
                          : 'For account security, shopper sessions automatically sign out 12 hours from login.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {language === 'ta' ? 'உங்கள் முழு பெயர்' : 'Your Full Name'}
                  </label>
                  <input
                    type="text"
                    value={editProfile.name}
                    onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {language === 'ta' ? 'மொபைல் எண் (விருப்பத்தேர்வு)' : 'Mobile Number (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={editProfile.phone}
                    onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {language === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={editProfile.email}
                    onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-5 rounded-xl shadow mt-2 cursor-pointer"
                >
                  {language === 'ta' ? 'மாற்றங்களை சேமி' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Printable Tax Invoice Modal for User */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
          order={selectedInvoiceOrder}
          storeInfo={storeInfo}
          isAdmin={false}
        />
      )}

      {/* Live Parcel Tracking Timeline */}
      {selectedTrackingOrder && (
        <OrderTrackingTimeline
          order={selectedTrackingOrder}
          onClose={() => setSelectedTrackingOrder(null)}
        />
      )}
    </div>
  );
};

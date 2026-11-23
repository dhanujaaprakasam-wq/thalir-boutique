import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Hourglass, IndianRupee, Boxes, Plus, Trash2, ArrowLeft, RefreshCw, 
  Eye, CheckCircle2, ShieldCheck, Settings, Store, Users, Calendar, Phone, Mail,
  Upload, Image as ImageIcon, Palette, Layers, Sparkles, Tag, Check, X, MessageCircle,
  FileText, Volume2, VolumeX, Truck, QrCode, Edit3, PlusCircle,
  TrendingUp, BarChart3, RotateCcw, Percent, Building, ExternalLink, Globe, Search,
  UploadCloud, Copy, Grid, Pipette, Download, Send, Star, Camera
} from 'lucide-react';
import { InstagramIcon } from './Icons';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import logoImg from '../assets/logo.jpg';

import instaImg1 from '../assets/instagram/thalir_insta_10.jpg';
import instaImg2 from '../assets/instagram/thalir_insta_11.jpg';
import instaImg3 from '../assets/instagram/thalir_insta_7.jpg';
import instaImg4 from '../assets/instagram/thalir_insta_12.jpg';
import instaImg5 from '../assets/instagram/thalir_insta_6.jpg';
import instaImg6 from '../assets/instagram/thalir_insta_8.jpg';
import instaImg7 from '../assets/instagram/thalir_insta_9.jpg';

const instaImageMap = {
  '/src/assets/instagram/thalir_insta_10.jpg': instaImg1,
  '/src/assets/instagram/thalir_insta_11.jpg': instaImg2,
  '/src/assets/instagram/thalir_insta_7.jpg': instaImg3,
  '/src/assets/instagram/thalir_insta_12.jpg': instaImg4,
  '/src/assets/instagram/thalir_insta_6.jpg': instaImg5,
  '/src/assets/instagram/thalir_insta_8.jpg': instaImg6,
  '/src/assets/instagram/thalir_insta_9.jpg': instaImg7,
};

const resolveInstaMedia = (url) => {
  if (!url) return instaImg1;
  if (instaImageMap[url]) return instaImageMap[url];
  return url;
};

import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { InvoiceModal } from './InvoiceModal';
import { ManualOrderModal } from './ManualOrderModal';
import { OrderEditModal } from './OrderEditModal';
import { PaymentVerificationModal } from './PaymentVerificationModal';
import { DaybookLedger } from './DaybookLedger';
import { InventoryManager } from './InventoryManager';
import { SupplierManager } from './SupplierManager';
import { OffersManager } from './OffersManager';
import { ReturnsManager } from './ReturnsManager';
import { ReportsAnalytics } from './ReportsAnalytics';
import { BroadcastManager } from './BroadcastManager';
import { playOrderChime } from '../utils/audioChime';
import { 
  CATEGORY_TEMPLATES, 
  generateProductCode, 
  getCategoryDefaults, 
  POPULAR_COLORS 
} from '../data/categoryTemplates';
import { 
  detectDominantColorFromImage, 
  BOUTIQUE_COLOR_PALETTE, 
  matchClosestBoutiqueColor, 
  hexToRgb 
} from '../utils/colorDetector';
import { 
  detectSareeAndFabric, 
  SAREE_PRESETS 
} from '../utils/garmentDetector';

const ALL_KURTI_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size'];


export const AdminDashboard = ({ setCurrentView, onLogoutAdmin }) => {
  const {
    orders,
    products,
    updateOrderStatus,
    toggleOrderStock,
    deleteOrder,
    addNewProduct,
    storeInfo,
    showToast,
    setIsAdminDemoMode,
    instagramPosts,
    loadingInstagram,
    refreshInstagramFeed,
    syncInstagramFeed,
    addInstagramPost,
    deleteInstagramPost,
    language,
    changeLanguage
  } = useStore();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'customers' | 'products' | 'settings'
  const [orderChannelFilter, setOrderChannelFilter] = useState('all'); // 'all' | 'whatsapp' | 'site' | 'direct' | 'pending' | 'sold'
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderSoldOnlyFilter, setOrderSoldOnlyFilter] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Sound Chime & Realtime State
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  
  // Payment Proof Verification Modal State
  const [selectedOrderForVerification, setSelectedOrderForVerification] = useState(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  
  // Manual & Edit Order State
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [isOrderEditOpen, setIsOrderEditOpen] = useState(false);

  // Instagram Management State
  const [isAddingInsta, setIsAddingInsta] = useState(false);
  const [newInstaUrl, setNewInstaUrl] = useState('');
  const [newInstaCaption, setNewInstaCaption] = useState('');
  const [newInstaPermalink, setNewInstaPermalink] = useState('https://www.instagram.com/thalir_boutique_/');
  const [instaAccessToken, setInstaAccessToken] = useState('');

  const prevOrderCountRef = useRef(orders.length);

  // Real-time Chime Trigger
  useEffect(() => {
    if (orders.length > prevOrderCountRef.current) {
      if (isSoundEnabled) {
        playOrderChime();
      }
      if (showToast) {
        showToast('🛎️ New Order Received!');
      }
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length, isSoundEnabled]);

  const exportOrdersToCsv = () => {
    if (!orders || orders.length === 0) {
      if (showToast) showToast(language === 'ta' ? 'ஏற்றுமதி செய்ய ஆர்டர்கள் எதுவும் இல்லை.' : 'No orders available to export.');
      return;
    }
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'City', 'Pincode', 'Items', 'Channel', 'Payment Status', 'Subtotal (INR)', 'Delivery Charge (INR)', 'Grand Total (INR)', 'Courier Partner', 'AWB Tracking Number'];
    const rows = orders.map(o => {
      const itemsSummary = (o.items || []).map(i => `${i.product_name || i.name || 'Item'} (${i.color || ''} x${i.qty || 1})`).join('; ');
      return [
        `"${o.orderId || o.id || ''}"`,
        `"${o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-IN') : ''}"`,
        `"${(o.customer?.fullName || o.customer_name || '').replace(/"/g, '""')}"`,
        `"${o.customer?.mobile || o.customer_phone || ''}"`,
        `"${(o.customer?.address || o.delivery_address || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.city || o.city || '').replace(/"/g, '""')}"`,
        `"${o.customer?.pincode || o.pincode || ''}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        `"${o.channel || 'online'}"`,
        `"${o.status || 'Pending'}"`,
        o.pricing?.subtotal || o.subtotal || 0,
        o.pricing?.deliveryCharge || o.delivery_charge || 0,
        o.pricing?.grandTotal || o.grand_total || 0,
        `"${o.courierPartner || ''}"`,
        `"${o.trackingNumber || o.awbNumber || ''}"`
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thalir_boutique_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast(language === 'ta' ? 'அனைத்து ஆர்டர்களும் CSV ஆக பதிவிறக்கப்பட்டது! 📥' : 'All orders exported to CSV successfully! 📥');
  };

  // Custom Delete Modal State
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    title: '',
    itemName: '',
    itemDetails: '',
    itemImage: null,
    warningText: '',
    confirmBtnText: 'Yes, Delete',
    onConfirm: () => {}
  });

  // --- Product Management State ---
  const [productMode, setProductMode] = useState('variants'); // 'variants' (multi-color) | 'simple' (single design)
  
  const initialSareeDefaults = getCategoryDefaults('sarees');
  const [newProd, setNewProd] = useState({
    code: initialSareeDefaults.code,
    name: initialSareeDefaults.name,
    category: 'sarees',
    basePrice: '',
    originalPrice: '',
    tag: 'New Arrival',
    fabric: initialSareeDefaults.fabric,
    length: initialSareeDefaults.length,
    care: initialSareeDefaults.care,
    description: initialSareeDefaults.description,
    defaultColor: 'Emerald Green',
    image: '',
    images: [],
    sizes: initialSareeDefaults.sizes,
    isSpecialEvent: false,
    eventName: 'Diwali Dhamaka Sale',
    eventEndTime: null,
    eventBadge: 'Diwali Special'
  });

  const [customSizeInput, setCustomSizeInput] = useState('');

  const [colorVariants, setColorVariants] = useState([
    {
      id: 1,
      code: `${initialSareeDefaults.code}-01`,
      colorName: 'Emerald Green',
      colorCode: '#0D5C3A',
      image: '',
      images: [],
      stockQty: 1
    }
  ]);

  const [isPublishing, setIsPublishing] = useState(false);
  const [bulkPublishMode, setBulkPublishMode] = useState('single_with_variants'); // 'single_with_variants' | 'separate_products'
  const [bulkStockApplyValue, setBulkStockApplyValue] = useState(1);
  const [publishProgress, setPublishProgress] = useState({ current: 0, total: 0, isPublishing: false });

  // Single File Upload Helper with Automatic Color & Saree Type / Fabric Detection
  const handleFileUpload = (file, variantIndex = null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const detected = await detectDominantColorFromImage(dataUrl);
      const sareeDetected = await detectSareeAndFabric(dataUrl, file?.name || '', newProd.category);

      if (variantIndex !== null) {
        setColorVariants(prev => prev.map((v, i) => {
          if (i !== variantIndex) return v;
          const curImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
          const nextImages = curImages.includes(dataUrl) ? curImages : [dataUrl, ...curImages];
          return { 
            ...v, 
            image: dataUrl,
            images: nextImages,
            colorName: detected.colorName || v.colorName,
            colorCode: detected.colorCode || v.colorCode,
            colorSuggestions: detected.suggestions || [],
            stockQty: v.stockQty ?? 1,
            detectedFromPhoto: true
          };
        }));

        // If it's the primary/first variant, also auto-update master product saree type & fabric!
        if (variantIndex === 0 || !newProd.image) {
          setNewProd(prev => {
            const curImages = Array.isArray(prev.images) && prev.images.length > 0 ? prev.images : (prev.image ? [prev.image] : []);
            const nextImages = curImages.includes(dataUrl) ? curImages : [dataUrl, ...curImages];
            return { 
              ...prev, 
              image: prev.image || dataUrl,
              images: nextImages,
              name: (prev.category === 'sarees' && sareeDetected?.sareeName) ? sareeDetected.sareeName : prev.name,
              fabric: (prev.category === 'sarees' && sareeDetected?.fabric) ? sareeDetected.fabric : prev.fabric,
              care: (prev.category === 'sarees' && sareeDetected?.care) ? sareeDetected.care : prev.care,
              description: (prev.category === 'sarees' && sareeDetected?.description) ? sareeDetected.description : prev.description,
              length: (prev.category === 'sarees' && sareeDetected?.length) ? sareeDetected.length : prev.length,
              defaultColor: detected.colorName || prev.defaultColor,
              detectedSareeType: sareeDetected
            };
          });
        }
      } else {
        setNewProd(prev => {
          const curImages = Array.isArray(prev.images) && prev.images.length > 0 ? prev.images : (prev.image ? [prev.image] : []);
          const nextImages = curImages.includes(dataUrl) ? curImages : [dataUrl, ...curImages];
          return { 
            ...prev, 
            image: dataUrl,
            images: nextImages,
            name: (prev.category === 'sarees' && sareeDetected?.sareeName) ? sareeDetected.sareeName : prev.name,
            fabric: (prev.category === 'sarees' && sareeDetected?.fabric) ? sareeDetected.fabric : prev.fabric,
            care: (prev.category === 'sarees' && sareeDetected?.care) ? sareeDetected.care : prev.care,
            description: (prev.category === 'sarees' && sareeDetected?.description) ? sareeDetected.description : prev.description,
            length: (prev.category === 'sarees' && sareeDetected?.length) ? sareeDetected.length : prev.length,
            defaultColor: detected.colorName || prev.defaultColor,
            detectedSareeType: sareeDetected
          };
        });
        setColorVariants(prev => prev.map((v, i) => {
          if (i !== 0) return v;
          const curImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
          const nextImages = curImages.includes(dataUrl) ? curImages : [dataUrl, ...curImages];
          return {
            ...v,
            image: dataUrl,
            images: nextImages,
            colorName: detected.colorName || v.colorName,
            colorCode: detected.colorCode || v.colorCode,
            colorSuggestions: detected.suggestions || [],
            stockQty: v.stockQty ?? 1,
            detectedFromPhoto: true
          };
        }));
      }

      if (showToast) {
        showToast(language === 'ta'
          ? `✨ தானாக கண்டறியப்பட்டது: ${sareeDetected?.sareeName || 'சேலை'} (${detected.colorName})! துணி & தலைப்பு அமைக்கப்பட்டது.`
          : `✨ Auto-detected: ${sareeDetected?.sareeName || 'Saree'} (${detected.colorName})! Fabric & title updated.`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload Multiple Photos of the SAME Product (Gallery / Front / Pallu / Blouse / Border / Drape)
  const handleUploadSameProductImages = async (files, variantIndex = null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    const readPromises = fileList.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            dataUrl: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(readPromises);
    const newImages = results.map(r => r.dataUrl).filter(Boolean);
    if (newImages.length === 0) return;

    // Detect saree fabric and dominant color from the first photo
    const firstImg = newImages[0];
    const detected = await detectDominantColorFromImage(firstImg);
    const sareeDetected = await detectSareeAndFabric(firstImg, results[0]?.name || '', newProd.category);

    if (variantIndex !== null) {
      setColorVariants(prev => prev.map((v, i) => {
        if (i !== variantIndex) return v;
        const curImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
        const nextImages = [...curImages, ...newImages];
        return {
          ...v,
          image: v.image || nextImages[0],
          images: nextImages,
          colorName: v.colorName || detected.colorName,
          colorCode: v.colorCode || detected.colorCode
        };
      }));
    } else {
      setNewProd(prev => {
        const curImages = Array.isArray(prev.images) && prev.images.length > 0 ? prev.images : (prev.image ? [prev.image] : []);
        const nextImages = [...curImages, ...newImages];
        return {
          ...prev,
          image: prev.image || nextImages[0],
          images: nextImages,
          name: (prev.category === 'sarees' && sareeDetected?.sareeName) ? sareeDetected.sareeName : prev.name,
          fabric: (prev.category === 'sarees' && sareeDetected?.fabric) ? sareeDetected.fabric : prev.fabric,
          care: (prev.category === 'sarees' && sareeDetected?.care) ? sareeDetected.care : prev.care,
          description: (prev.category === 'sarees' && sareeDetected?.description) ? sareeDetected.description : prev.description,
          length: (prev.category === 'sarees' && sareeDetected?.length) ? sareeDetected.length : prev.length,
          defaultColor: detected.colorName || prev.defaultColor,
          detectedSareeType: sareeDetected
        };
      });

      setColorVariants(prev => prev.map((v, i) => {
        if (i === 0) {
          const curImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
          const nextImages = [...curImages, ...newImages];
          return {
            ...v,
            image: v.image || nextImages[0],
            images: nextImages,
            colorName: v.colorName || detected.colorName,
            colorCode: v.colorCode || detected.colorCode
          };
        }
        return v;
      }));
    }

    if (showToast) {
      showToast(language === 'ta'
        ? `📸 ${newImages.length} தயாரிப்பு படங்கள் (பல்லு, பிளவுஸ், பார்டர்) வெற்றிகரமாக சேர்க்கப்பட்டன!`
        : `📸 Added ${newImages.length} pictures of this saree (Pallu, Blouse, Border, Angles)!`);
    }
  };

  const handleSetPrimaryNewProdImage = (idx) => {
    setNewProd(prev => {
      const list = [...(prev.images || [])];
      if (idx <= 0 || idx >= list.length) return prev;
      const [selected] = list.splice(idx, 1);
      list.unshift(selected);
      return {
        ...prev,
        image: list[0],
        images: list
      };
    });
    setColorVariants(prev => prev.map((v, i) => i === 0 ? {
      ...v,
      image: (newProd.images && newProd.images[idx]) || v.image
    } : v));
  };

  const handleRemoveNewProdImage = (idx) => {
    setNewProd(prev => {
      const list = (prev.images || []).filter((_, i) => i !== idx);
      return {
        ...prev,
        image: list[0] || '',
        images: list
      };
    });
  };

  const handleRemoveVariantSubImage = (variantIndex, imgIndex) => {
    setColorVariants(prev => prev.map((v, i) => {
      if (i !== variantIndex) return v;
      const nextImages = (v.images || []).filter((_, idx) => idx !== imgIndex);
      return {
        ...v,
        images: nextImages,
        image: nextImages[0] || ''
      };
    }));
  };

  const handleSetPrimaryVariantSubImage = (variantIndex, imgIndex) => {
    setColorVariants(prev => prev.map((v, i) => {
      if (i !== variantIndex) return v;
      const list = [...(v.images || [])];
      if (imgIndex <= 0 || imgIndex >= list.length) return v;
      const [selected] = list.splice(imgIndex, 1);
      list.unshift(selected);
      return {
        ...v,
        images: list,
        image: list[0] || v.image
      };
    }));
  };

  // Bulk Multiple Files Upload Helper (Select 10, 15, or more pictures at once)
  // Automatically detects garment color for every single picture, detects saree type/fabric, and defaults stock to 1
  const handleMultipleFilesUpload = async (files) => {
    if (!files || files.length === 0) return;
    setProductMode('variants');
    const fileList = Array.from(files);

    const readAndDetectPromises = fileList.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target.result;
          const detected = await detectDominantColorFromImage(dataUrl);
          resolve({
            name: file.name,
            dataUrl,
            detectedColor: detected
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(readAndDetectPromises);
    const baseCode = newProd.code || generateProductCode(newProd.category);
    const currentTpl = CATEGORY_TEMPLATES[newProd.category] || CATEGORY_TEMPLATES['sarees'];

    // Detect overall saree type from the uploaded photos / filenames
    const firstDataUrl = results[0]?.dataUrl;
    const firstFileName = fileList[0]?.name || results[0]?.name || '';
    const sareeDetected = await detectSareeAndFabric(firstDataUrl, firstFileName, newProd.category);

    if (newProd.category === 'sarees' && sareeDetected) {
      setNewProd(prev => ({
        ...prev,
        image: prev.image || firstDataUrl,
        name: sareeDetected.sareeName,
        fabric: sareeDetected.fabric,
        care: sareeDetected.care,
        description: sareeDetected.description,
        length: sareeDetected.length || prev.length,
        defaultColor: results[0]?.detectedColor?.colorName || prev.defaultColor,
        detectedSareeType: sareeDetected
      }));
    }

    const newVariants = results.map((res, index) => {
      const existingCount = colorVariants.filter(v => v.image).length;
      const idx = existingCount + index + 1;
      const autoCode = `${baseCode}-${String(idx).padStart(2, '0')}`;
      
      const detectedName = res.detectedColor?.colorName || `Color #${idx}`;
      const detectedCode = res.detectedColor?.colorCode || '#0D5C3A';
      const suggestions = res.detectedColor?.suggestions || [];

      const initialSizes = newProd.sizes && newProd.sizes.length > 0 ? [...newProd.sizes] : [...currentTpl.defaultSizes];
      const initialCounts = {};
      initialSizes.forEach(s => {
        initialCounts[s] = 1;
      });

      return {
        id: Date.now() + index + Math.random(),
        code: autoCode,
        colorName: detectedName,
        colorCode: detectedCode,
        colorSuggestions: suggestions,
        image: res.dataUrl,
        stockQty: Number(bulkStockApplyValue) || 1,
        sizes: initialSizes,
        sizeCounts: initialCounts,
        detectedFromPhoto: true
      };
    });

    setColorVariants(prev => {
      const existingWithImages = prev.filter(v => v.image);
      return [...existingWithImages, ...newVariants];
    });

    if (showToast) {
      showToast(language === 'ta'
        ? `📸 ${results.length} படங்கள் பதிவேற்றப்பட்டன! வகை: "${sareeDetected?.sareeName || 'சேலை'}", வண்ணங்கள் & இருப்பு அமைக்கப்பட்டது.`
        : `📸 Loaded ${results.length} pictures! Detected Saree: "${sareeDetected?.sareeName || 'Saree'}", colors auto-detected & default stock set to 1.`);
    }
  };

  const handlePickFromScreen = async (idx) => {
    if (typeof window !== 'undefined' && window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          const rgb = hexToRgb(hex);
          const match = matchClosestBoutiqueColor(rgb.r, rgb.g, rgb.b);
          setColorVariants(prev => prev.map((v, i) => i === idx ? {
            ...v,
            colorName: match.name,
            colorCode: hex,
            detectedFromPhoto: true
          } : v));
          if (showToast) showToast(`🎨 Sampled ${match.name} (${hex}) from photo!`);
        }
      } catch (err) {
        // User cancelled EyeDropper
      }
    } else {
      if (showToast) showToast('EyeDropper is supported in Chrome, Edge & Opera. You can pick from the color palette below.');
    }
  };

  const handleApplyStockToAll = (qty) => {
    const num = Math.max(0, parseInt(qty) ?? 1);
    setColorVariants(prev => prev.map(v => {
      const activeSizes = v.sizes || newProd.sizes || [];
      const updatedCounts = {};
      activeSizes.forEach(s => {
        updatedCounts[s] = Math.max(1, Math.floor(num / activeSizes.length) || 1);
      });
      return {
        ...v,
        stockQty: num,
        sizeCounts: updatedCounts
      };
    }));
    if (showToast) showToast(`Applied stock count (${num} pcs) to all ${colorVariants.length} items! 📦`);
  };

  const handleToggleVariantSize = (variantIdx, sizeName) => {
    setColorVariants(prev => prev.map((v, i) => {
      if (i !== variantIdx) return v;
      const currentSizes = v.sizes || [];
      const exists = currentSizes.includes(sizeName);
      const updatedSizes = exists ? currentSizes.filter(s => s !== sizeName) : [...currentSizes, sizeName];
      const safeSizes = updatedSizes.length > 0 ? updatedSizes : [sizeName];
      const updatedCounts = { ...(v.sizeCounts || {}) };
      if (!exists && !updatedCounts[sizeName]) {
        updatedCounts[sizeName] = 2;
      }
      return {
        ...v,
        sizes: safeSizes,
        sizeCounts: updatedCounts
      };
    }));
  };

  const handleUpdateVariantSizeCount = (variantIdx, sizeName, count) => {
    const val = Math.max(0, parseInt(count) || 0);
    setColorVariants(prev => prev.map((v, i) => {
      if (i !== variantIdx) return v;
      const updatedCounts = { ...(v.sizeCounts || {}), [sizeName]: val };
      const totalStock = Object.values(updatedCounts).reduce((sum, n) => sum + Number(n || 0), 0);
      return {
        ...v,
        sizeCounts: updatedCounts,
        stockQty: totalStock > 0 ? totalStock : v.stockQty
      };
    }));
  };

  // Smart Category Switcher: Auto-populates code, name, fabric, length, care, description & sizes
  const handleCategoryChange = (cat) => {
    const defaults = getCategoryDefaults(cat);
    setNewProd(prev => ({
      ...prev,
      category: cat,
      code: defaults.code,
      name: defaults.name,
      fabric: defaults.fabric,
      length: defaults.length,
      care: defaults.care,
      description: defaults.description,
      sizes: defaults.sizes
    }));
    setColorVariants(prev => prev.map((v, i) => ({
      ...v,
      code: `${defaults.code}-${String(i + 1).padStart(2, '0')}`,
      sizes: defaults.sizes
    })));
  };

  const handleRegenerateAutoFill = () => {
    const defaults = getCategoryDefaults(newProd.category);
    setNewProd(prev => ({
      ...prev,
      code: defaults.code,
      name: defaults.name,
      fabric: defaults.fabric,
      length: defaults.length,
      care: defaults.care,
      description: defaults.description,
      sizes: defaults.sizes
    }));
    setColorVariants(prev => prev.map((v, i) => ({
      ...v,
      code: `${defaults.code}-${String(i + 1).padStart(2, '0')}`,
      sizes: defaults.sizes
    })));
    if (showToast) showToast(`✨ Auto-fill presets refreshed for ${CATEGORY_TEMPLATES[newProd.category]?.name || 'category'}!`);
  };

  const addColorVariant = () => {
    const nextIdx = colorVariants.length + 1;
    const base = newProd.code ? newProd.code.trim().toUpperCase() : generateProductCode(newProd.category);
    const currentTpl = CATEGORY_TEMPLATES[newProd.category] || CATEGORY_TEMPLATES['sarees'];
    const colorPreset = POPULAR_COLORS[(nextIdx - 1) % POPULAR_COLORS.length];
    setColorVariants(prev => [
      ...prev,
      {
        id: Date.now(),
        code: `${base}-${String(nextIdx).padStart(2, '0')}`,
        colorName: colorPreset?.name || '',
        colorCode: colorPreset?.code || '#DFBA6D',
        image: '',
        stockQty: Number(bulkStockApplyValue) || 1,
        sizes: newProd.sizes && newProd.sizes.length > 0 ? [...newProd.sizes] : [...currentTpl.defaultSizes]
      }
    ]);
  };

  const removeColorVariant = (idx) => {
    if (colorVariants.length <= 1) {
      if (showToast) showToast('At least one color variant is required.');
      return;
    }
    setColorVariants(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleSize = (sz) => {
    setNewProd(prev => {
      const exists = prev.sizes.includes(sz);
      const updated = exists ? prev.sizes.filter(s => s !== sz) : [...prev.sizes, sz];
      return { ...prev, sizes: updated.length > 0 ? updated : [sz] };
    });
  };

  const handleAddCustomSize = (e) => {
    e?.preventDefault();
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    setNewProd(prev => {
      if (prev.sizes.includes(trimmed)) return prev;
      return { ...prev, sizes: [...prev.sizes, trimmed] };
    });
    setCustomSizeInput('');
  };

  const getProductCodePreview = (cat) => {
    return generateProductCode(cat);
  };

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const data = await api.getCustomers();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (e) {
      console.warn('Failed to load customers in admin:', e);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Calculate Metrics
  const totalOrders = orders.length;
  const whatsappOrders = orders.filter(o => o.channel === 'whatsapp');
  const directOrders = orders.filter(o => o.channel === 'direct' || o.channel === 'direct_shop' || o.channel === 'manual');
  const siteOrders = orders.filter(o => o.channel === 'site' || (!o.channel && !o.channel?.includes('direct') && o.channel !== 'whatsapp'));
  const pendingOrders = orders.filter(o => o.status?.includes('Pending'));
  const soldOrders = orders.filter(o => o.is_stock_deducted === true || ['Payment Confirmed', 'Dispatched', 'Delivered'].includes(o.status));
  // Gross Revenue only counts orders confirmed as SOLD
  const grossRevenue = orders
    .filter(o => o.is_stock_deducted === true && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.pricing?.grandTotal || o.pricing?.subtotal || 0)), 0);

  // Sold Out items count & total shopper view count
  const soldOutProductsCount = products.filter(p => {
    if (p.isSoldOut || p.is_sold_out) return true;
    if (p.variants && p.variants.length > 0) {
      return p.variants.every(v => (v.stockQty ?? v.stock_qty ?? 0) <= 0);
    }
    return (p.stockQty ?? p.stock_qty ?? p.stock ?? 0) <= 0;
  }).length;
  const totalCatalogViews = products.reduce((acc, p) => acc + Number(p.viewsCount || p.views_count || p.views || 0), 0);

  // Filtered Orders for the Table (supports search by Product Code, Customer, and Sold Products filter)
  const filteredOrders = orders.filter(order => {
    // Channel filter
    if (orderChannelFilter === 'whatsapp' && order.channel !== 'whatsapp') return false;
    if (orderChannelFilter === 'site' && (order.channel !== 'site' && (order.channel?.includes('direct') || order.channel === 'whatsapp'))) return false;
    if (orderChannelFilter === 'direct' && !(order.channel === 'direct' || order.channel === 'direct_shop' || order.channel === 'manual')) return false;
    if (orderChannelFilter === 'pending' && !order.status?.includes('Pending')) return false;
    if (orderChannelFilter === 'sold' && !(order.is_stock_deducted === true || ['Payment Confirmed', 'Dispatched', 'Delivered'].includes(order.status))) return false;

    // Search query filter: by Product Code, Product Name, Order ID, Customer Name, Mobile
    if (orderSearchTerm.trim()) {
      const q = orderSearchTerm.trim().toLowerCase().replace(/^#/, '');
      const matchesOrderId = order.orderId?.toLowerCase().includes(q);
      const matchesCustomer = order.customer?.fullName?.toLowerCase().includes(q) || order.customer?.mobile?.includes(q);
      const matchesItem = (order.items || []).some(item => {
        const itemCode = (item.product_code || item.code || item.productCode || item.id || '').toLowerCase();
        const itemName = (item.name || item.product_name || '').toLowerCase();
        const itemColor = (item.color || '').toLowerCase();
        return itemCode.includes(q) || itemName.includes(q) || itemColor.includes(q);
      });
      return matchesOrderId || matchesCustomer || matchesItem;
    }

    return true;
  });

  const handleEnterStoreDemo = () => {
    window.location.hash = '#view-store-demo';
    if (setIsAdminDemoMode) setIsAdminDemoMode(true);
    setCurrentView('demo');
    if (showToast) showToast(language === 'ta' ? 'கடை டெமோ பார்வைக்கு மாற்றப்பட்டது (மாற்று/நீக்கு இயக்கத்தில் உள்ளது) 🛍️' : 'Switched to Store Demo (Modify & Delete Active) 🛍️');
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name.trim() || !newProd.basePrice) {
      if (showToast) showToast('Please enter Product Name and Price.');
      return;
    }

    let finalVariants = [];
    let mainImage = newProd.image;

    if (productMode === 'variants') {
      const activeVariants = colorVariants.filter(v => v.image || v.colorName.trim());
      if (activeVariants.length === 0) {
        if (showToast) showToast('Please add at least one picture or color variant.');
        return;
      }

      setIsPublishing(true);
      setPublishProgress({ current: 0, total: activeVariants.length, isPublishing: true });

      try {
        if (bulkPublishMode === 'separate_products' && activeVariants.length > 1) {
          // Publish each uploaded picture as an individual standalone product in catalog
          for (let i = 0; i < activeVariants.length; i++) {
            const v = activeVariants[i];
            setPublishProgress({ current: i + 1, total: activeVariants.length, isPublishing: true });

            const baseSku = newProd.code ? newProd.code.trim().toUpperCase() : generateProductCode(newProd.category);
            const itemCode = v.code ? v.code.trim().toUpperCase() : `${baseSku}-${String(i + 1).padStart(2, '0')}`;
            const itemName = `${newProd.name} - ${v.colorName || `Item #${i + 1}`}`;

            const payload = {
              code: itemCode,
              name: itemName,
              category: newProd.category,
              basePrice: Number(newProd.basePrice),
              originalPrice: newProd.originalPrice ? Number(newProd.originalPrice) : null,
              discount: newProd.originalPrice ? `${Math.round(((newProd.originalPrice - newProd.basePrice) / newProd.originalPrice) * 100)}% OFF` : null,
              tag: newProd.tag,
              isSpecialEvent: Boolean(newProd.isSpecialEvent),
              eventName: newProd.isSpecialEvent ? newProd.eventName : '',
              eventEndTime: newProd.isSpecialEvent ? newProd.eventEndTime : null,
              eventBadge: newProd.isSpecialEvent ? newProd.eventBadge : '',
              description: newProd.description || 'Handcrafted boutique collection from Thalir Boutique.',
              fabric: newProd.fabric,
              length: newProd.length,
              care: newProd.care,
              defaultColor: v.colorName || 'Standard',
              image: v.image || newProd.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
              sizes: v.sizes && v.sizes.length > 0 ? v.sizes : newProd.sizes,
              variants: [{
                code: itemCode,
                colorName: v.colorName || 'Standard',
                colorCode: v.colorCode || '#0D5C3A',
                image: v.image || newProd.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
                stockQty: Number(v.stockQty) || 1,
                inStock: Number(v.stockQty) > 0
              }]
            };

            await addNewProduct(payload);
          }
          if (showToast) showToast(`Successfully published all ${activeVariants.length} products to store catalog! 🎉`);
        } else {
          // Publish as 1 master product with multiple color options / variant swatches
          const base = newProd.code ? newProd.code.trim().toUpperCase() : generateProductCode(newProd.category);
          const finalVariants = activeVariants.map((v, idx) => {
            const vImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
            return {
              code: v.code ? v.code.trim().toUpperCase() : `${base}-${String(idx + 1).padStart(2, '0')}`,
              colorName: v.colorName.trim() || `Color #${idx + 1}`,
              colorCode: v.colorCode || '#0D5C3A',
              image: vImages[0] || v.image || newProd.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
              images: vImages.length > 0 ? vImages : [v.image || newProd.image],
              stockQty: Number(v.stockQty) || 1,
              inStock: Number(v.stockQty) > 0
            };
          });

          const allProdImages = (newProd.images && newProd.images.length > 0)
            ? newProd.images
            : finalVariants.flatMap(v => v.images || []);

          const payload = {
            code: base,
            name: newProd.name.trim(),
            category: newProd.category,
            basePrice: Number(newProd.basePrice),
            originalPrice: newProd.originalPrice ? Number(newProd.originalPrice) : null,
            discount: newProd.originalPrice ? `${Math.round(((newProd.originalPrice - newProd.basePrice) / newProd.originalPrice) * 100)}% OFF` : null,
            tag: newProd.tag,
            isSpecialEvent: Boolean(newProd.isSpecialEvent),
            eventName: newProd.isSpecialEvent ? newProd.eventName : '',
            eventEndTime: newProd.isSpecialEvent ? newProd.eventEndTime : null,
            eventBadge: newProd.isSpecialEvent ? newProd.eventBadge : '',
            description: newProd.description || 'Handcrafted boutique collection from Thalir Boutique.',
            fabric: newProd.fabric,
            length: newProd.length,
            care: newProd.care,
            defaultColor: finalVariants[0]?.colorName || 'Standard',
            image: finalVariants[0]?.image || newProd.image,
            images: allProdImages.length > 0 ? allProdImages : [finalVariants[0]?.image || newProd.image],
            sizes: newProd.sizes,
            variants: finalVariants
          };

          await addNewProduct(payload);
          if (showToast) showToast(`Product "${newProd.name}" published with ${finalVariants.length} color variants! 🎉`);
        }

        // Reset form to fresh defaults for the category
        const resetCat = newProd.category || 'sarees';
        const resetDefaults = getCategoryDefaults(resetCat);
        setNewProd({
          code: resetDefaults.code,
          name: resetDefaults.name,
          category: resetCat,
          basePrice: '',
          originalPrice: '',
          tag: 'New Arrival',
          fabric: resetDefaults.fabric,
          length: resetDefaults.length,
          care: resetDefaults.care,
          description: resetDefaults.description,
          defaultColor: 'Emerald Green',
          image: '',
          images: [],
          sizes: resetDefaults.sizes,
          isSpecialEvent: false,
          eventName: 'Diwali Dhamaka Sale',
          eventEndTime: null,
          eventBadge: 'Diwali Special'
        });
        setColorVariants([
          {
            id: Date.now(),
            code: `${resetDefaults.code}-01`,
            colorName: 'Emerald Green',
            colorCode: '#0D5C3A',
            image: '',
            images: [],
            stockQty: 1,
            sizes: resetDefaults.sizes
          }
        ]);
        setActiveTab('orders');
      } catch (err) {
        if (showToast) showToast(`Failed to create product: ${err.message}`);
      } finally {
        setIsPublishing(false);
        setPublishProgress({ current: 0, total: 0, isPublishing: false });
      }
    } else {
      // Simple single product mode
      const allSimpleImages = Array.isArray(newProd.images) && newProd.images.length > 0
        ? newProd.images
        : (newProd.image ? [newProd.image] : (mainImage ? [mainImage] : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c']));

      finalVariants = [{
        code: newProd.code ? newProd.code.trim().toUpperCase() : generateProductCode(newProd.category),
        colorName: newProd.defaultColor || 'Standard',
        colorCode: '#0D5C3A',
        image: allSimpleImages[0],
        images: allSimpleImages,
        stockQty: 1,
        inStock: true
      }];

      const payload = {
        code: newProd.code ? newProd.code.trim().toUpperCase() : generateProductCode(newProd.category),
        name: newProd.name.trim(),
        category: newProd.category,
        basePrice: Number(newProd.basePrice),
        originalPrice: newProd.originalPrice ? Number(newProd.originalPrice) : null,
        discount: newProd.originalPrice ? `${Math.round(((newProd.originalPrice - newProd.basePrice) / newProd.originalPrice) * 100)}% OFF` : null,
        tag: newProd.tag,
        isSpecialEvent: Boolean(newProd.isSpecialEvent),
        eventName: newProd.isSpecialEvent ? newProd.eventName : '',
        eventEndTime: newProd.isSpecialEvent ? newProd.eventEndTime : null,
        eventBadge: newProd.isSpecialEvent ? newProd.eventBadge : '',
        description: newProd.description || 'Handcrafted boutique collection from Thalir Boutique.',
        fabric: newProd.fabric,
        length: newProd.length,
        care: newProd.care,
        defaultColor: finalVariants[0]?.colorName || 'Standard',
        image: allSimpleImages[0],
        images: allSimpleImages,
        sizes: newProd.sizes,
        variants: finalVariants
      };

      setIsPublishing(true);
      try {
        await addNewProduct(payload);
        const resetCat = newProd.category || 'sarees';
        const resetDefaults = getCategoryDefaults(resetCat);
        setNewProd({
          code: resetDefaults.code,
          name: resetDefaults.name,
          category: resetCat,
          basePrice: '',
          originalPrice: '',
          tag: 'New Arrival',
          fabric: resetDefaults.fabric,
          length: resetDefaults.length,
          care: resetDefaults.care,
          description: resetDefaults.description,
          defaultColor: 'Emerald Green',
          image: '',
          images: [],
          sizes: resetDefaults.sizes,
          isSpecialEvent: false,
          eventName: 'Diwali Dhamaka Sale',
          eventEndTime: null,
          eventBadge: 'Diwali Special'
        });
        setActiveTab('orders');
      } catch (err) {
        if (showToast) showToast(`Failed to create product: ${err.message}`);
      } finally {
        setIsPublishing(false);
      }
    }
  };

  const promptDeleteCustomer = (cust) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Delete Customer Account',
      itemName: cust.name,
      itemDetails: `Mobile: ${cust.phone ? `+91 ${cust.phone}` : 'Google Auth'} • Account ID: ${cust.user_id}`,
      itemImage: cust.avatar || null,
      warningText: `Are you sure you want to delete customer account "${cust.name}"? They will no longer be able to log in.`,
      confirmBtnText: 'Yes, Delete Account',
      onConfirm: async () => {
        try {
          await api.deleteCustomer(cust.user_id);
          setCustomers(prev => prev.filter(c => c.user_id !== cust.user_id));
          if (showToast) showToast(`Customer account "${cust.name}" deleted successfully.`);
        } catch (err) {
          if (showToast) showToast(`Failed to delete customer: ${err.message}`);
        }
      }
    });
  };

  const promptDeleteOrder = (order) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Delete Order Record',
      itemName: `Order #${order.orderId}`,
      itemDetails: `Customer: ${order.customer?.fullName || 'Customer'} • Total: ₹${order.pricing?.grandTotal || order.pricing?.subtotal}`,
      itemImage: order.items?.[0]?.image || null,
      warningText: `Are you sure you want to delete order #${order.orderId}? This record will be permanently deleted from database.`,
      confirmBtnText: 'Yes, Delete Order',
      onConfirm: async () => {
        await deleteOrder(order.orderId);
        if (showToast) showToast(`Order #${order.orderId} deleted.`);
      }
    });
  };

  const handleRoleChange = async (userId, newRole, customerName) => {
    try {
      await api.updateCustomerRole(userId, newRole);
      setCustomers(prev => prev.map(c => c.user_id === userId ? { ...c, role: newRole } : c));
      if (showToast) {
        showToast(`Role updated to "${newRole}" for ${customerName} ✨`);
      }
    } catch (err) {
      if (showToast) showToast(`Failed to update user role: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-900 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#073822] text-white p-6 flex flex-col justify-between border-r-2 border-gold/40 shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gold/30">
            <img src={logoImg} alt="Admin Logo" className="w-11 h-11 rounded-full border-2 border-gold object-cover" />
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight">
                {language === 'ta' ? 'தளிர் நிர்வாகம்' : 'Thalir Admin'}
              </h2>
              <span className="text-[11px] text-gold-shimmer">
                {language === 'ta' ? 'கடை மேலாண்மை பலகை' : 'Store Management'}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'orders' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>{language === 'ta' ? 'நேரலை ஆர்டர்கள்' : 'Live Orders'}</span>
              </span>
              <span className="bg-gold/30 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'ledger' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <IndianRupee className="w-4 h-4" />
                <span>{language === 'ta' ? 'கணக்கு & தினசரி புத்தகம்' : 'Accounts & Daybook'}</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'inventory' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4" />
                <span>{language === 'ta' ? 'சரக்கு & இருப்பு மேலாண்மை' : 'Stock & Inventory'}</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('suppliers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'suppliers' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Building className="w-4 h-4" />
                <span>{language === 'ta' ? 'சப்ளையர் & கொள்முதல்' : 'Suppliers & Purchases'}</span>
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('customers');
                fetchCustomers();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'customers' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>{language === 'ta' ? 'வாடிக்கையாளர்கள் & CRM' : 'Customers & CRM'}</span>
              </span>
              <span className="bg-gold/30 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
                {customers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('broadcast');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'broadcast' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ta' ? 'செய்தி அனுப்புதல் (SMS/WA)' : 'Broadcast (SMS / WA)'}</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                📢
              </span>
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'offers' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>{language === 'ta' ? 'சலுகைகள் & தள்ளுபடிகள்' : 'Offers & Discounts'}</span>
            </button>

            <button
              onClick={() => setActiveTab('returns')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'returns' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'ta' ? 'திரும்பப் பெறப்பட்டவை' : 'Returns & Damaged Goods'}</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'reports' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{language === 'ta' ? 'அறிக்கைகள் & பகுப்பாய்வு' : 'Reports & Analytics'}</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'products' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'ta' ? 'தயாரிப்பு சேர்த்தல்' : 'Add Products'}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'bg-gold/20 text-gold-shimmer font-bold' : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{language === 'ta' ? 'கடை அமைப்புகள்' : 'Store Settings'}</span>
            </button>
          </nav>
        </div>

        {/* Logout */}
        <div className="pt-6 border-t border-gold/20">
          {onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="w-full bg-white/10 hover:bg-red-600/80 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {language === 'ta' ? 'பாதுகாப்பான வெளியேற்றம்' : 'Secure Logout'}
            </button>
          )}
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
              {language === 'ta' ? 'கடை கட்டுப்பாட்டு மையம்' : 'Store Control Center'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              {language === 'ta'
                ? 'இணையதளம் & வாட்ஸ்அப் ஆர்டர்கள், வாடிக்கையாளர் கணக்குகள் மற்றும் தயாரிப்புகளை நிர்வகிக்கவும்.'
                : 'Manage incoming website & WhatsApp orders, registered customer accounts, and catalog products.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Language Switcher Pill */}
            <button
              type="button"
              onClick={() => changeLanguage(language === 'ta' ? 'en' : 'ta')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                language === 'ta'
                  ? 'bg-[#073822] text-white border-gold/60 shadow-xs'
                  : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-300 hover:border-gold'
              }`}
              title={language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
            >
              <Globe className={`w-3.5 h-3.5 ${language === 'ta' ? 'text-gold' : 'text-gold-dark'}`} />
              <span>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
            </button>

            <button
              onClick={() => {
                const next = !isSoundEnabled;
                setIsSoundEnabled(next);
                if (next) playOrderChime();
                if (showToast) showToast(next ? (language === 'ta' ? 'ஆர்டர் ஒலி இயக்கப்பட்டது 🔔' : 'Order Chime Enabled 🔔') : (language === 'ta' ? 'ஆர்டர் ஒலி அணைக்கப்பட்டது 🔇' : 'Order Chime Muted 🔇'));
              }}
              className={`text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer border ${
                isSoundEnabled 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                  : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'
              }`}
              title="Real-Time Order Audio Chime Alert"
            >
              {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
              <span>{isSoundEnabled ? (language === 'ta' ? 'ஒலி இயக்கம்' : 'Chime ON') : (language === 'ta' ? 'ஒலி அணைப்பு' : 'Muted')}</span>
            </button>

            <button
              onClick={handleEnterStoreDemo}
              className="bg-primary text-white hover:bg-primary-dark text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-gold-shimmer" />
              <span>{language === 'ta' ? 'கடையை பார்வையிட' : 'View Store Demo'}</span>
            </button>

            <button
              onClick={fetchCustomers}
              className="bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Refresh Customer & Order Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'புதுப்பி' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* 7 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-pale text-primary flex items-center justify-center font-bold shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 font-medium">
                {language === 'ta' ? 'மொத்த ஆர்டர்கள்' : 'Total Orders'}
              </span>
              <div className="text-lg font-bold text-stone-900">{totalOrders}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold shrink-0">
              <MessageCircle className="w-5 h-5 fill-green-600 text-green-600" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 font-medium">
                {language === 'ta' ? 'வாட்ஸ்அப்' : 'WhatsApp'}
              </span>
              <div className="text-lg font-bold text-green-700">{whatsappOrders.length}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 font-medium">
                {language === 'ta' ? 'வலைத்தளம்' : 'Website'}
              </span>
              <div className="text-lg font-bold text-blue-700">{siteOrders.length}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 font-medium">
                {language === 'ta' ? 'வாடிக்கையாளர்கள்' : 'Customers'}
              </span>
              <div className="text-lg font-bold text-stone-900">{customers.length}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <Boxes className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 font-medium">
                {language === 'ta' ? 'விற்றுத் தீர்ந்தவை' : 'Sold Out Items'}
              </span>
              <div className="text-lg font-bold text-rose-700">{soldOutProductsCount}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Eye className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 font-medium">
                {language === 'ta' ? 'பார்வையிட்டவர்கள்' : 'Product Views'}
              </span>
              <div className="text-lg font-bold text-amber-800">{totalCatalogViews.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 font-medium">
                {language === 'ta' ? 'மொத்த வருவாய்' : 'Gross Revenue'}
              </span>
              <div className="text-lg font-bold text-stone-900">₹{grossRevenue.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Tab 1: Orders Table with Channel Filters */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-stone-50">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-gold" />
                  <span>{language === 'ta' ? 'வாடிக்கையாளர் ஆர்டர்கள் & பரிவர்த்தனைகள்' : 'Customer Orders & Transactions'} ({filteredOrders.length})</span>
                </h3>
                <button
                  onClick={() => setIsManualOrderOpen(true)}
                  className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Create In-Store Walk-In Sale or Phone Order"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-gold" />
                  <span>{language === 'ta' ? '+ நேரடி விற்பனை / புதிய ஆர்டர்' : '+ In-Store Sale / Manual Order'}</span>
                </button>
                <button
                  type="button"
                  onClick={exportOrdersToCsv}
                  className="bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-stone-300 shadow-2xs cursor-pointer"
                  title="Download all customer orders as CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>{language === 'ta' ? 'ஆர்டர்கள் CSV ஏற்றுமதி' : 'Export Orders CSV'}</span>
                </button>
              </div>

              {/* Channel Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
                <button
                  onClick={() => setOrderChannelFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    orderChannelFilter === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {language === 'ta' ? 'அனைத்தும்' : 'All'} ({orders.length})
                </button>
                <button
                  onClick={() => setOrderChannelFilter('whatsapp')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    orderChannelFilter === 'whatsapp'
                      ? 'bg-green-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-green-700'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" /> WhatsApp ({whatsappOrders.length})
                </button>
                <button
                  onClick={() => setOrderChannelFilter('direct')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    orderChannelFilter === 'direct'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-amber-800'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> {language === 'ta' ? 'நேரடி விற்பனை' : 'In-Store Direct'} ({directOrders.length})
                </button>
                <button
                  onClick={() => setOrderChannelFilter('site')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    orderChannelFilter === 'site'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-blue-700'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> {language === 'ta' ? 'வலைத்தளம்' : 'Website'} ({siteOrders.length})
                </button>
                <button
                  onClick={() => setOrderChannelFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    orderChannelFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-amber-700'
                  }`}
                >
                  <Hourglass className="w-3.5 h-3.5" /> {language === 'ta' ? 'நிலுவையில்' : 'Pending'} ({pendingOrders.length})
                </button>
                <button
                  onClick={() => setOrderChannelFilter('sold')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    orderChannelFilter === 'sold'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-emerald-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {language === 'ta' ? 'விற்பனையானவை' : 'Sold Products'} ({soldOrders.length})
                </button>
              </div>
            </div>

            {/* Search Orders & Sold Products by Product Code / Customer */}
            <div className="p-3.5 bg-white border-b border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full max-w-xl">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  placeholder={language === 'ta' ? 'தயாரிப்பு குறியீடு (எ.கா. TB-SAR-8303), பெயர், வாடிக்கையாளர் மூலம் தேடவும்...' : 'Search orders & sold products by Product Code (e.g. TB-SAR-8303), Title, Customer...'}
                  className="w-full text-xs sm:text-sm pl-10 pr-9 py-2 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium"
                />
                {orderSearchTerm && (
                  <button
                    onClick={() => setOrderSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    title="Clear Search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                {orderSearchTerm ? (
                  <span className="font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    {filteredOrders.length} {language === 'ta' ? 'ஆர்டர்கள் பொருத்தமாக உள்ளன' : 'order(s) match'} "{orderSearchTerm}"
                  </span>
                ) : (
                  <span>{filteredOrders.length} {language === 'ta' ? 'ஆர்டர்கள் காட்டப்படுகின்றன' : 'order(s) showing'}</span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                    <th className="py-3 px-4">{language === 'ta' ? 'ஆர்டர் எண் & தேதி' : 'Order ID & Date'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'ஆர்டர் முறை' : 'Order Channel'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'வாடிக்கையாளர் விவரங்கள்' : 'Customer Details'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'பொருட்கள் & வகைகள்' : 'Items & Variants'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'செலுத்த வேண்டிய தொகை' : 'Payable'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'நிலை' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{language === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        No orders match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.orderId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <strong className="font-mono text-primary block">#{order.orderId}</strong>
                          <span className="text-[11px] text-stone-400">
                            {new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        {/* Order Channel Badge */}
                        <td className="py-3.5 px-4">
                          {order.channel === 'whatsapp' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-800 border border-green-300">
                              <MessageCircle className="w-3.5 h-3.5 fill-green-600 text-green-600" />
                              <span>WhatsApp</span>
                            </span>
                          ) : (order.channel === 'direct' || order.channel === 'direct_shop' || order.channel === 'manual') ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                              <Store className="w-3.5 h-3.5 text-amber-700" />
                              <span>In-Store Walk-In</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
                              <Globe className="w-3.5 h-3.5 text-blue-600" />
                              <span>Website</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <strong className="text-stone-900 block font-semibold">{order.customer?.fullName || 'Customer'}</strong>
                          <span className="text-xs text-stone-600 block">{order.customer?.mobile}</span>
                          {order.customer?.address && (
                            <span className="text-[11px] text-stone-400 line-clamp-1 block">
                              {order.customer?.address}{order.customer?.city ? `, ${order.customer?.city}` : ''}
                            </span>
                          )}
                          {order.customer?.distance_km && (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              📍 ~{order.customer.distance_km} km ({order.pricing?.deliveryFee ? `₹${order.pricing.deliveryFee}` : (order.customer.distance_km <= 100 ? '₹30' : order.customer.distance_km <= 500 ? '₹50' : '₹70')})
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            {order.items?.map((it, i) => (
                              <div key={i} className="text-xs text-stone-700">
                                {(it.product_code || it.code || it.productCode || it.id) && (
                                  <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1.5 border border-primary/20">
                                    #{it.product_code || it.code || it.productCode || it.id}
                                  </span>
                                )}
                                <span className="font-semibold text-stone-900">{it.name || it.product_name}</span>{' '}
                                <span className="text-stone-500">({it.color}{it.size ? `, ${it.size}` : ''}) × {it.qty}</span>
                                {it.customPrice && (
                                  <span className="ml-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    ₹{it.customPrice}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Payable & Payment Method */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-primary text-sm">
                            ₹{(order.pricing?.grandTotal || order.pricing?.subtotal || order.grand_total || 0).toLocaleString('en-IN')}
                          </div>

                          {/* Coupon Used Indicator Badge */}
                          {((order.coupon_code || order.pricing?.couponCode) || (order.discount_amount > 0 || order.pricing?.discountAmount > 0)) && (
                            <div className="mt-1 inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs" title={`Coupon: ${order.coupon_code || order.pricing?.couponCode}`}>
                              <span>🎟️ {order.coupon_code || order.pricing?.couponCode || 'Coupon'}</span>
                              {(order.discount_amount > 0 || order.pricing?.discountAmount > 0) && (
                                <span className="text-emerald-700">(-₹{order.discount_amount || order.pricing?.discountAmount})</span>
                              )}
                            </div>
                          )}
                          
                          {/* Payment Proof Badge / Screenshot Trigger (For orders with proof image or proof attachment) */}
                          {(order.paymentProofImage || 
                            order.payment_proof_image || 
                            (order.paymentProof && order.paymentProof !== 'Not attached') ||
                            (order.channel === 'site' && order.status === 'Pending Verification')) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForVerification(order);
                                setIsVerificationOpen(true);
                              }}
                              className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                              title="Click to view full payment screenshot & verify"
                            >
                              <Eye className="w-3 h-3 text-purple-600" />
                              <span>{language === 'ta' ? '📸 ஆதாரம் பார்' : '📸 View Proof'}</span>
                            </button>
                          ) : (order.paymentUtr || order.payment_utr) ? (
                            <span className="mt-0.5 block text-[10px] font-mono text-stone-600 truncate max-w-[110px]" title={`UTR: ${order.paymentUtr || order.payment_utr}`}>
                              UTR: {order.paymentUtr || order.payment_utr}
                            </span>
                          ) : (order.channel === 'direct' || order.channel === 'direct_shop' || order.orderId?.startsWith('TB-DIR') || order.orderId?.startsWith('TB-MAN')) ? (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {order.paymentMethod || (language === 'ta' ? '💵 நேரடி ரொக்கம்' : '💵 Cash on Counter')}
                            </span>
                          ) : (order.channel === 'whatsapp' || order.orderId?.startsWith('TB-WA')) ? (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-green-800 font-semibold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                              {order.paymentMethod || '💬 WhatsApp Deal'}
                            </span>
                          ) : (
                            <span className="mt-0.5 block text-[10px] text-stone-500">
                              {order.paymentMethod || 'Website UPI'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <select
                              value={order.status || 'Payment Confirmed'}
                              onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer w-full transition-all ${
                                (order.status === 'Pending Verification')
                                  ? 'bg-amber-50/80 text-amber-900 border-amber-300 font-bold'
                                  : (order.status === 'Payment Confirmed' || !order.status)
                                  ? 'bg-green-50 text-green-900 border-green-300'
                                  : 'bg-white text-stone-800 border-stone-200'
                              }`}
                            >
                              <option value="Payment Confirmed">{language === 'ta' ? '✅ கட்டணம் உறுதி செய்யப்பட்டது' : '✅ Payment Confirmed'}</option>
                              <option value="Pending Verification">{language === 'ta' ? '⏳ சரிபார்ப்பு நிலுவையில்' : '⏳ Pending Verification'}</option>
                              <option value="Dispatched">{language === 'ta' ? '🚚 கூரியரில் அனுப்பப்பட்டது' : '🚚 Dispatched'}</option>
                              <option value="Delivered">{language === 'ta' ? '🛍️ டெலிவரி செய்யப்பட்டது' : '🛍️ Delivered'}</option>
                              <option value="Cancelled">{language === 'ta' ? '❌ ரத்து செய்யப்பட்டது' : '❌ Cancelled'}</option>
                            </select>

                            {/* Stock Deduction Status Dropdown */}
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                                {language === 'ta' ? 'சரக்கு இருப்பு நிலை' : 'Stock Status'}
                              </label>
                              <select
                                value={order.is_stock_deducted ? 'sold' : 'pending'}
                                onChange={(e) => toggleOrderStock(order.orderId, e.target.value === 'sold' ? 'deduct' : 'restore')}
                                className={`text-xs font-bold px-2 py-1.5 rounded-lg border outline-none cursor-pointer w-full transition-all ${
                                  order.is_stock_deducted
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold'
                                    : 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                                }`}
                                title={order.is_stock_deducted ? 'Stock is marked as SOLD (Inventory deducted & Daybook credited).' : 'Stock is NOT sold / pending (Inventory retained).'}
                              >
                                <option value="sold">{language === 'ta' ? '✓ சரக்கு விற்கப்பட்டது' : '✓ Stock Sold'}</option>
                                <option value="pending">{language === 'ta' ? '⏳ விற்கப்படவில்லை / நிலுவையில்' : '⏳ Not Sold / Pending'}</option>
                              </select>
                            </div>

                            {/* 1-Click Verification Trigger ONLY for unverified website orders with proof */}
                            {(order.status === 'Pending Verification' && (order.channel === 'site' || !order.channel || order.paymentProofImage)) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderForVerification(order);
                                  setIsVerificationOpen(true);
                                }}
                                className="w-full py-1 px-2 rounded-lg bg-[#073822] hover:bg-[#0a4d2f] text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                <ShieldCheck className="w-3 h-3 text-gold" />
                                <span>{language === 'ta' ? 'ஆதாரம் சரிபார்' : 'Verify Proof'}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Verify Payment Proof Modal Button (Only if website order or proof attached) */}
                            {(order.channel === 'site' || order.paymentProofImage || order.payment_proof_image) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderForVerification(order);
                                  setIsVerificationOpen(true);
                                }}
                                className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg transition-colors cursor-pointer"
                                title="Review Payment Screenshot & Confirm"
                              >
                                <ShieldCheck className="w-4 h-4 text-purple-700" />
                              </button>
                            )}

                            {/* Edit Order Details (Add Extra Products, Address, Custom Prices, Items) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForEdit(order);
                                setIsOrderEditOpen(true);
                              }}
                              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
                              title="Add Products, Edit Order Details, Address & Custom Prices"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* 1-Click PDF Tax Invoice & Courier Shipping Label */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForInvoice(order);
                                setIsInvoiceOpen(true);
                              }}
                              className="p-1.5 bg-stone-100 hover:bg-gold/25 text-[#073822] rounded-lg transition-colors cursor-pointer"
                              title="Print GST Tax Invoice & Courier Shipping Label"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => promptDeleteOrder(order)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete order"
                            >
                              <Trash2 className="w-4 h-4" />
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
        )}

        {/* Tab 2: Customer Accounts Table */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-stone-200 flex flex-wrap justify-between items-center gap-3 bg-stone-50">
              <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-gold" />
                <span>{language === 'ta' ? 'பதிவுசெய்த வாடிக்கையாளர் கணக்குகள்' : 'Registered Customer Accounts'} ({customers.length})</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('broadcast')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'அனைவருக்கும் செய்தி அனுப்பு (SMS / WA)' : 'Send Message to All (SMS & WA)'}</span>
                </button>
                <button
                  onClick={fetchCustomers}
                  className="text-xs bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomers ? 'animate-spin' : ''}`} />
                  <span>{language === 'ta' ? 'புதுப்பி' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                    <th className="py-3 px-4">{language === 'ta' ? 'வாடிக்கையாளர்' : 'Customer'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'பங்கு' : 'Role'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'மொபைல் எண்' : 'Mobile Number'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'உள்நுழைவு முறை' : 'Auth Provider'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'கணக்கு எண்' : 'Account ID'}</th>
                    <th className="py-3 px-4">{language === 'ta' ? 'பதிவு செய்த நாள்' : 'Registered On'}</th>
                    <th className="py-3 px-4 text-right">{language === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        {loadingCustomers 
                          ? (language === 'ta' ? 'வாடிக்கையாளர் கணக்குகள் பதிவேற்றப்படுகின்றன...' : 'Loading registered customers from database...') 
                          : (language === 'ta' ? 'வாடிக்கையாளர் கணக்குகள் எதுவும் கிடைக்கவில்லை.' : 'No registered customers found in database yet.')
                        }
                      </td>
                    </tr>
                  ) : (
                    customers.map(cust => (
                      <tr key={cust.user_id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={cust.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${cust.name}&backgroundColor=0D5C3A`}
                            alt={cust.name}
                            className="w-9 h-9 rounded-full border border-gold object-cover bg-stone-100"
                          />
                          <div>
                            <strong className="text-stone-900 block font-semibold">{cust.name}</strong>
                            {cust.email && <span className="text-[11px] text-stone-400 block">{cust.email}</span>}
                          </div>
                        </td>

                        {/* Role Selector */}
                        <td className="py-3.5 px-4">
                          <select
                            value={cust.role || 'Customer'}
                            onChange={(e) => handleRoleChange(cust.user_id, e.target.value, cust.name)}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer outline-none transition-colors ${
                              cust.role === 'Admin'
                                ? 'bg-amber-50 text-amber-900 border-amber-300 font-extrabold shadow-xs'
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <option value="Customer">{language === 'ta' ? '👤 வாடிக்கையாளர்' : '👤 Customer'}</option>
                            <option value="Admin">{language === 'ta' ? '👑 நிர்வாகி' : '👑 Admin'}</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-stone-800">
                          {cust.phone ? `+91 ${cust.phone}` : <span className="text-stone-400 italic">Google Auth</span>}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            cust.auth_provider === 'google' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {cust.auth_provider === 'google' ? 'Google OAuth' : 'Phone Auth'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                          {cust.user_id}
                        </td>

                        <td className="py-3.5 px-4 text-stone-500 text-xs">
                          {new Date(cust.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => promptDeleteCustomer(cust)}
                            className="text-stone-400 hover:text-red-600 p-1.5 transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Delete Customer Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2.5: Broadcast / Bulk Messaging (SMS & WhatsApp) */}
        {activeTab === 'broadcast' && (
          <BroadcastManager language={language} onNavigateTab={setActiveTab} />
        )}

        {/* Tab 3: Add Products Form */}
        {activeTab === 'products' && (() => {
          const currentCategoryTemplate = CATEGORY_TEMPLATES[newProd.category] || CATEGORY_TEMPLATES['sarees'];

          return (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm max-w-4xl space-y-6 animate-in fade-in">
              
              {/* Header with Auto Product ID Preview */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-stone-200">
                <div>
                  <h3 className="font-serif font-bold text-xl text-primary flex items-center gap-2">
                    <Plus className="w-5 h-5 text-gold" />
                    <span>{language === 'ta' ? 'புதிய தயாரிப்பை பட்டியலில் சேர்க்க' : 'Add New Item to Catalog'}</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'ta'
                      ? 'தானியங்கி பிரிவு வாரியான ஸ்மார்ட் அமைப்புகளுடன் விரைவாக தயாரிப்பை சேர்க்கவும்.'
                      : 'Streamlined quick product addition with automatic category smart-presets.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-semibold">SKU:</span>
                  <span className="font-mono bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-lg text-xs font-bold">
                    {newProd.code || generateProductCode(newProd.category)}
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateAutoFill}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Regenerate code & auto-fill templates"
                  >
                    <RotateCcw className="w-3 h-3" /> {language === 'ta' ? 'தானியங்கி நிரப்பல்' : 'Auto-Fill'}
                  </button>
                </div>
              </div>

              {/* Smart Auto-Fill Quick Add Banner */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 p-4 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                      <span>{language === 'ta' ? '⚡ ஸ்மார்ட் விரைவு சேர்ப்பு செயலில் உள்ளது' : '⚡ Smart Quick Add Active'}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        {currentCategoryTemplate.name}
                      </span>
                    </h4>
                    <p className="text-xs text-emerald-800">
                      {language === 'ta'
                        ? 'புகைப்படம், விலை & பிரிவை மட்டும் சேர்த்தால் போதும். தயாரிப்பு குறியீடு, தலைப்பு, துணி வகை, அளவுகள் தானாக நிரப்பப்படும்!'
                        : 'Just add Photo, Price & Category. Product code, title, fabric, cut lengths, care & category sizes are auto-filled instantly. Everything is editable!'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateAutoFill}
                  className="shrink-0 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Reset all fields to category defaults"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'ta' ? 'மீட்டமைக்க' : 'Reset Defaults'}</span>
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-2 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setProductMode('variants')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                    productMode === 'variants'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-transparent text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>{language === 'ta' ? 'ஒரே டிசைன், பல வண்ணங்கள் (சேலைகள் / பாவாடைகள்)' : 'Same Design, Multiple Colors (Sarees / Inskirts)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductMode('simple')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                    productMode === 'simple'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-transparent text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{language === 'ta' ? 'ஒற்றை / பிரத்யேக வடிவமைப்பு பொருள்' : 'Single / Unique Design Item'}</span>
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-6">
                
                {/* Step 1: Category & Pricing (Tag is automatically 'New Arrival') */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50/80 rounded-2xl border border-stone-200">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span>{language === 'ta' ? '1. பிரிவு' : '1. Category'}</span> <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newProd.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full text-sm font-bold px-4 py-2.5 rounded-xl border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-white shadow-2xs text-stone-900 cursor-pointer"
                    >
                      <option value="sarees">👘 {language === 'ta' ? 'சேலைகள் (Free Size • 6.3m)' : 'Sarees (Free Size • 6.3m)'}</option>
                      <option value="kurtis">👗 {language === 'ta' ? 'குர்தி & செட்கள் (XS முதல் 3XL)' : 'Kurtis & Sets (XS to 3XL)'}</option>
                      <option value="inskirts">🪡 {language === 'ta' ? 'உள்பாவாடைகள் (6-பகுதி முதல் 10-பகுதி)' : 'Inskirts (6-Part to 10-Part Panel Cuts)'}</option>
                      <option value="blouse-materials">✂️ {language === 'ta' ? 'பிளவுஸ் துணிகள் (மீட்டர் அளவு)' : 'Blouse Materials (Meter Measurements)'}</option>
                      <option value="linings">🧵 {language === 'ta' ? 'லைனிங் துணிகள் (மீட்டர் அளவு)' : 'Linings (Meter Measurements)'}</option>
                      <option value="chudi-material">✨ {language === 'ta' ? 'சுடிதார் துணிகள் (Free Size செட்)' : 'Chudi Materials (Free Size Set)'}</option>
                      <option value="night-wear">🌙 {language === 'ta' ? 'நைட்வேர் (XS முதல் 3XL)' : 'Night Wear & Loungewear (XS to 3XL)'}</option>
                    </select>
                    <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                      ✓ {language === 'ta' ? `${currentCategoryTemplate.name} பிரிவுக்கு ஏற்ப அளவுகள் அமைக்கப்பட்டுள்ளன` : `Sizes & specs auto-adapted to ${currentCategoryTemplate.name}`}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gold"></span>
                        <span>{language === 'ta' ? '2. அசல் விலை (₹)' : '2. Original Price (₹)'}</span> <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span>✨</span>
                        <span>{language === 'ta' ? 'தானாக புதிய வரவு (New Arrival)' : 'Auto New Arrival'}</span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        value={newProd.basePrice}
                        onChange={(e) => setNewProd({ ...newProd, basePrice: e.target.value })}
                        placeholder="e.g. 790"
                        className="w-full text-sm pl-8 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-bold text-primary bg-white shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Event / Festival Flash Sale Mention Section */}
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  newProd.isSpecialEvent
                    ? 'bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-red-50/90 border-amber-300 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-200/80">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm ${
                        newProd.isSpecialEvent ? 'bg-amber-500 text-white animate-bounce' : 'bg-stone-200 text-stone-500'
                      }`}>
                        🪔
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                          <span>{language === 'ta' ? 'பண்டிகை / சிறப்பு நிகழ்வு தயாரிப்பு (Festival Sale)' : 'Special Event / Festival Sale Product'}</span>
                          {newProd.isSpecialEvent && (
                            <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {language === 'ta' ? 'செயலில் உள்ளது' : 'Active'}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {language === 'ta'
                            ? 'இந்த தயாரிப்பை தீபாவளி, பொங்கல், புத்தாண்டு போன்ற சிறப்பு பண்டிகை விற்பனை பேனரில் பிரத்யேகமாக காட்சிப்படுத்தலாம்.'
                            : 'Highlight this product in the celebratory festival sale banner (Diwali, Pongal, New Year, Wedding Specials).'}
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(newProd.isSpecialEvent)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setNewProd(prev => ({
                            ...prev,
                            isSpecialEvent: checked,
                            eventName: prev.eventName || 'Diwali Dhamaka Sale',
                            eventBadge: prev.eventBadge || 'Diwali Special',
                            eventEndTime: null
                          }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 shadow-inner"></div>
                      <span className="ml-2.5 text-xs font-bold text-stone-800">
                        {newProd.isSpecialEvent ? (language === 'ta' ? 'ஆம், சிறப்பு தயாரிப்பு' : 'Special Event Item') : (language === 'ta' ? 'சாதாரண தயாரிப்பு' : 'Regular Item')}
                      </span>
                    </label>
                  </div>

                  {/* Expanded Event Configuration Controls */}
                  {newProd.isSpecialEvent && (
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                      
                      {/* Festival Name (Editable with Quick Presets) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🪔</span>
                            <span>{language === 'ta' ? 'சிறப்பு பண்டிகை / நிகழ்வு பெயர்' : 'Special Occasion / Event Name'}</span>
                          </label>
                          <span className="text-[11px] text-amber-800 font-normal">
                            {language === 'ta' ? 'விரும்பிய பெயரை நேரடியாக உள்ளிடலாம்' : 'Freely Editable'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={newProd.eventName || ''}
                          onChange={(e) => setNewProd(prev => ({ ...prev, eventName: e.target.value }))}
                          placeholder={language === 'ta' ? 'எ.கா. தீபாவளி சிறப்பு விற்பனை / பொங்கல் தள்ளுபடி' : 'e.g. Diwali Dhamaka Sale / Pongal Mega Offer'}
                          className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 outline-none focus:border-amber-500 shadow-2xs"
                        />
                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-bold text-stone-500 uppercase mr-0.5">
                            {language === 'ta' ? 'விரைவு தேர்வுகள்:' : 'Presets:'}
                          </span>
                          {[
                            { name: 'Diwali Dhamaka Sale', taName: 'தீபாவளி சிறப்பு விற்பனை', badge: 'Diwali Special', icon: '🪔' },
                            { name: 'Pongal Thiruvizha Sale', taName: 'பொங்கல் திருவிழா விற்பனை', badge: 'Pongal Offer', icon: '🌾' },
                            { name: 'Aadi Kondattam Sale', taName: 'ஆடி கொண்டாட்டம்', badge: 'Aadi Special', icon: '🌿' },
                            { name: 'Christmas Celebration Sale', taName: 'கிறிஸ்துமஸ் சிறப்பு விற்பனை', badge: 'Christmas Special', icon: '🎄' },
                            { name: 'Eid Mubarak Special', taName: 'ரமலான் & பெருநாள் சிறப்பு', badge: 'Eid Special', icon: '🌙' },
                            { name: 'New Year Mega Sale', taName: 'புத்தாண்டு மெகா விற்பனை', badge: 'New Year Special', icon: '✨' },
                            { name: 'Wedding Festive Edit', taName: 'திருமண பண்டிகை தொகுப்பு', badge: 'Wedding Edit', icon: '💍' },
                            { name: 'Weekend Mega Offer', taName: 'வார இறுதி மெகா சலுகை', badge: 'Weekend Deal', icon: '⚡' }
                          ].map(preset => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setNewProd(prev => ({
                                  ...prev,
                                  eventName: language === 'ta' ? preset.taName : preset.name,
                                  eventBadge: preset.badge
                                }));
                              }}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                (newProd.eventName === preset.name || newProd.eventName === preset.taName)
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : 'bg-white hover:bg-amber-50 border-stone-200 text-stone-700 hover:border-amber-300'
                              }`}
                            >
                              <span>{preset.icon}</span>
                              <span>{language === 'ta' ? preset.taName : preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Event Badge on Product Card */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🔥</span>
                            <span>{language === 'ta' ? 'தயாரிப்பு அட்டை முத்திரை (Card Badge)' : 'Product Card Festive Badge'}</span>
                          </label>
                          <span className="text-[11px] text-amber-800 font-normal">
                            {language === 'ta' ? 'சேலை அட்டையில் தெரியும்' : 'Shown on card'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={newProd.eventBadge || ''}
                          onChange={(e) => setNewProd(prev => ({ ...prev, eventBadge: e.target.value }))}
                          placeholder="e.g. DIWALI SPECIAL / PONGAL OFFER"
                          className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white outline-none focus:border-amber-500 shadow-2xs uppercase text-amber-900"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] text-stone-500">{language === 'ta' ? 'முன்னோட்டம்:' : 'Live Preview:'}</span>
                          <span className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1 border border-gold/40">
                            🔥 {newProd.eventBadge || 'FESTIVAL SPECIAL'}
                          </span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Step 2: Title & Code (Auto-populated & Fully Editable) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>{language === 'ta' ? 'தயாரிப்பு தலைப்பு / டிசைன் பெயர்' : 'Product Title / Design Name'}</span> <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-stone-400 font-normal">
                        {language === 'ta' ? 'தானாக நிரப்பப்பட்டது • மாற்றிக்கொள்ளலாம்' : 'Auto-filled • Fully Editable'}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={newProd.name}
                      onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                      placeholder="e.g. Handcrafted Pure Cotton Saree / 7-Part Panel Inskirt"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium"
                    />

                    {/* Quick Saree Type Selector Chips */}
                    {newProd.category === 'sarees' && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold text-stone-500 uppercase mr-0.5">
                          {language === 'ta' ? 'சேலை வகை தேர்வுகள்:' : 'Saree Types:'}
                        </span>
                        {SAREE_PRESETS.map((preset) => {
                          const isSelected = newProd.name === preset.name || newProd.name === preset.nameTa;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setNewProd(prev => ({
                                  ...prev,
                                  name: language === 'ta' ? preset.nameTa : preset.name,
                                  fabric: language === 'ta' ? preset.fabricTa : preset.fabric,
                                  description: preset.description,
                                  care: preset.care,
                                  length: preset.length || prev.length
                                }));
                              }}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-xs'
                                  : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700 hover:border-stone-400'
                              }`}
                            >
                              <span>{preset.icon}</span>
                              <span>{language === 'ta' ? preset.nameTa : preset.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        {language === 'ta' ? 'தயாரிப்பு குறியீடு (SKU)' : 'Product Code (SKU)'}
                      </label>
                      <span className="text-[11px] text-stone-400 font-normal">
                        {language === 'ta' ? 'தானாக உருவாக்கப்பட்டது' : 'Auto-generated'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={newProd.code}
                      onChange={(e) => setNewProd({ ...newProd, code: e.target.value.toUpperCase() })}
                      placeholder={`e.g. ${newProd.code}`}
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-mono font-bold uppercase text-primary"
                    />
                  </div>
                </div>

                {/* Step 3: Dynamic Category Size Selector */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>{language === 'ta' ? 'கிடைக்கும் அளவுகள் / வெட்டுகள்' : 'Available Sizes / Cuts'}</span> • {currentCategoryTemplate.sizeLabel}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {currentCategoryTemplate.sizeDescription}
                      </span>
                    </div>

                    {currentCategoryTemplate.sizeType !== 'free' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewProd({ ...newProd, sizes: [...currentCategoryTemplate.sizeOptions] })}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          {language === 'ta' ? 'அனைத்தும் தேர்வு' : 'Select All'}
                        </button>
                        <span className="text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={() => setNewProd({ ...newProd, sizes: [...currentCategoryTemplate.defaultSizes] })}
                          className="text-[11px] font-bold text-stone-500 hover:underline cursor-pointer"
                        >
                          {language === 'ta' ? 'இயல்பு அளவுகள்' : 'Default Cuts'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Saree & Chudi Material: Universal Free Size */}
                  {currentCategoryTemplate.sizeType === 'free' && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white border border-primary shadow-sm flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'ta' ? 'இலவச அளவு (Universal Free Size)' : 'Free Size (Universal)'}</span>
                      </span>
                      <span className="text-xs text-stone-400 italic">
                        {language === 'ta'
                          ? 'பாரம்பரிய சேலை / தையல் செய்யப்படாத பொருள் அனைத்து உடல் அளவுகளுக்கும் பொருந்தும்.'
                          : 'Traditional draping / unstitched material fits all standard measurements.'}
                      </span>
                    </div>
                  )}

                  {/* Inskirts: Stitched in Panels (6-Part to 10-Part cuts) */}
                  {currentCategoryTemplate.sizeType === 'panel' && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex flex-wrap gap-2">
                        {currentCategoryTemplate.sizeOptions.map((sz) => {
                          const isSelected = newProd.sizes?.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSize(sz)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-sm'
                                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <span>{sz}</span>
                            </button>
                          );
                        })}
                        {newProd.sizes?.filter(s => !currentCategoryTemplate.sizeOptions.includes(s)).map(sz => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleSize(sz)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border bg-primary text-white border-primary shadow-sm flex items-center gap-1.5"
                          >
                            <Check className="w-3 h-3" />
                            <span>{sz}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1 max-w-sm">
                        <input
                          type="text"
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          placeholder={language === 'ta' ? 'தனிப்பயன் பகுதி அளவைச் சேர்க்கவும் (எ.கா. 12-Part)...' : 'Add custom panel cut (e.g. 12-Part Cut)...'}
                          className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-white flex-1 outline-none focus:border-primary"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSize(e)}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          + {language === 'ta' ? 'அளவு சேர்' : 'Add Cut'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Kurtis & Nightwear: Standard Sizes XS to 3XL */}
                  {currentCategoryTemplate.sizeType === 'standard' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {currentCategoryTemplate.sizeOptions.map((sz) => {
                        const isSelected = newProd.sizes?.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleSize(sz)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{sz}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Linings & Blouse Materials: Meter measurements */}
                  {currentCategoryTemplate.sizeType === 'meter' && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex flex-wrap gap-2">
                        {currentCategoryTemplate.sizeOptions.map((sz) => {
                          const isSelected = newProd.sizes?.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSize(sz)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-sm'
                                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <span>{sz}</span>
                            </button>
                          );
                        })}
                        {newProd.sizes?.filter(s => !currentCategoryTemplate.sizeOptions.includes(s)).map(sz => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleSize(sz)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border bg-primary text-white border-primary shadow-sm flex items-center gap-1.5"
                          >
                            <Check className="w-3 h-3" />
                            <span>{sz}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1 max-w-sm">
                        <input
                          type="text"
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          placeholder={language === 'ta' ? 'தனிப்பயன் மீட்டர் அளவு (எ.கா. 1.75 Meters)...' : 'Enter custom meter cut (e.g. 1.75 Meters)...'}
                          className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-white flex-1 outline-none focus:border-primary"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSize(e)}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          + {language === 'ta' ? 'மீட்டர் சேர்' : 'Add Meter'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 4: Multi-Picture Batch Upload & Color / Stock Manager */}
                {productMode === 'variants' ? (
                  <div className="space-y-4 pt-2">
                    
                    {/* Header with Multi-Picture Hero Upload */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-primary" /> 
                          <span>{language === 'ta' ? 'தயாரிப்பு படங்கள் & இருப்பு மேலாளர்' : 'Product Pictures & Stock Manager'} ({colorVariants.filter(v => v.image).length} {language === 'ta' ? 'படங்கள் சேர்க்கப்பட்டன' : 'Photos Added'})</span>
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {language === 'ta'
                            ? 'ஒரே நேரத்தில் 5, 10, அல்லது 15+ படங்களை பதிவேற்றவும். குறியீடுகள், வண்ணங்கள், இருப்பு தானாக ஒதுக்கப்படும்!'
                            : 'Upload 5, 10, or 15+ pictures at once. Thalir auto-assigns codes, colors, stock counts, and sizes!'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Option 1: Upload Multiple Photos of the SAME Product */}
                        <label className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md">
                          <Camera className="w-4 h-4 text-gold-shimmer" />
                          <span>{language === 'ta' ? 'ஒரே தயாரிப்பின் பல படங்கள் (பல்லு, பிளவுஸ், பார்டர்)' : 'Upload More Photos of Same Product (Pallu, Blouse, Border)'}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadSameProductImages(e.target.files)}
                          />
                        </label>

                        {/* Option 2: Multi-Color Swatches Bulk Upload */}
                        <label className="bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md">
                          <UploadCloud className="w-4 h-4 text-gold-shimmer" />
                          <span>{language === 'ta' ? 'வெவ்வேறு வண்ணப் படங்கள்' : 'Upload Different Color Swatches'}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleMultipleFilesUpload(e.target.files)}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={addColorVariant}
                          className="bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs px-3 py-2.5 rounded-xl border border-stone-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Add an empty color variant card"
                        >
                          <Plus className="w-3.5 h-3.5 text-primary" /> {language === 'ta' ? '+ வெற்று உருப்படி' : 'Add Blank Item'}
                        </button>
                      </div>
                    </div>

                    {/* Batch Actions Toolbar: Quick Stock Setter & Catalog Mode */}
                    {colorVariants.length > 0 && (
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 shadow-2xs">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                              {language === 'ta' ? `⚡ மொத்த வேகக் கட்டுப்பாடுகள் (${colorVariants.length} பொருட்கள்)` : `⚡ Batch Fast Controls (${colorVariants.length} Items Configured)`}
                            </span>
                          </div>

                          {/* Quick Stock Setter for all items */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="text-[11px] font-bold text-stone-700 whitespace-nowrap">
                              {language === 'ta' ? 'அனைத்துக்கும் இருப்பு:' : 'Set Stock for ALL:'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={bulkStockApplyValue}
                              onChange={(e) => setBulkStockApplyValue(e.target.value)}
                              className="w-16 text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-center font-bold outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() => handleApplyStockToAll(bulkStockApplyValue)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1.5"
                            >
                              <span>{language === 'ta' ? `அனைத்து ${colorVariants.length} பொருட்களுக்கும் அமை` : `Apply to All ${colorVariants.length} Items`}</span>
                              <Sparkles className="w-3 h-3 text-gold" />
                            </button>
                          </div>
                        </div>

                        {/* Catalog Publishing Strategy */}
                        <div className="pt-2 border-t border-emerald-200/70">
                          <span className="block text-[11px] font-bold text-emerald-950 uppercase mb-1.5">
                            {language === 'ta' ? `இந்த ${colorVariants.length} பொருட்கள் உங்கள் கடையில் எவ்வாறு தோன்ற வேண்டும்?` : `How should these ${colorVariants.length} items appear in your store?`}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                              bulkPublishMode === 'single_with_variants'
                                ? 'bg-white border-primary shadow-xs ring-1 ring-primary/30'
                                : 'bg-white/60 border-stone-200 hover:bg-white'
                            }`}>
                              <input
                                type="radio"
                                name="bulkPublishMode"
                                value="single_with_variants"
                                checked={bulkPublishMode === 'single_with_variants'}
                                onChange={() => setBulkPublishMode('single_with_variants')}
                                className="mt-0.5 accent-primary"
                              />
                              <div>
                                <span className="text-xs font-bold text-stone-900 block flex items-center gap-1.5">
                                  <span>{language === 'ta' ? `1 சேலை டிசைன் - ${colorVariants.length} வண்ண ஸ்வாட்ச்களுடன்` : `1 Saree Design with ${colorVariants.length} Color Swatches`}</span>
                                  <span className="text-[10px] bg-primary-pale text-primary px-1.5 py-0.2 rounded font-semibold">{language === 'ta' ? 'பரிந்துரைக்கப்படுகிறது' : 'Recommended'}</span>
                                </span>
                                <span className="text-[11px] text-stone-500 block leading-tight mt-0.5">
                                  {language === 'ta'
                                    ? 'வாடிக்கையாளர்கள் 1 சேலை தயாரிப்பைப் பார்த்து வண்ண பொத்தான்களை கிளிக் செய்து தேர்வு செய்வர்.'
                                    : 'Customers view 1 master saree product and click color swatches (e.g. Rani Pink, Peacock Blue) to choose.'}
                                </span>
                              </div>
                            </label>

                            <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                              bulkPublishMode === 'separate_products'
                                ? 'bg-white border-primary shadow-xs ring-1 ring-primary/30'
                                : 'bg-white/60 border-stone-200 hover:bg-white'
                            }`}>
                              <input
                                type="radio"
                                name="bulkPublishMode"
                                value="separate_products"
                                checked={bulkPublishMode === 'separate_products'}
                                onChange={() => setBulkPublishMode('separate_products')}
                                className="mt-0.5 accent-primary"
                              />
                              <div>
                                <span className="text-xs font-bold text-stone-900 block">
                                  {language === 'ta' ? `பட்டியலில் ${colorVariants.length} தனித்தனி தயாரிப்புகள்` : `${colorVariants.length} Individual Separate Products in Catalog`}
                                </span>
                                <span className="text-[11px] text-stone-500 block leading-tight mt-0.5">
                                  {language === 'ta'
                                    ? `ஒவ்வொரு வண்ணத்தையும் தனி தயாரிப்பு அட்டையாக கடையில் ${colorVariants.length} தயாரிப்புகளாக வெளியிடும்.`
                                    : `Creates ${colorVariants.length} individual product cards in your collection, each with this price and fabric.`}
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Variant Cards List */}
                    <div className="space-y-4">
                      {colorVariants.map((variant, idx) => (
                        <div
                          key={variant.id || idx}
                          className="p-4 sm:p-5 bg-stone-50/80 border border-stone-200 rounded-2xl space-y-3.5 relative hover:border-primary/50 transition-colors shadow-2xs"
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-primary bg-primary-pale px-3 py-1 rounded-full flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: variant.colorCode || '#0D5C3A' }} />
                                {language === 'ta'
                                  ? `உருப்படி #${idx + 1}: ${variant.colorName || 'வண்ணத்தைத் தேர்ந்தெடுக்கவும்'}`
                                  : `Item #${idx + 1}: ${variant.colorName || 'Select Color'}`}
                              </span>
                              <span className="text-xs font-mono font-bold text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded">
                                {variant.code || `${(newProd.code || generateProductCode(newProd.category))}-${String(idx + 1).padStart(2, '0')}`}
                              </span>
                              {variant.detectedFromPhoto && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>{language === 'ta' ? 'தானாகக் கண்டறியப்பட்ட நிறம்' : 'Auto-Detected Color'}</span>
                                </span>
                              )}
                            </div>

                            {colorVariants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeColorVariant(idx)}
                                className="text-stone-400 hover:text-red-600 p-1.5 transition-colors rounded-lg cursor-pointer hover:bg-red-50"
                                title={language === 'ta' ? 'இந்த உருப்படியை நீக்கு' : 'Remove this item'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Image-Detected Palette Suggestions (if available) */}
                          {variant.colorSuggestions && variant.colorSuggestions.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap p-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-xl">
                              <span className="text-[10px] font-bold text-emerald-950 uppercase flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-700" />
                                <span>{language === 'ta' ? 'சேலையிலிருந்து கண்டறியப்பட்டது:' : 'Detected from Saree:'}</span>
                              </span>
                              {variant.colorSuggestions.map(sug => (
                                <button
                                  key={sug.name}
                                  type="button"
                                  onClick={() => {
                                    setColorVariants(prev => prev.map((v, i) => i === idx ? { 
                                      ...v, 
                                      colorName: sug.name, 
                                      colorCode: sug.code 
                                    } : v));
                                  }}
                                  className={`text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1.5 cursor-pointer transition-all ${
                                    variant.colorName === sug.name
                                      ? 'bg-emerald-800 text-white border-emerald-900 font-bold shadow-xs'
                                      : 'bg-white text-stone-700 border-emerald-200 hover:border-emerald-500'
                                  }`}
                                  title={language === 'ta' ? `${sug.name} நிறத்திற்கு மாற்றவும்` : `Switch to ${sug.name}`}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: sug.code }} />
                                  <span>{sug.name}</span>
                                  {variant.colorName === sug.name && <Check className="w-2.5 h-2.5" />}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Quick Color Swatch Presets */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">
                              {language === 'ta' ? '1-கிளிக் நிறம்:' : '1-Click Color:'}
                            </span>
                            {POPULAR_COLORS.map(c => (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() => {
                                  setColorVariants(prev => prev.map((v, i) => i === idx ? { ...v, colorName: c.name, colorCode: c.code } : v));
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-colors ${
                                  variant.colorName === c.name
                                    ? 'bg-primary text-white border-primary font-bold shadow-2xs'
                                    : 'bg-white text-stone-700 border-stone-200 hover:border-primary'
                                }`}
                                title={language === 'ta' ? `${c.name} நிறமாக அமைக்கவும்` : `Set to ${c.name}`}
                              >
                                <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: c.code }} />
                                <span>{c.name}</span>
                              </button>
                            ))}
                          </div>

                          {/* Photo & Core Specs Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
                            {/* Photo Thumbnail & Uploader */}
                            <div className="sm:col-span-4 space-y-1.5">
                              <label className="block text-[11px] font-bold text-stone-600 uppercase">
                                {language === 'ta' ? 'தயாரிப்பு புகைப்படம்' : 'Product Photo'} <span className="text-red-500">*</span>
                              </label>

                              <div className="flex items-center gap-2.5">
                                {variant.image ? (
                                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-primary shrink-0 shadow-sm">
                                    <img src={variant.image} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setColorVariants(prev => prev.map((v, i) => i === idx ? { ...v, image: '' } : v))}
                                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 cursor-pointer"
                                      title={language === 'ta' ? 'புகைப்படத்தை நீக்கு' : 'Remove photo'}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                                    <ImageIcon className="w-6 h-6" />
                                  </div>
                                )}

                                <div className="flex-1 space-y-1">
                                  <div className="flex gap-1.5">
                                    <label className="flex-1 bg-white border border-stone-300 hover:border-primary px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
                                      <Upload className="w-3.5 h-3.5 text-primary" />
                                      <span>{variant.image ? (language === 'ta' ? 'முதன்மைப் படம்' : 'Cover Photo') : (language === 'ta' ? 'படம் பதிவேற்று' : 'Upload Photo')}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e.target.files[0], idx)}
                                      />
                                    </label>
                                    <label className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap" title="Add more pictures of this color (Pallu, Blouse, etc.)">
                                      <Camera className="w-3 h-3 text-primary" />
                                      <span>{language === 'ta' ? '+ படங்கள்' : '+ More'}</span>
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleUploadSameProductImages(e.target.files, idx)}
                                      />
                                    </label>
                                  </div>
                                  <input
                                    type="url"
                                    value={variant.image}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setColorVariants(prev => prev.map((v, i) => i === idx ? { ...v, image: val } : v));
                                    }}
                                    onBlur={async (e) => {
                                      const val = e.target.value?.trim();
                                      if (val && (val.startsWith('http') || val.startsWith('data:'))) {
                                        const detected = await detectDominantColorFromImage(val);
                                        const sareeDetected = await detectSareeAndFabric(val, '', newProd.category);
                                        setColorVariants(prev => prev.map((v, i) => i === idx ? { 
                                          ...v, 
                                          colorName: detected.colorName || v.colorName, 
                                          colorCode: detected.colorCode || v.colorCode,
                                          stockQty: v.stockQty ?? 1
                                        } : v));
                                        if (idx === 0 && newProd.category === 'sarees' && sareeDetected) {
                                          setNewProd(prev => ({
                                            ...prev,
                                            name: sareeDetected.sareeName,
                                            fabric: sareeDetected.fabric,
                                            care: sareeDetected.care,
                                            description: sareeDetected.description
                                          }));
                                        }
                                        if (showToast) showToast(`🎨 Auto-detected: ${sareeDetected?.sareeName || ''} (${detected.colorName})!`);
                                      }
                                    }}
                                    placeholder={language === 'ta' ? 'அல்லது படத்தின் URL...' : 'Or image URL...'}
                                    className="w-full text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 bg-white outline-none focus:border-primary"
                                  />
                                </div>
                              </div>

                              {/* Multi-photo strip for this color variant */}
                              {Array.isArray(variant.images) && variant.images.length > 1 && (
                                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                                  <span className="text-[10px] font-bold text-stone-500 whitespace-nowrap">
                                    {language === 'ta' ? 'படங்கள்:' : 'Photos:'}
                                  </span>
                                  {variant.images.map((vImg, vImgIdx) => (
                                    <div key={vImgIdx} className="relative w-8 h-8 rounded border border-stone-300 overflow-hidden shrink-0 group">
                                      <img src={vImg} alt="" className="w-full h-full object-cover" />
                                      {vImgIdx === 0 ? (
                                        <span className="absolute top-0 left-0 bg-primary text-white text-[7px] px-0.5 font-bold">★</span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleSetPrimaryVariantSubImage(idx, vImgIdx)}
                                          className="absolute bottom-0 inset-x-0 bg-primary/90 text-[7px] text-white opacity-0 group-hover:opacity-100 text-center font-bold"
                                          title="Set as Cover"
                                        >
                                          Cover
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariantSubImage(idx, vImgIdx)}
                                        className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Remove photo"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Color Name & Code */}
                            <div className="sm:col-span-3 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-stone-600 uppercase">
                                  {language === 'ta' ? 'வண்ணப் பெயர்' : 'Color Name'} <span className="text-red-500">*</span>
                                </label>
                                {typeof window !== 'undefined' && window.EyeDropper && (
                                  <button
                                    type="button"
                                    onClick={() => handlePickFromScreen(idx)}
                                    className="text-[10px] bg-stone-100 hover:bg-primary-pale text-stone-700 hover:text-primary font-bold px-1.5 py-0.5 rounded border border-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                                    title={language === 'ta' ? 'ஐ-ட்ராப்பரைப் பயன்படுத்தி சேலை படத்திலிருந்து வண்ணத்தை நேரடியாகத் தேர்ந்தெடுக்கவும்' : 'Click to sample exact color directly from the saree picture using eye-dropper'}
                                  >
                                    <Pipette className="w-2.5 h-2.5 text-primary" />
                                    <span>{language === 'ta' ? 'நிறம் எடு' : 'Sample'}</span>
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                required
                                list="boutique-color-options"
                                value={variant.colorName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const matched = BOUTIQUE_COLOR_PALETTE.find(p => p.name.toLowerCase() === val.toLowerCase());
                                  setColorVariants(prev => prev.map((v, i) => i === idx ? { 
                                    ...v, 
                                    colorName: val,
                                    colorCode: matched ? matched.code : v.colorCode
                                  } : v));
                                }}
                                placeholder={language === 'ta' ? 'எ.கா. மணப்பெண் மெரூன் / மஞ்சள்' : 'e.g. Bridal Maroon / Haldi Yellow'}
                                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 bg-white focus:border-primary outline-none font-medium"
                              />

                              <div className="flex items-center gap-2 pt-0.5">
                                <input
                                  type="color"
                                  value={variant.colorCode || '#0D5C3A'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setColorVariants(prev => prev.map((v, i) => i === idx ? { ...v, colorCode: val } : v));
                                  }}
                                  className="w-7 h-7 p-0.5 rounded-lg border border-stone-200 cursor-pointer bg-white"
                                  title={language === 'ta' ? 'வண்ணத்தைத் தேர்ந்தெடுக்கவும்' : 'Pick Color Swatch'}
                                />
                                <span className="text-[11px] font-mono text-stone-500">{variant.colorCode || '#0D5C3A'}</span>
                              </div>
                            </div>

                            {/* SKU Code */}
                            <div className="sm:col-span-2 space-y-1.5">
                              <label className="block text-[11px] font-bold text-stone-600 uppercase">
                                {language === 'ta' ? 'SKU குறியீடு' : 'Item SKU Code'}
                              </label>
                              <input
                                type="text"
                                value={variant.code || ''}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  setColorVariants(prev => prev.map((v, i) => i === idx ? { ...v, code: val } : v));
                                }}
                                placeholder={`e.g. ${(newProd.code || generateProductCode(newProd.category))}-${String(idx + 1).padStart(2, '0')}`}
                                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 bg-white focus:border-primary outline-none font-mono font-bold uppercase text-primary"
                              />
                            </div>

                            {/* Stock Count (Pieces) - PROMINENT FOR EVERY ITEM */}
                            <div className="sm:col-span-3 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-stone-700 uppercase">
                                  {language === 'ta' ? 'கையிருப்பு எண்ணிக்கை (துண்டுகள்)' : 'Stock Count (Pieces)'} <span className="text-red-500">*</span>
                                </label>
                                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                  Number(variant.stockQty) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                                }`}>
                                  {Number(variant.stockQty) > 0
                                    ? (language === 'ta' ? `${variant.stockQty} இருப்பில் உள்ளது` : `${variant.stockQty} in stock`)
                                    : (language === 'ta' ? 'இருப்பில் இல்லை' : 'Out of stock')}
                                </span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                required
                                value={variant.stockQty ?? 10}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setColorVariants(prev => prev.map((v, i) => i === idx ? { ...v, stockQty: val } : v));
                                }}
                                className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-stone-300 bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none text-stone-900"
                              />
                              <p className="text-[10px] text-stone-400">
                                {language === 'ta' ? 'இந்த புகைப்படத்திற்கான மொத்த இருப்பு' : 'Total available inventory for this photo'}
                              </p>
                            </div>
                          </div>

                          {/* Dynamic Sizing Row per Item: Inskirt Panels, Kurti Sizes, Meter Cuts, or Free Size */}
                          <div className="pt-2 border-t border-stone-200/80">
                            {/* Category: Saree or Chudi Material (Free Size) */}
                            {currentCategoryTemplate.sizeType === 'free' && (
                              <div className="flex items-center gap-2 text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                                <span>
                                  <strong>{language === 'ta' ? 'இலவச அளவு (Free Size):' : 'Free Size:'}</strong>{' '}
                                  {language === 'ta'
                                    ? 'அனைத்து பொதுவான அளவுகளுக்கும் பொருந்தும். கூடுதல் அளவு தேர்வு தேவையில்லை.'
                                    : 'Universal cut fits all standard measurements. No extra size selection needed.'}
                                </span>
                              </div>
                            )}

                            {/* Category: Inskirts (Stitched in Panels: 6-part to 10-part cuts) */}
                            {currentCategoryTemplate.sizeType === 'panel' && (
                              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                                  <span className="text-[11px] font-bold text-stone-700 uppercase flex items-center gap-1.5">
                                    <span>{language === 'ta' ? 'இந்த உருப்படிக்கான பேனல் வெட்டுகள்:' : 'Panel Cuts for this Item:'}</span>
                                    <span className="text-[10px] text-primary font-normal">
                                      {language === 'ta' ? '(மாற்ற கிளிக் செய்யவும் / ஒரு பேனலுக்கு இருப்பை உள்ளிடவும்)' : '(Click cut to toggle / enter stock per panel)'}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {currentCategoryTemplate.sizeOptions.map(sz => {
                                    const hasCut = (variant.sizes || newProd.sizes || []).includes(sz);
                                    const count = variant.sizeCounts?.[sz] ?? (hasCut ? 2 : 0);
                                    return (
                                      <div key={sz} className={`flex items-center rounded-lg border text-xs overflow-hidden transition-all ${
                                        hasCut ? 'border-primary bg-primary-pale/30' : 'border-stone-200 bg-stone-50 opacity-60'
                                      }`}>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleVariantSize(idx, sz)}
                                          className={`px-2.5 py-1.5 font-bold flex items-center gap-1 cursor-pointer ${
                                            hasCut ? 'bg-primary text-white' : 'text-stone-600 hover:text-stone-900'
                                          }`}
                                        >
                                          {hasCut && <Check className="w-3 h-3" />}
                                          <span>{sz}</span>
                                        </button>
                                        {hasCut && (
                                          <div className="flex items-center gap-1 px-2 py-1 bg-white border-l border-primary/20">
                                            <span className="text-[10px] text-stone-400 font-bold">{language === 'ta' ? 'எண்ணிக்கை:' : 'Qty:'}</span>
                                            <input
                                              type="number"
                                              min="0"
                                              value={count}
                                              onChange={(e) => handleUpdateVariantSizeCount(idx, sz, e.target.value)}
                                              className="w-10 text-[11px] text-center font-bold border border-stone-200 rounded px-1 py-0.5 outline-none focus:border-primary"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Category: Kurtis & Nightwear (Standard Sizes XS to 3XL) */}
                            {currentCategoryTemplate.sizeType === 'standard' && (
                              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                                  <span className="text-[11px] font-bold text-stone-700 uppercase flex items-center gap-1.5">
                                    <span>{language === 'ta' ? 'கிடைக்கும் அளவுகள்:' : 'Sizes Available for this Item:'}</span>
                                    <span className="text-[10px] text-primary font-normal">
                                      {language === 'ta' ? '(அளவுகளைத் தேர்ந்தெடுக்கவும் மற்றும் எண்ணிக்கையை மாற்றவும்)' : '(Toggle sizes & adjust count per size)'}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {currentCategoryTemplate.sizeOptions.map(sz => {
                                    const hasSize = (variant.sizes || newProd.sizes || []).includes(sz);
                                    const count = variant.sizeCounts?.[sz] ?? (hasSize ? 2 : 0);
                                    return (
                                      <div key={sz} className={`flex items-center rounded-lg border text-xs overflow-hidden transition-all ${
                                        hasSize ? 'border-primary bg-primary-pale/30' : 'border-stone-200 bg-stone-50 opacity-60'
                                      }`}>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleVariantSize(idx, sz)}
                                          className={`px-2.5 py-1.5 font-bold flex items-center gap-1 cursor-pointer ${
                                            hasSize ? 'bg-primary text-white' : 'text-stone-600 hover:text-stone-900'
                                          }`}
                                        >
                                          {hasSize && <Check className="w-3 h-3" />}
                                          <span>{sz}</span>
                                        </button>
                                        {hasSize && (
                                          <div className="flex items-center gap-1 px-2 py-1 bg-white border-l border-primary/20">
                                            <span className="text-[10px] text-stone-400 font-bold">{language === 'ta' ? 'எண்ணிக்கை:' : 'Qty:'}</span>
                                            <input
                                              type="number"
                                              min="0"
                                              value={count}
                                              onChange={(e) => handleUpdateVariantSizeCount(idx, sz, e.target.value)}
                                              className="w-10 text-[11px] text-center font-bold border border-stone-200 rounded px-1 py-0.5 outline-none focus:border-primary"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Category: Blouse Materials & Linings (Meter Cuts) */}
                            {currentCategoryTemplate.sizeType === 'meter' && (
                              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                                  <span className="text-[11px] font-bold text-stone-700 uppercase flex items-center gap-1.5">
                                    <span>{language === 'ta' ? 'மீட்டர் வெட்டுகள்:' : 'Meter Cuts for this Item:'}</span>
                                    <span className="text-[10px] text-primary font-normal">
                                      {language === 'ta' ? '(வெட்டுகள் மற்றும் மீட்டர் அளவை தேர்ந்தெடுக்கவும்)' : '(Select cuts and meter quantity)'}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {currentCategoryTemplate.sizeOptions.map(sz => {
                                    const hasCut = (variant.sizes || newProd.sizes || []).includes(sz);
                                    const count = variant.sizeCounts?.[sz] ?? (hasCut ? 2 : 0);
                                    return (
                                      <div key={sz} className={`flex items-center rounded-lg border text-xs overflow-hidden transition-all ${
                                        hasCut ? 'border-primary bg-primary-pale/30' : 'border-stone-200 bg-stone-50 opacity-60'
                                      }`}>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleVariantSize(idx, sz)}
                                          className={`px-2.5 py-1.5 font-bold flex items-center gap-1 cursor-pointer ${
                                            hasCut ? 'bg-primary text-white' : 'text-stone-600 hover:text-stone-900'
                                          }`}
                                        >
                                          {hasCut && <Check className="w-3 h-3" />}
                                          <span>{sz}</span>
                                        </button>
                                        {hasCut && (
                                          <div className="flex items-center gap-1 px-2 py-1 bg-white border-l border-primary/20">
                                            <span className="text-[10px] text-stone-400 font-bold">{language === 'ta' ? 'எண்ணிக்கை:' : 'Qty:'}</span>
                                            <input
                                              type="number"
                                              min="0"
                                              value={count}
                                              onChange={(e) => handleUpdateVariantSizeCount(idx, sz, e.target.value)}
                                              className="w-10 text-[11px] text-center font-bold border border-stone-200 rounded px-1 py-0.5 outline-none focus:border-primary"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>

                    {/* Bottom Multi-Photo Upload Dropzone */}
                    <div className="p-4 bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-pale text-primary flex items-center justify-center shrink-0">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-800">
                            {language === 'ta' ? 'இந்த தொகுப்பில் மேலும் படங்களைச் சேர்க்க விரும்புகிறீர்களா?' : 'Want to add more pictures to this batch?'}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {language === 'ta' ? 'உங்கள் கேலரியில் இருந்து ஒரே நேரத்தில் 5, 10 அல்லது 15+ சேலை அல்லது ஆடை படங்களைத் தேர்ந்தெடுக்கவும்.' : 'Choose 5, 10, or 15+ more saree or dress pictures at once from your gallery.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
                          <UploadCloud className="w-4 h-4 text-gold-shimmer" />
                          <span>{language === 'ta' ? 'மேலும் படங்களைத் தேர்ந்தெடுக்கவும்' : 'Select More Pictures'}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleMultipleFilesUpload(e.target.files)}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={addColorVariant}
                          className="bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> {language === 'ta' ? '+ வெற்று கார்டு' : '+ Blank Card'}
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-primary" />
                            {language === 'ta'
                              ? 'தயாரிப்பு புகைப்படக் காட்சியகம் (ஒரே தயாரிப்பின் பல படங்கள்)'
                              : 'Product Photo Gallery (Multiple Pictures of Same Product)'} <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {language === 'ta'
                            ? 'ஒரே சேலையின் பல்லு, பிளவுஸ் பிட், பார்டர், முழு தோற்றம் போன்ற கூடுதல் புகைப்படங்களைச் சேர்க்கவும் (15+ படங்கள் வரை).'
                            : 'Upload multiple pictures of this same saree: Front view, Pallu view, Blouse piece, Border detail, Draped view.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto">
                          <UploadCloud className="w-4 h-4 text-gold-shimmer" />
                          <span>{language === 'ta' ? 'பல படங்களை பதிவேற்று (ஒரே நேரத்தில்)' : 'Upload Multiple Photos (At Once)'}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadSameProductImages(e.target.files)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Interactive Multi-Photo Gallery Grid */}
                    {(newProd.images && newProd.images.length > 0) ? (
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {newProd.images.map((img, imgIdx) => (
                            <div 
                              key={imgIdx} 
                              className={`relative rounded-xl overflow-hidden border-2 bg-white shadow-2xs group transition-all ${
                                imgIdx === 0 ? 'border-primary ring-2 ring-primary/40' : 'border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              <div className="w-full h-28 overflow-hidden bg-stone-100 flex items-center justify-center">
                                <img src={img} alt={`Product ${imgIdx + 1}`} className="w-full h-full object-cover" />
                              </div>

                              {/* Primary Cover Badge */}
                              {imgIdx === 0 ? (
                                <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                                  {language === 'ta' ? 'முதன்மை' : 'Cover'}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryNewProdImage(imgIdx)}
                                  className="absolute top-1 left-1 bg-white/95 hover:bg-primary hover:text-white text-stone-800 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm transition-colors cursor-pointer opacity-90 group-hover:opacity-100"
                                  title={language === 'ta' ? 'முதன்மைப் படமாக அமை' : 'Make Cover Photo'}
                                >
                                  ⭐ {language === 'ta' ? 'அமை' : 'Make Cover'}
                                </button>
                              )}

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveNewProdImage(imgIdx)}
                                className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full shadow-sm transition-colors cursor-pointer"
                                title={language === 'ta' ? 'படத்தை நீக்கு' : 'Remove photo'}
                              >
                                <X className="w-3 h-3" />
                              </button>

                              <div className="p-1 bg-white/95 text-[9px] text-stone-500 font-bold text-center border-t border-stone-100 truncate">
                                #{imgIdx + 1} {imgIdx === 0 ? (language === 'ta' ? 'முழு படம்' : 'Main View') : (imgIdx === 1 ? (language === 'ta' ? 'பல்லு / பிளவுஸ்' : 'Pallu/Blouse') : (language === 'ta' ? 'விவரம்' : 'Detail'))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add More Photos / URL Row */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-stone-200">
                          <label className="w-full sm:w-auto bg-white hover:bg-stone-100 text-stone-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-stone-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                            <Plus className="w-3.5 h-3.5 text-primary" />
                            <span>{language === 'ta' ? '+ மேலும் படங்களைச் சேர்' : '+ Add More Pictures'}</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadSameProductImages(e.target.files)}
                            />
                          </label>

                          <div className="flex gap-1.5 flex-1 w-full">
                            <input
                              type="url"
                              placeholder={language === 'ta' ? 'அல்லது படத்தின் URL ஐ ஒட்டவும்...' : 'Or paste additional image URL...'}
                              className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.target.value?.trim();
                                  if (val) {
                                    setNewProd(prev => ({ ...prev, images: [...(prev.images || []), val] }));
                                    e.target.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-primary-pale text-primary flex items-center justify-center shadow-xs">
                          <Camera className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-800">
                            {language === 'ta' ? 'சேலையின் அனைத்து படங்களையும் தேர்ந்தெடுக்கவும்' : 'Upload Pictures of this Saree / Product'}
                          </p>
                          <p className="text-xs text-stone-500 max-w-md mt-0.5">
                            {language === 'ta'
                              ? 'ஒரே நேரத்தில் 3, 5, அல்லது 10+ படங்களை தேர்வு செய்யலாம் (முழு சேலை, பல்லு, பிளவுஸ் பிட், பார்டர் போன்றவை).'
                              : 'Select 1, 3, 5, or more pictures of the same product at once (Front view, Pallu view, Blouse piece, Border detail).'}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
                          <label className="flex-1 bg-primary text-white hover:bg-primary-dark font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all">
                            <Upload className="w-4 h-4" /> {language === 'ta' ? 'படங்களைத் தேர்ந்தெடுக்கவும் (பல படங்கள்)' : 'Choose Pictures (Select Multiple)'}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadSameProductImages(e.target.files)}
                            />
                          </label>

                          <input
                            type="url"
                            value={newProd.image}
                            onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                            onBlur={async (e) => {
                              const val = e.target.value?.trim();
                              if (val && (val.startsWith('http') || val.startsWith('data:'))) {
                                const detected = await detectDominantColorFromImage(val);
                                const sareeDetected = await detectSareeAndFabric(val, '', newProd.category);
                                setNewProd(prev => ({ 
                                  ...prev, 
                                  image: val,
                                  images: [...(prev.images || []), val],
                                  defaultColor: detected.colorName || prev.defaultColor,
                                  name: (prev.category === 'sarees' && sareeDetected) ? sareeDetected.sareeName : prev.name,
                                  fabric: (prev.category === 'sarees' && sareeDetected) ? sareeDetected.fabric : prev.fabric,
                                  care: (prev.category === 'sarees' && sareeDetected) ? sareeDetected.care : prev.care,
                                  description: (prev.category === 'sarees' && sareeDetected) ? sareeDetected.description : prev.description
                                }));
                                setColorVariants(prev => prev.map((v, i) => i === 0 ? {
                                  ...v,
                                  image: val,
                                  images: [val],
                                  colorName: detected.colorName || v.colorName,
                                  colorCode: detected.colorCode || v.colorCode,
                                  stockQty: v.stockQty ?? 1
                                } : v));
                                if (showToast) showToast(`🎨 Auto-detected: ${sareeDetected?.sareeName || ''} (${detected.colorName})!`);
                              }
                            }}
                            placeholder={language === 'ta' ? 'அல்லது படத்தின் URL ஐ ஒட்டவும்...' : 'Or paste Image URL...'}
                            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick Link to switch to Batch Mode */}
                    <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-stone-700">
                        <UploadCloud className="w-4 h-4 text-emerald-700" />
                        <span>{language === 'ta' ? 'ஒரே வடிவமைப்பில் 15 சேலை படங்கள் அல்லது வண்ணங்களை ஒரே நேரத்தில் சேர்க்க வேண்டுமா?' : 'Have 15 saree pictures or colors of the same design to add at once?'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProductMode('variants')}
                        className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        {language === 'ta' ? 'பல படத் தொகுதி முறைக்கு மாறவும் →' : 'Switch to Multi-Picture Batch Mode →'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Fabric Specs, Length, Care & Description (Auto-populated with 1-click Preset Chips & Fully Editable) */}
                <div className="space-y-4 pt-2">

                  {/* Auto-Detected Saree Type & Weave Switcher */}
                  {newProd.category === 'sarees' && (
                    <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border border-emerald-200 space-y-2.5 shadow-2xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-emerald-200/70">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">👘</span>
                          <div>
                            <span className="text-xs font-bold text-emerald-950 flex flex-wrap items-center gap-1.5">
                              <span>{language === 'ta' ? 'தானாக கண்டறியப்பட்ட சேலை வகை & துணி:' : 'Auto-Detected Saree Type & Fabric:'}</span>
                              <strong className="text-primary font-black bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                                {newProd.name || 'Geometric Woven Jacquard Saree'}
                              </strong>
                              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                                {newProd.detectedSareeType?.detectedSource === 'filename_keywords' ? '✓ File & Photo Match' : '✓ Photo AI Analysis'}
                              </span>
                            </span>
                            <p className="text-[11px] text-stone-600 mt-0.5">
                              {language === 'ta'
                                ? 'புகைப்படம் பதிவேற்றியவுடன் சேலை வகை, நெசவு முறை மற்றும் துணி தானாக அமைக்கப்படும். தேவைப்பட்டால் கீழே மாற்றிக்கொள்ளலாம்:'
                                : 'Detected automatically from uploaded photo & filename. Click any saree type below to instantly switch all specs:'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Saree Type Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {SAREE_PRESETS.map((preset) => {
                          const isCurrent = newProd.fabric === preset.fabric || newProd.name === preset.name;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setNewProd(prev => ({
                                  ...prev,
                                  name: preset.name,
                                  fabric: preset.fabric,
                                  care: preset.care,
                                  description: preset.description,
                                  length: preset.length || prev.length,
                                  detectedSareeType: preset
                                }));
                                if (showToast) showToast(language === 'ta' ? `✨ சேலை வகை மாற்றப்பட்டது: ${preset.name}` : `✨ Saree type set to: ${preset.name}`);
                              }}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCurrent
                                  ? 'bg-[#073822] text-white border-primary shadow-sm ring-2 ring-gold/50 scale-102'
                                  : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {isCurrent && <Check className="w-3.5 h-3.5 text-gold" />}
                              <span>{preset.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Fabric Type */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                          {language === 'ta' ? 'துணி வகை' : 'Fabric Type'} <span className="text-[10px] text-stone-400 font-normal">({language === 'ta' ? 'தானியங்கி • திருத்தக்கூடியது' : 'Auto • Editable'})</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={newProd.fabric}
                        onChange={(e) => setNewProd({ ...newProd, fabric: e.target.value })}
                        placeholder={language === 'ta' ? 'எ.கா. பியூர் டிஷ்யூ சில்க் / ரேயான் 140g' : 'e.g. Pure Tissue Silk / Rayon 140g'}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-primary outline-none font-medium"
                      />
                      {/* Quick Fabric Preset Chips */}
                      {currentCategoryTemplate.fabricPresets && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {currentCategoryTemplate.fabricPresets.slice(0, 5).map(f => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setNewProd({ ...newProd, fabric: f })}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                newProd.fabric === f
                                  ? 'bg-primary text-white border-primary shadow-2xs'
                                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Length / Cut Length */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                          {language === 'ta' ? 'நீளம் / வெட்டு நீளம்' : 'Length / Cut Length'} <span className="text-[10px] text-stone-400 font-normal">({language === 'ta' ? 'தானியங்கி • திருத்தக்கூடியது' : 'Auto • Editable'})</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={newProd.length}
                        onChange={(e) => setNewProd({ ...newProd, length: e.target.value })}
                        placeholder={language === 'ta' ? 'எ.கா. 6.3 மீ (பிளவுஸ் உடன்) / 44 அங்குலம்' : 'e.g. 6.3m (with blouse) / 44 inches'}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-primary outline-none font-medium"
                      />
                      {/* Quick Length Preset Chips */}
                      {currentCategoryTemplate.lengthPresets && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {currentCategoryTemplate.lengthPresets.map(l => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setNewProd({ ...newProd, length: l })}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                newProd.length === l
                                  ? 'bg-primary text-white border-primary shadow-2xs'
                                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Care Instructions */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        {language === 'ta' ? 'பராமரிப்பு வழிமுறைகள்' : 'Care Instructions'} <span className="text-[10px] text-stone-400 font-normal">({language === 'ta' ? 'தானியங்கி • திருத்தக்கூடியது' : 'Auto • Editable'})</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={newProd.care}
                      onChange={(e) => setNewProd({ ...newProd, care: e.target.value })}
                      placeholder={language === 'ta' ? 'எ.கா. டிரை கிளீன் மட்டும் / மென்மையான கை கழுவுதல்' : 'e.g. Dry Clean Only / Gentle Hand Wash'}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-primary outline-none"
                    />
                    {currentCategoryTemplate.carePresets && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {currentCategoryTemplate.carePresets.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setNewProd({ ...newProd, care: c })}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer truncate max-w-xs ${
                              newProd.care === c
                                ? 'bg-primary text-white border-primary shadow-2xs'
                                : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                            }`}
                            title={c}
                          >
                            {language === 'ta' ? `முன்னமைவு ${i + 1}: ${c.slice(0, 32)}...` : `Preset ${i + 1}: ${c.slice(0, 32)}...`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description & Styling Notes */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        {language === 'ta' ? 'விளக்கம் & உடை குறிப்புகள்' : 'Description & Styling Notes'} <span className="text-[10px] text-stone-400 font-normal">({language === 'ta' ? 'தானியங்கி • திருத்தக்கூடியது' : 'Auto-generated • Editable'})</span>
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={newProd.description}
                      onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                      placeholder={language === 'ta' ? 'ஜரிகை பார்டர், கைத்தறி நெசவு விவரங்கள், உடை குறிப்புகள்...' : 'Rich zari border, handloom weaving details, styling tips...'}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-primary outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Publish Progress Banner */}
                {isPublishing && publishProgress.total > 1 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-950">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                        <span>{language === 'ta' ? `தயாரிப்பு ${publishProgress.current} / ${publishProgress.total} வெளியிடுகிறது...` : `Publishing Product ${publishProgress.current} of ${publishProgress.total}...`}</span>
                      </span>
                      <span className="font-mono text-emerald-800">
                        {Math.round((publishProgress.current / publishProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full transition-all duration-300"
                        style={{ width: `${Math.round((publishProgress.current / publishProgress.total) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      {language === 'ta' ? 'தனித்தனி புகைப்படங்கள், இருப்பு எண்ணிக்கை மற்றும் அளவுகளுடன் பட்டியல் உருப்படிகளை உருவாக்குகிறது...' : 'Creating catalog items with individual photos, stock counts, and sizes...'}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-3 border-t border-stone-200">
                  <button
                    type="submit"
                    disabled={isPublishing || !newProd.name.trim() || !newProd.basePrice}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <RefreshCw className="w-5 h-5 text-gold-shimmer animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-gold-shimmer" />
                    )}
                    <span>
                      {isPublishing 
                        ? (publishProgress.total > 1
                            ? (language === 'ta' ? `${publishProgress.total} இல் ${publishProgress.current} உருப்படிகளை வெளியிடுகிறது...` : `Publishing ${publishProgress.current} of ${publishProgress.total} Items...`)
                            : (language === 'ta' ? 'தயாரிப்பை கடையில் வெளியிடுகிறது...' : 'Publishing Product to Store...')) 
                        : productMode === 'variants'
                          ? (bulkPublishMode === 'separate_products' && colorVariants.filter(v => v.image || v.colorName).length > 1
                              ? (language === 'ta' ? `அனைத்து ${colorVariants.filter(v => v.image || v.colorName).length} தயாரிப்புகளையும் தனித்தனியாக பட்டியலில் வெளியிடு` : `Publish All ${colorVariants.filter(v => v.image || v.colorName).length} Products Separately to Catalog`)
                              : (language === 'ta' ? `${colorVariants.length} வண்ண வகைகளுடன் தயாரிப்பை வெளியிடு` : `Publish Design with ${colorVariants.length} Color Variant(s) to Store`))
                          : (language === 'ta' ? 'தயாரிப்பை கடையில் வெளியிடு' : 'Publish Product to Store')
                      }
                    </span>
                  </button>
                </div>

                {/* Datalist of Authentic Boutique Saree Colors */}
                <datalist id="boutique-color-options">
                  {BOUTIQUE_COLOR_PALETTE.map(c => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </form>
            </div>
          );
        })()}

        {/* Tab 4: Store & Production Automation Settings */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
            
            {/* 1. Official WhatsApp Business API */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-serif font-bold text-base text-primary">WhatsApp Business API</h3>
                  <p className="text-xs text-stone-500">
                    {language === 'ta' ? 'Interakt / Gupshup / AiSensy தானியங்கி செய்தி சேவை' : 'Interakt / Gupshup / AiSensy automated messaging'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'வாட்ஸ்அப் வணிக தொலைபேசி எண் #' : 'WhatsApp Business Phone #'}
                </label>
                <input
                  type="text"
                  defaultValue={`+91 ${storeInfo.whatsappNumber}`}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'அதிகாரப்பூர்வ வாட்ஸ்அப் வரி விலைப்பட்டியல் டெம்ப்ளேட்' : 'Official WhatsApp Tax Invoice Template'}
                </label>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 font-mono">
                  "*THALIR BOUTIQUE - TAX INVOICE & ORDER RECEIPT* - [Invoice #, Date, Items, Subtotal, Grand Total, Courier Details]"
                </div>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'வெப்ஹூக் செயலில் உள்ளது (நிகழ்நேர தகவல்கள் ஒத்திசைவு)' : 'Webhook Active (Real-Time Inquiries Synced)'}</span>
                </span>
              </div>
            </div>

            {/* 2. Logistics & Courier Integration */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200">
                <Truck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-serif font-bold text-base text-primary">
                    {language === 'ta' ? 'கூரியர் லாஜிஸ்டிக்ஸ் & AWB கண்காணிப்பு' : 'Courier Logistics & AWB Tracking'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {language === 'ta' ? 'Delhivery / Shiprocket தானியங்கி அனுப்புதல்' : 'Delhivery / Shiprocket automatic dispatch'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'இயல்புநிலை கூரியர் பங்குதாரர்' : 'Default Courier Partner'}
                </label>
                <select className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 bg-white font-medium">
                  <option>{language === 'ta' ? 'Delhivery Express Surface (விரைவு டெலிவரி)' : 'Delhivery Express Surface'}</option>
                  <option>{language === 'ta' ? 'Shiprocket All-India (அகில இந்திய)' : 'Shiprocket All-India'}</option>
                  <option>{language === 'ta' ? 'Professional Couriers (தமிழ்நாடு உள்ளூர்)' : 'Professional Couriers (Local TN)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {language === 'ta' ? 'AWB பார்-கோடு வடிவம்' : 'AWB Barcode Format'}
                </label>
                <input
                  type="text"
                  defaultValue={language === 'ta' ? 'TB-EXP-###### (தானாக உருவாக்கப்பட்டது)' : 'TB-EXP-###### (Auto Generated)'}
                  disabled
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-500"
                />
              </div>
            </div>

            {/* 3. Instagram Live Feed & Showcase Hub */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-700 flex items-center justify-center text-white shadow-xs">
                    <InstagramIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
                      {language === 'ta' ? 'இன்ஸ்டாகிராம் நேரடி ஊட்டம் & புகைப்பட அரங்கம்' : 'Instagram Live Feed & Media Showcase'}
                      <span className="inline-flex items-center gap-1 text-[10px] text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                        <span>{language === 'ta' ? 'தானாக ஒத்திசைக்கப்பட்டது' : 'Auto Synced'}</span>
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      {language === 'ta' ? 'நேரடி புகைப்படங்கள் ஒத்திசைக்கப்பட்டது ' : 'Live pictures synced with '}
                      <a 
                        href="https://www.instagram.com/thalir_boutique_/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-bold text-pink-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        @thalir_boutique_ <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingInsta(!isAddingInsta)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <span>{isAddingInsta ? (language === 'ta' ? 'படிவத்தை மூடு' : 'Close Add Form') : (language === 'ta' ? 'புகைப்படம் / இடுகை சேர்' : 'Add Photo / Post')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => syncInstagramFeed(instaAccessToken || null)}
                    disabled={loadingInstagram}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingInstagram ? 'animate-spin' : ''}`} />
                    <span>{loadingInstagram ? (language === 'ta' ? 'ஒத்திசைக்கிறது...' : 'Syncing...') : (language === 'ta' ? 'இன்ஸ்டாகிராமை உடனே ஒத்திசைக்கவும்' : 'Sync Instagram Now')}</span>
                  </button>
                </div>
              </div>

              {/* Add New Instagram Post Form */}
              {isAddingInsta && (
                <div className="p-4 bg-pink-50/50 rounded-xl border border-pink-200/70 space-y-3 animate-in fade-in">
                  <div className="font-bold text-xs text-pink-900">
                    {language === 'ta' ? 'இன்ஸ்டாகிராம் ஊட்டத்திற்கு புதிய புகைப்படம் / ரீல் சேர்க்கவும்:' : 'Add New Photo / Reel to Instagram Feed:'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {language === 'ta' ? 'படத்தின் URL / மீடியா இணைப்பு *' : 'Image URL / Media Link *'}
                      </label>
                      <input
                        type="url"
                        value={newInstaUrl}
                        onChange={(e) => setNewInstaUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or Instagram CDN link"
                        className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {language === 'ta' ? 'இன்ஸ்டாகிராம் இடுகை இணைப்பு (விருப்பத்தேர்வு)' : 'Instagram Post Permalink (Optional)'}
                      </label>
                      <input
                        type="url"
                        value={newInstaPermalink}
                        onChange={(e) => setNewInstaPermalink(e.target.value)}
                        placeholder="https://www.instagram.com/p/C3.../"
                        className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {language === 'ta' ? 'தலைப்பு / ஹேஷ்டேக்குகள்' : 'Caption / Hashtags'}
                      </label>
                      <input
                        type="text"
                        value={newInstaCaption}
                        onChange={(e) => setNewInstaCaption(e.target.value)}
                        placeholder={language === 'ta' ? 'எ.கா. ✨ பியூர் சாஃப்ட் சில்க் சேலை #thalirboutique' : 'e.g. ✨ Royal Bridal Silk Saree in Peacock Blue #thalirboutique'}
                        className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-stone-300"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingInsta(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-800"
                    >
                      {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newInstaUrl) {
                          showToast(language === 'ta' ? 'தயவுசெய்து பட URL-ஐ வழங்கவும்.' : 'Please provide an image URL.');
                          return;
                        }
                        await addInstagramPost({
                          media_url: newInstaUrl,
                          permalink: newInstaPermalink || 'https://www.instagram.com/thalir_boutique_/',
                          caption: newInstaCaption
                        });
                        setNewInstaUrl('');
                        setNewInstaCaption('');
                        setIsAddingInsta(false);
                      }}
                      className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-xs cursor-pointer"
                    >
                      {language === 'ta' ? 'ஊட்டத்தில் சேமி' : 'Save to Feed'}
                    </button>
                  </div>
                </div>
              )}

              {/* Current Active Instagram Posts Gallery */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  {language === 'ta' ? `தற்போது ஒத்திசைக்கப்பட்ட இன்ஸ்டாகிராம் இடுகைகள் (${instagramPosts?.length || 0} உருப்படிகள்):` : `Currently Synced Instagram Posts (${instagramPosts?.length || 0} items):`}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {(instagramPosts || []).map((post, idx) => (
                    <div key={post.id || post.post_id || idx} className="group relative rounded-xl overflow-hidden aspect-square border border-stone-200 bg-stone-100 shadow-2xs">
                      <img
                        src={resolveInstaMedia(post.media_url)}
                        alt="Instagram Post"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => deleteInstagramPost(post.post_id || post.id)}
                            className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 cursor-pointer shadow-xs"
                            title={language === 'ta' ? 'காட்சியகத்திலிருந்து இந்த புகைப்படத்தை நீக்கு' : 'Remove this photo from showcase'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] leading-tight line-clamp-2 drop-shadow-xs font-medium">
                          {post.caption || '@thalir_boutique_'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Graph API Token Setting */}
              <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    {language === 'ta' ? 'மெட்டா கிராஃப் ஏபிஐ அணுகல் டோக்கன் (தானியங்கி பின்னணி ஒத்திசைவுக்கு)' : 'Meta Graph API Access Token (For automated background auto-polling)'}
                  </label>
                  <input
                    type="password"
                    value={instaAccessToken}
                    onChange={(e) => setInstaAccessToken(e.target.value)}
                    placeholder={language === 'ta' ? 'IGQVJ... (பொது தரவுத்தள ஒத்திசைவைப் பயன்படுத்த காலியாக விடவும்)' : 'IGQVJ... (Leave blank to use public database sync)'}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-200 font-mono"
                  />
                </div>
                <div className="text-[11px] text-stone-500 sm:max-w-xs">
                  {language === 'ta' ? 'புதிய இடுகைகள் அல்லது புகைப்படங்கள் வெளியிடப்படும்போது இணையதளத்தில் உடனுக்குடன் புதுப்பிக்கப்படும்.' : 'Updates on the website reflect real-time when new posts or photos are published.'}
                </div>
              </div>
            </div>

            {/* 4. Payment Credentials */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200">
                <IndianRupee className="w-5 h-5 text-gold-dark" />
                <div>
                  <h3 className="font-serif font-bold text-base text-primary">
                    {language === 'ta' ? 'கடை & கட்டண நற்சான்றிதழ்கள்' : 'Store & Payment Credentials'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {language === 'ta' ? 'UPI QR குறியீடுகள் மற்றும் விஐபி சமூகம்' : 'UPI QR codes and VIP Community'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'நேரடி QR குறியீடுகளுக்கான UPI ஐடி' : 'UPI ID for Direct QR Codes'}
                  </label>
                  <input
                    type="text"
                    defaultValue={storeInfo.upiId}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'ta' ? 'வாட்ஸ்அப் குழு இணைப்பு' : 'WhatsApp Community Link'}
                  </label>
                  <input
                    type="text"
                    defaultValue={storeInfo.whatsappGroupUrl}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (showToast) showToast(language === 'ta' ? 'அனைத்து நற்சான்றிதழ்களும் வெற்றிகரமாக சேமிக்கப்பட்டன! ✓' : 'All configuration credentials saved successfully! ✓');
                  }}
                  className="bg-gold hover:bg-gold-light text-stone-950 font-bold py-2.5 px-6 rounded-xl text-xs cursor-pointer shadow-sm transition-all"
                >
                  {language === 'ta' ? 'அனைத்து நற்சான்றிதழ்களையும் சேமிக்கவும்' : 'Save All Credentials'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Tab: Daybook & Financial Accounts */}
        {activeTab === 'ledger' && (
          <DaybookLedger />
        )}

        {/* Tab: Stock & Inventory Management */}
        {activeTab === 'inventory' && (
          <InventoryManager />
        )}

        {/* Tab: Suppliers & Purchase Invoices */}
        {activeTab === 'suppliers' && (
          <SupplierManager />
        )}

        {/* Tab: Offers & Discount Coupons */}
        {activeTab === 'offers' && (
          <OffersManager />
        )}

        {/* Tab: Returns & Damaged Saree Refunds */}
        {activeTab === 'returns' && (
          <ReturnsManager />
        )}

        {/* Tab: Business Reports & Analytics */}
        {activeTab === 'reports' && (
          <ReportsAnalytics />
        )}

      </main>

      {/* Themed Confirm Delete Modal for Admin Dashboard (Orders / Customers) */}
      {deleteModalConfig.isOpen && (
        <ConfirmDeleteModal
          isOpen={deleteModalConfig.isOpen}
          title={deleteModalConfig.title}
          itemName={deleteModalConfig.itemName}
          itemDetails={deleteModalConfig.itemDetails}
          itemImage={deleteModalConfig.itemImage}
          warningText={deleteModalConfig.warningText}
          confirmBtnText={deleteModalConfig.confirmBtnText}
          onConfirm={deleteModalConfig.onConfirm}
          onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* 1-Click Printable PDF Tax Invoice & Courier Shipping Label Modal */}
      {isInvoiceOpen && (
        <InvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => {
            setIsInvoiceOpen(false);
            setSelectedOrderForInvoice(null);
          }}
          order={selectedOrderForInvoice}
          storeInfo={storeInfo}
          isAdmin={true}
        />
      )}

      {/* Manual / Direct In-Store Order Creation Modal */}
      {isManualOrderOpen && (
        <ManualOrderModal
          isOpen={isManualOrderOpen}
          onClose={() => setIsManualOrderOpen(false)}
        />
      )}

      {/* Edit Order Details & Customer Address Modal */}
      {isOrderEditOpen && (
        <OrderEditModal
          isOpen={isOrderEditOpen}
          onClose={() => {
            setIsOrderEditOpen(false);
            setSelectedOrderForEdit(null);
          }}
          order={selectedOrderForEdit}
        />
      )}

      {/* Payment Proof Verification & Approval Modal */}
      {isVerificationOpen && (
        <PaymentVerificationModal
          isOpen={isVerificationOpen}
          onClose={() => {
            setIsVerificationOpen(false);
            setSelectedOrderForVerification(null);
          }}
          order={selectedOrderForVerification}
          onConfirmPayment={(orderId) => {
            updateOrderStatus(orderId, 'Payment Confirmed');
            if (showToast) showToast(language === 'ta' ? `ஆர்டர் #${orderId} கட்டணம் அங்கீகரிக்கப்பட்டது! ஆர்டர் உறுதி செய்யப்பட்டது.` : `Payment approved for order #${orderId}! Order confirmed.`);
          }}
        />
      )}

    </div>
  );
};


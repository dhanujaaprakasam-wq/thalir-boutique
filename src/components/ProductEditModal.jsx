import React, { useState, useEffect } from 'react';
import { X, Save, Palette, Trash2, Plus, Upload, Check, Image as ImageIcon, Camera, Star, UploadCloud } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { CATEGORY_TEMPLATES, POPULAR_COLORS } from '../data/categoryTemplates';
import { detectDominantColorFromImage, BOUTIQUE_COLOR_PALETTE } from '../utils/colorDetector';
import { detectSareeAndFabric, SAREE_PRESETS } from '../utils/garmentDetector';

export const ProductEditModal = ({ product, isOpen, onClose }) => {
  const { updateProduct, deleteProduct, showToast, language } = useStore();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'sarees',
    basePrice: '',
    originalPrice: '',
    tag: 'New Arrival',
    fabric: '',
    length: '',
    care: '',
    description: '',
    sizes: ['Free Size'],
    images: [],
    isSpecialEvent: false,
    eventName: 'Diwali Dhamaka Sale',
    eventEndTime: null,
    eventBadge: 'Diwali Special'
  });

  const [newProdUrlInput, setNewProdUrlInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [variants, setVariants] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (product) {
      const prodImages = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (product.variants?.flatMap(v => Array.isArray(v.images) ? v.images : [v.image]).filter(Boolean).length > 0
            ? product.variants?.flatMap(v => Array.isArray(v.images) ? v.images : [v.image]).filter(Boolean)
            : (product.image ? [product.image] : []));

      setFormData({
        code: product.code || product.id || '',
        name: product.name || '',
        category: product.category || 'sarees',
        basePrice: product.basePrice || '',
        originalPrice: product.originalPrice || '',
        tag: product.tag || 'New Arrival',
        fabric: product.fabric || '',
        length: product.length || '',
        care: product.care || '',
        description: product.description || '',
        sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size'],
        images: prodImages,
        isSpecialEvent: Boolean(product.isSpecialEvent),
        eventName: product.eventName || 'Diwali Dhamaka Sale',
        eventEndTime: null,
        eventBadge: product.eventBadge || 'Diwali Special'
      });

      if (product.variants && product.variants.length > 0) {
        setVariants(product.variants.map((v, i) => {
          const vCode = v.code || v.productCode || v.product_code || (product.code ? `${product.code}-${String(i + 1).padStart(2, '0')}` : '');
          const vImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
          return {
            id: i + 1,
            code: vCode,
            colorName: v.colorName || 'Standard',
            colorCode: v.colorCode || '#0D5C3A',
            image: vImages[0] || v.image || product.image || '',
            images: vImages.length > 0 ? vImages : (v.image ? [v.image] : []),
            stockQty: v.stockQty ?? 1
          };
        }));
      } else {
        const initImages = prodImages.length > 0 ? prodImages : (product.image ? [product.image] : []);
        setVariants([{
          id: 1,
          code: product.code || '',
          colorName: product.defaultColor || 'Standard',
          colorCode: '#0D5C3A',
          image: initImages[0] || product.image || '',
          images: initImages,
          stockQty: product.stockQty ?? 1
        }]);
      }
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleFileUpload = (file, variantIndex) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const detected = await detectDominantColorFromImage(dataUrl);
      const sareeDetected = await detectSareeAndFabric(dataUrl, file?.name || '', formData.category);

      setVariants(prev => prev.map((v, i) => {
        if (i !== variantIndex) return v;
        const curImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
        const nextImages = curImages.includes(dataUrl) ? curImages : [dataUrl, ...curImages];
        return { 
          ...v, 
          image: dataUrl,
          images: nextImages,
          colorName: detected.colorName || v.colorName,
          colorCode: detected.colorCode || v.colorCode,
          stockQty: v.stockQty ?? 1
        };
      }));

      // Also ensure master images has this image
      setFormData(prev => ({
        ...prev,
        images: prev.images.includes(dataUrl) ? prev.images : [dataUrl, ...prev.images],
        name: (variantIndex === 0 && formData.category === 'sarees' && sareeDetected) ? sareeDetected.sareeName : prev.name,
        fabric: (variantIndex === 0 && formData.category === 'sarees' && sareeDetected) ? sareeDetected.fabric : prev.fabric,
        care: (variantIndex === 0 && formData.category === 'sarees' && sareeDetected) ? sareeDetected.care : prev.care,
        description: (variantIndex === 0 && formData.category === 'sarees' && sareeDetected) ? sareeDetected.description : prev.description
      }));

      if (showToast) showToast(`🎨 Auto-detected: ${sareeDetected?.sareeName || ''} (${detected.colorName})!`);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMoreProductImages = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), dataUrl]
        }));
      };
      reader.readAsDataURL(file);
    });
    if (showToast) showToast(language === 'ta' ? `📸 ${fileList.length} படங்கள் சேர்க்கப்பட்டன!` : `📸 Added ${fileList.length} pictures to gallery!`);
  };

  const handleAddImageUrl = (e) => {
    e?.preventDefault();
    const trimmed = newProdUrlInput.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), trimmed]
    }));
    setNewProdUrlInput('');
  };

  const handleSetPrimaryProductImage = (idx) => {
    setFormData(prev => {
      const list = [...(prev.images || [])];
      if (idx <= 0 || idx >= list.length) return prev;
      const [selected] = list.splice(idx, 1);
      list.unshift(selected);
      return { ...prev, images: list };
    });
  };

  const handleRemoveProductImage = (idx) => {
    setFormData(prev => {
      const list = (prev.images || []).filter((_, i) => i !== idx);
      return { ...prev, images: list };
    });
  };

  const handleUploadMoreVariantImages = (files, variantIndex) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setVariants(prev => prev.map((v, i) => {
          if (i !== variantIndex) return v;
          const curImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
          const nextImages = [...curImages, dataUrl];
          return {
            ...v,
            image: v.image || nextImages[0],
            images: nextImages
          };
        }));
      };
      reader.readAsDataURL(file);
    });
    if (showToast) showToast(language === 'ta' ? `📸 படங்கள் சேர்க்கப்பட்டன!` : `📸 Photos added for this color!`);
  };

  const handleRemoveVariantImage = (variantIndex, imgIndex) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== variantIndex) return v;
      const nextImages = (v.images || []).filter((_, idx) => idx !== imgIndex);
      return {
        ...v,
        images: nextImages,
        image: nextImages[0] || ''
      };
    }));
  };

  const handleSetPrimaryVariantImage = (variantIndex, imgIndex) => {
    setVariants(prev => prev.map((v, i) => {
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

  const addColorVariant = () => {
    const nextIdx = variants.length + 1;
    const baseCode = formData.code ? formData.code.trim().toUpperCase() : 'TB-PRD-';
    setVariants(prev => [
      ...prev,
      {
        id: Date.now(),
        code: `${baseCode}-${String(nextIdx).padStart(2, '0')}`,
        colorName: '',
        colorCode: '#DFBA6D',
        image: '',
        stockQty: 1
      }
    ]);
  };

  const removeColorVariant = (idx) => {
    if (variants.length <= 1) {
      if (showToast) showToast('At least one color variant is required.');
      return;
    }
    setVariants(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleSize = (sz) => {
    setFormData(prev => {
      const exists = prev.sizes.includes(sz);
      const updated = exists ? prev.sizes.filter(s => s !== sz) : [...prev.sizes, sz];
      return { ...prev, sizes: updated.length > 0 ? updated : [sz] };
    });
  };

  const handleAddCustomSize = (e) => {
    e?.preventDefault();
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    setFormData(prev => {
      if (prev.sizes.includes(trimmed)) return prev;
      return { ...prev, sizes: [...prev.sizes, trimmed] };
    });
    setCustomSizeInput('');
  };

  const handleCategoryChange = (newCat) => {
    const tpl = CATEGORY_TEMPLATES[newCat] || CATEGORY_TEMPLATES['sarees'];
    setFormData(prev => ({
      ...prev,
      category: newCat,
      sizes: [...tpl.defaultSizes]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.basePrice) {
      if (showToast) showToast('Please enter Product Name and Price.');
      return;
    }

    setIsSaving(true);
    try {
      const baseCode = formData.code ? formData.code.trim().toUpperCase() : (product.code || 'TB-PRD-001');
      const finalProdImages = (formData.images && formData.images.length > 0)
        ? formData.images
        : (variants.flatMap(v => Array.isArray(v.images) ? v.images : [v.image]).filter(Boolean).length > 0 
            ? variants.flatMap(v => Array.isArray(v.images) ? v.images : [v.image]).filter(Boolean) 
            : [product.image]);

      const payload = {
        code: baseCode,
        name: formData.name.trim(),
        category: formData.category,
        basePrice: Number(formData.basePrice),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        tag: formData.tag,
        isSpecialEvent: Boolean(formData.isSpecialEvent),
        eventName: formData.isSpecialEvent ? formData.eventName : '',
        eventEndTime: formData.isSpecialEvent ? formData.eventEndTime : null,
        eventBadge: formData.isSpecialEvent ? formData.eventBadge : '',
        fabric: formData.fabric,
        length: formData.length,
        care: formData.care,
        description: formData.description,
        sizes: formData.sizes,
        image: finalProdImages[0] || product.image,
        images: finalProdImages,
        variants: variants.map((v, idx) => {
          const vImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
          return {
            code: v.code ? v.code.trim().toUpperCase() : `${baseCode}-${String(idx + 1).padStart(2, '0')}`,
            colorName: v.colorName.trim() || 'Standard',
            colorCode: v.colorCode || '#0D5C3A',
            image: vImages[0] || v.image || product.image,
            images: vImages.length > 0 ? vImages : [v.image || product.image],
            stockQty: Number(v.stockQty) || 10,
            inStock: true
          };
        })
      };

      await updateProduct(product.id, payload);
      if (showToast) showToast(language === 'ta' ? 'தயாரிப்பு வெற்றிகரமாக புதுப்பிக்கப்பட்டது! ✨' : 'Product updated successfully! ✨');
      onClose();
    } catch (err) {
      if (showToast) showToast(`Failed to update product: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteAction = async () => {
    await deleteProduct(product.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-gold/50 flex flex-col my-auto relative">
          
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#073822] to-[#0D5C3A] text-white flex items-center justify-between border-b-2 border-gold">
            <div>
              <span className="text-[11px] text-gold-shimmer font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'நிர்வாக அங்காடி திருத்தி' : 'Admin Storefront Editor'}
              </span>
              <h3 className="font-serif font-bold text-lg text-white">
                {language === 'ta' ? `தயாரிப்பை மாற்று: ${product.name}` : `Modify Product: ${product.name}`}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {language === 'ta' ? 'தயாரிப்பு குறியீடு (SKU)' : 'Product Code (SKU)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. TB-SAR-001"
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-200 focus:border-primary outline-none font-mono font-bold text-primary uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {language === 'ta' ? 'தயாரிப்பு பெயர்' : 'Product Title'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-200 focus:border-primary outline-none font-medium"
                />

                {/* Saree Type Selector Chips */}
                {formData.category === 'sarees' && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-stone-500 uppercase mr-0.5">
                      {language === 'ta' ? 'சேலை வகைகள்:' : 'Saree Types:'}
                    </span>
                    {SAREE_PRESETS.map((preset) => {
                      const isSelected = formData.name === preset.name || formData.name === preset.nameTa;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              name: language === 'ta' ? preset.nameTa : preset.name,
                              fabric: language === 'ta' ? preset.fabricTa : preset.fabric,
                              description: preset.description,
                              care: preset.care,
                              length: preset.length || prev.length
                            }));
                          }}
                          className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
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
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {language === 'ta' ? 'வகை' : 'Category'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-200 focus:border-primary outline-none bg-white font-medium cursor-pointer"
                >
                  <option value="sarees">{language === 'ta' ? '👘 சேலைகள் (இலவச அளவு • 6.3 மீ)' : '👘 Sarees (Free Size • 6.3m)'}</option>
                  <option value="kurtis">{language === 'ta' ? '👗 குர்திகள் (XS முதல் 3XL)' : '👗 Kurtis & Sets (XS to 3XL)'}</option>
                  <option value="inskirts">{language === 'ta' ? '🪡 உள்பாவாடைகள் (6 முதல் 10 பாக வெட்டுகள்)' : '🪡 Inskirts (6-Part to 10-Part Panel Cuts)'}</option>
                  <option value="blouse-materials">{language === 'ta' ? '✂️ பிளவுஸ் துணிகள் (மீட்டர் வெட்டுகள்)' : '✂️ Blouse Materials (Meter Cuts)'}</option>
                  <option value="linings">{language === 'ta' ? '🧵 லைனிங் துணிகள் (மீட்டர் வெட்டுகள்)' : '🧵 Linings (Meter Cuts)'}</option>
                  <option value="chudi-material">{language === 'ta' ? '✨ சுடிதார் மெட்டீரியல்ஸ் (இலவச அளவு)' : '✨ Chudi Materials (Free Size Set)'}</option>
                  <option value="night-wear">{language === 'ta' ? '🌙 நைட் வேர் ஆடைகள் (XS முதல் 3XL)' : '🌙 Night Wear & Loungewear (XS to 3XL)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {language === 'ta' ? 'விற்பனை விலை (₹)' : 'Selling Price (₹)'}
                </label>
                <input
                  type="number"
                  required
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-200 focus:border-primary outline-none font-bold text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {language === 'ta' ? 'அசல் விலை (₹)' : 'Original MRP (₹)'}
                </label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  placeholder="e.g. 1290"
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-200 focus:border-primary outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {language === 'ta' ? 'காட்சி டேக்' : 'Display Tag'}
                </label>
                <select
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-200 focus:border-primary outline-none bg-white"
                >
                  <option value="New Arrival">{language === 'ta' ? '✨ புதிய வரவு' : '✨ New Arrival'}</option>
                  <option value="">{language === 'ta' ? '⚪ சாதாரண தயாரிப்பு (டேக் இல்லை)' : '⚪ Normal / Regular (No Badge)'}</option>
                  <option value="Trending">{language === 'ta' ? '🔥 டிரெண்டிங்' : '🔥 Trending Now'}</option>
                  <option value="Bestseller">{language === 'ta' ? '⭐ அதிகம் விற்பனையாகும்' : '⭐ Bestseller'}</option>
                  <option value="Handloom Special">{language === 'ta' ? '🌿 கைத்தறி ஸ்பெஷல்' : '🌿 Handloom Special'}</option>
                  <option value="Festive Edit">{language === 'ta' ? '🎉 பண்டிகை பதிப்பு' : '🎉 Festive Edit'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {language === 'ta' ? 'துணி வகை' : 'Fabric Type'}
                </label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  placeholder="e.g. Pure Tissue Silk / Rayon"
                  className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-stone-200 focus:border-primary outline-none"
                />
                {(CATEGORY_TEMPLATES[formData.category]?.fabricPresets) && (
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {CATEGORY_TEMPLATES[formData.category].fabricPresets.slice(0, 4).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFormData({ ...formData, fabric: f })}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          formData.fabric === f ? 'bg-primary text-white border-primary' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Special Event / Festival Flash Sale Toggle & Settings */}
            <div className={`p-4 rounded-2xl border transition-all ${
              formData.isSpecialEvent
                ? 'bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-red-50/90 border-amber-300 shadow-md ring-1 ring-amber-400/40'
                : 'bg-stone-50 border-stone-200'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-200/80">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-sm ${
                    formData.isSpecialEvent ? 'bg-amber-500 text-white animate-bounce' : 'bg-stone-200 text-stone-500'
                  }`}>
                    🪔
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                      <span>{language === 'ta' ? 'பண்டிகை / சிறப்பு நிகழ்வு தயாரிப்பு (Festival Sale)' : 'Special Event / Festival Sale Product'}</span>
                      {formData.isSpecialEvent && (
                        <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {language === 'ta' ? 'செயலில் உள்ளது' : 'Active'}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      {language === 'ta'
                        ? 'தீபாவளி, பொங்கல், புத்தாண்டு போன்ற சிறப்பு பண்டிகை விற்பனை பேனரில் பிரத்யேகமாக இணைக்கவும்.'
                        : 'Highlight in the celebratory festival sale banner (Diwali, Pongal, New Year, Wedding Specials).'}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isSpecialEvent)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        isSpecialEvent: checked,
                        eventName: prev.eventName || 'Diwali Dhamaka Sale',
                        eventBadge: prev.eventBadge || 'Diwali Special',
                        eventEndTime: null
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 shadow-inner"></div>
                  <span className="ml-2 text-xs font-bold text-stone-800">
                    {formData.isSpecialEvent ? (language === 'ta' ? 'ஆம், சிறப்பு நிகழ்வு' : 'Special Event') : (language === 'ta' ? 'சாதாரண தயாரிப்பு' : 'Regular')}
                  </span>
                </label>
              </div>

              {formData.isSpecialEvent && (
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                  {/* Occasion / Event Name (Editable with Quick Presets) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                        🪔 {language === 'ta' ? 'சிறப்பு பண்டிகை / நிகழ்வு பெயர்' : 'Special Occasion / Event Name'}
                      </label>
                      <span className="text-[10px] text-amber-800 font-normal">
                        {language === 'ta' ? 'மாற்றிக்கொள்ளலாம்' : 'Editable'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.eventName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                      placeholder={language === 'ta' ? 'எ.கா. தீபாவளி சிறப்பு விற்பனை / பொங்கல் தள்ளுபடி' : 'e.g. Diwali Dhamaka Sale / Pongal Mega Offer'}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-stone-300 bg-white outline-none focus:border-amber-500 shadow-2xs"
                    />
                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {[
                        { name: 'Diwali Dhamaka Sale', taName: 'தீபாவளி சிறப்பு விற்பனை', badge: 'Diwali Special', icon: '🪔' },
                        { name: 'Pongal Thiruvizha Sale', taName: 'பொங்கல் திருவிழா விற்பனை', badge: 'Pongal Offer', icon: '🌾' },
                        { name: 'Aadi Kondattam Sale', taName: 'ஆடி கொண்டாட்டம்', badge: 'Aadi Special', icon: '🌿' },
                        { name: 'Christmas Celebration Sale', taName: 'கிறிஸ்துமஸ் சிறப்பு விற்பனை', badge: 'Christmas Special', icon: '🎄' },
                        { name: 'Eid Mubarak Special', taName: 'ரமலான் & பெருநாள் சிறப்பு', badge: 'Eid Special', icon: '🌙' },
                        { name: 'New Year Mega Sale', taName: 'புத்தாண்டு மெகா விற்பனை', badge: 'New Year Special', icon: '✨' },
                        { name: 'Wedding Festive Edit', taName: 'திருமண தொகுப்பு', badge: 'Wedding Edit', icon: '💍' },
                        { name: 'Weekend Mega Offer', taName: 'வார இறுதி சலுகை', badge: 'Weekend Deal', icon: '⚡' }
                      ].map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              eventName: language === 'ta' ? preset.taName : preset.name,
                              eventBadge: preset.badge
                            }));
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            (formData.eventName === preset.name || formData.eventName === preset.taName)
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white hover:bg-amber-50 border-stone-200 text-stone-700'
                          }`}
                        >
                          <span>{preset.icon}</span>
                          <span>{language === 'ta' ? preset.taName : preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Festive Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                        🔥 {language === 'ta' ? 'அட்டை முத்திரை (Card Badge)' : 'Card Festive Badge'}
                      </label>
                      <span className="text-[10px] text-amber-800 font-normal">
                        {language === 'ta' ? 'அட்டையில் தெரியும்' : 'Shown on card'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.eventBadge || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventBadge: e.target.value }))}
                      placeholder="e.g. DIWALI SPECIAL / PONGAL OFFER"
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-stone-300 bg-white outline-none focus:border-amber-500 uppercase text-amber-900 shadow-2xs"
                    />
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                      <span className="text-stone-500 text-[10px]">{language === 'ta' ? 'முன்னோட்டம்:' : 'Preview:'}</span>
                      <span className="bg-gradient-to-r from-red-600 to-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase shadow-2xs">
                        🔥 {formData.eventBadge || 'FESTIVAL SPECIAL'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                {language === 'ta' ? 'விளக்கம்' : 'Description'}
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 focus:border-primary outline-none"
              />
            </div>

            {/* Dynamic Sizes according to Category */}
            {(() => {
              const currentTpl = CATEGORY_TEMPLATES[formData.category] || CATEGORY_TEMPLATES['sarees'];
              return (
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-700 uppercase">
                      {language === 'ta' ? 'கிடைக்கும் அளவுகள் / வெட்டுகள்' : 'Available Sizes / Cuts'} ({currentTpl.sizeLabel})
                    </label>
                    {currentTpl.sizeType !== 'free' && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, sizes: [...currentTpl.sizeOptions] })}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        {language === 'ta' ? 'அனைத்தையும் தேர்ந்தெடு' : 'Select All'}
                      </button>
                    )}
                  </div>

                  {currentTpl.sizeType === 'free' ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Free Size (Universal)
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {currentTpl.sizeOptions.map(sz => {
                          const isSelected = formData.sizes?.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSize(sz)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                isSelected ? 'bg-primary text-white border-primary' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <span>{sz}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 pt-1 max-w-xs">
                        <input
                          type="text"
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          placeholder={language === 'ta' ? 'தனிப்பயன் அளவு...' : 'Add custom size...'}
                          className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-white flex-1 outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSize(e)}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          + {language === 'ta' ? 'சேர்' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Multi-Photo Gallery for Same Product / Saree (Pallu, Blouse, Border, Angles) */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                    <Camera className="w-4 h-4 text-primary" />
                    <span>{language === 'ta' ? 'தயாரிப்பு புகைப்படக் காட்சியகம் (ஒரே தயாரிப்பின் பல படங்கள்)' : 'Product Photo Gallery (Multiple Pictures of Same Product)'}</span>
                    <span className="text-[11px] bg-primary text-white font-extrabold px-2 py-0.2 rounded-full">
                      {(formData.images || []).length}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {language === 'ta'
                      ? 'ஒரே சேலையின் பல்லு, பிளவுஸ் பிட், பார்டர், முழு தோற்றம் போன்ற கூடுதல் புகைப்படங்களைச் சேர்க்கவும்.'
                      : 'Upload and organize multiple angles of the same saree: Pallu view, Blouse piece, Border detail, Draped view.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs w-full sm:w-auto">
                    <UploadCloud className="w-3.5 h-3.5 text-gold-shimmer" />
                    <span>{language === 'ta' ? '+ படங்கள் பதிவேற்று (பல படங்கள்)' : '+ Upload Photos (Multiple)'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadMoreProductImages(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {/* Uploaded Gallery Thumbnails Grid */}
              {(formData.images || []).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                  {(formData.images || []).map((img, imgIdx) => (
                    <div 
                      key={imgIdx} 
                      className={`relative rounded-xl overflow-hidden border-2 bg-white shadow-2xs group ${
                        imgIdx === 0 ? 'border-primary ring-2 ring-primary/30' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="w-full h-24 overflow-hidden bg-stone-100 flex items-center justify-center">
                        <img src={img} alt={`Product ${imgIdx + 1}`} className="w-full h-full object-cover" />
                      </div>

                      {/* Cover Badge on First Photo */}
                      {imgIdx === 0 ? (
                        <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                          {language === 'ta' ? 'முதன்மை' : 'Cover'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryProductImage(imgIdx)}
                          className="absolute top-1 left-1 bg-white/90 hover:bg-primary hover:text-white text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm transition-colors cursor-pointer opacity-90 group-hover:opacity-100"
                          title={language === 'ta' ? 'முதன்மைப் படமாக மாற்று' : 'Set as Cover Photo'}
                        >
                          ⭐ {language === 'ta' ? 'அமை' : 'Make Cover'}
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveProductImage(imgIdx)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full shadow-sm transition-colors cursor-pointer"
                        title={language === 'ta' ? 'படத்தை நீக்கு' : 'Remove photo'}
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <div className="p-1 bg-white/95 text-[9px] text-stone-500 font-bold text-center border-t border-stone-100">
                        #{imgIdx + 1} {imgIdx === 0 ? (language === 'ta' ? 'முழு படம்' : 'Main View') : (imgIdx === 1 ? (language === 'ta' ? 'பல்லு / விவரம்' : 'Pallu/Detail') : (language === 'ta' ? 'கோணம்' : 'Angle'))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-emerald-200 rounded-xl bg-white text-center">
                  <p className="text-xs text-stone-600 font-medium">
                    {language === 'ta' ? 'இன்னும் கூடுதல் படங்கள் பதிவேற்றப்படவில்லை.' : 'No additional gallery photos added yet.'}
                  </p>
                </div>
              )}

              {/* Paste URL for product gallery */}
              <div className="flex gap-2 pt-1">
                <input
                  type="url"
                  value={newProdUrlInput}
                  onChange={(e) => setNewProdUrlInput(e.target.value)}
                  placeholder={language === 'ta' ? 'அல்லது படத்தின் URL ஐ ஒட்டவும்...' : 'Or paste additional image URL (e.g. Pallu / Blouse URL)...'}
                  className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  + {language === 'ta' ? 'URL சேர்' : 'Add URL'}
                </button>
              </div>
            </div>

            {/* Color Variants & Stock */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-primary" />
                  <span>{language === 'ta' ? 'வண்ணங்கள் & இருப்பு எண்ணிக்கை' : 'Color Variants & Stock Quantities'}</span>
                </label>
                <button
                  type="button"
                  onClick={addColorVariant}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {language === 'ta' ? '+ வண்ணம் சேர்' : '+ Add Color Variant'}
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div key={v.id || idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      
                      {/* Image Preview / Upload */}
                      <div className="sm:col-span-3 flex items-center gap-2">
                        <div className="w-12 h-12 rounded-lg bg-white border border-stone-300 overflow-hidden shrink-0 flex items-center justify-center relative">
                          {v.image ? (
                            <img src={v.image} alt={v.colorName} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                            <Upload className="w-3 h-3" /> {language === 'ta' ? 'படம் மாற்று' : 'Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e.target.files[0], idx)}
                            />
                          </label>
                          <label className="text-[10px] text-stone-500 hover:text-stone-800 cursor-pointer flex items-center gap-1">
                            <Plus className="w-2.5 h-2.5" /> {language === 'ta' ? '+ கூடுதல் படங்கள்' : '+ More Photos'}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadMoreVariantImages(e.target.files, idx)}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Color Name */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-0.5">
                          {language === 'ta' ? 'வண்ணம்' : 'Color Name'}
                        </label>
                        <input
                          type="text"
                          value={v.colorName}
                          list="edit-boutique-color-options"
                          onChange={(e) => {
                            const val = e.target.value;
                            const matched = BOUTIQUE_COLOR_PALETTE.find(c => c.name.toLowerCase() === val.toLowerCase());
                            setVariants(prev => prev.map((item, i) => i === idx ? { 
                              ...item, 
                              colorName: val,
                              colorCode: matched ? matched.hex : item.colorCode 
                            } : item));
                          }}
                          placeholder="e.g. Peacock Blue"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                        />
                      </div>

                      {/* Color Hex & Swatch */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-0.5">
                          {language === 'ta' ? 'வண்ணக் குறியீடு' : 'Swatch Hex'}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={v.colorCode || '#0D5C3A'}
                            onChange={(e) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, colorCode: e.target.value } : item))}
                            className="w-6 h-6 rounded cursor-pointer border border-stone-300 p-0"
                          />
                          <input
                            type="text"
                            value={v.colorCode || '#0D5C3A'}
                            onChange={(e) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, colorCode: e.target.value } : item))}
                            className="w-16 text-xs px-1.5 py-1 rounded border border-stone-200 font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      {/* Stock Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-0.5">
                          {language === 'ta' ? 'இருப்பு' : 'Stock Units'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={v.stockQty}
                          onChange={(e) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, stockQty: Number(e.target.value) } : item))}
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-stone-200 bg-white text-center font-bold"
                        />
                      </div>

                      {/* Delete variant */}
                      <div className="sm:col-span-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeColorVariant(idx)}
                          className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                          title="Remove color variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Variant Multi-Photo Sub-Strip if more than 1 photo exists */}
                    {Array.isArray(v.images) && v.images.length > 1 && (
                      <div className="flex items-center gap-1.5 pt-1 border-t border-stone-200/60 overflow-x-auto">
                        <span className="text-[10px] font-bold text-stone-500 whitespace-nowrap">
                          {language === 'ta' ? 'இந்த வண்ணத்தின் படங்கள்:' : 'Photos of this color:'}
                        </span>
                        {v.images.map((vImg, vImgIdx) => (
                          <div key={vImgIdx} className="relative w-8 h-8 rounded border border-stone-300 overflow-hidden shrink-0 group">
                            <img src={vImg} alt="" className="w-full h-full object-cover" />
                            {vImgIdx === 0 && (
                              <span className="absolute inset-0 bg-primary/40 border border-primary pointer-events-none" />
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantImage(idx, vImgIdx)}
                              className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Remove photo"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> {language === 'ta' ? 'தயாரிப்பை நீக்கு' : 'Delete Product'}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? (language === 'ta' ? 'மாற்றங்கள் சேமிக்கப்படுகிறது...' : 'Saving Changes...') : (language === 'ta' ? 'சேமி & புதுப்பி' : 'Save & Update')}</span>
                </button>
              </div>
            </div>

            <datalist id="edit-boutique-color-options">
              {BOUTIQUE_COLOR_PALETTE.map(c => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>

          </form>

        </div>
      </div>

      {/* Themed Confirm Delete Modal */}
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          title={language === 'ta' ? 'தயாரிப்பை நீக்கு' : 'Delete Product'}
          itemName={product.name}
          itemDetails={`Category: ${formData.category} • Price: ₹${formData.basePrice}`}
          itemImage={product.image}
          warningText={language === 'ta' ? `"${product.name}" தயாரிப்பை நிரந்தரமாக நீக்க விரும்புகிறீர்களா? இது உங்கள் பட்டியலிலிருந்து அகற்றப்படும்.` : `Are you sure you want to delete "${product.name}"? It will be removed from your catalog.`}
          confirmBtnText={language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete Product'}
          onConfirm={confirmDeleteAction}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </>
  );
};

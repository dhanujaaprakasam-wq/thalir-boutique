import React from 'react';
import { ShoppingBasket, Sparkles, Gem, Palette, Truck, ArrowRight } from 'lucide-react';
import { InstagramIcon } from './Icons';
import { useStore } from '../context/StoreContext';
import logoImg from '../assets/logo.jpg';

export const Hero = () => {
  const { storeInfo, products, setSelectedProductForModal, language } = useStore();

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Featured product: Show the most recently added product on the front home page
  const featuredProduct = products && products.length > 0 ? products[0] : null;

  const featuredImage = featuredProduct?.variants?.[0]?.image || 
                        featuredProduct?.image || 
                        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80';

  const variantCount = featuredProduct?.variants?.length || 1;
  const productTag = featuredProduct?.tag || 'New Arrival';

  const handleOpenFeaturedProduct = () => {
    if (featuredProduct) {
      setSelectedProductForModal(featuredProduct);
    } else {
      scrollToCatalog();
    }
  };

  return (
    <section id="home" className="relative bg-gradient-to-br from-[#073822] via-[#0D5C3A] to-[#167C50] text-white py-16 sm:py-24 overflow-hidden">
      {/* Background Subtle Radial Dot Pattern */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#DFBA6D 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading & Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-gold/40 text-gold-shimmer text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>{language === 'ta' ? 'தூய நேர்த்தி & தனித்துவ அழகு' : 'Pure Elegance & Supreme Comfort'}</span>
            </div>

            {/* Main Heading with Brand Logo integrated */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
              <div className="relative group shrink-0">
                <img
                  src={logoImg}
                  alt="Thalir Boutique Emblem"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-gold shadow-2xl animate-pulse ring-4 ring-gold/20"
                />
              </div>
              <div>
                <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                  {language === 'ta' ? 'பிரபலமான சேலைகள்' : 'Trending Sarees'} <br />
                  <span className="bg-gradient-to-r from-[#DFBA6D] via-[#F6E3BA] to-[#C5A059] bg-clip-text text-transparent italic font-normal">
                    {language === 'ta' ? 'தன்னம்பிக்கையும் தனித்துவ அழகும்' : 'Feel Confident & Elegant'}
                  </span>
                </h1>
              </div>
            </div>

            {/* Description */}
            <p className="text-stone-200 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {language === 'ta'
                ? 'நேர்த்தியான பட்டுச் சேலைகள், பண்டிகை குர்திகள், தூய பருத்தி பிளவுஸ் துணிகள், சுடிதார் மெட்டீரியல்ஸ், மற்றும் பிரீமியம் நைட்டி ஆடைகள். கைத்தறி பாரம்பரிய நெசவு.'
                : 'Curated South Indian silks, designer festive kurtis, pure cotton & soft silk blouse pieces, unstitched chudidhar materials, premium cotton inskirts, and ultra-soft comfort nightwear. Handpicked craftsmanship for every celebration.'
              }
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={scrollToCatalog}
                className="bg-gradient-to-r from-[#DFBA6D] via-[#C5A059] to-[#AF8B43] hover:from-[#E5C67F] hover:to-[#C5A059] text-stone-900 font-bold px-7 py-3.5 rounded-full shadow-gold hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm sm:text-base transform hover:-translate-y-0.5 cursor-pointer"
              >
                <ShoppingBasket className="w-5 h-5" />
                <span>{language === 'ta' ? 'அனைத்து ஆடைகளையும் காண்க' : 'Explore All Collections'}</span>
              </button>

              <a
                href={storeInfo.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="border-2 border-white/40 hover:border-white text-white bg-white/5 hover:bg-white/10 font-semibold px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
              >
                <InstagramIcon className="w-5 h-5 text-pink-400" /> Follow {storeInfo.instagramHandle}
              </a>
            </div>

            {/* Key Value Highlights */}
            <div className="pt-8 border-t border-white/15 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0">
                  <Gem className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-medium text-stone-100">
                  {language === 'ta' ? 'உயர்தர துணிகள்' : 'Premium Fabrics'}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-medium text-stone-100">
                  {language === 'ta' ? 'பல வண்ண ரகங்கள்' : 'Multi-Color Variants'}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-medium text-stone-100">
                    {language === 'ta' ? 'அகில இந்திய டெலிவரி' : 'All-India Delivery'}
                  </div>
                  <div className="text-[10px] text-gold font-medium">
                    {language === 'ta' ? '(குறைந்த கட்டணம்)' : '(Shipping extra)'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase Card (Clickable Top Product) */}
          <div className="lg:col-span-5 flex justify-center">
            <div 
              onClick={handleOpenFeaturedProduct}
              className="relative w-full max-w-md cursor-pointer group"
              title="Click to view product details"
            >
              <div className="relative bg-white p-3 rounded-3xl shadow-2xl border-4 border-gold/40 overflow-hidden transform group-hover:scale-[1.02] group-hover:border-gold transition-all duration-300">
                
                {/* Tag Badge */}
                <div className="absolute top-5 right-5 z-20 bg-gradient-to-r from-[#DFBA6D] to-[#C5A059] text-stone-950 text-xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{productTag}</span>
                </div>

                <div className="w-full h-[400px] overflow-hidden rounded-2xl bg-stone-100 relative">
                  <img
                    src={featuredImage}
                    alt={featuredProduct?.name || "Featured Product"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Subtle overlay on hover */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-primary/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                      {language === 'ta' ? 'விவரங்களைக் காண்க & ஆர்டர் செய்க' : 'View Details & Order'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
                
                {/* Floating Info Pill */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-stone-200 flex items-center justify-between text-stone-900 group-hover:border-primary/40 transition-colors">
                  <div className="max-w-[65%]">
                    <h4 className="font-serif font-bold text-primary text-sm sm:text-base truncate">
                      {featuredProduct?.name || "Kanjivaram Silk Zari Border"}
                    </h4>
                    <p className="text-xs text-stone-500 font-medium">
                      {variantCount > 1
                        ? (language === 'ta' ? `${variantCount} வண்ணங்களில் கிடைக்கிறது` : `Available in ${variantCount} Rich Colors`)
                        : (featuredProduct?.categoryName || (language === 'ta' ? 'தனித்துவ வடிவமைப்பு' : 'Exclusive Design'))}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-lg sm:text-xl text-primary-dark block">
                      ₹{Number(featuredProduct?.basePrice || 2499).toLocaleString('en-IN')}
                    </span>
                    <span className="inline-block text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {language === 'ta' ? 'இருப்பில் உள்ளது' : 'In Stock'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

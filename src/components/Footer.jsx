import React from 'react';
import { MessageCircle, Phone, MapPin, Sparkles, Users } from 'lucide-react';
import { InstagramIcon } from './Icons';
import { useStore } from '../context/StoreContext';
import logoImg from '../assets/logo.jpg';

export const Footer = ({ onOpenAdminLogin }) => {
  const { storeInfo, setActiveCategory, language } = useStore();

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#062818] text-stone-300 pt-16 pb-8 border-t-4 border-gold">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* 4 Column Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="Thalir Boutique"
                className="w-12 h-12 rounded-full border-2 border-gold object-cover"
              />
              <h3 className="font-serif font-bold text-xl text-white">Thalir Boutique</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              {language === 'ta'
                ? 'வெப்படை, நாமக்கல்லில் அமைந்துள்ள தளிர்ப் பொட்டிக் - பிரபலமான சேலைகள், திருவிழா குர்திகள், ஆரி ஒர்க் பிளவுஸ் துணிகள், சுடிதார் மெட்டீரியல்ஸ் மற்றும் நைட்டி ஆடைகள்.'
                : 'Your premier boutique destination in Veppadai, Namakkal for trending Sarees, festive Kurtis, heavy aari work Blouse Materials, chudidhars, inskirts, and supreme comfort nightwear.'
              }
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={storeInfo.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-pink-600 text-white flex items-center justify-center transition-colors"
                title="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${storeInfo.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-whatsapp text-white flex items-center justify-center transition-colors"
                title="WhatsApp Direct"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={storeInfo.whatsappGroupUrl}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold text-white flex items-center justify-center transition-colors"
                title="VIP WhatsApp Group"
              >
                <Users className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop Categories (6 Categories) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gold/40 pb-2 inline-block">
              {language === 'ta' ? 'ஆடை வகைகள்' : 'Shop Categories'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-400">
              <li>
                <button onClick={() => handleCategoryClick('sarees')} className="hover:text-gold transition-colors cursor-pointer">
                  {language === 'ta' ? 'பிரபல பட்டுச் சேலைகள்' : 'Trending Silk Sarees'}
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('kurtis')} className="hover:text-gold transition-colors cursor-pointer">
                  {language === 'ta' ? 'பண்டிகை குர்திகள்' : 'Designer Festive Kurtis'}
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('blouse-materials')} className="hover:text-gold transition-colors cursor-pointer">
                  {language === 'ta' ? 'பிளவுஸ் துணிகள்' : 'Cotton & Silk Blouse Materials'}
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('chudi-material')} className="hover:text-gold transition-colors cursor-pointer">
                  {language === 'ta' ? 'சுடிதார் மெட்டீரியல்ஸ்' : 'Chudidhar Dress Materials'}
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('inskirts')} className="hover:text-gold transition-colors cursor-pointer">
                  {language === 'ta' ? 'பருத்தி உள்பாவாடைகள்' : 'Pure Cotton Inskirts & Shapewear'}
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('night-wear')} className="hover:text-gold transition-colors cursor-pointer">
                  {language === 'ta' ? 'நைட் வேர் ஆடைகள்' : 'Cotton & Satin Night Wear'}
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gold/40 pb-2 inline-block">
              {language === 'ta' ? 'விரைவு இணைப்புகள்' : 'Quick Links'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-400">
              <li><a href="#home" className="hover:text-gold transition-colors">{language === 'ta' ? 'முகப்பு' : 'Home'}</a></li>
              <li><a href="#catalog" className="hover:text-gold transition-colors">{language === 'ta' ? 'அனைத்து தொகுப்புகள்' : 'All Collections'}</a></li>
              <li><a href="#about" className="hover:text-gold transition-colors">{language === 'ta' ? 'நேரடி கடை' : 'Physical Store'}</a></li>
              <li><a href={storeInfo.mapsUrl} target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">{language === 'ta' ? 'கூகுள் மேப்ஸ்' : 'Google Maps'}</a></li>
            </ul>
          </div>

          {/* Contact & Store */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gold/40 pb-2 inline-block">
              {language === 'ta' ? 'கடை & நேரடி ஆர்டர்கள்' : 'Store & Direct Orders'}
            </h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>5/797, NC Colony, Kumarapalayam Main Rd, Veppadai, Namakkal 638008</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <a href={`tel:${storeInfo.rawPhone}`} className="hover:text-white font-medium">
                  {storeInfo.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-whatsapp shrink-0" />
                <a href={`https://wa.me/${storeInfo.whatsappNumber}`} className="hover:text-white font-medium">
                  {language === 'ta' ? 'வாட்ஸ்அப் உதவி' : 'WhatsApp Support'}
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row justify-center items-center gap-2 text-xs text-stone-500">
          <p>© 2026 Thalir Boutique. {language === 'ta' ? 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' : 'All Rights Reserved.'} Veppadai, Namakkal.</p>
        </div>

      </div>
    </footer>
  );
};

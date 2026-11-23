import React from 'react';
import { Sparkles, Shirt, Sparkle, Scissors, Layers, Smile, Moon } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CATEGORIES } from '../data/products';

const iconMap = {
  Sparkles,
  Shirt,
  Sparkle,
  Scissors,
  Layers,
  Smile,
  Moon
};

const categoryTamilLabels = {
  'all': 'அனைத்தும்',
  'sarees': 'சேலைகள்',
  'blouse-materials': 'பிளவுஸ் துணிகள்',
  'chudi-material': 'சுடிதார் மெட்டீரியல்ஸ்',
  'inskirts': 'உள்பாவாடைகள்',
  'linings': 'லைனிங் துணிகள்',
  'night-wear': 'நைட் வேர்'
};

export const CategoryTabs = () => {
  const { activeCategory, setActiveCategory, language, products } = useStore();
  
  // Only count products explicitly marked for special events / occasions
  const specialProducts = (products || []).filter(p => p.isSpecialEvent);
  const festivalCount = specialProducts.length;

  // Active event details
  const activeSpecial = specialProducts.find(p => p.eventName) || specialProducts[0];
  const rawEventName = activeSpecial?.eventName || '';
  const rawEventBadge = activeSpecial?.eventBadge || '';
  const fullSearch = `${rawEventName} ${rawEventBadge}`;

  // Detect festival type
  const isDiwali = /diwali|deepavali|தீபாவளி/i.test(fullSearch);
  const isPongal = /pongal|sankranti|பொங்கல்|மகர/i.test(fullSearch);
  const isAadi = /aadi|ஆடி/i.test(fullSearch);
  const isChristmas = /christmas|xmas|x-mas|கிறிஸ்துமஸ்/i.test(fullSearch);
  const isEid = /eid|ramadan|ramzan|ரம்ஜான்|பெருநாள்/i.test(fullSearch);
  const isNewYear = /new year|newyear|புத்தாண்டு/i.test(fullSearch);
  const isWedding = /wedding|bridal|muhurtham|திருமணம்|முகூர்த்த/i.test(fullSearch);

  const eventIcon = isDiwali ? '🪔' : isPongal ? '🌾' : isAadi ? '🌿' : isChristmas ? '🎄' : isEid ? '🌙' : isNewYear ? '✨' : isWedding ? '💍' : '🎉';

  const eventLabel = rawEventName 
    ? rawEventName 
    : (isDiwali ? (language === 'ta' ? 'தீபாவளி சிறப்பு' : 'Diwali Specials')
    : isPongal ? (language === 'ta' ? 'பொங்கல் திருவிழா' : 'Pongal Specials')
    : isAadi ? (language === 'ta' ? 'ஆடி தள்ளுபடி' : 'Aadi Offers')
    : isChristmas ? (language === 'ta' ? 'கிறிஸ்துமஸ் சிறப்பு' : 'Christmas Specials')
    : isEid ? (language === 'ta' ? 'ரமலான் சிறப்பு' : 'Eid Specials')
    : isNewYear ? (language === 'ta' ? 'புத்தாண்டு சலுகை' : 'New Year Specials')
    : isWedding ? (language === 'ta' ? 'முகூர்த்த சிறப்பு' : 'Wedding Specials')
    : (language === 'ta' ? 'விசேஷ & பண்டிகை ஆடைகள்' : 'Festive & Occasion Specials'));

  return (
    <div className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3 py-6">
      {festivalCount > 0 && (
        <button
          onClick={() => setActiveCategory('festival')}
          className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-200 flex items-center gap-2 border shadow-sm cursor-pointer ${
            activeCategory === 'festival'
              ? 'bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-white border-amber-500 shadow-md scale-105 ring-2 ring-gold/40 animate-pulse'
              : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
          }`}
        >
          <span>{eventIcon}</span>
          <span>{eventLabel}</span>
          <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
            {festivalCount}
          </span>
        </button>
      )}
      {CATEGORIES.map(cat => {
        const IconComponent = iconMap[cat.icon] || Sparkles;
        const isActive = activeCategory === cat.id;
        const displayName = language === 'ta' ? (categoryTamilLabels[cat.id] || cat.label) : cat.label;

        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 border shadow-sm cursor-pointer ${
              isActive
                ? 'bg-primary text-white border-primary shadow-md scale-105'
                : 'bg-white text-stone-700 border-stone-200 hover:border-primary hover:text-primary'
            }`}
          >
            <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-gold-light' : 'text-stone-400'}`} />
            <span>{displayName}</span>
          </button>
        );
      })}
    </div>
  );
};

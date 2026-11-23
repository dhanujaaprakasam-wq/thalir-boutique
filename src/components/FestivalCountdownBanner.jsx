import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, ArrowRight, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const calculateTimeLeft = (endTime) => {
  if (!endTime) return null;
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds };
};

export const FestivalCountdownBanner = ({ onExploreFestive }) => {
  const { products, language, setActiveCategory } = useStore();

  // Find all products explicitly designated for special occasions
  const specialProducts = (products || []).filter(p => p.isSpecialEvent);

  // If no special occasion saree is available, do NOT display the banner
  if (!specialProducts || specialProducts.length === 0) {
    return null;
  }

  // Identify active festival/occasion product
  const activeSpecial = specialProducts.find(p => p.eventName) || specialProducts[0];
  const rawEventName = activeSpecial?.eventName || '';
  const rawEventBadge = activeSpecial?.eventBadge || '';
  const eventEndTime = activeSpecial?.eventEndTime;

  // Live Countdown state if deadline is configured
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(eventEndTime));

  useEffect(() => {
    if (!eventEndTime) return;
    setTimeLeft(calculateTimeLeft(eventEndTime));
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(eventEndTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [eventEndTime]);

  // Festival detection (Diwali, Pongal, Aadi, Christmas, Eid, New Year, Wedding, etc.)
  const fullSearch = `${rawEventName} ${rawEventBadge}`;
  const isDiwali = /diwali|deepavali|தீபாவளி/i.test(fullSearch);
  const isPongal = /pongal|sankranti|பொங்கல்|மகர/i.test(fullSearch);
  const isAadi = /aadi|ஆடி/i.test(fullSearch);
  const isChristmas = /christmas|xmas|x-mas|கிறிஸ்துமஸ்/i.test(fullSearch);
  const isEid = /eid|ramadan|ramzan|ரம்ஜான்|பெருநாள்/i.test(fullSearch);
  const isNewYear = /new year|newyear|புத்தாண்டு/i.test(fullSearch);
  const isWedding = /wedding|bridal|muhurtham|திருமணம்|முகூர்த்த/i.test(fullSearch);

  // Dynamic Theme Preset configuration
  let theme = {
    icon: '🎉',
    nameEn: rawEventName || 'Special Occasion Festive Sale',
    nameTa: rawEventName || 'சிறப்பு விழா கொண்டாட்ட விற்பனை',
    badgeEn: rawEventBadge || 'FESTIVAL SPECIAL',
    badgeTa: rawEventBadge || 'சிறப்பு விழா சலுகை',
    badgeGradient: 'from-red-600 via-amber-600 to-amber-500',
    bannerGradient: 'from-[#041D12] via-[#073822] to-[#0A4D2E]',
    borderGlow: 'border-gold/60',
    accentColor: 'text-gold',
    pillTextEn: 'Festive Celebration',
    pillTextTa: 'சிறப்பு விழா கொண்டாட்டம்',
    subtitleEn: 'Exclusive limited-edition celebratory collection at special festive prices.',
    subtitleTa: 'பாரம்பரிய கைத்தறி சேலைகள் மற்றும் பொட்டிக் உடைகளுக்கான சிறப்பு பண்டிகை கால சலுகைகள்!'
  };

  if (isDiwali) {
    theme = {
      icon: '🪔',
      nameEn: rawEventName || 'Diwali Dhamaka Sale',
      nameTa: rawEventName || 'தீபாவளி சிறப்பு தள்ளுபடி திருவிழா',
      badgeEn: rawEventBadge || 'DIWALI SPECIAL',
      badgeTa: rawEventBadge || 'தீபாவளி ஸ்பெஷல்',
      badgeGradient: 'from-red-600 via-orange-600 to-amber-500',
      bannerGradient: 'from-[#1C0804] via-[#380E07] to-[#5C160B]',
      borderGlow: 'border-amber-500/70',
      accentColor: 'text-amber-400',
      pillTextEn: 'Diwali Dhamaka Deal',
      pillTextTa: 'தீபாவளி சிறப்பு சலுகை',
      subtitleEn: 'Exclusive festive collection & celebratory offers on handcrafted soft silk sarees & boutique wear.',
      subtitleTa: 'பாரம்பரிய கைத்தறி பட்டு சேலைகள் மற்றும் தீபாவளி பண்டிகைக்கான பிரத்யேக தள்ளுபடி சலுகைகள்!'
    };
  } else if (isPongal) {
    theme = {
      icon: '🌾',
      nameEn: rawEventName || 'Pongal Thiruvizha Sale',
      nameTa: rawEventName || 'பொங்கல் திருவிழா சிறப்பு விற்பனை',
      badgeEn: rawEventBadge || 'PONGAL OFFER',
      badgeTa: rawEventBadge || 'பொங்கல் ஸ்பெஷல்',
      badgeGradient: 'from-amber-500 via-yellow-600 to-emerald-700',
      bannerGradient: 'from-[#072517] via-[#154628] to-[#543F07]',
      borderGlow: 'border-yellow-400/70',
      accentColor: 'text-yellow-300',
      pillTextEn: 'Harvest Celebration',
      pillTextTa: 'உழவர் திருநாள் கொண்டாட்டம்',
      subtitleEn: 'Auspicious festive handlooms & heritage sarees for joyful harvest celebrations.',
      subtitleTa: 'உழவர் திருநாள் பொங்கலுக்கான பாரம்பரிய கைத்தறி பட்டு சேலைகள் மற்றும் விழா சலுகைகள்!'
    };
  } else if (isAadi) {
    theme = {
      icon: '🌿',
      nameEn: rawEventName || 'Aadi Kondattam Mega Offer',
      nameTa: rawEventName || 'ஆடி கொண்டாட்டம் மெகா தள்ளுபடி',
      badgeEn: rawEventBadge || 'AADI SPECIAL',
      badgeTa: rawEventBadge || 'ஆடி ஸ்பெஷல்',
      badgeGradient: 'from-rose-600 via-red-600 to-amber-600',
      bannerGradient: 'from-[#2A060C] via-[#4D0F1B] to-[#751624]',
      borderGlow: 'border-rose-400/70',
      accentColor: 'text-rose-300',
      pillTextEn: 'Aadi Bumper Offer',
      pillTextTa: 'ஆடி தள்ளுபடி திருவிழா',
      subtitleEn: 'Bumper Aadi discounts & exclusive boutique sarees with unbeatable festive savings.',
      subtitleTa: 'ஆடி மாத கொண்டாட்ட சிறப்பு தள்ளுபடிகள் மற்றும் பிரத்யேக கைத்தறி சேலைகள்!'
    };
  } else if (isChristmas) {
    theme = {
      icon: '🎄',
      nameEn: rawEventName || 'Christmas Celebration Sale',
      nameTa: rawEventName || 'கிறிஸ்துமஸ் பண்டிகை சிறப்பு விற்பனை',
      badgeEn: rawEventBadge || 'CHRISTMAS SPECIAL',
      badgeTa: rawEventBadge || 'கிறிஸ்துமஸ் ஸ்பெஷல்',
      badgeGradient: 'from-emerald-600 via-teal-600 to-red-600',
      bannerGradient: 'from-[#052419] via-[#0E3D2B] to-[#480E14]',
      borderGlow: 'border-emerald-400/70',
      accentColor: 'text-emerald-300',
      pillTextEn: 'Christmas Joy Sale',
      pillTextTa: 'கிறிஸ்துமஸ் கொண்டாட்டம்',
      subtitleEn: 'Joyous holiday specials & gorgeous designer silks for Christmas & New Year celebrations.',
      subtitleTa: 'இனிய கிறிஸ்துமஸ் கொண்டாட்டத்திற்கான சிறப்பு பட்டு சேலைகள் மற்றும் பண்டிகை சலுகைகள்!'
    };
  } else if (isEid) {
    theme = {
      icon: '🌙',
      nameEn: rawEventName || 'Eid Mubarak Festive Special',
      nameTa: rawEventName || 'ரமலான் & பெருநாள் சிறப்பு விற்பனை',
      badgeEn: rawEventBadge || 'EID SPECIAL',
      badgeTa: rawEventBadge || 'ரம்ஜான் ஸ்பெஷல்',
      badgeGradient: 'from-emerald-500 via-teal-600 to-amber-500',
      bannerGradient: 'from-[#02231A] via-[#083D2F] to-[#0E5C46]',
      borderGlow: 'border-emerald-400/70',
      accentColor: 'text-emerald-300',
      pillTextEn: 'Eid Mubarak Deals',
      pillTextTa: 'பெருநாள் சிறப்பு சலுகைகள்',
      subtitleEn: 'Blessed Eid festival collections woven with grace, elegance, and pure luxury.',
      subtitleTa: 'புனித ரமலான் மற்றும் பெருநாளுக்கான அழகான பட்டு சேலைகள் & பிரத்யேக உடைகள்!'
    };
  } else if (isNewYear) {
    theme = {
      icon: '✨',
      nameEn: rawEventName || 'New Year Grand Sale',
      nameTa: rawEventName || 'புத்தாண்டு பிரம்மாண்ட மெகா விற்பனை',
      badgeEn: rawEventBadge || 'NEW YEAR SPECIAL',
      badgeTa: rawEventBadge || 'புத்தாண்டு ஸ்பெஷல்',
      badgeGradient: 'from-purple-600 via-indigo-600 to-amber-500',
      bannerGradient: 'from-[#080B21] via-[#12173D] to-[#28184C]',
      borderGlow: 'border-purple-400/70',
      accentColor: 'text-purple-300',
      pillTextEn: 'New Year Celebration',
      pillTextTa: 'புத்தாண்டு கொண்டாட்டம்',
      subtitleEn: 'Step into the New Year in grand style with limited-edition boutique collections.',
      subtitleTa: 'இனிய புத்தாண்டு தொடக்கத்திற்கான புதிய வரவுகள் மற்றும் பிரத்யேக சிறப்பு சலுகைகள்!'
    };
  } else if (isWedding) {
    theme = {
      icon: '💍',
      nameEn: rawEventName || 'Wedding & Festive Edit',
      nameTa: rawEventName || 'திருமண முகூர்த்த சிறப்பு தொகுப்பு',
      badgeEn: rawEventBadge || 'WEDDING EDIT',
      badgeTa: rawEventBadge || 'முகூர்த்த ஸ்பெஷல்',
      badgeGradient: 'from-amber-600 via-red-700 to-rose-900',
      bannerGradient: 'from-[#260710] via-[#450F1E] to-[#69182C]',
      borderGlow: 'border-amber-400/70',
      accentColor: 'text-amber-300',
      pillTextEn: 'Bridal & Festive Edit',
      pillTextTa: 'முகூர்த்த பட்டு தொகுப்பு',
      subtitleEn: 'Royal bridal Kanjivarams and grand wedding silks for magnificent celebrations.',
      subtitleTa: 'திருமண விழாக்களுக்கான பிரம்மாண்ட முகூர்த்த பட்டு சேலைகள் & ஜரிகை உடைகள்!'
    };
  }

  const eventName = language === 'ta' ? theme.nameTa : theme.nameEn;
  const eventBadge = language === 'ta' ? theme.badgeTa : theme.badgeEn;
  const eventSubtitle = language === 'ta' ? theme.subtitleTa : theme.subtitleEn;
  const pillText = language === 'ta' ? theme.pillTextTa : theme.pillTextEn;

  const handleCtaClick = () => {
    if (onExploreFestive) {
      onExploreFestive();
    } else {
      if (setActiveCategory) setActiveCategory('festival');
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={`w-full bg-gradient-to-r ${theme.bannerGradient} text-white border-y-2 ${theme.borderGlow} shadow-xl relative overflow-hidden transition-all duration-500`}>
      {/* Decorative Shimmering Background Glows */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(#DFBA6D_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col lg:flex-row items-center justify-between gap-4 relative z-10">
        
        {/* Left: Festive Headline & Occasion Name */}
        <div className="flex items-center gap-3.5 sm:gap-4 text-center lg:text-left">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-gold to-amber-500 p-0.5 shadow-lg shrink-0 flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-black/40 rounded-[14px] flex items-center justify-center text-2xl sm:text-3xl">
              {theme.icon}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className={`bg-gradient-to-r ${theme.badgeGradient} text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1`}>
                <Flame className="w-3 h-3 fill-white" />
                <span>{eventBadge}</span>
              </span>

              <span className="bg-white/15 text-gold-light text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-gold/30">
                {specialProducts.length} {language === 'ta' ? 'சிறப்பு சேலைகள் உள்ளன' : 'Special Sarees Available'}
              </span>

              {timeLeft && (
                <span className="bg-red-950/80 text-amber-300 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border border-red-500/50 flex items-center gap-1 shadow-sm animate-pulse">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span>
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </span>
              )}
            </div>

            <h3 className="font-serif font-bold text-lg sm:text-2xl text-white tracking-wide mt-1">
              {eventName}
            </h3>

            <p className="text-stone-300 text-xs sm:text-sm max-w-xl">
              {eventSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Festive Highlight Pill & Instant CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full lg:w-auto justify-center">
          
          <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-inner">
            <Sparkles className={`w-5 h-5 ${theme.accentColor} animate-spin`} />
            <div className="text-left">
              <div className={`text-xs font-black ${theme.accentColor} uppercase tracking-wider`}>
                {pillText}
              </div>
              <div className="text-[11px] text-stone-300 font-medium">
                {language === 'ta' ? 'பிரத்யேக தள்ளுபடி சலுகைகள்' : 'Exclusive Boutique Deals'}
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full sm:w-auto bg-gradient-to-r from-gold via-amber-400 to-gold text-[#073822] hover:brightness-110 font-black text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <span>{language === 'ta' ? 'விழா தயாரிப்புகளை காண்க' : 'Shop Festival Specials'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

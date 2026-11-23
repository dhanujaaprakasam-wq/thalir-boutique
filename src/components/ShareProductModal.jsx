import React, { useState } from 'react';
import { X, Check, Copy, Link2, Mail, MessageSquare, MoreHorizontal, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';

// Authentic Brand SVGs for Social Sharing
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.12.82.83-3.04-.19-.31a8.17 8.17 0 0 1-1.25-4.46c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/>
  </svg>
);

const FacebookIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const SnapchatIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.03 2c-3.7 0-6.2 2.66-6.2 5.56 0 1.08.4 2.15.86 2.87-.2.27-.64.44-1.07.56-.44.13-.8.29-.8.67 0 .42.38.74.83.91.73.28 1.47.2 2.06.07.24.97.87 1.8 1.94 2.22-.53.48-1.57.85-2.67 1.04-.57.1-.96.42-.96.88 0 .53.51.84 1.13.98 1.05.23 2.22.18 3.32-.04.42 1.05.9 1.79 1.55 1.79.66 0 1.14-.74 1.55-1.79 1.1.22 2.27.27 3.32.04.62-.14 1.13-.45 1.13-.98 0-.46-.39-.78-.96-.88-1.1-.19-2.14-.56-2.67-1.04 1.07-.42 1.7-1.25 1.94-2.22.59.13 1.33.21 2.06-.07.45-.17.83-.49.83-.91 0-.38-.36-.54-.8-.67-.43-.12-.87-.29-1.07-.56.46-.72.86-1.79.86-2.87 0-2.9-2.5-5.56-6.2-5.56z"/>
  </svg>
);

const RedditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

export const ShareProductModal = ({ product, isOpen, onClose }) => {
  const { language, showToast } = useStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const currentVariant = (product.variants && product.variants[0]) || {};
  const currentImage = currentVariant.image || currentVariant.image_url || product.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c';
  const productCode = product.code || product.productCode || product.id;

  // Formulate public share link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const shareUrl = `${origin}${pathname}?product=${encodeURIComponent(productCode)}`;

  const shareText = `Check out "${product.name}" from Thalir Boutique at ₹${Number(product.basePrice || 0).toLocaleString('en-IN')}! Special handcrafted collection:\n${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (showToast) {
        showToast(language === 'ta' ? 'தயாரிப்பு இணைப்பு நகலெடுக்கப்பட்டது! 📋' : 'Product link copied to clipboard! 📋');
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      if (showToast) {
        showToast(language === 'ta' ? 'தயாரிப்பு இணைப்பு நகலெடுக்கப்பட்டது! 📋' : 'Product link copied to clipboard! 📋');
      }
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} from Thalir Boutique!`,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const shareChannels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <WhatsAppIcon className="w-6 h-6 text-white" />,
      bg: 'bg-[#25D366] hover:bg-[#20ba59]',
      onClick: () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      icon: <SnapchatIcon className="w-6 h-6 text-black" />,
      bg: 'bg-[#FFFC00] hover:bg-[#e6e300]',
      onClick: () => {
        const url = `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <FacebookIcon className="w-6 h-6 text-white" />,
      bg: 'bg-[#1877F2] hover:bg-[#166fe5]',
      onClick: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: <RedditIcon className="w-6 h-6 text-white" />,
      bg: 'bg-[#FF4500] hover:bg-[#e03d00]',
      onClick: () => {
        const url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(product.name)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    {
      id: 'messages',
      name: language === 'ta' ? 'செய்தி' : 'Messages',
      icon: <MessageSquare className="w-6 h-6 text-white" />,
      bg: 'bg-[#007AFF] hover:bg-[#006ee6]',
      onClick: () => {
        const url = `sms:?body=${encodeURIComponent(shareText)}`;
        window.location.href = url;
      }
    },
    {
      id: 'email',
      name: language === 'ta' ? 'மின்னஞ்சல்' : 'Email',
      icon: <Mail className="w-6 h-6 text-stone-700" />,
      bg: 'bg-white border border-stone-300 hover:bg-stone-50',
      onClick: () => {
        const subject = encodeURIComponent(`${product.name} - Thalir Boutique`);
        const body = encodeURIComponent(shareText);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }
    },
    {
      id: 'copy',
      name: copied ? (language === 'ta' ? 'நகலானது!' : 'Copied!') : (language === 'ta' ? 'நகல் செய்' : 'Copy Link'),
      icon: copied ? <Check className="w-6 h-6 text-emerald-600" /> : <Link2 className="w-6 h-6 text-stone-700" />,
      bg: copied ? 'bg-emerald-50 border border-emerald-400' : 'bg-white border border-stone-300 hover:bg-stone-50',
      onClick: handleCopyLink
    },
    {
      id: 'more',
      name: language === 'ta' ? 'மேலும்' : 'More',
      icon: <MoreHorizontal className="w-6 h-6 text-stone-700" />,
      bg: 'bg-stone-100 hover:bg-stone-200 border border-stone-200',
      onClick: handleNativeShare
    }
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-stone-100">
          <h3 className="font-bold text-base sm:text-lg text-stone-900 tracking-tight">
            {language === 'ta' ? 'இந்த தயாரிப்பை நண்பர்களுடன் பகிரவும்' : 'Share this product with friends'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Preview Card (Exact Amazon / Flipkart Layout) */}
        <div className="p-4 sm:p-5">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3.5 mb-5 shadow-xs">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {product.isSpecialEvent ? (
                  <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                    {product.eventBadge || 'Special Deal'}
                  </span>
                ) : product.tag ? (
                  <span className="text-[10px] bg-[#073822] text-gold-light font-extrabold px-2 py-0.5 rounded-full uppercase border border-gold/30">
                    {product.tag}
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase">
                    Thalir Boutique
                  </span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate leading-snug">
                {product.name}
              </h4>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm font-extrabold text-primary">
                  ₹{Number(product.basePrice || 0).toLocaleString('en-IN')}
                </span>
                {product.originalPrice && Number(product.originalPrice) > Number(product.basePrice) && (
                  <span className="text-xs text-stone-400 line-through">
                    ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Social Channels 4x2 Grid */}
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
            {shareChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={channel.onClick}
                className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm group-hover:scale-108 active:scale-95 transition-transform duration-200 ${channel.bg}`}>
                  {channel.icon}
                </div>
                <span className="text-[11px] font-semibold text-stone-700 group-hover:text-stone-900 leading-tight">
                  {channel.name}
                </span>
              </button>
            ))}
          </div>

          {/* Instant Share Link Bar */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center gap-2">
            <div className="flex-grow bg-stone-100 px-3.5 py-2.5 rounded-xl border border-stone-200 text-[11px] font-mono text-stone-600 truncate select-all">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-sm'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (language === 'ta' ? 'நகலானது' : 'Copied') : (language === 'ta' ? 'நகல்' : 'Copy')}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

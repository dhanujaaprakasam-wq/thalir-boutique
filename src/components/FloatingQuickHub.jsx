import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const FloatingQuickHub = () => {
  const { storeInfo } = useStore();
  if (typeof window !== 'undefined' && window.location.hash === '#admin') return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${storeInfo.whatsappNumber}?text=${encodeURIComponent("Hello Thalir Boutique! I am interested in exploring your collections.")}`}
        target="_blank"
        rel="noreferrer"
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-whatsapp hover:bg-whatsapp-dark text-white shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 duration-200"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 fill-white text-whatsapp" />
      </a>

      {/* Direct Call Floating Button */}
      <a
        href={`tel:${storeInfo.rawPhone}`}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary hover:bg-primary-light text-white shadow-xl flex items-center justify-center transition-all transform hover:scale-110 duration-200"
        title="Call Store"
      >
        <Phone className="w-5 h-5 text-gold-shimmer" />
      </a>
    </div>
  );
};

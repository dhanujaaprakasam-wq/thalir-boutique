import React from 'react';
import { MapPin, Clock, Phone, Navigation, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const StoreLocation = () => {
  const { storeInfo, language } = useStore();

  return (
    <section id="about" className="py-16 bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Information */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-gold block mb-1">
                {language === 'ta' ? 'எங்கள் கடைக்கு நேரில் வருகை தாருங்கள்' : 'Visit Our Physical Boutique'}
              </span>
              <h2 className="font-serif text-3xl font-bold text-primary">
                {language === 'ta' ? 'வெப்படை, நாமக்கல்லில் அமைந்துள்ளது' : 'Located in Veppadai, Namakkal'}
              </h2>
            </div>

            <p className="text-stone-600 text-sm leading-relaxed">
              {language === 'ta'
                ? 'தளிர்ப் பொட்டிக்கிற்கு உங்களை அன்போடு வரவேற்கிறோம்! பாரம்பரிய பட்டுச் சேலைகள், திருவிழா ஆடைகள், பிளவுஸ் துணிகளை நேரில் பார்த்து வாங்கலாம் அல்லது ஆன்லைனில் விரைவு டெலிவரி மூலம் பெறலாம்.'
                : 'Welcome to Thalir Boutique, where rich traditional silks meet contemporary festive draping. Walk in to inspect our pure fabric varieties, try comfortable fits, or order online directly for speedy doorstep delivery.'
              }
            </p>

            <div className="space-y-3.5 text-xs sm:text-sm text-stone-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 font-bold">
                    {language === 'ta' ? 'கடை முகவரி:' : 'Physical Address:'}
                  </strong>
                  <span>{storeInfo.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 font-bold">
                    {language === 'ta' ? 'கடை இயங்கும் நேரம்:' : 'Store Hours:'}
                  </strong>
                  <span>{language === 'ta' ? 'திங்கள் – ஞாயிறு: காலை 9:30 – இரவு 9:00 (அனைத்து நாட்களும்)' : 'Monday – Sunday: 9:30 AM – 9:00 PM (All 7 Days)'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 font-bold">
                    {language === 'ta' ? 'நேரடி அழைப்பு & வாட்ஸ்அப்:' : 'Direct Call & WhatsApp:'}
                  </strong>
                  <a href={`tel:${storeInfo.rawPhone}`} className="text-primary font-bold hover:underline">
                    {storeInfo.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={storeInfo.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-gradient-to-r from-[#DFBA6D] to-[#C5A059] text-stone-900 font-bold px-5 py-2.5 rounded-full text-xs sm:text-sm shadow-sm hover:shadow flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>{language === 'ta' ? 'கூகுள் மேப்ஸ் வழிசெலுத்தல்' : 'Get Google Maps Directions'}</span>
              </a>

              <a
                href={storeInfo.whatsappGroupUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-whatsapp hover:bg-whatsapp-dark text-white font-semibold px-5 py-2.5 rounded-full text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>{language === 'ta' ? 'வாட்ஸ்அப் விஐபி குழுவில் சேர' : 'Join VIP Group'}</span>
              </a>
            </div>
          </div>

          {/* Embedded Map */}
          <div className="lg:col-span-6 h-80 sm:h-96 rounded-2xl overflow-hidden border-2 border-stone-200 shadow-md">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15655.452684784777!2d77.818458!3d11.396264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba96181f5c76067%3A0xcda8d7a19bb69781!2sVeppadai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Thalir Boutique Location Map"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

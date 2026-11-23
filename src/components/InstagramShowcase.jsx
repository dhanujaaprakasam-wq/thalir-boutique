import React from 'react';
import { InstagramIcon } from './Icons';
import { useStore } from '../context/StoreContext';
import { ExternalLink } from 'lucide-react';

import instaImg1 from '../assets/instagram/thalir_insta_10.jpg';
import instaImg2 from '../assets/instagram/thalir_insta_11.jpg';
import instaImg3 from '../assets/instagram/thalir_insta_7.jpg';
import instaImg4 from '../assets/instagram/thalir_insta_12.jpg';
import instaImg5 from '../assets/instagram/thalir_insta_6.jpg';
import instaImg6 from '../assets/instagram/thalir_insta_8.jpg';
import instaImg7 from '../assets/instagram/thalir_insta_9.jpg';

const imageMap = {
  '/src/assets/instagram/thalir_insta_10.jpg': instaImg1,
  '/src/assets/instagram/thalir_insta_11.jpg': instaImg2,
  '/src/assets/instagram/thalir_insta_7.jpg': instaImg3,
  '/src/assets/instagram/thalir_insta_12.jpg': instaImg4,
  '/src/assets/instagram/thalir_insta_6.jpg': instaImg5,
  '/src/assets/instagram/thalir_insta_8.jpg': instaImg6,
  '/src/assets/instagram/thalir_insta_9.jpg': instaImg7,
};

const resolveMediaUrl = (url) => {
  if (!url) return instaImg1;
  if (imageMap[url]) return imageMap[url];
  return url;
};

const defaultRealPosts = [
  {
    post_id: 'Ddq47Djkjaw',
    media_url: instaImg1,
    permalink: 'https://www.instagram.com/p/Ddq47Djkjaw/',
    caption: '🌱 Thalir_Boutique Soft Silk Sarees with Rich Zari Motifs. DM or WhatsApp to order! 🌸'
  },
  {
    post_id: 'Ddp170qEvDb',
    media_url: instaImg2,
    permalink: 'https://www.instagram.com/p/Ddp170qEvDb/',
    caption: '🌸 Banarasi Munga Soft Silk Sarees in regal jewel & pastel tones with floral pallu.'
  },
  {
    post_id: 'Dd1MEy2kv3Y',
    media_url: instaImg3,
    permalink: 'https://www.instagram.com/p/Dd1MEy2kv3Y/',
    caption: '🌸 Grace Never Goes Out of Style. Dual Tone Contrast Border Sarees with rich pallu.'
  },
  {
    post_id: 'Ddng68Nkqm2',
    media_url: instaImg4,
    permalink: 'https://www.instagram.com/p/Ddng68Nkqm2/',
    caption: '✨ Tie-Dye Cotton Sarees with Tassels. Breathable everyday elegance in 8 color shades.'
  },
  {
    post_id: 'Dd3xgg0EgXA',
    media_url: instaImg5,
    permalink: 'https://www.instagram.com/p/Dd3xgg0EgXA/',
    caption: '✨ Elegant Jamdani Saree with golden leaf & floral border. Lightweight festive draping.'
  },
  {
    post_id: 'Ddyn5YAkll8',
    media_url: instaImg6,
    permalink: 'https://www.instagram.com/p/Ddyn5YAkll8/',
    caption: '✨ Khadi Jute Saree Collection. Contemporary drape styling from Thalir Boutique.'
  }
];

export const InstagramShowcase = () => {
  const { instagramPosts, language } = useStore();

  const displayPosts = (instagramPosts && instagramPosts.length > 0)
    ? instagramPosts.slice(0, 6)
    : defaultRealPosts;

  return (
    <section className="py-16 bg-[#FAF8F5] border-t border-stone-100">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Banner */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-200/70 text-[11px] font-bold text-pink-700 uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
            <span>{language === 'ta' ? 'இன்ஸ்டாகிராம் புதிய பதிவுகள்' : 'Live Instagram Updates'}</span>
          </div>
          
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <InstagramIcon className="w-6 h-6 text-pink-600" />
            <a 
              href="https://www.instagram.com/thalir_boutique_/" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-gold transition-colors"
            >
              @thalir_boutique_
            </a>
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-1.5">
            {language === 'ta'
              ? 'புதிய சேலை வரவுகள், வீடியோக்கள் மற்றும் வாடிக்கையாளர் மதிப்புரைகளை இன்ஸ்டாகிராமில் காண்க.'
              : 'Follow our daily new arrivals, live video drapes, customer reviews & festive styling directly from Instagram.'}
          </p>
        </div>

        {/* 6 Grid Live Photos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {displayPosts.map((post, i) => {
            const finalImage = resolveMediaUrl(post.media_url);
            return (
              <a
                key={post.id || post.post_id || i}
                href={post.permalink || 'https://www.instagram.com/thalir_boutique_/'}
                target="_blank"
                rel="noreferrer"
                className="group relative rounded-2xl overflow-hidden aspect-square bg-stone-100 shadow-xs border border-stone-200/60 block hover:shadow-lg transition-all duration-300"
              >
                <img
                  src={finalImage}
                  alt={post.caption ? post.caption.slice(0, 50) : `Thalir Boutique Instagram Look ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  loading="lazy"
                />
                
                {/* Overlay with clean details & direct link (No fake counts) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3.5 text-white">
                  <div className="flex justify-end">
                    <div className="w-7 h-7 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
                      <InstagramIcon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    {post.caption && (
                      <p className="text-[11px] text-stone-100 line-clamp-3 leading-snug mb-2.5 font-medium drop-shadow-sm">
                        {post.caption}
                      </p>
                    )}
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-300 group-hover:text-pink-200 transition-colors">
                      <span>{language === 'ta' ? 'இன்ஸ்டாகிராமில் காண்க' : 'View on Instagram'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Bottom CTA to follow Instagram */}
        <div className="mt-8 text-center flex items-center justify-center">
          <a
            href="https://www.instagram.com/thalir_boutique_/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs shadow-md hover:shadow-lg hover:scale-102 transition-all cursor-pointer"
          >
            <InstagramIcon className="w-4 h-4" />
            <span>{language === 'ta' ? '@thalir_boutique_ ஐ இன்ஸ்டாகிராமில் பின்தொடரவும்' : 'Follow @thalir_boutique_ on Instagram'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>

      </div>
    </section>
  );
};

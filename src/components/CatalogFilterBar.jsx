import React, { useState } from 'react';
import { SlidersHorizontal, ArrowUpDown, Sparkles, X, Check, IndianRupee, Layers } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const FABRIC_OPTIONS = [
  'All Fabrics',
  'Silk',
  'Pure Cotton',
  'Soft Silk',
  'Georgette',
  'Chiffon',
  'Rayon',
  'Linen',
  'Chanderi'
];

export const CatalogFilterBar = ({
  priceRange,
  setPriceRange,
  selectedFabric,
  setSelectedFabric,
  sortBy,
  setSortBy,
  inStockOnly,
  setInStockOnly,
  totalResults,
  onResetFilters
}) => {
  const { language } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const isFiltered = priceRange < 10000 || selectedFabric !== 'All Fabrics' || sortBy !== 'newest' || inStockOnly;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-sm mb-8 space-y-4">
      
      {/* Top Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              isOpen || isFiltered 
                ? 'bg-[#073822] text-white border-[#073822] shadow-sm' 
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-gold" />
            <span>{language === 'ta' ? 'வடிகட்டிகள்' : 'Filters'} {isFiltered && '•'}</span>
          </button>

          <span className="text-xs text-stone-500 font-medium">
            {language === 'ta' ? 'பாரம்பரிய கைத்தறி ஆடைகள்' : 'Handcrafted Boutique Collections'}
          </span>
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <label className="text-xs font-semibold text-stone-600 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-gold" /> {language === 'ta' ? 'வரிசைப்படுத்து:' : 'Sort by:'}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="newest">{language === 'ta' ? 'புதிய வரவுகள்' : 'Newest Arrivals'}</option>
            <option value="price_low">{language === 'ta' ? 'விலை: குறைவிலிருந்து அதிகம்' : '₹ Price: Low to High'}</option>
            <option value="price_high">{language === 'ta' ? 'விலை: அதிகத்திலிருந்து குறைவு' : '₹ Price: High to Low'}</option>
          </select>
        </div>
      </div>

      {/* Expandable Filter Tray */}
      {isOpen && (
        <div className="pt-4 border-t border-stone-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top duration-200">
          
          {/* 1. Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-gold" /> {language === 'ta' ? 'அதிகபட்ச விலை:' : 'Max Price:'}
              </span>
              <span className="font-extrabold text-primary bg-primary-pale px-2.5 py-0.5 rounded-full border border-primary/20">
                ₹{Number(priceRange).toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="300"
              max="10000"
              step="100"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#073822]"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-medium">
              <span>₹300</span>
              <span>₹5,000</span>
              <span>₹10,000+</span>
            </div>
          </div>

          {/* 2. Fabric Filter Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-gold" /> {language === 'ta' ? 'துணி வகை:' : 'Fabric:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {FABRIC_OPTIONS.map((fab) => (
                <button
                  key={fab}
                  onClick={() => setSelectedFabric(fab)}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    selectedFabric === fab
                      ? 'bg-gold text-stone-950 border-gold font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {fab}
                </button>
              ))}
            </div>
          </div>

          {/* 3. In-Stock Toggle & Reset */}
          <div className="flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-stone-800 block mb-2">
                {language === 'ta' ? 'இருப்பு நிலை:' : 'Availability:'}
              </span>
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-[#073822]"
                />
                <span>{language === 'ta' ? 'இருப்பில் உள்ளவை மட்டும்' : 'Show In-Stock Items Only'}</span>
              </label>
            </div>

            {isFiltered && (
              <button
                onClick={onResetFilters}
                className="text-xs font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 px-4 rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{language === 'ta' ? 'வடிகட்டிகளை அழிக்க' : 'Reset Filters'}</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

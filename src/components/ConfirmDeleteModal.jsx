import React from 'react';
import { X, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ConfirmDeleteModal = ({
  isOpen,
  title,
  itemName = "",
  itemDetails = "",
  itemImage = null,
  warningText,
  confirmBtnText,
  confirmBtnColor = "red", // 'red' | 'primary'
  onConfirm,
  onClose
}) => {
  const { language } = useStore();
  if (!isOpen) return null;

  const defaultTitle = language === 'ta' ? 'நீக்குவதை உறுதிப்படுத்தவும்' : 'Confirm Deletion';
  const defaultWarning = language === 'ta' 
    ? 'இந்த செயல் நிரந்தரமானது, மாற்ற முடியாது. தொடர விரும்புகிறீர்களா?' 
    : 'This action is permanent and cannot be undone. Are you sure you want to proceed?';
  const defaultConfirmText = language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete';
  const cancelText = language === 'ta' ? 'ரத்து செய்' : 'Cancel';
  const subText = language === 'ta' ? 'உறுதி செய்வதற்கு முன் விவரங்களைச் சரிபார்க்கவும்' : 'Please review the item before confirming';

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-red-200/80 flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#073822] text-white pt-6 pb-5 px-6 text-center relative border-b-2 border-gold/40">
          <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-2.5 shadow-md">
            <Trash2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-serif text-xl font-bold text-white tracking-tight">
            {title || defaultTitle}
          </h3>
          <p className="text-xs text-stone-200 mt-1">
            {subText}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-center">
          
          {/* Item Preview Card */}
          {(itemName || itemImage) && (
            <div className="flex items-center gap-3.5 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-left shadow-2xs">
              {itemImage ? (
                <img
                  src={itemImage}
                  alt={itemName}
                  className="w-14 h-16 rounded-xl object-cover border border-stone-300 bg-white shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0 border border-red-200">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-serif font-bold text-stone-900 text-sm truncate leading-snug">
                  {itemName}
                </h4>
                {itemDetails && (
                  <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1 font-medium">
                    {itemDetails}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-medium flex items-start gap-2.5 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>{warningText || defaultWarning}</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{confirmBtnText || defaultConfirmText}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

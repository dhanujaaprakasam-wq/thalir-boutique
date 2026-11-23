import React, { useState } from 'react';
import { X, Lock, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import logoImg from '../assets/logo.jpg';

export const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { language } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPhone = cleanUser.replace(/\D/g, '');
    const isAuthorizedAdmin = 
      (cleanUser === 'admin' && (password === 'admin123' || password === 'Dhanujaa@26')) ||
      (cleanUser === 'sudhi' && (password === 'Dhanujaa@26' || password === 'admin123')) ||
      (cleanPhone === '6382218590' && (password === 'Dhanujaa@26' || password === 'admin123')) ||
      (cleanUser === 'dhanujaa' && (password === 'Dhanujaa@26' || password === 'admin123'));

    if (isAuthorizedAdmin) {
      setErrorMsg('');
      setUsername('');
      setPassword('');
      onLoginSuccess();
      onClose();
    } else {
      setErrorMsg(language === 'ta' ? 'தவறான நிர்வாக நற்சான்றிதழ்கள். சரியான பயனர் பெயர் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.' : 'Invalid admin credentials. Please enter your valid administrator credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border-2 border-gold/40 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#073822] to-[#0D5C3A] text-white p-6 text-center border-b-2 border-gold">
          <img
            src={logoImg}
            alt="Thalir Boutique"
            className="w-14 h-14 rounded-full border-2 border-gold mx-auto mb-2 object-cover shadow-lg"
          />
          <h3 className="font-serif text-lg font-bold">{language === 'ta' ? 'தளிர்ப் பொட்டிக் நிர்வாக போர்டல்' : 'Thalir Admin Portal'}</h3>
          <p className="text-xs text-gold-shimmer">{language === 'ta' ? 'அங்கீகரிக்கப்பட்ட நிர்வாக அணுகல் மட்டும்' : 'Authorized Management Access Only'}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">{language === 'ta' ? 'நிர்வாகப் பயனர் பெயர்' : 'Admin Username'}</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-mono"
                required
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">{language === 'ta' ? 'நிர்வாகக் கடவுச்சொல்' : 'Admin Password'}</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-mono"
                required
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>{language === 'ta' ? 'நிர்வாக மையத்தில் நுழைய' : 'Login to Admin Hub'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-center text-stone-400 pt-1">
            {language === 'ta' ? 'வாடிக்கையாளர்கள் கணக்கு உள்நுழைவைப் பயன்படுத்தவும்.' : 'Standard shoppers use the Customer Account login.'}
          </p>
        </form>

      </div>
    </div>
  );
};

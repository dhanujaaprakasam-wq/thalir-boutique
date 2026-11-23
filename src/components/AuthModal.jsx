import React, { useState, useEffect } from 'react';
import { 
  X, ArrowRight, AlertCircle, CheckCircle2, KeyRound, 
  ShieldCheck, Eye, EyeOff, User, Lock, Phone, RotateCcw, Check, Sparkles 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import logoImg from '../assets/logo.jpg';

export const AuthModal = ({ isGate = false, onOpenAdminLogin = null }) => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginDirectUser,
    loginCustomer,
    registerCustomer,
    user,
    language
  } = useStore();

  // Mode: 'login' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState('login');

  // --- Login State ---
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // --- Signup State ---
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupPhoneVerified, setSignupPhoneVerified] = useState(false);

  // --- Forgot Password State ---
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotPhoneVerified, setForgotPhoneVerified] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  // --- Shared Timer & Loading State ---
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset errors/messages on mode switch
  const switchMode = (mode) => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(false);
  };

  // Reset modal state on open
  useEffect(() => {
    if (isAuthModalOpen || isGate) {
      setErrorMsg('');
      setSuccessMsg('');
      setIsSubmitting(false);
    }
  }, [isAuthModalOpen, isGate]);

  // OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if ((signupOtpSent || forgotOtpSent) && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [signupOtpSent, forgotOtpSent, timerSeconds]);

  if (!isAuthModalOpen && !isGate) return null;
  if (user && isGate) return null;

  // -------------------------------------------------------------
  // 1. Handle Login (Username or Mobile Number + Password)
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your username or registered mobile number.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await loginCustomer(loginIdentifier.trim(), loginPassword);
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect username/mobile number or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Handle Signup Flows
  // -------------------------------------------------------------
  const handleSendSignupOtp = async () => {
    const cleanPhone = signupPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSendingOtp(true);
    try {
      const res = await api.sendOtp(cleanPhone, 'signup');
      setSignupOtpSent(true);
      setTimerSeconds(30);
      setCanResend(false);
      setSignupOtp('');
      setSuccessMsg(`6-Digit OTP sent via SMS to +91 ${cleanPhone}. Please check your phone.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP. Please check your mobile number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifySignupOtp = async () => {
    const cleanPhone = signupPhone.replace(/\D/g, '');
    const cleanOtp = signupOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    setErrorMsg('');
    setIsVerifyingOtp(true);
    try {
      await api.verifyOtp(cleanPhone, cleanOtp);
      setSignupPhoneVerified(true);
      setSuccessMsg('Mobile number verified successfully! ✓');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid OTP code. Please enter the correct code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    const cleanPhone = signupPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Valid 10-digit mobile number is required.');
      return;
    }
    if (!signupPhoneVerified) {
      setErrorMsg('Please verify your mobile number with OTP before completing registration.');
      return;
    }
    if (!signupPassword) {
      setErrorMsg('Password is required.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await registerCustomer({
        name: signupName.trim(),
        username: signupUsername.trim() || undefined,
        phone: cleanPhone,
        otp: signupOtp.trim(),
        password: signupPassword,
        confirm_password: signupConfirmPassword
      });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 3. Handle Forgot Password Flows
  // -------------------------------------------------------------
  const handleSendForgotOtp = async () => {
    const cleanPhone = forgotPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter your registered 10-digit mobile number.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSendingOtp(true);
    try {
      const res = await api.sendOtp(cleanPhone, 'forgot_password');
      setForgotOtpSent(true);
      setTimerSeconds(30);
      setCanResend(false);
      setSuccessMsg(res.message || `6-Digit OTP sent to +91 ${cleanPhone}.`);
    } catch (err) {
      setErrorMsg(err.message || 'No account found with this mobile number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    const cleanPhone = forgotPhone.replace(/\D/g, '');
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP.');
      return;
    }

    setErrorMsg('');
    setIsVerifyingOtp(true);
    try {
      await api.verifyOtp(cleanPhone, cleanOtp);
      setForgotPhoneVerified(true);
      setSuccessMsg('Number verified! You can now enter your new password.');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid OTP code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = forgotPhone.replace(/\D/g, '');
    if (!forgotPhoneVerified) {
      setErrorMsg('Please verify OTP code before resetting password.');
      return;
    }
    if (!forgotNewPassword) {
      setErrorMsg('New password is required.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const res = await api.forgotPassword({
        phone: cleanPhone,
        otp: forgotOtp.trim(),
        new_password: forgotNewPassword,
        confirm_password: forgotConfirmPassword
      });
      setSuccessMsg(res.message || 'Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        if (res.user) {
          loginDirectUser(res.user);
        } else {
          switchMode('login');
          setLoginIdentifier(cleanPhone);
        }
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-gold/40 relative flex flex-col my-auto max-h-[92vh]">
        
        {/* Close Button (Only show if not gated) */}
        {!isGate && (
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="bg-gradient-to-r from-[#073822] to-[#0D5C3A] text-white pt-6 pb-5 px-6 text-center relative border-b-2 border-gold flex-shrink-0">
          <img
            src={logoImg}
            alt="Thalir Boutique Logo"
            className="w-14 h-14 rounded-full border-2 border-gold mx-auto mb-2.5 object-cover shadow-lg"
          />
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            {authMode === 'login' && (language === 'ta' ? 'உள்நுழைவு' : 'Sign In')}
            {authMode === 'signup' && (language === 'ta' ? 'புதிய கணக்கு உருவாக்கு' : 'Create New Account')}
            {authMode === 'forgot' && (language === 'ta' ? 'கடவுச்சொல்லை மீட்டமை' : 'Reset Password')}
          </h2>
          <p className="text-xs text-stone-200 mt-1">
            {authMode === 'login' && (language === 'ta' ? 'பயனர்பெயர் அல்லது மொபைல் எண் மற்றும் கடவுச்சொல்லை உள்ளிடவும்' : 'Enter your username or mobile number & password')}
            {authMode === 'signup' && (language === 'ta' ? 'தளிர்பொட்டிக்கில் புதிய கணக்கு தொடங்கி ஷாப்பிங் செய்யுங்கள்' : 'Join Thalir Boutique for handcrafted premium sarees')}
            {authMode === 'forgot' && (language === 'ta' ? 'புதிய கடவுச்சொல்லை உருவாக்க மொபைல் எண்ணை சரிபார்க்கவும்' : 'Verify mobile number to create a new password')}
          </p>
        </div>

        {/* Modal Body with smooth scrolling if needed */}
        <div className="p-6 sm:p-7 space-y-4 overflow-y-auto">

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 1: LOGIN (Username or Mobile Number + Password)           */}
          {/* ============================================================== */}
          {authMode === 'login' && (
            <div className="space-y-4 animate-in fade-in">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Username or Mobile Field */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {language === 'ta' ? 'பயனர்பெயர் அல்லது மொபைல் எண்' : 'Username or Mobile Number'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={language === 'ta' ? 'பயனர்பெயர் அல்லது 10-இலக்க மொபைல் எண்' : 'Enter username or 10-digit mobile'}
                      className="w-full text-sm px-4 py-3 pl-10 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium transition-all"
                    />
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      {language === 'ta' ? 'கடவுச்சொல்' : 'Password'} <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] font-semibold text-primary hover:text-primary-dark hover:underline transition-colors cursor-pointer"
                    >
                      {language === 'ta' ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter your password'}
                      className="w-full text-sm px-4 py-3 pl-10 pr-10 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium transition-all"
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 transition-colors p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !loginIdentifier.trim() || !loginPassword}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? (language === 'ta' ? 'உள்நுழைகிறது...' : 'Signing In...') : (language === 'ta' ? 'உள்நுழைக' : 'Sign In')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Switch to Signup */}
              <div className="pt-2 text-center text-xs text-stone-600 border-t border-stone-100">
                <span>{language === 'ta' ? 'கணக்கு இல்லையா? ' : "Don't have an account? "}</span>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-bold text-primary hover:text-primary-dark underline cursor-pointer"
                >
                  {language === 'ta' ? 'புதிய கணக்கு தொடங்க / பதிவு செய்க' : 'Create New Account / Sign Up'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 2: SIGN UP / REGISTRATION (Full Name, Phone, OTP, Password)*/}
          {/* ============================================================== */}
          {authMode === 'signup' && (
            <div className="space-y-4 animate-in fade-in">
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium transition-all"
                  />
                </div>

                {/* Username (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Username <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Choose a unique username"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium transition-all"
                  />
                </div>

                {/* Mobile Number & OTP Verification */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    {signupPhoneVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="inline-flex items-center px-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-700 select-none">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      disabled={signupPhoneVerified}
                      value={signupPhone}
                      onChange={(e) => {
                        setSignupPhone(e.target.value.replace(/\D/g, ''));
                        setSignupPhoneVerified(false);
                        setSignupOtpSent(false);
                      }}
                      placeholder="10-digit mobile number"
                      className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium disabled:bg-stone-50 transition-all"
                      required
                    />
                    {!signupPhoneVerified && (
                      <button
                        type="button"
                        disabled={isSendingOtp || signupPhone.length < 10}
                        onClick={handleSendSignupOtp}
                        className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-sm"
                      >
                        {isSendingOtp ? 'Sending...' : signupOtpSent ? 'Resend' : 'Verify Number'}
                      </button>
                    )}
                  </div>
                </div>

                {/* OTP Input section if OTP sent and not verified */}
                {signupOtpSent && !signupPhoneVerified && (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-700 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-primary" /> Enter 6-Digit OTP:
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {canResend ? 'OTP expired' : `Valid: ${timerSeconds}s`}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={signupOtp}
                        onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 text-center tracking-widest text-sm font-bold px-3 py-2 rounded-lg border border-stone-200 bg-white focus:border-primary outline-none"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingOtp || signupOtp.length < 6}
                        onClick={handleVerifySignupOtp}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {isVerifyingOtp ? 'Checking...' : 'Verify OTP'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-8 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupConfirmPassword ? 'text' : 'password'}
                        required
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-8 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showSignupConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Signup Button */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    !signupName.trim() || 
                    !signupPhoneVerified || 
                    !signupPassword || 
                    signupPassword.length < 6 || 
                    signupPassword !== signupConfirmPassword
                  }
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
                >
                  <Sparkles className="w-4 h-4 text-gold-shimmer" />
                  <span>{isSubmitting ? 'Creating Account...' : 'Create Account & Sign In'}</span>
                </button>
              </form>

              {/* Switch to Login */}
              <div className="pt-2 text-center text-xs text-stone-600 border-t border-stone-100">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-primary hover:text-primary-dark underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 3: FORGOT PASSWORD (Enter Phone -> OTP -> New Passwords)  */}
          {/* ============================================================== */}
          {authMode === 'forgot' && (
            <div className="space-y-4 animate-in fade-in">
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                
                {/* Step A: Registered Mobile Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Registered Mobile Number <span className="text-red-500">*</span>
                    </label>
                    {forgotPhoneVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="inline-flex items-center px-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-700 select-none">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      disabled={forgotPhoneVerified}
                      value={forgotPhone}
                      onChange={(e) => {
                        setForgotPhone(e.target.value.replace(/\D/g, ''));
                        setForgotPhoneVerified(false);
                        setForgotOtpSent(false);
                      }}
                      placeholder="10-digit mobile number"
                      className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium disabled:bg-stone-50 transition-all"
                      required
                    />
                    {!forgotPhoneVerified && (
                      <button
                        type="button"
                        disabled={isSendingOtp || forgotPhone.length < 10}
                        onClick={handleSendForgotOtp}
                        className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-sm"
                      >
                        {isSendingOtp ? 'Sending...' : forgotOtpSent ? 'Resend' : 'Verify Number'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step B: OTP Input */}
                {forgotOtpSent && !forgotPhoneVerified && (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-700 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-primary" /> Enter 6-Digit OTP:
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {canResend ? 'OTP expired' : `Valid: ${timerSeconds}s`}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 text-center tracking-widest text-sm font-bold px-3 py-2 rounded-lg border border-stone-200 bg-white focus:border-primary outline-none"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingOtp || forgotOtp.length < 6}
                        onClick={handleVerifyForgotOtp}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {isVerifyingOtp ? 'Checking...' : 'Verify OTP'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step C: New Password Fields (Enabled once verified) */}
                {forgotPhoneVerified && (
                  <div className="space-y-3 pt-1 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showForgotNewPassword ? 'text' : 'password'}
                          required
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="Enter at least 6 characters"
                          className="w-full text-sm px-3.5 py-2.5 pr-9 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                          tabIndex={-1}
                        >
                          {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showForgotConfirmPassword ? 'text' : 'password'}
                          required
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full text-sm px-3.5 py-2.5 pr-9 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-medium transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                          className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                          tabIndex={-1}
                        >
                          {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Reset Submit Button */}
                    <button
                      type="submit"
                      disabled={
                        isSubmitting || 
                        !forgotNewPassword || 
                        forgotNewPassword.length < 6 || 
                        forgotNewPassword !== forgotConfirmPassword
                      }
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-gold-shimmer" />
                      <span>{isSubmitting ? 'Updating Password...' : 'Update Password & Sign In'}</span>
                    </button>
                  </div>
                )}
              </form>

              {/* Back to Sign In */}
              <div className="pt-2 text-center text-xs text-stone-600 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-primary hover:text-primary-dark underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

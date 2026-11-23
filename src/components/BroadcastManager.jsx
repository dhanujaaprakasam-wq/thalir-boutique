import React, { useState, useEffect } from 'react';
import { 
  Send, MessageCircle, Phone, Smartphone, Users, CheckCircle2, AlertCircle, 
  Copy, ExternalLink, RefreshCw, Search, Plus, Trash2, Settings, Sparkles, 
  Clock, Check, Filter, ChevronRight, Play, ArrowRight, ShieldCheck, Tag
} from 'lucide-react';
import { api } from '../services/api';

export const BroadcastManager = ({ language = 'en', onNavigateTab = null }) => {
  // Channel: 'whatsapp' | 'sms' | 'both'
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');
  
  // Recipient Filter: 'all' | 'registered' | 'buyers'
  const [recipientFilter, setRecipientFilter] = useState('all');
  
  // Recipients Data
  const [recipients, setRecipients] = useState([]);
  const [selectedPhones, setSelectedPhones] = useState(new Set());
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom number input
  const [customPhone, setCustomPhone] = useState('');
  const [customName, setCustomName] = useState('');
  
  // Message Composer
  const [campaignTitle, setCampaignTitle] = useState('');
  const [messageText, setMessageText] = useState(
    language === 'ta'
      ? '[ THALIR BOUTIQUE ]\nவணக்கம் {name}! தளிர்புடவைகள் பிரத்யேக சிறப்புத் தள்ளுபடி சலுகை! மென்பட்டு & ஜாக்கார்டு புடவைகளில் 20% வரை தள்ளுபடி. உடனே பாருங்கள்: thalir.com | வாட்ஸ்அப்: 9047443933'
      : '[ THALIR BOUTIQUE ]\nSpecial Festival Offer! Dear {name}, celebrate in style with up to 25% OFF on Thalir Boutique Soft Silk & Jacquard sarees. Limited stock available! Order now: thalir.com | WhatsApp: 9047443933'
  );
  
  // Fast2SMS Settings
  const [fast2smsConfigured, setFast2smsConfigured] = useState(false);
  const [showSmsConfig, setShowSmsConfig] = useState(false);
  const [fast2smsApiKey, setFast2smsApiKey] = useState('');
  const [fast2smsSenderId, setFast2smsSenderId] = useState('THALIR');
  const [fast2smsRoute, setFast2smsRoute] = useState('q'); // 'q' or 'dlt'
  const [fast2smsDltTemplateId, setFast2smsDltTemplateId] = useState('');
  
  // Status & Progress
  const [isSending, setIsSending] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // WhatsApp Queue Sender State
  const [activeQueueIndex, setActiveQueueIndex] = useState(0);
  const [sentQueuePhones, setSentQueuePhones] = useState(new Set());
  const [isQueueActive, setIsQueueActive] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Load Recipients & History on Mount
  useEffect(() => {
    fetchRecipients();
    fetchHistory();
  }, [recipientFilter]);

  const fetchRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const data = await api.getBroadcastRecipients(recipientFilter);
      const list = data.recipients || [];
      setRecipients(list);
      setFast2smsConfigured(!!data.fast2sms_configured);
      if (data.fast2sms_sender_id) setFast2smsSenderId(data.fast2sms_sender_id);
      if (data.fast2sms_route) setFast2smsRoute(data.fast2sms_route);
      if (data.fast2sms_template_id) setFast2smsDltTemplateId(data.fast2sms_template_id);
      // Select all by default
      setSelectedPhones(new Set(list.map(r => r.phone)));
    } catch (err) {
      console.warn('Failed to load recipients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const hist = await api.getBroadcastHistory();
      setBroadcastHistory(hist || []);
    } catch (err) {
      console.warn('Failed to load broadcast history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Toggle single phone selection
  const togglePhone = (phone) => {
    const updated = new Set(selectedPhones);
    if (updated.has(phone)) {
      updated.delete(phone);
    } else {
      updated.add(phone);
    }
    setSelectedPhones(updated);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedPhones.size === filteredRecipients.length) {
      setSelectedPhones(new Set());
    } else {
      setSelectedPhones(new Set(filteredRecipients.map(r => r.phone)));
    }
  };

  // Add custom test phone
  const handleAddCustomRecipient = (e) => {
    e.preventDefault();
    const clean = customPhone.replace(/\D/g, '');
    const validPhone = clean.length === 12 && clean.startsWith('91') ? clean.slice(2) : clean;
    if (validPhone.length !== 10) {
      alert(language === 'ta' ? 'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.' : 'Please enter a valid 10-digit mobile number.');
      return;
    }
    const name = customName.trim() || 'Customer';
    const newRecipient = {
      phone: validPhone,
      name,
      first_name: name.split(' ')[0],
      is_registered: false,
      source: 'custom',
      orders_count: 0
    };
    setRecipients(prev => [newRecipient, ...prev.filter(r => r.phone !== validPhone)]);
    setSelectedPhones(prev => new Set([...prev, validPhone]));
    setCustomPhone('');
    setCustomName('');
  };

  // Insert tag helper
  const insertTag = (tag) => {
    setMessageText(prev => prev + ' ' + tag);
  };

  // Template Presets
  const applyTemplate = (templateKey) => {
    if (templateKey === 'festive') {
      setMessageText(
        language === 'ta'
          ? '[ THALIR BOUTIQUE ]\n🎉 சிறப்புப் பண்டிகை ஆஃபர்! அன்புள்ள {name}, தளிர்புடவைகளின் தீபாவளி & விசேஷ ஆடைகளுக்கு 25% வரை தள்ளுபடி! பட்டு & டிசைனர் புடவைகளை உடனடியாகப் பாருங்கள்: thalir.com | தொடர்பு: 9047443933'
          : '[ THALIR BOUTIQUE ]\n🎉 Special Festival Offer! Dear {name}, celebrate in style with up to 25% OFF on Thalir Boutique Soft Silk & Jacquard sarees. Limited stock available! Order now: thalir.com | WhatsApp: 9047443933'
      );
      setCampaignTitle('Festive & Occasion Saree Offer');
    } else if (templateKey === 'new_arrivals') {
      setMessageText(
        language === 'ta'
          ? '[ THALIR BOUTIQUE ]\n✨ புதிய வருகைகள்! வணக்கம் {name}, தளிர்புடவைகளில் புத்தம்புதிய பிரீமியம் காஞ்சி & சாப்ட் சில்க் புடவைகள் வந்துள்ளன. உடனே வாங்கி மகிழுங்கள்: thalir.com'
          : '[ THALIR BOUTIQUE ]\n✨ Exciting New Arrivals! Hello {name}, exquisite new handcrafted Soft Silk & Jacquard sarees just arrived at Thalir Boutique. Discover latest designs: thalir.com | Call/WA: 9047443933'
      );
      setCampaignTitle('New Silk Arrivals Alert');
    } else if (templateKey === 'discount') {
      setMessageText(
        language === 'ta'
          ? '[ THALIR BOUTIQUE ]\n🏷️ சிறப்பு கூப்பன் ஆஃபர்! அன்புள்ள {name}, உங்கள் அடுத்த புடவை ஆர்டருக்கு THALIR10 என்ற கூப்பனைப் பயன்படுத்தி உடனடி 10% தள்ளுபடி பெறுங்கள்! செல்லுபடியாகும் காலம்: இந்த வாரம் மட்டும்.'
          : '[ THALIR BOUTIQUE ]\n🏷️ Exclusive Coupon for You! Dear {name}, use promo code THALIR10 to get an extra 10% OFF on your next saree order at Thalir Boutique. Valid this week only!'
      );
      setCampaignTitle('VIP 10% Discount Code');
    } else if (templateKey === 'appreciation') {
      setMessageText(
        language === 'ta'
          ? '[ THALIR BOUTIQUE ]\n🌸 நன்றி வணக்கம்! எங்கள் மதிப்பிற்குரிய வாடிக்கையாளர் {name} அவர்களுக்கு தளிர்புடவைகளின் மனமார்ந்த நன்றிகள். உங்கள் விசேஷ தருணங்களை அலங்கரிக்க எப்போதும் உங்களுடன் இருக்கிறோம்.'
          : '[ THALIR BOUTIQUE ]\n🌸 Warm Greetings from Thalir Boutique! Dear {name}, thank you for choosing Thalir Boutique. We are honored to be part of your celebrations. Discover our timeless sarees anytime at thalir.com'
      );
      setCampaignTitle('Customer Appreciation Greeting');
    }
  };

  // Filter recipients by search
  const filteredRecipients = recipients.filter(r => {
    const q = searchQuery.toLowerCase();
    return (r.name && r.name.toLowerCase().includes(q)) || (r.phone && r.phone.includes(q));
  });

  // Calculate targets
  const targetRecipients = recipients.filter(r => selectedPhones.has(r.phone));

  // Copy all phone numbers to clipboard (comma separated)
  const copyAllNumbers = () => {
    const numbers = targetRecipients.map(r => r.phone).join(', ');
    navigator.clipboard.writeText(numbers);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Copy composed message
  const copyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Trigger Send Broadcast
  const handleSendBroadcast = async () => {
    if (targetRecipients.length === 0) {
      alert(language === 'ta' ? 'செய்தி அனுப்ப குறைந்தபட்சம் ஒரு வாடிக்கையாளரையாவது தேர்ந்தெடுக்கவும்.' : 'Please select at least one customer to send the message.');
      return;
    }
    if (!messageText.trim()) {
      alert(language === 'ta' ? 'செய்தி விவரங்களை உள்ளிடவும்.' : 'Please enter message content.');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        channel: selectedChannel,
        message: messageText,
        recipient_filter: recipientFilter,
        selected_phones: Array.from(selectedPhones),
        title: campaignTitle || (selectedChannel === 'whatsapp' ? 'WhatsApp Broadcast' : 'SMS Broadcast'),
        fast2sms_api_key: fast2smsApiKey || undefined,
        sender_id: fast2smsSenderId || 'THALIR',
        sms_route: fast2smsRoute || 'q',
        dlt_template_id: fast2smsDltTemplateId || undefined
      };

      const res = await api.sendBroadcastMessage(payload);
      setResultModal(res);

      if (selectedChannel === 'whatsapp' || selectedChannel === 'both') {
        setIsQueueActive(true);
        setActiveQueueIndex(0);
        setSentQueuePhones(new Set());
      }
      fetchHistory();
    } catch (err) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Open individual WhatsApp message in new tab
  const openWhatsAppDirect = (recipient) => {
    const personalized = messageText
      .replace('{name}', recipient.name || 'Valued Customer')
      .replace('{first_name}', recipient.first_name || 'Customer')
      .replace('{phone}', recipient.phone)
      .replace('{store}', 'Thalir Boutique');
    
    const waUrl = `https://wa.me/91${recipient.phone}?text=${encodeURIComponent(personalized)}`;
    window.open(waUrl, '_blank');
    setSentQueuePhones(prev => new Set([...prev, recipient.phone]));
  };

  // Open device SMS directly
  const openDeviceSms = (recipient) => {
    const personalized = messageText
      .replace('{name}', recipient.name || 'Valued Customer')
      .replace('{first_name}', recipient.first_name || 'Customer')
      .replace('{phone}', recipient.phone)
      .replace('{store}', 'Thalir Boutique');
    
    const smsUrl = `sms:+91${recipient.phone}?body=${encodeURIComponent(personalized)}`;
    window.open(smsUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#073822] via-[#0D5C3A] to-[#124b33] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-gold/30">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold-shimmer text-xs font-bold uppercase tracking-wider mb-2 border border-gold/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'அனைத்து வாடிக்கையாளர்களுக்கும் செய்தி அனுப்புதல்' : 'Customer Broadcast & Bulk Messaging'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
              {language === 'ta' ? 'SMS & WhatsApp பல்கு செய்தி மையம்' : 'Normal SMS & WhatsApp Broadcast Center'}
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
              {language === 'ta'
                ? 'பதிவுசெய்த பயனர்கள் மற்றும் ஆர்டர் செய்த வாடிக்கையாளர்களுக்கு ஒரே நேரத்தில் சலுகைகள், புதிய புடவைகள் பற்றிய தகவல்கள் மற்றும் வாழ்த்துக்களை அனுப்புங்கள்.'
                : 'Send instant festival offers, new arrival alerts, and exclusive discounts to all registered users and mobile contacts at once via Normal Carrier SMS and WhatsApp.'
              }
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-black/25 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-center px-3 border-r border-white/15">
              <span className="block text-xl font-bold text-gold font-mono">{recipients.length}</span>
              <span className="text-[10px] text-stone-300 uppercase tracking-wider">{language === 'ta' ? 'மொத்த எண்கள்' : 'Reachable'}</span>
            </div>
            <div className="text-center px-3 border-r border-white/15">
              <span className="block text-xl font-bold text-emerald-400 font-mono">{targetRecipients.length}</span>
              <span className="text-[10px] text-stone-300 uppercase tracking-wider">{language === 'ta' ? 'தேர்வு செய்தவை' : 'Selected'}</span>
            </div>
            <button
              onClick={fetchRecipients}
              disabled={loadingRecipients}
              className="p-2 text-stone-300 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
              title="Refresh Recipients"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRecipients ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Composer (Left) & Recipients (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Message Composer & Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Channel Selector & Audience */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>{language === 'ta' ? '1. அனுப்பும் முறையைத் தேர்ந்தெடுக்கவும் (Channel)' : '1. Select Delivery Channel'}</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => setSelectedChannel('whatsapp')}
                  className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedChannel === 'whatsapp'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <MessageCircle className={`w-5 h-5 ${selectedChannel === 'whatsapp' ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span className="text-xs font-bold">WhatsApp</span>
                  <span className="text-[10px] text-stone-500">{language === 'ta' ? 'நேரடி சேட் & பிராட்காஸ்ட்' : '1-Click Direct Chat'}</span>
                </button>

                {/* Normal SMS */}
                <button
                  type="button"
                  onClick={() => setSelectedChannel('sms')}
                  className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedChannel === 'sms'
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <Smartphone className={`w-5 h-5 ${selectedChannel === 'sms' ? 'text-primary' : 'text-stone-400'}`} />
                  <span className="text-xs font-bold">{language === 'ta' ? 'சாதாரண SMS' : 'Normal SMS'}</span>
                  <span className="text-[10px] text-stone-500">{language === 'ta' ? 'கேரியர் கேட்வே' : 'Carrier Gateway'}</span>
                </button>

                {/* Both */}
                <button
                  type="button"
                  onClick={() => setSelectedChannel('both')}
                  className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedChannel === 'both'
                      ? 'border-gold bg-amber-50 text-amber-900 shadow-sm'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <Sparkles className={`w-5 h-5 ${selectedChannel === 'both' ? 'text-gold' : 'text-stone-400'}`} />
                  <span className="text-xs font-bold">{language === 'ta' ? 'இரண்டும் (SMS + WA)' : 'Both (SMS + WA)'}</span>
                  <span className="text-[10px] text-stone-500">{language === 'ta' ? 'அதிகபட்ச சென்றடைவு' : 'Maximum Reach'}</span>
                </button>
              </div>
            </div>

            {/* Audience Filter Tabs */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>{language === 'ta' ? '2. பெறும் நபர்களின் பிரிவு (Audience)' : '2. Target Audience Filter'}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    recipientFilter === 'all'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'அனைத்து எண்கள்' : 'All Mobile Contacts'}</span>
                  <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">{recipients.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientFilter('registered')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    recipientFilter === 'registered'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'பதிவுசெய்த பயனர்கள் மட்டும்' : 'Registered Users Only'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientFilter('buyers')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    recipientFilter === 'buyers'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'ஆர்டர் செய்த வாடிக்கையாளர்கள்' : 'Order Buyers Only'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Message Composer */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-primary" />
                <span>{language === 'ta' ? '3. செய்தியை உருவாக்கவும் (Message Content)' : '3. Compose Broadcast Message'}</span>
              </label>

              {/* Character counter */}
              <div className="text-[11px] text-stone-500 font-mono">
                {messageText.length} chars | {Math.ceil(messageText.length / 160) || 1} SMS {language === 'ta' ? 'பக்கம்' : 'page(s)'}
              </div>
            </div>

            {/* Campaign Title (Optional) */}
            <div>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder={language === 'ta' ? 'பிரச்சாரத்தின் தலைப்பு (எ.கா: தீபாவளி தள்ளுபடி சலுகை)' : 'Campaign Title (e.g. Diwali Saree Special Offer)'}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary bg-stone-50/50"
              />
            </div>

            {/* Quick Template Buttons */}
            <div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                {language === 'ta' ? '⚡ விரைவு டெம்ப்ளேட்டுகள் (Quick Templates):' : '⚡ Quick Templates:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTemplate('festive')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  🪔 {language === 'ta' ? 'பண்டிகை சலுகை' : 'Festive Special'}
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('new_arrivals')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  ✨ {language === 'ta' ? 'புதிய புடவைகள்' : 'New Arrivals'}
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('discount')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  🏷️ {language === 'ta' ? '10% தள்ளுபடி கூப்பன்' : '10% Coupon Code'}
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('appreciation')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  🌸 {language === 'ta' ? 'வாழ்த்துகள்' : 'Appreciation'}
                </button>
              </div>
            </div>

            {/* Message Textarea */}
            <div className="relative">
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={language === 'ta' ? 'செய்தியை இங்கே தட்டச்சு செய்யவும்... {name} என்ற குறிச்சொல் வாடிக்கையாளரின் பெயராக மாறும்.' : 'Type your message here... Use {name} to personalize with recipient name.'}
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-stone-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans leading-relaxed text-stone-800"
              />
            </div>

            {/* Tag Inserter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase">{language === 'ta' ? 'குறிச்சொற்கள்:' : 'Personalize Tags:'}</span>
              <button
                type="button"
                onClick={() => insertTag('{name}')}
                className="text-[10px] font-mono bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200 font-bold cursor-pointer"
                title="Inserts Customer Full Name"
              >
                + &#123;name&#125;
              </button>
              <button
                type="button"
                onClick={() => insertTag('{first_name}')}
                className="text-[10px] font-mono bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200 font-bold cursor-pointer"
                title="Inserts Customer First Name"
              >
                + &#123;first_name&#125;
              </button>
              <button
                type="button"
                onClick={() => insertTag('{phone}')}
                className="text-[10px] font-mono bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200 font-bold cursor-pointer"
                title="Inserts Customer Phone Number"
              >
                + &#123;phone&#125;
              </button>
              <button
                type="button"
                onClick={() => insertTag('{store}')}
                className="text-[10px] font-mono bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200 font-bold cursor-pointer"
                title="Inserts Store Name"
              >
                + &#123;store&#125;
              </button>
            </div>

            {/* Fast2SMS API Key Collapsible (Only relevant for SMS) */}
            {(selectedChannel === 'sms' || selectedChannel === 'both') && (
              <div className="pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowSmsConfig(!showSmsConfig)}
                  className="text-xs font-bold text-stone-600 hover:text-primary flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'Fast2SMS கேரியர் கேட்வே அமைப்புகள்' : 'Fast2SMS Carrier Gateway Settings'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${fast2smsConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {fast2smsConfigured ? (language === 'ta' ? 'செயலில் உள்ளது ✓' : 'Configured ✓') : (language === 'ta' ? 'தேவைப்பட்டால் மாற்றலாம்' : 'Simulator / Optional Key')}
                  </span>
                </button>

                {showSmsConfig && (
                  <div className="mt-2.5 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3.5 animate-in fade-in">
                    {/* TRAI & Sender ID Info Box */}
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-1.5 text-amber-950">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>{language === 'ta' ? 'அனுப்புநர் பெயர் (Sender ID) பற்றிய விளக்கம்:' : 'Why does SMS show a number like 59039465?'}</span>
                      </div>
                      <p className="text-[11px] text-amber-900/90 leading-relaxed">
                        {language === 'ta'
                          ? 'இந்திய அரசின் TRAI விதிமுறைகளின்படி, அனைத்து தொலைத்தொடர்பு நெட்வொர்க்குகளும் (Jio, Airtel, Vi) SMS தலைப்பில் எழுத்துக்கள் (எ.கா: THALIR) வர DLT பதிவு கட்டாயம். DLT இல்லாத விரைவு SMS பொதுவான எண்கள் மூலம் செல்லும். வாடிக்கையாளர் உடனடியாக உங்கள் கடையை அடையாளம் காண, அனைத்து SMSகளின் தொடக்கத்திலும் [ THALIR BOUTIQUE ] என சேர்க்கப்பட்டுள்ளது.'
                          : 'Under Indian TRAI telecom regulations, all carrier SMS without DLT registration are routed via shared gateway numbers (like 59039465). To make sure your customers immediately recognize your boutique, all messages now start with [ THALIR BOUTIQUE ] at the top.'}
                      </p>
                      <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                        <span>💬 {language === 'ta' ? 'உடனடி பிராண்ட் பெயர்: WhatsApp தேர்வு செய்தால், நேரடியாக உங்கள் "Thalir Boutique" பெயரிலேயே செய்தி செல்லும்!' : 'For instant brand delivery: Use WhatsApp option to send directly as "Thalir Boutique"!'}</span>
                      </p>
                    </div>

                    {/* Sender ID & API Key Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          {language === 'ta' ? 'அனுப்புநர் பெயர் (Sender ID):' : 'Sender ID / 6-Letter Header:'}
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={fast2smsSenderId}
                          onChange={(e) => setFast2smsSenderId(e.target.value.toUpperCase())}
                          placeholder="THALIR"
                          className="w-full text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:border-primary bg-white"
                        />
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {language === 'ta' ? 'TRAI DLT ஒப்புதல் பெற்ற 6 இலக்க பெயர்' : '6-character DLT registered header'}
                        </span>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          {language === 'ta' ? 'SMS முறை (Route):' : 'SMS Delivery Route:'}
                        </label>
                        <select
                          value={fast2smsRoute}
                          onChange={(e) => setFast2smsRoute(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:border-primary bg-white cursor-pointer"
                        >
                          <option value="q">{language === 'ta' ? 'Quick SMS (DLT தேவையில்லை)' : 'Quick SMS (Route q - Instant)'}</option>
                          <option value="dlt">{language === 'ta' ? 'DLT Route (ஒப்புதல் பெற்ற தலைப்பு)' : 'DLT Route (Approved Header)'}</option>
                        </select>
                      </div>
                    </div>

                    {fast2smsRoute === 'dlt' && (
                      <div className="animate-in fade-in">
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          {language === 'ta' ? 'DLT Template ID:' : 'DLT Content Template ID:'}
                        </label>
                        <input
                          type="text"
                          value={fast2smsDltTemplateId}
                          onChange={(e) => setFast2smsDltTemplateId(e.target.value)}
                          placeholder="e.g. 17071618293..."
                          className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:border-primary bg-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">
                        {language === 'ta' ? 'Fast2SMS API Key:' : 'Fast2SMS API Key:'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={fast2smsApiKey}
                          onChange={(e) => setFast2smsApiKey(e.target.value)}
                          placeholder="Enter Fast2SMS API Key"
                          className="text-xs font-mono flex-1 px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:border-primary bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (fast2smsApiKey) {
                              setFast2smsConfigured(true);
                              alert(language === 'ta' ? 'அமைப்புகள் சேமிக்கப்பட்டது!' : 'Gateway settings saved!');
                            }
                          }}
                          className="text-xs font-bold px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
                        >
                          {language === 'ta' ? 'சேமி' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyMessage}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'செய்தியை நகலெடு' : 'Copy Message'}</span>
                </button>
                <button
                  type="button"
                  onClick={copyAllNumbers}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'எண்களை நகலெடு' : 'Copy Numbers'}</span>
                </button>
              </div>

              {/* Main Broadcast Send Button */}
              <button
                type="button"
                disabled={isSending || targetRecipients.length === 0}
                onClick={handleSendBroadcast}
                className="bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'ta' ? 'செய்தி அனுப்பப்படுகிறது...' : 'Dispatching Broadcast...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {selectedChannel === 'whatsapp' && (language === 'ta' ? `WhatsApp பிராட்காஸ்ட் தயார் (${targetRecipients.length})` : `Start WhatsApp Broadcast (${targetRecipients.length})`)}
                      {selectedChannel === 'sms' && (language === 'ta' ? `SMS அனுப்புக (${targetRecipients.length})` : `Send Bulk SMS (${targetRecipients.length})`)}
                      {selectedChannel === 'both' && (language === 'ta' ? `இரண்டிலும் அனுப்புக (${targetRecipients.length})` : `Broadcast to All (${targetRecipients.length})`)}
                    </span>
                  </>
                )}
              </button>
            </div>
            {copiedNotification && (
              <p className="text-[11px] text-emerald-600 font-bold text-center animate-in fade-in">
                ✓ {language === 'ta' ? 'கிளிப்போர்டில் வெற்றிகரமாக நகலெடுக்கப்பட்டது!' : 'Copied to clipboard successfully!'}
              </p>
            )}
          </div>

          {/* Interactive WhatsApp Queue Player (Appears when WhatsApp is active) */}
          {isQueueActive && targetRecipients.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-lg space-y-4 animate-in fade-in border border-emerald-500/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-300" />
                  <h4 className="font-bold text-sm">
                    {language === 'ta' ? 'WhatsApp நேரடி அனுப்பும் வரிசை (Interactive Queue)' : '1-Click WhatsApp Direct Sender Queue'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQueueActive(false)}
                  className="text-stone-300 hover:text-white text-xs underline cursor-pointer"
                >
                  {language === 'ta' ? 'மூடு' : 'Close Queue'}
                </button>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-emerald-200 mb-1">
                  <span>
                    {language === 'ta' ? 'வாடிக்கையாளர்' : 'Recipient'} {activeQueueIndex + 1} {language === 'ta' ? 'இல்' : 'of'} {targetRecipients.length}
                  </span>
                  <span>{sentQueuePhones.size} {language === 'ta' ? 'அனுப்பப்பட்டது' : 'sent'}</span>
                </div>
                <div className="w-full bg-emerald-950/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gold h-full transition-all duration-300"
                    style={{ width: `${((activeQueueIndex + 1) / targetRecipients.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Recipient Card */}
              {targetRecipients[activeQueueIndex] && (
                <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <strong className="text-base font-bold text-white block">
                      {targetRecipients[activeQueueIndex].name}
                    </strong>
                    <span className="text-xs text-emerald-200 font-mono block">
                      +91 {targetRecipients[activeQueueIndex].phone}
                    </span>
                    <span className="text-[10px] text-stone-300 italic block mt-1">
                      {targetRecipients[activeQueueIndex].source === 'registered' ? 'Registered Customer' : 'Order Customer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => openWhatsAppDirect(targetRecipients[activeQueueIndex])}
                      className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-stone-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{language === 'ta' ? 'WhatsApp இல் அனுப்பு' : 'Open WhatsApp Chat'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      disabled={activeQueueIndex >= targetRecipients.length - 1}
                      onClick={() => setActiveQueueIndex(prev => Math.min(prev + 1, targetRecipients.length - 1))}
                      className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {language === 'ta' ? 'அடுத்து ➔' : 'Next ➔'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Recipients Selector Table (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[780px]">
            {/* Header */}
            <div className="p-4 border-b border-stone-200 bg-stone-50 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs sm:text-sm text-stone-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{language === 'ta' ? 'வாடிக்கையாளர் எண்கள் பட்டியல்' : 'Target Recipient Contacts'}</span>
                  <span className="bg-stone-200 text-stone-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {selectedPhones.size} / {recipients.length}
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-primary hover:text-primary-dark underline cursor-pointer"
                >
                  {selectedPhones.size === filteredRecipients.length
                    ? (language === 'ta' ? 'எல்லாம் நீக்கு' : 'Deselect All')
                    : (language === 'ta' ? 'அனைத்தும் தேர்வு' : 'Select All')
                  }
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ta' ? 'பெயர் அல்லது எண்ணைத் தேடவும்...' : 'Search by customer name or phone...'}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary bg-white"
                />
              </div>

              {/* Quick Add Custom Test Number */}
              <form onSubmit={handleAddCustomRecipient} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={language === 'ta' ? 'பெயர் (விருப்பம்)' : 'Name'}
                  className="w-1/3 text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none bg-white"
                />
                <input
                  type="tel"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder={language === 'ta' ? '10 இலக்க மொபைல் எண்' : '10-digit mobile'}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none bg-white font-mono"
                />
                <button
                  type="submit"
                  className="bg-stone-800 hover:bg-black text-white text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  title="Add recipient"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'சேர்' : 'Add'}</span>
                </button>
              </form>
            </div>

            {/* Scrollable Recipients List */}
            <div className="overflow-y-auto flex-1 divide-y divide-stone-100 p-2">
              {filteredRecipients.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs">
                  {loadingRecipients 
                    ? (language === 'ta' ? 'எண்கள் பதிவேற்றப்படுகின்றன...' : 'Loading recipient contacts...')
                    : (language === 'ta' ? 'வாடிக்கையாளர் எண்கள் எதுவும் கிடைக்கவில்லை.' : 'No mobile numbers found matching filter.')
                  }
                </div>
              ) : (
                filteredRecipients.map((rec) => {
                  const isChecked = selectedPhones.has(rec.phone);
                  const isSent = sentQueuePhones.has(rec.phone);

                  return (
                    <div
                      key={rec.phone}
                      className={`p-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                        isChecked ? 'bg-stone-50 hover:bg-stone-100/70' : 'opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePhone(rec.phone)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                        <div>
                          <strong className="text-xs font-semibold text-stone-900 block">
                            {rec.name}
                          </strong>
                          <span className="text-[11px] font-mono text-stone-500 block">
                            +91 {rec.phone}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Sent Badge */}
                        {isSent && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Sent
                          </span>
                        )}

                        {/* Source Tag */}
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          rec.source === 'registered' || rec.source === 'both'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {rec.source === 'registered' ? 'Reg' : rec.source === 'both' ? 'Reg+Buyer' : 'Buyer'}
                        </span>

                        {/* Direct 1-Click WhatsApp Button */}
                        <button
                          type="button"
                          onClick={() => openWhatsAppDirect(rec)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Open WhatsApp chat with prefilled message"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Direct 1-Click Device SMS Button */}
                        <button
                          type="button"
                          onClick={() => openDeviceSms(rec)}
                          className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Open phone SMS app"
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-500">
              {language === 'ta'
                ? `தேர்வு செய்யப்பட்டவை: ${selectedPhones.size} / ${recipients.length} எண்கள்`
                : `Targeting ${selectedPhones.size} of ${recipients.length} reachable mobile numbers`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold" />
            <span>{language === 'ta' ? 'முந்தைய செய்திகள் & பிராட்காஸ்ட் வரலாறு' : 'Previous Broadcast History & Logs'}</span>
          </h3>
          <button
            type="button"
            onClick={fetchHistory}
            className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>{language === 'ta' ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <th className="py-2.5 px-3">{language === 'ta' ? 'நாள் & நேரம்' : 'Date & Time'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'முறை (Channel)' : 'Channel'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'தலைப்பு / செய்தி' : 'Campaign & Message'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'எண்ணிக்கை' : 'Recipients'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'நிலை' : 'Status'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'கேட்வே' : 'Gateway'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {broadcastHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    {language === 'ta' ? 'முந்தைய பிராட்காஸ்ட் பதிவுகள் எதுவும் இல்லை.' : 'No previous broadcast messages recorded yet.'}
                  </td>
                </tr>
              ) : (
                broadcastHistory.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(b.created_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        b.channel === 'sms' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        {b.channel}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate">
                      <strong className="text-stone-800 block text-xs">{b.title || 'Broadcast Campaign'}</strong>
                      <span className="text-[11px] text-stone-500 block truncate">{b.message}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-stone-700">
                      {b.recipient_count}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === 'sent' || b.status === 'simulated' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-500 text-[11px]">
                      {b.gateway || 'Multi-Channel'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success / Result Dialog Modal */}
      {resultModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-emerald-600/30 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-xl text-stone-900">
                {language === 'ta' ? 'பிராட்காஸ்ட் வெற்றிகரமாக தயாராகியுள்ளது!' : 'Broadcast Dispatched Successfully!'}
              </h3>
              <p className="text-xs text-stone-600">
                {resultModal.message}
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">{language === 'ta' ? 'அனுப்பிய முறை:' : 'Channel:'}</span>
                <span className="font-bold uppercase text-stone-800">{resultModal.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{language === 'ta' ? 'சென்றடைந்த எண்கள்:' : 'Total Recipients:'}</span>
                <span className="font-bold text-stone-800 font-mono">{resultModal.recipient_count}</span>
              </div>
              {resultModal.channel !== 'whatsapp' && (
                <div className="flex justify-between">
                  <span className="text-stone-500">{language === 'ta' ? 'SMS கேரியர் நிலை:' : 'Carrier SMS Status:'}</span>
                  <span className="font-bold text-emerald-700 capitalize font-mono">{resultModal.sms_status} ({resultModal.sms_sent_count} sent)</span>
                </div>
              )}
              {resultModal.sms_details?.note && (
                <p className="text-[11px] text-stone-500 italic pt-1 border-t border-stone-200">
                  ℹ️ {resultModal.sms_details.note}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResultModal(null)}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                {language === 'ta' ? 'சரி / தொடர்க' : 'Done / Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

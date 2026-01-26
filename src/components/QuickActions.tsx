import React, { useState, useEffect, useRef } from 'react';
import { Plus, Phone, MessageCircle, X, Check, User, Clock, FileText } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Customer, Activity } from '../types';
import toast from 'react-hot-toast';

// ==================== QUICK ACTION FAB ====================

interface QuickActionsFABProps {
  onCallClick: () => void;
  onMessageClick: () => void;
}

export const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({ onCallClick, onMessageClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Sub-buttons - visible when FAB is open */}
      <div className={`flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Message Button */}
        <button
          onClick={() => { onMessageClick(); setIsOpen(false); }}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white pl-4 pr-5 py-3 rounded-full shadow-lg transition-all hover:scale-105"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Mesaj Kaydı</span>
        </button>

        {/* Call Button */}
        <button
          onClick={() => { onCallClick(); setIsOpen(false); }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white pl-4 pr-5 py-3 rounded-full shadow-lg transition-all hover:scale-105"
        >
          <Phone className="w-5 h-5" />
          <span className="text-sm font-medium">Arama Kaydı</span>
        </button>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
            : 'bg-sky-500 hover:bg-sky-600'
        }`}
      >
        <Plus className="w-7 h-7 text-white" />
      </button>
    </div>
  );
};

// ==================== QUICK CALL MODAL ====================

interface QuickCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCallModal: React.FC<QuickCallModalProps> = ({ isOpen, onClose }) => {
  const { customers, addActivity, addCustomer, userProfile } = useData();
  const [phone, setPhone] = useState('');
  const [callResult, setCallResult] = useState<'Olumlu' | 'Olumsuz' | 'Düşünüyor' | 'Ulaşılamadı'>('Olumlu');
  const [note, setNote] = useState('');
  const [callTime, setCallTime] = useState<'now' | '5min' | '10min'>('now');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setCallResult('Olumlu');
      setNote('');
      setCallTime('now');
      setMatchedCustomer(null);
      setSuggestions([]);
    }
  }, [isOpen]);

  // Search customers by phone
  useEffect(() => {
    if (phone.length >= 3) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const matches = customers.filter(c =>
        c.phone?.replace(/\D/g, '').includes(normalizedPhone)
      ).slice(0, 5);
      setSuggestions(matches);

      // Exact match
      const exact = customers.find(c =>
        c.phone?.replace(/\D/g, '') === normalizedPhone
      );
      setMatchedCustomer(exact || null);
    } else {
      setSuggestions([]);
      setMatchedCustomer(null);
    }
  }, [phone, customers]);

  const selectCustomer = (customer: Customer) => {
    setPhone(customer.phone);
    setMatchedCustomer(customer);
    setSuggestions([]);
  };

  const getCallDateTime = () => {
    const now = new Date();
    if (callTime === '5min') now.setMinutes(now.getMinutes() - 5);
    if (callTime === '10min') now.setMinutes(now.getMinutes() - 10);
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5)
    };
  };

  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast.error('Telefon numarası gerekli');
      return;
    }

    setIsSubmitting(true);

    try {
      let customerId = matchedCustomer?.id;
      let customerName = matchedCustomer?.name;

      // If no match, create potential customer
      if (!matchedCustomer) {
        const newCustomer: Partial<Customer> = {
          name: `Potansiyel - ${phone}`,
          phone: phone,
          email: '',
          status: 'Potansiyel',
          customerType: 'Alıcı',
          source: 'Telefon',
          createdAt: new Date().toISOString(),
          interactions: [],
          avatar: `https://ui-avatars.com/api/?name=P&background=f59e0b&color=fff`
        };
        const created = await addCustomer(newCustomer as Customer);
        customerId = created.id;
        customerName = created.name;
        toast.success('Yeni potansiyel müşteri oluşturuldu');
      }

      const { date, time } = getCallDateTime();

      const activity: Partial<Activity> = {
        type: 'Gelen Arama',
        customerId: customerId!,
        customerName: customerName!,
        date,
        time,
        description: note || `${callResult} - Telefon görüşmesi`,
        status: callResult === 'Ulaşılamadı' ? 'Olumsuz' : callResult as any
      };

      await addActivity(activity as Activity);
      toast.success('Arama kaydedildi');
      onClose();
    } catch (error) {
      console.error('Error saving call:', error);
      toast.error('Kayıt sırasında hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:w-[440px] sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-blue-500 text-white sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Hızlı Arama Kaydı</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Phone Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Telefon Numarası
            </label>
            <input
              ref={inputRef}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-lg"
            />

            {/* Customer Suggestions */}
            {suggestions.length > 0 && !matchedCustomer && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {suggestions.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center gap-3 border-b last:border-0 border-gray-100 dark:border-slate-600"
                  >
                    <img src={customer.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{customer.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Matched Customer Badge */}
            {matchedCustomer && (
              <div className="mt-2 flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Eşleşti: {matchedCustomer.name}</span>
              </div>
            )}

            {/* No Match Info */}
            {phone.length >= 7 && !matchedCustomer && suggestions.length === 0 && (
              <div className="mt-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg">
                <User className="w-4 h-4" />
                <span className="text-sm">Yeni potansiyel müşteri olarak kaydedilecek</span>
              </div>
            )}
          </div>

          {/* Call Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1" /> Görüşme Zamanı
            </label>
            <div className="flex gap-2">
              {[
                { value: 'now', label: 'Şimdi' },
                { value: '5min', label: '5 dk önce' },
                { value: '10min', label: '10 dk önce' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCallTime(opt.value as any)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    callTime === opt.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Call Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Görüşme Sonucu
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'Olumlu', color: 'green', icon: '👍' },
                { value: 'Olumsuz', color: 'red', icon: '👎' },
                { value: 'Düşünüyor', color: 'amber', icon: '🤔' },
                { value: 'Ulaşılamadı', color: 'gray', icon: '📵' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCallResult(opt.value as any)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    callResult === opt.value
                      ? opt.color === 'green' ? 'bg-green-500 text-white ring-2 ring-green-300' :
                        opt.color === 'red' ? 'bg-red-500 text-white ring-2 ring-red-300' :
                        opt.color === 'amber' ? 'bg-amber-500 text-white ring-2 ring-amber-300' :
                        'bg-gray-500 text-white ring-2 ring-gray-300'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="mr-2">{opt.icon}</span>
                  {opt.value}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              <FileText className="w-4 h-4 inline mr-1" /> Not (opsiyonel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Görüşme hakkında kısa not..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !phone.trim()}
              className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== QUICK MESSAGE MODAL ====================

interface QuickMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickMessageModal: React.FC<QuickMessageModalProps> = ({ isOpen, onClose }) => {
  const { customers, addActivity, addCustomer } = useData();
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
  const [topic, setTopic] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setChannel('WhatsApp');
      setTopic('');
      setMatchedCustomer(null);
      setSuggestions([]);
    }
  }, [isOpen]);

  // Search customers by phone
  useEffect(() => {
    if (phone.length >= 3) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const matches = customers.filter(c =>
        c.phone?.replace(/\D/g, '').includes(normalizedPhone)
      ).slice(0, 5);
      setSuggestions(matches);

      const exact = customers.find(c =>
        c.phone?.replace(/\D/g, '') === normalizedPhone
      );
      setMatchedCustomer(exact || null);
    } else {
      setSuggestions([]);
      setMatchedCustomer(null);
    }
  }, [phone, customers]);

  const selectCustomer = (customer: Customer) => {
    setPhone(customer.phone);
    setMatchedCustomer(customer);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast.error('Telefon numarası veya kişi gerekli');
      return;
    }

    setIsSubmitting(true);

    try {
      let customerId = matchedCustomer?.id;
      let customerName = matchedCustomer?.name;

      // If no match, create potential customer
      if (!matchedCustomer) {
        const newCustomer: Partial<Customer> = {
          name: `Potansiyel - ${phone}`,
          phone: phone,
          email: '',
          status: 'Potansiyel',
          customerType: 'Alıcı',
          source: channel,
          createdAt: new Date().toISOString(),
          interactions: [],
          avatar: `https://ui-avatars.com/api/?name=P&background=10b981&color=fff`
        };
        const created = await addCustomer(newCustomer as Customer);
        customerId = created.id;
        customerName = created.name;
        toast.success('Yeni potansiyel müşteri oluşturuldu');
      }

      const now = new Date();

      const activity: Partial<Activity> = {
        type: 'Diğer',
        customerId: customerId!,
        customerName: customerName!,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        description: `${channel} - ${topic || 'Mesajlaşma'}`,
        status: 'Tamamlandı'
      };

      await addActivity(activity as Activity);
      toast.success('Mesaj kaydı eklendi');
      onClose();
    } catch (error) {
      console.error('Error saving message:', error);
      toast.error('Kayıt sırasında hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:w-[440px] sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-green-500 text-white sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Hızlı Mesaj Kaydı</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Kanal
            </label>
            <div className="flex gap-2">
              {[
                { value: 'WhatsApp', icon: '💬', color: 'green' },
                { value: 'SMS', icon: '📱', color: 'blue' },
                { value: 'Email', icon: '📧', color: 'purple' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setChannel(opt.value as any)}
                  className={`flex-1 py-3 px-3 rounded-xl text-sm font-medium transition-all ${
                    channel === opt.value
                      ? opt.color === 'green' ? 'bg-green-500 text-white' :
                        opt.color === 'blue' ? 'bg-blue-500 text-white' :
                        'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="mr-1">{opt.icon}</span>
                  {opt.value}
                </button>
              ))}
            </div>
          </div>

          {/* Phone/Contact Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Kişi / Telefon
            </label>
            <input
              ref={inputRef}
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="İsim veya telefon numarası"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
            />

            {/* Customer Suggestions */}
            {suggestions.length > 0 && !matchedCustomer && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {suggestions.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center gap-3 border-b last:border-0 border-gray-100 dark:border-slate-600"
                  >
                    <img src={customer.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{customer.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Matched Customer Badge */}
            {matchedCustomer && (
              <div className="mt-2 flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Eşleşti: {matchedCustomer.name}</span>
              </div>
            )}
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Konu
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Seçiniz...</option>
              <option value="Fiyat görüşmesi">Fiyat görüşmesi</option>
              <option value="Randevu">Randevu</option>
              <option value="Bilgi talebi">Bilgi talebi</option>
              <option value="Belge paylaşımı">Belge paylaşımı</option>
              <option value="Takip">Takip</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !phone.trim()}
              className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

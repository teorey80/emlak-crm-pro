import React, { useState, useEffect, useRef } from 'react';
import { Plus, Phone, MessageCircle, X, Check, User, Clock, FileText, PhoneIncoming, PhoneOutgoing, Building2, Calendar, ClipboardList, Info } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Customer, Activity, Property } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ==================== QUICK ACTION FAB ====================

interface QuickActionsFABProps {
  onCallClick: () => void;
  onMessageClick: () => void;
}

export const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({ onCallClick, onMessageClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[100] flex flex-col items-end gap-3">
      {/* Sub-buttons - visible when FAB is open */}
      <div className={`flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Message Button */}
        <button
          onClick={() => { onMessageClick(); setIsOpen(false); }}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white pl-4 pr-5 py-3 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium whitespace-nowrap">Mesaj Kaydı</span>
        </button>

        {/* Call Button */}
        <button
          onClick={() => { onCallClick(); setIsOpen(false); }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white pl-4 pr-5 py-3 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Phone className="w-5 h-5" />
          <span className="text-sm font-medium whitespace-nowrap">Arama Kaydı</span>
        </button>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
            : 'bg-sky-500 hover:bg-sky-600 animate-pulse'
        }`}
        style={{ boxShadow: isOpen ? undefined : '0 0 20px rgba(14, 165, 233, 0.5)' }}
      >
        <Plus className="w-8 h-8 text-white" />
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
  const navigate = useNavigate();
  const { customers, properties, addActivity, addCustomer, addRequest } = useData();

  // Form state
  const [callDirection, setCallDirection] = useState<'incoming' | 'outgoing'>('incoming');
  const [phone, setPhone] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertySearch, setPropertySearch] = useState('');
  const [actionType, setActionType] = useState<'info' | 'appointment' | 'request'>('info');
  const [callResult, setCallResult] = useState<'Olumlu' | 'Olumsuz' | 'Düşünüyor'>('Olumlu');
  const [note, setNote] = useState('');

  // UI state
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [propertySuggestions, setPropertySuggestions] = useState<Property[]>([]);
  const [showPropertySearch, setShowPropertySearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Focus phone input when modal opens
  useEffect(() => {
    if (isOpen && phoneInputRef.current) {
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCallDirection('incoming');
      setPhone('');
      setSelectedProperty(null);
      setPropertySearch('');
      setActionType('info');
      setCallResult('Olumlu');
      setNote('');
      setMatchedCustomer(null);
      setCustomerSuggestions([]);
      setPropertySuggestions([]);
      setShowPropertySearch(false);
    }
  }, [isOpen]);

  // Search customers by phone
  useEffect(() => {
    if (phone.length >= 3) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const matches = customers.filter(c =>
        c.phone?.replace(/\D/g, '').includes(normalizedPhone)
      ).slice(0, 5);
      setCustomerSuggestions(matches);

      // Exact match
      const exact = customers.find(c =>
        c.phone?.replace(/\D/g, '') === normalizedPhone ||
        c.phone?.replace(/\D/g, '').endsWith(normalizedPhone)
      );
      setMatchedCustomer(exact || null);
    } else {
      setCustomerSuggestions([]);
      setMatchedCustomer(null);
    }
  }, [phone, customers]);

  // Search properties
  useEffect(() => {
    if (propertySearch.length >= 2) {
      const searchLower = propertySearch.toLowerCase();
      const matches = properties.filter(p =>
        p.title?.toLowerCase().includes(searchLower) ||
        p.location?.toLowerCase().includes(searchLower) ||
        p.id?.toLowerCase().includes(searchLower)
      ).slice(0, 5);
      setPropertySuggestions(matches);
    } else {
      setPropertySuggestions([]);
    }
  }, [propertySearch, properties]);

  const selectCustomer = (customer: Customer) => {
    setPhone(customer.phone);
    setMatchedCustomer(customer);
    setCustomerSuggestions([]);
  };

  const selectProperty = (property: Property) => {
    setSelectedProperty(property);
    setPropertySearch('');
    setPropertySuggestions([]);
    setShowPropertySearch(false);
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

      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().slice(0, 5);

      // Build description based on action type
      let description = '';
      const propertyInfo = selectedProperty ? `[${selectedProperty.title}] ` : '';

      switch (actionType) {
        case 'info':
          description = `${propertyInfo}Bilgi verildi. ${note}`.trim();
          break;
        case 'appointment':
          description = `${propertyInfo}Randevu planlandı. ${note}`.trim();
          break;
        case 'request':
          description = `${propertyInfo}Yeni talep alındı. ${note}`.trim();
          break;
      }

      // Create activity
      const activity: Partial<Activity> = {
        type: callDirection === 'incoming' ? 'Gelen Arama' : 'Giden Arama',
        customerId: customerId!,
        customerName: customerName!,
        propertyId: selectedProperty?.id,
        propertyTitle: selectedProperty?.title,
        date,
        time,
        description,
        status: callResult
      };

      await addActivity(activity as Activity);

      // If appointment selected, offer to create activity
      if (actionType === 'appointment') {
        toast.success('Arama kaydedildi. Randevu için Aktiviteler sayfasına yönlendiriliyorsunuz.');
        onClose();
        setTimeout(() => {
          navigate('/activities/new', {
            state: {
              customerId,
              customerName,
              propertyId: selectedProperty?.id,
              propertyTitle: selectedProperty?.title,
              type: 'Yer Gösterimi'
            }
          });
        }, 500);
        return;
      }

      // If request selected, offer to create request
      if (actionType === 'request') {
        toast.success('Arama kaydedildi. Talep oluşturmak için Talepler sayfasına yönlendiriliyorsunuz.');
        onClose();
        setTimeout(() => {
          navigate('/requests/new', {
            state: {
              customerId,
              customerName
            }
          });
        }, 500);
        return;
      }

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
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-500 to-blue-600 text-white sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Hızlı Arama Kaydı</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(95vh-140px)]">

          {/* Call Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Arama Yönü
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCallDirection('incoming')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  callDirection === 'incoming'
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
              >
                <PhoneIncoming className="w-5 h-5" />
                Gelen Arama
              </button>
              <button
                onClick={() => setCallDirection('outgoing')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  callDirection === 'outgoing'
                    ? 'bg-green-500 text-white ring-2 ring-green-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
              >
                <PhoneOutgoing className="w-5 h-5" />
                Giden Arama
              </button>
            </div>
          </div>

          {/* Phone Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Telefon Numarası
            </label>
            <input
              ref={phoneInputRef}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-lg"
            />

            {/* Customer Suggestions */}
            {customerSuggestions.length > 0 && !matchedCustomer && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {customerSuggestions.map(customer => (
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
                <span className="text-sm font-medium">{matchedCustomer.name}</span>
              </div>
            )}

            {/* No Match Info */}
            {phone.length >= 7 && !matchedCustomer && customerSuggestions.length === 0 && (
              <div className="mt-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg">
                <User className="w-4 h-4" />
                <span className="text-sm">Yeni potansiyel müşteri olarak kaydedilecek</span>
              </div>
            )}
          </div>

          {/* Property Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              İlgili Portföy (opsiyonel)
            </label>

            {selectedProperty ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                {selectedProperty.images?.[0] && (
                  <img src={selectedProperty.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{selectedProperty.title}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{selectedProperty.location}</p>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg"
                >
                  <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={propertySearch}
                  onChange={(e) => { setPropertySearch(e.target.value); setShowPropertySearch(true); }}
                  onFocus={() => setShowPropertySearch(true)}
                  placeholder="Portföy ara (başlık veya konum)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />

                {/* Property Suggestions */}
                {showPropertySearch && propertySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {propertySuggestions.map(property => (
                      <button
                        key={property.id}
                        onClick={() => selectProperty(property)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center gap-3 border-b last:border-0 border-gray-100 dark:border-slate-600"
                      >
                        {property.images?.[0] && (
                          <img src={property.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{property.title}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{property.location} - {property.price?.toLocaleString('tr-TR')} {property.currency}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Ne Yapıldı?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActionType('info')}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-all ${
                  actionType === 'info'
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
              >
                <Info className="w-5 h-5" />
                Bilgi Verildi
              </button>
              <button
                onClick={() => setActionType('appointment')}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-all ${
                  actionType === 'appointment'
                    ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
              >
                <Calendar className="w-5 h-5" />
                Randevu
              </button>
              <button
                onClick={() => setActionType('request')}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-all ${
                  actionType === 'request'
                    ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                Talep Alındı
              </button>
            </div>
          </div>

          {/* Call Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Görüşme Sonucu
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'Olumlu', icon: '👍', color: 'green' },
                { value: 'Olumsuz', icon: '👎', color: 'red' },
                { value: 'Düşünüyor', icon: '🤔', color: 'amber' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCallResult(opt.value as any)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    callResult === opt.value
                      ? opt.color === 'green' ? 'bg-green-500 text-white ring-2 ring-green-300' :
                        opt.color === 'red' ? 'bg-red-500 text-white ring-2 ring-red-300' :
                        'bg-amber-500 text-white ring-2 ring-amber-300'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  <span className="mr-1">{opt.icon}</span>
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
  const { customers, properties, addActivity, addCustomer } = useData();
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertySearch, setPropertySearch] = useState('');
  const [topic, setTopic] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [propertySuggestions, setPropertySuggestions] = useState<Property[]>([]);
  const [showPropertySearch, setShowPropertySearch] = useState(false);
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
      setSelectedProperty(null);
      setPropertySearch('');
      setTopic('');
      setMatchedCustomer(null);
      setCustomerSuggestions([]);
      setPropertySuggestions([]);
      setShowPropertySearch(false);
    }
  }, [isOpen]);

  // Search customers by phone
  useEffect(() => {
    if (phone.length >= 3) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const matches = customers.filter(c =>
        c.phone?.replace(/\D/g, '').includes(normalizedPhone) ||
        c.name?.toLowerCase().includes(phone.toLowerCase())
      ).slice(0, 5);
      setCustomerSuggestions(matches);

      const exact = customers.find(c =>
        c.phone?.replace(/\D/g, '') === normalizedPhone
      );
      setMatchedCustomer(exact || null);
    } else {
      setCustomerSuggestions([]);
      setMatchedCustomer(null);
    }
  }, [phone, customers]);

  // Search properties
  useEffect(() => {
    if (propertySearch.length >= 2) {
      const searchLower = propertySearch.toLowerCase();
      const matches = properties.filter(p =>
        p.title?.toLowerCase().includes(searchLower) ||
        p.location?.toLowerCase().includes(searchLower)
      ).slice(0, 5);
      setPropertySuggestions(matches);
    } else {
      setPropertySuggestions([]);
    }
  }, [propertySearch, properties]);

  const selectCustomer = (customer: Customer) => {
    setPhone(customer.phone || customer.name);
    setMatchedCustomer(customer);
    setCustomerSuggestions([]);
  };

  const selectProperty = (property: Property) => {
    setSelectedProperty(property);
    setPropertySearch('');
    setPropertySuggestions([]);
    setShowPropertySearch(false);
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
      const propertyInfo = selectedProperty ? `[${selectedProperty.title}] ` : '';

      const activity: Partial<Activity> = {
        type: 'Diğer',
        customerId: customerId!,
        customerName: customerName!,
        propertyId: selectedProperty?.id,
        propertyTitle: selectedProperty?.title,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        description: `${channel} - ${propertyInfo}${topic || 'Mesajlaşma'}`,
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
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-500 to-green-600 text-white sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Hızlı Mesaj Kaydı</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Kanal
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'WhatsApp', icon: '💬', color: 'green' },
                { value: 'SMS', icon: '📱', color: 'blue' },
                { value: 'Email', icon: '📧', color: 'purple' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setChannel(opt.value as any)}
                  className={`py-3 px-3 rounded-xl text-sm font-medium transition-all ${
                    channel === opt.value
                      ? opt.color === 'green' ? 'bg-green-500 text-white' :
                        opt.color === 'blue' ? 'bg-blue-500 text-white' :
                        'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
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
            {customerSuggestions.length > 0 && !matchedCustomer && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {customerSuggestions.map(customer => (
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
                <span className="text-sm font-medium">{matchedCustomer.name}</span>
              </div>
            )}
          </div>

          {/* Property Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              İlgili Portföy (opsiyonel)
            </label>

            {selectedProperty ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
                {selectedProperty.images?.[0] && (
                  <img src={selectedProperty.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{selectedProperty.title}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{selectedProperty.location}</p>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg"
                >
                  <X className="w-4 h-4 text-green-600 dark:text-green-400" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={propertySearch}
                  onChange={(e) => { setPropertySearch(e.target.value); setShowPropertySearch(true); }}
                  onFocus={() => setShowPropertySearch(true)}
                  placeholder="Portföy ara (başlık veya konum)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                />

                {/* Property Suggestions */}
                {showPropertySearch && propertySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {propertySuggestions.map(property => (
                      <button
                        key={property.id}
                        onClick={() => selectProperty(property)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center gap-3 border-b last:border-0 border-gray-100 dark:border-slate-600"
                      >
                        {property.images?.[0] && (
                          <img src={property.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{property.title}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{property.location}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
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

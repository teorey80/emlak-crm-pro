import React, { useState, useMemo } from 'react';
import { MessageCircle, Phone, Send, Copy, CheckCheck, Search, Filter, Users, WholeWord, ExternalLink, Smartphone, Info, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { createWhatsAppLink, applyTemplate, MESSAGE_TEMPLATES, sendNetGSMSms } from '../services/smsService';

// ─── Tip Tanımları ─────────────────────────────────────────────────────────────
interface ContactEntry {
  customerId: string;
  customerName: string;
  phone: string;
  transactionType: 'sale' | 'rental';
  transactionDate: string;
  propertyTitle: string;
  selected: boolean;
}

// ─── Ana Bileşen ───────────────────────────────────────────────────────────────
const Messaging: React.FC = () => {
  const { sales, customers, userProfile } = useData();

  // Filtreler
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'rental'>('all');
  const [yearFilter, setYearFilter] = useState<'all' | 'thisYear' | 'lastYear'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Seçim
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Mesaj
  const [messageText, setMessageText] = useState(MESSAGE_TEMPLATES[0].text);
  const [selectedTemplate, setSelectedTemplate] = useState(MESSAGE_TEMPLATES[0].id);
  const [showTemplates, setShowTemplates] = useState(false);

  // SMS (NetGSM)
  const [useSMS, setUseSMS] = useState(false);
  const [sendingBatch, setSendingBatch] = useState(false);
  const [sentResults, setSentResults] = useState<{ phone: string; name: string; success: boolean }[]>([]);

  // NetGSM ayarları (settings'den alınacak — şimdilik localStorage)
  const netgsmUser = localStorage.getItem('netgsm_user') || '';
  const netgsmPass = localStorage.getItem('netgsm_pass') || '';

  // İşlem yapılmış müşteri listesi
  const contacts: ContactEntry[] = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();

    return sales
      .filter(sale => {
        // Tip filtresi
        if (typeFilter === 'sale' && sale.transactionType === 'rental') return false;
        if (typeFilter === 'rental' && sale.transactionType !== 'rental') return false;

        // Yıl filtresi
        const saleYear = new Date(sale.saleDate || sale.sale_date || '').getFullYear();
        if (yearFilter === 'thisYear' && saleYear !== thisYear) return false;
        if (yearFilter === 'lastYear' && saleYear !== thisYear - 1) return false;

        return true;
      })
      .map(sale => {
        // Müşteriyi bul
        const customerId = sale.buyerId || sale.buyer_id || '';
        const customer = customers.find(c => c.id === customerId);
        const phone = customer?.phone || '';

        return {
          customerId,
          customerName: sale.buyerName || sale.buyer_name || 'Bilinmiyor',
          phone,
          transactionType: sale.transactionType === 'rental' ? 'rental' : 'sale',
          transactionDate: sale.saleDate || sale.sale_date || '',
          propertyTitle: sale.propertyTitle || '',
          selected: selectedIds.has(customerId),
        } as ContactEntry;
      })
      .filter(c => c.customerId && c.phone) // Telefonu olmayanları çıkar
      // İsim araması
      .filter(c => !searchTerm || c.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      // Aynı müşteriyi tekrar ekleme
      .filter((c, idx, arr) => arr.findIndex(x => x.customerId === c.customerId) === idx);
  }, [sales, customers, typeFilter, yearFilter, searchTerm, selectedIds]);

  const selectedContacts = contacts.filter(c => selectedIds.has(c.customerId));

  // Tümünü seç / kaldır
  const toggleAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.customerId)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Şablonu uygula
  const applyMsg = (customer: ContactEntry) =>
    applyTemplate(messageText, {
      isim: customer.customerName,
      danismanAdi: userProfile?.name || 'Danışmanınız',
      tarih: customer.transactionDate,
      adres: customer.propertyTitle,
    });

  // Tek WhatsApp
  const openWhatsApp = (contact: ContactEntry) => {
    const msg = applyMsg(contact);
    const link = createWhatsAppLink(contact.phone, msg);
    window.open(link, '_blank');
  };

  // Seçilenlere toplu WhatsApp (her birini yeni sekmede aç)
  const openAllWhatsApp = () => {
    if (selectedContacts.length === 0) {
      toast.error('Önce müşteri seçin.');
      return;
    }
    if (selectedContacts.length > 10) {
      toast('⚠️ Tarayıcı 10\'dan fazla sekme engelleyebilir. İlk 10 açılıyor.', { icon: '⚠️' });
    }
    const toOpen = selectedContacts.slice(0, 10);
    toOpen.forEach(c => {
      const msg = applyMsg(c);
      window.open(createWhatsAppLink(c.phone, msg), '_blank');
    });
    toast.success(`${toOpen.length} WhatsApp penceresi açıldı.`);
  };

  // WhatsApp linkleri panoya kopyala
  const copyAllLinks = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Önce müşteri seçin.');
      return;
    }
    const lines = selectedContacts.map(c => {
      const msg = applyMsg(c);
      return `${c.customerName}: ${createWhatsAppLink(c.phone, msg)}`;
    }).join('\n');
    await navigator.clipboard.writeText(lines);
    toast.success(`${selectedContacts.length} WhatsApp linki panoya kopyalandı.`);
  };

  // Toplu NetGSM SMS
  const sendBatchSMS = async () => {
    if (!netgsmUser || !netgsmPass) {
      toast.error('Ayarlar > Entegrasyonlar bölümünden NetGSM bilgilerinizi girin.');
      return;
    }
    if (selectedContacts.length === 0) {
      toast.error('Önce müşteri seçin.');
      return;
    }

    setSendingBatch(true);
    const results: { phone: string; name: string; success: boolean }[] = [];

    // Her müşteriye bireysel SMS (kişiselleştirilmiş mesaj için)
    for (const contact of selectedContacts) {
      const msg = applyMsg(contact);
      const result = await sendNetGSMSms([contact.phone], msg, netgsmUser, netgsmPass);
      results.push({
        phone: contact.phone,
        name: contact.customerName,
        success: result.sent.length > 0 && result.failed.length === 0
      });
    }

    setSentResults(results);
    setSendingBatch(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    toast.success(`${successCount} SMS gönderildi${failCount > 0 ? `, ${failCount} başarısız` : ''}.`);
  };

  const selectTemplate = (tpl: typeof MESSAGE_TEMPLATES[number]) => {
    setMessageText(tpl.text);
    setSelectedTemplate(tpl.id);
    setShowTemplates(false);
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">📨 Mesajlaşma Merkezi</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          İşlem yapılmış müşterilerinize toplu WhatsApp mesajı veya SMS gönderin.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* SOL: Müşteri Listesi */}
        <div className="xl:col-span-2 space-y-4">
          {/* Filtreler */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
              <Filter className="w-4 h-4" />
              Müşteri Filtresi
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">İşlem Türü</label>
                <div className="flex gap-1">
                  {(['all', 'sale', 'rental'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        typeFilter === t
                          ? 'bg-[#1193d4] text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                      }`}
                    >
                      {t === 'all' ? '🔁 Hepsi' : t === 'sale' ? '🏠 Satış' : '🔑 Kiralama'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Dönem</label>
                <div className="flex gap-1">
                  {([
                    { val: 'all', label: 'Tümü' },
                    { val: 'thisYear', label: 'Bu Yıl' },
                    { val: 'lastYear', label: 'Geçen Yıl' },
                  ] as const).map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setYearFilter(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        yearFilter === val
                          ? 'bg-[#1193d4] text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-gray-500 mb-1">İsim Ara</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Müşteri ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Müşteri Tablosu */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1193d4]" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {contacts.length} müşteri bulundu
                </span>
                {selectedIds.size > 0 && (
                  <span className="bg-[#1193d4] text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedIds.size} seçili
                  </span>
                )}
              </div>
              <button
                onClick={toggleAll}
                className="text-xs text-[#1193d4] hover:underline font-medium"
              >
                {selectedIds.size === contacts.length && contacts.length > 0 ? 'Seçimi Kaldır' : 'Tümünü Seç'}
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="p-10 text-center">
                <Users className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Müşteri bulunamadı.</p>
                <p className="text-xs text-gray-400 mt-1">Satış veya kiralama işlemi yaparken müşteri ekleyin.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-slate-700/50 max-h-[500px] overflow-y-auto">
                {contacts.map(contact => (
                  <div
                    key={contact.customerId}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                      selectedIds.has(contact.customerId) ? 'bg-sky-50 dark:bg-sky-900/10' : ''
                    }`}
                    onClick={() => toggleOne(contact.customerId)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.customerId)}
                      onChange={() => toggleOne(contact.customerId)}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 rounded accent-sky-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 dark:text-white text-sm truncate">{contact.customerName}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          contact.transactionType === 'sale'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {contact.transactionType === 'sale' ? '🏠 Satış' : '🔑 Kiralama'}
                        </span>
                      </div>
                      {contact.propertyTitle && (
                        <div className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{contact.propertyTitle}</div>
                      )}
                    </div>
                    {/* Tekli WhatsApp */}
                    <button
                      onClick={e => { e.stopPropagation(); openWhatsApp(contact); }}
                      className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                      title="WhatsApp'ta aç"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ: Mesaj Paneli */}
        <div className="space-y-4">
          {/* Mesaj Şablonu */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                <WholeWord className="w-4 h-4 text-[#1193d4]" />
                Mesaj Şablonu
              </h3>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs text-[#1193d4] flex items-center gap-1 hover:underline"
              >
                Hazır Şablonlar
                {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showTemplates && (
              <div className="space-y-1 mb-2">
                {MESSAGE_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => selectTemplate(tpl)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      selectedTemplate === tpl.id
                        ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
              placeholder="Mesajınızı yazın..."
            />

            <div className="bg-sky-50 dark:bg-sky-900/10 rounded-lg p-2 text-xs text-sky-700 dark:text-sky-300">
              <strong>Değişkenler:</strong>{' '}
              <code>{'{{isim}}'}</code>, <code>{'{{danismanAdi}}'}</code>, <code>{'{{tarih}}'}</code>, <code>{'{{adres}}'}</code>
            </div>

            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {messageText.length} karakter
            </div>
          </div>

          {/* Gönderim Seçenekleri */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              📤 Gönderim ({selectedIds.size} seçili)
            </h3>

            {/* WhatsApp Butonları */}
            <div className="space-y-2">
              <button
                onClick={openAllWhatsApp}
                disabled={selectedIds.size === 0}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 dark:disabled:bg-slate-700 disabled:text-gray-400 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp ile Gönder ({selectedIds.size})
              </button>

              <button
                onClick={copyAllLinks}
                disabled={selectedIds.size === 0}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 text-gray-700 dark:text-slate-300 font-medium py-2 rounded-xl transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                Linkleri Kopyala
              </button>
            </div>

            {/* SMS bölümü */}
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={useSMS}
                  onChange={e => setUseSMS(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1193d4]"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">SMS ile Gönder (NetGSM)</span>
              </label>

              {useSMS && (
                <div className="space-y-2">
                  {(!netgsmUser || !netgsmPass) ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-2.5 text-xs text-amber-700 dark:text-amber-300">
                      ⚠️ NetGSM bilgileri girilmemiş.{' '}
                      <a href="#/settings" className="underline font-medium">Ayarlar &gt; Entegrasyonlar</a>{' '}
                      bölümünden ekleyin.
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" />
                      NetGSM bağlı: {netgsmUser}
                    </div>
                  )}

                  <button
                    onClick={sendBatchSMS}
                    disabled={selectedIds.size === 0 || sendingBatch || !netgsmUser}
                    className="w-full flex items-center justify-center gap-2 bg-[#1193d4] hover:bg-sky-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <Smartphone className="w-4 h-4" />
                    {sendingBatch ? 'Gönderiliyor...' : `SMS Gönder (${selectedIds.size})`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Gönderim Sonuçları */}
          {sentResults.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2 flex items-center gap-2">
                <Send className="w-4 h-4 text-green-500" />
                Gönderim Sonuçları
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {sentResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-700 dark:text-slate-300">{r.name}</span>
                    <span className={r.success ? 'text-green-500' : 'text-red-500'}>
                      {r.success ? '✅ Gönderildi' : '❌ Başarısız'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;

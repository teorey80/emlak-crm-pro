import React, { useState, useMemo } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

// Yıllık değer artışı muafiyet tablosu (TÜFE / ÜFE)
// NOT: Gerçek değerler her yıl GİB tarafından güncellenir.
// Kullanıcı manuel olarak değiştirebilir.
const EXEMPTION_2024 = 87000; // 2024 istisna tutarı (TL) - güncellenmeli

const GainTaxCalculator: React.FC = () => {
  const [purchasePrice, setPurchasePrice] = useState(1500000);
  const [salePrice, setSalePrice] = useState(3000000);
  const [purchaseDate, setPurchaseDate] = useState('2021-01-01');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [exemptionAmount, setExemptionAmount] = useState(EXEMPTION_2024);

  const results = useMemo(() => {
    const buyDate = new Date(purchaseDate);
    const sellDate = new Date(saleDate);
    const diffMs = sellDate.getTime() - buyDate.getTime();
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    const months = Math.floor(years * 12);

    // 5 yıl ve üzeri sahiplikte vergi yok
    if (years >= 5) {
      return {
        years,
        months,
        taxFree: true,
        grossGain: salePrice - purchasePrice,
        taxableGain: 0,
        tax: 0,
        message: '🎉 5 yıldan fazla sahipsiniz — Değer artış kazancı vergisi yok!'
      };
    }

    const grossGain = salePrice - purchasePrice;
    if (grossGain <= 0) {
      return {
        years,
        months,
        taxFree: false,
        grossGain,
        taxableGain: 0,
        tax: 0,
        message: 'Zarar söz konusu — Vergi hesaplanmaz.'
      };
    }

    // İstisna sonrası vergiye tabi kazanç
    const taxableGain = Math.max(0, grossGain - exemptionAmount);

    // Gelir vergisi dilimleri (2024)
    let tax = 0;
    if (taxableGain <= 110000) tax = taxableGain * 0.15;
    else if (taxableGain <= 230000) tax = 110000 * 0.15 + (taxableGain - 110000) * 0.20;
    else if (taxableGain <= 870000) tax = 110000 * 0.15 + 120000 * 0.20 + (taxableGain - 230000) * 0.27;
    else if (taxableGain <= 3000000) tax = 110000 * 0.15 + 120000 * 0.20 + 640000 * 0.27 + (taxableGain - 870000) * 0.35;
    else tax = 110000 * 0.15 + 120000 * 0.20 + 640000 * 0.27 + 2130000 * 0.35 + (taxableGain - 3000000) * 0.40;

    return {
      years,
      months,
      taxFree: false,
      grossGain,
      taxableGain,
      tax,
      message: `⚠️ ${Math.floor(years)} yıl ${months % 12} ay sahiplik — Vergi ödenmesi gerekebilir.`
    };
  }, [purchasePrice, salePrice, purchaseDate, saleDate, exemptionAmount]);

  const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 rounded-xl">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Değer Artışı Kazanç Vergisi</h3>
          <p className="text-xs text-gray-500">5 yıl dolmadan satışta ödenecek vergi</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Alış Fiyatı (₺)</label>
          <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Satış Fiyatı (₺)</label>
          <input type="number" value={salePrice} onChange={e => setSalePrice(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Alış Tarihi</label>
          <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Satış Tarihi</label>
          <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">İstisna Tutarı (2024: {fmt(EXEMPTION_2024)} ₺)</label>
        <input type="number" value={exemptionAmount} onChange={e => setExemptionAmount(Number(e.target.value))}
          className="w-48 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
        <span className="text-xs text-gray-400 ml-2">Her yıl GİB tarafından güncellenir</span>
      </div>

      {results && (
        <div className="space-y-3">
          <div className={`rounded-xl p-3 text-sm font-medium ${results.taxFree ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {results.message}
          </div>
          {!results.taxFree && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-600">Brüt Kazanç</p>
                <p className="text-lg font-bold text-slate-800">{fmt(results.grossGain)} ₺</p>
              </div>
              <div className="text-center border-l border-emerald-100">
                <p className="text-xs text-gray-600">İstisna Sonrası</p>
                <p className="text-lg font-bold text-slate-800">{fmt(results.taxableGain)} ₺</p>
              </div>
              <div className="text-center border-l border-emerald-100">
                <p className="text-xs text-red-500">Tahmini Vergi</p>
                <p className="text-lg font-bold text-red-600">{fmt(results.tax)} ₺</p>
              </div>
              <div className="text-center border-l border-emerald-100">
                <p className="text-xs text-gray-600">Net Kazanç</p>
                <p className="text-lg font-bold text-emerald-700">{fmt(results.grossGain - results.tax)} ₺</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Bu hesaplama tahminidir. Kesin vergi için mali müşavirinize danışın. TÜFE endekslemesi, birden fazla mülk durumu veya özel durumlar sonucu değiştirebilir.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GainTaxCalculator;

import React, { useState, useMemo } from 'react';
import { Home } from 'lucide-react';

const RentYieldCalculator: React.FC = () => {
  const [propertyValue, setPropertyValue] = useState(3000000);
  const [monthlyRent, setMonthlyRent] = useState(15000);
  const [annualExpenses, setAnnualExpenses] = useState(5000); // Sigorta, bakım vb.

  const results = useMemo(() => {
    if (propertyValue <= 0 || monthlyRent <= 0) return null;

    const annualRent = monthlyRent * 12;
    const grossYield = (annualRent / propertyValue) * 100;
    const netAnnualRent = annualRent - annualExpenses;
    const netYield = (netAnnualRent / propertyValue) * 100;
    const paybackYears = propertyValue / annualRent;

    return { annualRent, grossYield, netYield, paybackYears, netAnnualRent };
  }, [propertyValue, monthlyRent, annualExpenses]);

  const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 0 });

  const getYieldColor = (pct: number) =>
    pct >= 5 ? 'text-green-700' : pct >= 3 ? 'text-amber-600' : 'text-red-600';
  const getYieldBg = (pct: number) =>
    pct >= 5 ? 'bg-green-50' : pct >= 3 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <Home className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Kira Getirisi Hesaplama</h3>
          <p className="text-xs text-gray-500">Brüt ve net kira getirisi (ROI)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Mülk Değeri (₺)</label>
          <input type="number" value={propertyValue} onChange={e => setPropertyValue(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Aylık Kira (₺)</label>
          <input type="number" value={monthlyRent} onChange={e => setMonthlyRent(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Yıllık Gider (₺)</label>
          <input type="number" value={annualExpenses} onChange={e => setAnnualExpenses(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          <p className="text-[10px] text-gray-400 mt-0.5">Bakım, sigorta, aidat vb.</p>
        </div>
      </div>

      {results && (
        <div className={`${getYieldBg(results.grossYield)} rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4`}>
          <div className="text-center">
            <p className="text-xs text-gray-600">Brüt Getiri</p>
            <p className={`text-2xl font-bold ${getYieldColor(results.grossYield)}`}>
              %{results.grossYield.toFixed(2)}
            </p>
          </div>
          <div className="text-center border-l border-indigo-100">
            <p className="text-xs text-gray-600">Net Getiri</p>
            <p className={`text-2xl font-bold ${getYieldColor(results.netYield)}`}>
              %{results.netYield.toFixed(2)}
            </p>
          </div>
          <div className="text-center border-l border-indigo-100">
            <p className="text-xs text-gray-600">Yıllık Kira</p>
            <p className="text-lg font-bold text-slate-800">{fmt(results.annualRent)} ₺</p>
          </div>
          <div className="text-center border-l border-indigo-100">
            <p className="text-xs text-gray-600">Geri Dönüş</p>
            <p className="text-lg font-bold text-slate-800">{results.paybackYears.toFixed(1)} yıl</p>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400">
        💡 <strong>İyi getiri:</strong> %5+ (yıllık) • <strong>Orta:</strong> %3-5 • <strong>Düşük:</strong> %3 altı
      </div>
    </div>
  );
};

export default RentYieldCalculator;

import React, { useState, useMemo } from 'react';
import { Calculator, TrendingDown } from 'lucide-react';

const MortgageCalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [duration, setDuration] = useState(120); // ay
  const [annualRate, setAnnualRate] = useState(3.5); // aylık faiz %

  const results = useMemo(() => {
    const monthlyRate = annualRate / 100;
    if (monthlyRate <= 0 || duration <= 0 || loanAmount <= 0) return null;

    // Annüite formülü: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const r = monthlyRate;
    const n = duration;
    const monthlyPayment = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - loanAmount;

    return {
      monthlyPayment,
      totalPayment,
      totalInterest,
    };
  }, [loanAmount, duration, annualRate]);

  const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-xl">
          <Calculator className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Konut Kredisi Hesaplama</h3>
          <p className="text-xs text-gray-500">Aylık taksit ve toplam ödeme hesaplayın</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Kredi Tutarı (₺)</label>
          <input
            type="number"
            value={loanAmount}
            onChange={e => setLoanAmount(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            min={0}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vade (Ay)</label>
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {[60, 84, 96, 120, 144, 180, 240].map(m => (
              <option key={m} value={m}>{m} Ay ({m / 12} Yıl)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Aylık Faiz (%)</label>
          <input
            type="number"
            value={annualRate}
            onChange={e => setAnnualRate(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            min={0}
            max={10}
            step={0.1}
          />
        </div>
      </div>

      {results && (
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-blue-600 font-medium">Aylık Taksit</p>
            <p className="text-xl font-bold text-blue-800">{fmt(results.monthlyPayment)} ₺</p>
          </div>
          <div className="text-center border-x border-blue-100">
            <p className="text-xs text-blue-600 font-medium">Toplam Ödeme</p>
            <p className="text-xl font-bold text-blue-800">{fmt(results.totalPayment)} ₺</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-red-500 font-medium">Toplam Faiz</p>
            <p className="text-xl font-bold text-red-600">{fmt(results.totalInterest)} ₺</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MortgageCalculator;

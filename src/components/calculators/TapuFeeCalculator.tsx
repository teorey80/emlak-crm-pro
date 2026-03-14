import React, { useState, useMemo } from 'react';
import { FileText, AlertCircle } from 'lucide-react';

// 2024 tapu harç oranları ve döner sermaye
const BUYER_RATE = 0.02;   // Alıcı tapu harcı %2
const SELLER_RATE = 0.02;  // Satıcı tapu harcı %2
const DONERSER_BASE = 1087; // 2024 döner sermaye taban (her iki taraf için toplam - güncel tutarı kontrol edin)

const TapuFeeCalculator: React.FC = () => {
  const [salePrice, setSalePrice] = useState(3000000);
  const [isNewBuild, setIsNewBuild] = useState(false); // Sıfır yapı KDV'li olabilir

  const results = useMemo(() => {
    const buyerFee = salePrice * BUYER_RATE;
    const sellerFee = salePrice * SELLER_RATE;
    const totalTapuFee = buyerFee + sellerFee;
    // Döner sermaye sabit (her iki taraf için)
    const donerSermayeBuyer = DONERSER_BASE / 2;
    const donerSermayeSeller = DONERSER_BASE / 2;
    const totalDoner = DONERSER_BASE;

    const buyerTotal = buyerFee + donerSermayeBuyer;
    const sellerTotal = sellerFee + donerSermayeSeller;
    const grandTotal = buyerTotal + sellerTotal;

    return {
      buyerFee,
      sellerFee,
      totalTapuFee,
      donerSermayeBuyer,
      donerSermayeSeller,
      totalDoner,
      buyerTotal,
      sellerTotal,
      grandTotal
    };
  }, [salePrice]);

  const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-50 rounded-xl">
          <FileText className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Tapu Harcı Hesaplama</h3>
          <p className="text-xs text-gray-500">Alıcı ve satıcı harçları + döner sermaye</p>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Satış Bedeli (₺)</label>
          <input
            type="number"
            value={salePrice}
            onChange={e => setSalePrice(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>
      </div>

      <div className="space-y-3">
        {/* Alıcı */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-blue-800">🧑‍💼 Alıcı Öder</span>
            <span className="text-xl font-bold text-blue-700">{fmt(results.buyerTotal)} ₺</span>
          </div>
          <div className="space-y-1 text-xs text-blue-700">
            <div className="flex justify-between">
              <span>Tapu Harcı (%{(BUYER_RATE * 100).toFixed(0)})</span>
              <span>{fmt(results.buyerFee)} ₺</span>
            </div>
            <div className="flex justify-between">
              <span>Döner Sermaye (tahmini)</span>
              <span>{fmt(results.donerSermayeBuyer)} ₺</span>
            </div>
          </div>
        </div>

        {/* Satıcı */}
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-green-800">🏡 Satıcı Öder</span>
            <span className="text-xl font-bold text-green-700">{fmt(results.sellerTotal)} ₺</span>
          </div>
          <div className="space-y-1 text-xs text-green-700">
            <div className="flex justify-between">
              <span>Tapu Harcı (%{(SELLER_RATE * 100).toFixed(0)})</span>
              <span>{fmt(results.sellerFee)} ₺</span>
            </div>
            <div className="flex justify-between">
              <span>Döner Sermaye (tahmini)</span>
              <span>{fmt(results.donerSermayeSeller)} ₺</span>
            </div>
          </div>
        </div>

        {/* Toplam */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center">
          <span className="font-bold text-amber-800">Toplam Devlet Ödemesi</span>
          <span className="text-2xl font-bold text-amber-700">{fmt(results.grandTotal)} ₺</span>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>Döner sermaye tutarı 2024 tahminidir, tapu müdürlüğüne göre değişebilir. Belediye harcı ayrıca alınabilir.</span>
      </div>
    </div>
  );
};

export default TapuFeeCalculator;

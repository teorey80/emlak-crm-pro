import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building, CheckCircle, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { findMatches } from '../services/matchingService';
import PropertyMatchCard from '../components/demands/PropertyMatchCard';

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requests, properties } = useData();
  const [showHighMatchesOnly, setShowHighMatchesOnly] = useState(true);

  const request = requests.find((row) => row.id === id);

  const matchingResults = useMemo(() => {
    if (!request) return [];
    const minScore = showHighMatchesOnly ? 70 : 0;
    return findMatches(properties, [request], undefined, minScore);
  }, [properties, request, showHighMatchesOnly]);

  if (!request) {
    return <div className="p-10 text-center text-gray-500 dark:text-slate-400">Talep bulunamadı.</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Taleplere Dön
      </button>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{request.customerName} - Emlak Talebi</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">{request.type} arıyor</p>
          </div>
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
            {request.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-t border-gray-100 dark:border-slate-700">
          <div>
            <span className="text-xs text-gray-400 dark:text-slate-500 block uppercase">Bütçe Aralığı</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {request.minPrice.toLocaleString('tr-TR')} - {request.maxPrice.toLocaleString('tr-TR')} {request.currency}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 dark:text-slate-500 block uppercase">Lokasyon</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{request.district}, {request.city}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 dark:text-slate-500 block uppercase">Oda Tercihi</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{request.minRooms || 'Farketmez'}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 dark:text-slate-500 block uppercase">Tarih</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{request.date}</span>
          </div>
        </div>

        {request.notes && (
          <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 text-sm text-amber-800 dark:text-amber-200">
            <strong>Notlar:</strong> {request.notes}
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CheckCircle className="text-[#1193d4] w-5 h-5" />
            Eşleşen Portföyler ({matchingResults.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowHighMatchesOnly((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showHighMatchesOnly
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            {showHighMatchesOnly ? 'En az %70 eşleşenler' : 'Tüm eşleşmeler'}
          </button>
        </div>

        {matchingResults.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {matchingResults.map((match) => (
              <PropertyMatchCard key={`${match.request.id}-${match.property.id}`} match={match} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-10 text-center">
            <Building className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">Bu filtreye uygun eşleşme bulunamadı.</p>
            <Link to="/properties/new" className="text-[#1193d4] hover:underline mt-2 inline-block text-sm">
              Bu talebe uygun yeni emlak ekle
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetail;

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Star, X, XCircle } from 'lucide-react';
import { MatchCriterion, MatchResult } from '../../services/matchingService';

interface PropertyMatchCardProps {
  match: MatchResult;
}

const statusMeta = (status: MatchCriterion['status']) => {
  if (status === 'pass') {
    return {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      className: 'text-emerald-700 dark:text-emerald-400'
    };
  }
  if (status === 'partial') {
    return {
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      className: 'text-amber-700 dark:text-amber-400'
    };
  }
  return {
    icon: <XCircle className="w-4 h-4 text-rose-500" />,
    className: 'text-rose-700 dark:text-rose-400'
  };
};

const badgeMeta = (badge: MatchResult['badge']) => {
  if (badge === 'perfect') return { label: '🔥 Mükemmel Eşleşme', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  if (badge === 'good') return { label: '⭐ İyi Eşleşme', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
  if (badge === 'medium') return { label: '📊 Orta Eşleşme', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  return { label: 'Zayıf Eşleşme', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' };
};

const buildStars = (score: number): number => {
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  if (score > 0) return 1;
  return 0;
};

const PropertyMatchCard: React.FC<PropertyMatchCardProps> = ({ match }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mandatoryCriteria = useMemo(
    () => [
      match.matchingCriteria.location,
      match.matchingCriteria.price,
      match.matchingCriteria.rooms,
      match.matchingCriteria.area,
      match.matchingCriteria.propertyType
    ],
    [match]
  );

  const optionalCriteria = useMemo(
    () => [match.matchingCriteria.floor, match.matchingCriteria.balcony].filter(Boolean) as MatchCriterion[],
    [match]
  );

  const comparisonRows = useMemo(() => {
    return [...mandatoryCriteria, ...optionalCriteria];
  }, [mandatoryCriteria, optionalCriteria]);

  const badge = badgeMeta(match.badge);
  const stars = buildStars(match.score);
  const progressClass = match.score >= 90
    ? 'from-emerald-500 to-emerald-400'
    : match.score >= 70
      ? 'from-blue-500 to-sky-400'
      : match.score >= 50
        ? 'from-amber-500 to-yellow-400'
        : 'from-rose-500 to-orange-400';

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{match.property.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{match.property.location}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {mandatoryCriteria.map((criterion) => {
            const meta = statusMeta(criterion.status);
            return (
              <div key={criterion.key} className={`flex items-start gap-2 text-sm ${meta.className}`}>
                <span className="mt-0.5">{meta.icon}</span>
                <div>
                  <span className="font-medium">{criterion.label}:</span>{' '}
                  <span>{criterion.message}</span>
                </div>
              </div>
            );
          })}
          {optionalCriteria.map((criterion) => {
            const meta = statusMeta(criterion.status);
            return (
              <div key={criterion.key} className={`flex items-start gap-2 text-sm ${meta.className}`}>
                <span className="mt-0.5">{meta.icon}</span>
                <div>
                  <span className="font-medium">{criterion.label}:</span>{' '}
                  <span>{criterion.message}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Eşleşme Skoru: %{match.score}</span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, index) => (
                <Star
                  key={index}
                  className={`w-4 h-4 ${index < stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                />
              ))}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressClass} transition-all duration-700 ease-out`}
              style={{ width: `${Math.max(0, Math.min(100, match.score))}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Detay Karşılaştırma
          </button>
          <Link
            to={`/properties/${match.property.id}`}
            className="px-3 py-2 text-sm rounded-lg bg-[#1193d4] hover:bg-[#0e7db5] text-white transition-colors"
          >
            Portföye Git
          </Link>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Modal kapat"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">Talep - Portföy Karşılaştırması</h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 text-slate-500 dark:text-slate-400 font-medium">Kriter</th>
                    <th className="py-2 text-slate-500 dark:text-slate-400 font-medium">Talep</th>
                    <th className="py-2 text-slate-500 dark:text-slate-400 font-medium">Emlak</th>
                    <th className="py-2 text-slate-500 dark:text-slate-400 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => {
                    const meta = statusMeta(row.status);
                    return (
                      <tr key={row.key} className="border-b border-slate-100 dark:border-slate-700/60">
                        <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{row.label}</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">{row.requestValue || '-'}</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">{row.propertyValue || '-'}</td>
                        <td className={`py-2.5 ${meta.className}`}>
                          <span className="inline-flex items-center gap-1.5">
                            {meta.icon}
                            {row.message}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyMatchCard;

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { findMatches, MatchCriterion, MatchResult } from '../services/matchingService';
import { Sparkles, Users, CheckCircle, X, Phone, Mail, MapPin, Home, DollarSign, Filter, ArrowRight, Eye, EyeOff } from 'lucide-react';

const MatchCenter: React.FC = () => {
    const { properties, requests, teamMembers, userProfile } = useData();
    const navigate = useNavigate();
    const [showCrossOnly, setShowCrossOnly] = useState(false);
    const [minScore, setMinScore] = useState(70);
    const [dismissedMatches, setDismissedMatches] = useState<string[]>(() => {
        const saved = localStorage.getItem('dismissedMatches');
        return saved ? JSON.parse(saved) : [];
    });

    // Calculate all matches
    const allMatches = useMemo(() => {
        return findMatches(properties, requests, teamMembers);
    }, [properties, requests, teamMembers]);

    // Filter matches
    const filteredMatches = useMemo(() => {
        return allMatches
            .filter(match => {
                const matchId = `${match.request.id}-${match.property.id}`;
                if (dismissedMatches.includes(matchId)) return false;
                if (match.score < minScore) return false;
                if (showCrossOnly && !match.isCrossConsultant) return false;
                return true;
            })
            .sort((a, b) => b.score - a.score);
    }, [allMatches, dismissedMatches, minScore, showCrossOnly]);

    const dismissMatch = (match: MatchResult) => {
        const matchId = `${match.request.id}-${match.property.id}`;
        setDismissedMatches(prev => {
            const updated = [...prev, matchId];
            localStorage.setItem('dismissedMatches', JSON.stringify(updated));
            return updated;
        });
        toast.success('Eşleşme gizlendi');
    };

    const clearDismissed = () => {
        setDismissedMatches([]);
        localStorage.removeItem('dismissedMatches');
        toast.success('Tüm gizlenen eşleşmeler geri alındı');
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'bg-emerald-500';
        if (score >= 75) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const criterionBadge = (criterion: MatchCriterion) => {
        if (criterion.status === 'pass') return `✅ ${criterion.label}`;
        if (criterion.status === 'partial') return `⚠️ ${criterion.label}`;
        return `❌ ${criterion.label}`;
    };

    const criterionClass = (criterion: MatchCriterion) => {
        if (criterion.status === 'pass') return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400';
        if (criterion.status === 'partial') return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400';
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400';
    };

    const scoreBadge = (score: number) => {
        if (score >= 90) return { text: '🔥 Mükemmel Eşleşme', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
        if (score >= 70) return { text: '⭐ İyi Eşleşme', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
        if (score >= 50) return { text: '📊 Orta Eşleşme', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
        return { text: 'Düşük Eşleşme', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' };
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-violet-500" />
                        Akıllı Eşleşme Merkezi
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Müşteri talepleri ile portföyler arasındaki en iyi eşleşmeler
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        {filteredMatches.length} eşleşme bulundu
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtreler:</span>
                    </div>

                    {/* Min Score Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600 dark:text-slate-400">Min Skor:</label>
                        <select
                            value={minScore}
                            onChange={(e) => setMinScore(Number(e.target.value))}
                            className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        >
                            <option value={50}>%50+</option>
                            <option value={60}>%60+</option>
                            <option value={70}>%70+</option>
                            <option value={80}>%80+</option>
                            <option value={90}>%90+</option>
                        </select>
                    </div>

                    {/* Cross-consultant Filter */}
                    <button
                        onClick={() => setShowCrossOnly(!showCrossOnly)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showCrossOnly
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Sadece Çapraz Eşleşmeler
                    </button>

                    {/* Clear Dismissed */}
                    {dismissedMatches.length > 0 && (
                        <button
                            onClick={clearDismissed}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600"
                        >
                            <Eye className="w-4 h-4" />
                            {dismissedMatches.length} Gizlenenı Göster
                        </button>
                    )}
                </div>
            </div>

            {/* Matches Grid */}
            {filteredMatches.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
                    <Sparkles className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                        Eşleşme Bulunamadı
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        Seçili filtrelere uygun eşleşme yok. Filtre kriterlerini gevşetin veya yeni talep/portföy ekleyin.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredMatches.map((match, idx) => (
                        <div
                            key={`${match.request.id}-${match.property.id}-${idx}`}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Score Badge */}
                                <div className="flex-shrink-0 self-center lg:self-start">
                                    <div className={`w-16 h-16 ${getScoreColor(match.score)} rounded-xl flex items-center justify-center`}>
                                        <span className="text-2xl font-bold text-white">%{match.score}</span>
                                    </div>
                                    {match.isCrossConsultant && (
                                        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                            <Users className="w-3 h-3" />
                                            Çapraz
                                        </div>
                                    )}
                                </div>

                                {/* Request Info */}
                                <div className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-slate-700 pb-4 lg:pb-0 lg:pr-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                            TALEP
                                        </span>
                                        {match.requestOwnerName && (
                                            <span className="text-xs text-slate-500">
                                                ({match.requestOwnerName})
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-slate-800 dark:text-white">
                                        {match.request.customerName}
                                    </h4>
                                    <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                        <p className="flex items-center gap-2">
                                            <Home className="w-4 h-4" />
                                            {match.request.type} arıyor
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {[match.request.district, match.request.city].filter(Boolean).join(', ') || 'Belirtilmemiş'}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            {match.request.minPrice?.toLocaleString('tr-TR') || '0'} - {match.request.maxPrice?.toLocaleString('tr-TR') || '∞'} ₺
                                        </p>
                                    </div>
                                </div>

                                {/* Property Info */}
                                <div className="flex-1 lg:pl-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                            PORTFÖY
                                        </span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBadge(match.score).className}`}>
                                            {scoreBadge(match.score).text}
                                        </span>
                                        {match.propertyOwnerName && (
                                            <span className="text-xs text-slate-500">
                                                ({match.propertyOwnerName})
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-slate-800 dark:text-white">
                                        {match.property.title}
                                    </h4>
                                    <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                        <p className="flex items-center gap-2">
                                            <Home className="w-4 h-4" />
                                            {match.property.type} - {match.property.status}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {match.property.location}
                                        </p>
                                        <p className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                                            <DollarSign className="w-4 h-4" />
                                            {match.property.price.toLocaleString('tr-TR')} ₺
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex lg:flex-col items-center justify-end gap-2">
                                    <button
                                        onClick={() => navigate(`/properties/${match.property.id}`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#1193d4] hover:bg-[#0e7db5] text-white rounded-lg font-medium transition-colors"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        Portföye Git
                                    </button>
                                    <button
                                        onClick={() => dismissMatch(match)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
                                    >
                                        <EyeOff className="w-4 h-4" />
                                        Gizle
                                    </button>
                                </div>
                            </div>

                            {/* Match Criteria */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <div className="flex flex-wrap gap-2">
                                    {match.criteria.slice(0, 6).map((criterion) => (
                                        <span
                                            key={criterion.key}
                                            className={`text-xs px-2 py-1 rounded-full ${criterionClass(criterion)}`}
                                        >
                                            {criterionBadge(criterion)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Footer */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex flex-wrap justify-center gap-8">
                    <div className="text-center">
                        <p className="text-3xl font-bold">{allMatches.length}</p>
                        <p className="text-sm opacity-80">Toplam Eşleşme</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold">{allMatches.filter(m => m.isCrossConsultant).length}</p>
                        <p className="text-sm opacity-80">Çapraz Eşleşme</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold">{allMatches.filter(m => m.score >= 80).length}</p>
                        <p className="text-sm opacity-80">Yüksek Skor (%80+)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchCenter;

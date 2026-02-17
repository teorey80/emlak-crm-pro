import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, MapPin, Pencil, Trash2, Sparkles, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { Request } from '../types';

const RequestList: React.FC = () => {
    const { requests, deleteRequest, userProfile, teamMembers } = useData();
    const navigate = useNavigate();

    // Check if current user can edit a request (owner or broker)
    const canEditRequest = (request: Request): boolean => {
        const isOwner = request.user_id === userProfile?.id;
        const isBroker = ['broker', 'ofis_broker', 'admin', 'owner'].includes(userProfile?.role || '');
        return isOwner || isBroker;
    };

    // Get request owner name from teamMembers
    const getRequestOwnerName = (request: Request): string => {
        if (!request.user_id) return '';
        const owner = teamMembers.find(m => m.id === request.user_id);
        return owner?.name || '';
    };
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu talebi silmek istediğinize emin misiniz?')) {
            try {
                await deleteRequest(id);
                toast.success("Talep silindi.");
            } catch (error) {
                console.error("Silme hatası:", error);
                toast.error("Silinemedi.");
            }
        }
    };

    const filteredRequests = requests.filter(r =>
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Müşteri Talepleri</h2>
                <Link
                    to="/requests/new"
                    className="flex items-center gap-2 bg-[#1193d4] text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-all shadow-sm font-medium">
                    <Plus className="w-4 h-4" />
                    Yeni Talep Ekle
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Müşteri veya notlarda ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 focus:border-[#1193d4]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRequests.map((req) => (
                    <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-sky-200 dark:hover:border-sky-800 transition-all group relative">
                        <div className="flex justify-between items-start mb-3">
                            <Link to={`/requests/${req.id}`} className="font-bold text-slate-800 dark:text-white group-hover:text-[#1193d4] dark:group-hover:text-sky-400 block flex-1">
                                {req.customerName}
                                {req.siteName && <span className="block text-xs font-normal text-gray-500 mt-0.5">({req.siteName})</span>}
                            </Link>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                {/* Show Edit/Delete only for own requests or if broker */}
                                {canEditRequest(req) ? (
                                    <>
                                        <Link
                                            to={`/requests/edit/${req.id}`}
                                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-1"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Düzenle
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete(req.id);
                                            }}
                                            className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Sil
                                        </button>
                                    </>
                                ) : (
                                    /* Show "Suggest Match" button for others' requests */
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(`/matches?requestId=${req.id}`);
                                        }}
                                        className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 transition-colors flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Eşleşme Öner
                                    </button>
                                )}
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${req.status === 'Aktif' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {req.status}
                                </span>
                            </div>
                        </div>
                        {/* Show request owner if not own request */}
                        {!canEditRequest(req) && getRequestOwnerName(req) && (
                            <div className="mb-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>Danışman: {getRequestOwnerName(req)}</span>
                            </div>
                        )}
                        <Link to={`/requests/${req.id}`} className="block">
                            <div className="space-y-2 text-sm text-gray-600 dark:text-slate-400 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 w-16">Tip:</span>
                                    <span className="font-medium text-slate-800 dark:text-white">{req.requestType || 'Satılık'}</span>
                                    <span className="text-gray-400">-</span>
                                    <span>{req.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 w-16">Bütçe:</span>
                                    <span>{req.minPrice.toLocaleString()} - {req.maxPrice.toLocaleString()} {req.currency}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 w-16">Konum:</span>
                                    <div className="flex items-center">
                                        <MapPin className="w-3 h-3 mr-1 text-gray-400 dark:text-slate-500" />
                                        {req.district}, {req.city}
                                    </div>
                                </div>
                            </div>
                            {req.notes && (
                                <div className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-2 rounded border border-amber-100 dark:border-amber-900/30 italic truncate">
                                    "{req.notes}"
                                </div>
                            )}
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500 text-right">
                                Eklenme: {req.date}
                            </div>
                        </Link>
                    </div>
                ))}
                {filteredRequests.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 dark:text-slate-500">
                        Talep bulunamadı.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestList;
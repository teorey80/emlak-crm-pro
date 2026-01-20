import React, { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';

const CustomerList: React.FC = () => {
    const { customers, deleteCustomer, hasMoreCustomers, loadMoreCustomers, loadingMore } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');

    const filteredCustomers = customers.filter(c =>
        (selectedType === '' || c.customerType === selectedType) &&
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
            await deleteCustomer(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Müşteriler</h2>
                <Link
                    to="/customers/new"
                    className="flex items-center gap-2 bg-[#1193d4] text-white px-4 py-2.5 rounded-lg hover:opacity-90 shadow-sm font-medium">
                    <Plus className="w-4 h-4" />
                    Yeni Müşteri Ekle
                </Link>
            </div>

            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Müşteri ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 focus:border-[#1193d4] shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <select className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer shadow-sm">
                        <option>Durum</option>
                        <option>Aktif</option>
                        <option>Potansiyel</option>
                    </select>
                </div>
                <div className="relative">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer shadow-sm"
                    >
                        <option value="">Tümü (Müşteri Tipi)</option>
                        <option value="Alıcı">Alıcı</option>
                        <option value="Satıcı">Satıcı</option>
                        <option value="Kiracı">Kiracı</option>
                        <option value="Kiracı Adayı">Kiracı Adayı</option>
                        <option value="Mal Sahibi">Mal Sahibi</option>
                    </select>
                </div>
            </div>

            {/* Customer Table */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 uppercase text-xs font-semibold">
                        <tr>
                            <th className="p-4">Ad Soyad</th>
                            <th className="p-4">Telefon</th>
                            <th className="p-4">E-posta</th>
                            <th className="p-4">Durum</th>
                            <th className="p-4">Müşteri Tipi</th>
                            <th className="p-4">Oluşturulma</th>
                            <th className="p-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-sky-50/30 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="p-4">
                                    <Link to={`/customers/${customer.id}`} className="font-medium text-slate-800 dark:text-slate-200 hover:text-[#1193d4]">
                                        {customer.name}
                                    </Link>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-slate-400">{customer.phone}</td>
                                <td className="p-4 text-gray-600 dark:text-slate-400">{customer.email}</td>
                                <td className="p-4">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${customer.status === 'Aktif'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                        : customer.status === 'Potansiyel'
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-slate-400">
                                    <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                                        {customer.customerType || '-'}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500 dark:text-slate-500 text-xs">{customer.createdAt}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(customer.id);
                                        }}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Load More Button */}
                {filteredCustomers.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-center items-center">
                        {hasMoreCustomers ? (
                            <button
                                onClick={loadMoreCustomers}
                                disabled={loadingMore}
                                className="px-6 py-2.5 bg-[#1193d4] text-white rounded-lg font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loadingMore ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Yükleniyor...
                                    </>
                                ) : (
                                    'Daha Fazla Yükle'
                                )}
                            </button>
                        ) : (
                            <span className="text-sm text-gray-500 dark:text-slate-400">
                                Tüm müşteriler yüklendi ({customers.length} müşteri)
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerList;
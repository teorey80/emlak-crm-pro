import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, DollarSign, Calculator, Users, UserCheck, ArrowRightLeft, CheckCircle, UserPlus, Wallet } from 'lucide-react';
import { Property, Sale, SaleExpense, Customer } from '../types';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

interface SaleFormProps {
    property: Property;
    onClose: () => void;
    onSave: (sale: Sale) => void;
}

const EXPENSE_TYPES = [
    'Reklam',
    'Ulasim',
    'Tapu Masrafi',
    'Ekspertiz',
    'Komisyon Paylasimi',
    'Personel Primi',
    'Diger'
];

const SaleForm: React.FC<SaleFormProps> = ({ property, onClose, onSave }) => {
    const { customers, session, userProfile, teamMembers } = useData();

    // Detect if this is a cross-consultant sale (property owner != selling consultant)
    const propertyOwner = useMemo(() => {
        if (!property.user_id) return null;
        return teamMembers.find(m => m.id === property.user_id);
    }, [property.user_id, teamMembers]);

    const isCrossConsultant = propertyOwner && propertyOwner.id !== session?.user?.id;
    const [formData, setFormData] = useState({
        salePrice: property.price || 0,
        saleDate: new Date().toISOString().split('T')[0],
        buyerId: '',
        buyerName: '',
        consultantId: session?.user?.id || '',
        consultantName: userProfile?.name || '',
        // Ayrı komisyon tutarları (manuel giriş)
        buyerCommissionAmount: 0, // Alıcıdan alınan
        sellerCommissionAmount: 0, // Satıcıdan alınan
        officeShareRate: 50, // Default 50%
        notes: '',
        // Cross-commission fields
        enableCrossCommission: isCrossConsultant || false,
        propertyOwnerShareRate: 30, // Property owner gets 30% of consultant share by default
    });

    // Kaydetme durumu
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saving, setSaving] = useState(false);

    const [expenses, setExpenses] = useState<SaleExpense[]>([]);
    const [newExpenseType, setNewExpenseType] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState(0);

    // Otomatik hesaplanan komisyon oranları
    const buyerCommissionRate = formData.salePrice > 0
        ? (formData.buyerCommissionAmount / formData.salePrice) * 100
        : 0;
    const sellerCommissionRate = formData.salePrice > 0
        ? (formData.sellerCommissionAmount / formData.salePrice) * 100
        : 0;

    // Toplam komisyon
    const commissionAmount = formData.buyerCommissionAmount + formData.sellerCommissionAmount;
    const commissionRate = formData.salePrice > 0
        ? (commissionAmount / formData.salePrice) * 100
        : 0;

    // Calculated values
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = commissionAmount - totalExpenses;
    const officeShareAmount = (netProfit * formData.officeShareRate) / 100;
    const consultantShareRate = 100 - formData.officeShareRate;
    const totalConsultantShare = netProfit - officeShareAmount;

    // Cross-commission calculation
    const propertyOwnerShareAmount = formData.enableCrossCommission
        ? (totalConsultantShare * formData.propertyOwnerShareRate) / 100
        : 0;
    const sellingConsultantShareAmount = totalConsultantShare - propertyOwnerShareAmount;
    const consultantShareAmount = formData.enableCrossCommission ? sellingConsultantShareAmount : totalConsultantShare;

    // Add expense
    const addExpense = () => {
        if (!newExpenseType || newExpenseAmount <= 0) return;

        setExpenses([
            ...expenses,
            {
                id: Date.now().toString(),
                type: newExpenseType,
                amount: newExpenseAmount,
            }
        ]);
        setNewExpenseType('');
        setNewExpenseAmount(0);
    };

    // Remove expense
    const removeExpense = (id: string) => {
        setExpenses(expenses.filter(e => e.id !== id));
    };

    // Handle buyer selection
    const handleBuyerChange = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setFormData({
            ...formData,
            buyerId: customerId,
            buyerName: customer?.name || ''
        });
    };

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (commissionAmount <= 0) {
            toast.error('Lütfen en az bir komisyon tutarı girin');
            return;
        }

        setSaving(true);

        const sale: Sale = {
            id: Date.now().toString(),
            propertyId: property.id,
            transactionType: 'sale',
            consultantId: formData.consultantId,
            consultantName: formData.consultantName,
            salePrice: formData.salePrice,
            saleDate: formData.saleDate,
            buyerId: formData.buyerId,
            buyerName: formData.buyerName,
            // Yeni komisyon alanları
            buyerCommissionAmount: formData.buyerCommissionAmount,
            buyerCommissionRate,
            sellerCommissionAmount: formData.sellerCommissionAmount,
            sellerCommissionRate,
            commissionRate,
            commissionAmount,
            expenses,
            totalExpenses,
            officeShareRate: formData.officeShareRate,
            consultantShareRate,
            officeShareAmount,
            consultantShareAmount,
            netProfit,
            notes: formData.notes,
            propertyTitle: property.title
        };

        try {
            await onSave(sale);
            // PropertyDetail'daki onSave tüm işlemleri yapıp toast gösterecek
            // Burada ekstra bir şey yapmaya gerek yok
        } catch (error) {
            console.error('SaleForm error:', error);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white">🎉 Satış Kaydı</h2>
                            <p className="text-green-100 text-sm mt-1">{property.title}</p>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Sale Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Satış Bedeli
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-3 pl-8 text-gray-900 dark:text-white"
                                    value={formData.salePrice.toLocaleString('tr-TR')}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\./g, '');
                                        setFormData({ ...formData, salePrice: parseInt(raw) || 0 });
                                    }}
                                />
                                <span className="absolute left-3 top-3.5 text-gray-400">₺</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Satış Tarihi
                            </label>
                            <input
                                type="date"
                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-3 text-gray-900 dark:text-white"
                                value={formData.saleDate}
                                onChange={e => setFormData({ ...formData, saleDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Buyer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            <Users className="w-4 h-4 inline mr-1" />
                            Alıcı (CRM'den seç)
                        </label>
                        <select
                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-3 text-gray-900 dark:text-white"
                            value={formData.buyerId}
                            onChange={e => handleBuyerChange(e.target.value)}
                        >
                            <option value="">Alıcı Seçin (opsiyonel)</option>
                            {customers.filter(c => c.customerType === 'Alıcı').map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Commission - Ayrı Alıcı/Satıcı */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <Wallet className="w-5 h-5" />
                            Komisyon Bilgileri
                        </h3>

                        {/* Alıcıdan Alınan Komisyon */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                    <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">Alıcıdan Alınan Komisyon</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Tutar (manuel giriş)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-slate-700 border p-2.5 pl-7 text-gray-900 dark:text-white font-medium"
                                            value={formData.buyerCommissionAmount > 0 ? formData.buyerCommissionAmount.toLocaleString('tr-TR') : ''}
                                            placeholder="0"
                                            onChange={e => {
                                                const raw = e.target.value.replace(/\./g, '');
                                                setFormData({ ...formData, buyerCommissionAmount: parseInt(raw) || 0 });
                                            }}
                                        />
                                        <span className="absolute left-2.5 top-3 text-gray-400 text-sm">₺</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Oran (otomatik)</label>
                                    <div className="bg-blue-100 dark:bg-blue-800/50 rounded-lg p-2.5 text-center font-bold text-blue-700 dark:text-blue-300">
                                        %{buyerCommissionRate.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Satıcıdan Alınan Komisyon */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">Satıcıdan Alınan Komisyon</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Tutar (manuel giriş)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-slate-700 border p-2.5 pl-7 text-gray-900 dark:text-white font-medium"
                                            value={formData.sellerCommissionAmount > 0 ? formData.sellerCommissionAmount.toLocaleString('tr-TR') : ''}
                                            placeholder="0"
                                            onChange={e => {
                                                const raw = e.target.value.replace(/\./g, '');
                                                setFormData({ ...formData, sellerCommissionAmount: parseInt(raw) || 0 });
                                            }}
                                        />
                                        <span className="absolute left-2.5 top-3 text-gray-400 text-sm">₺</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Oran (otomatik)</label>
                                    <div className="bg-purple-100 dark:bg-purple-800/50 rounded-lg p-2.5 text-center font-bold text-purple-700 dark:text-purple-300">
                                        %{sellerCommissionRate.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toplam Komisyon */}
                        <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="font-semibold text-green-800 dark:text-green-300">Toplam Komisyon</span>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-green-700 dark:text-green-300">
                                    {commissionAmount.toLocaleString('tr-TR')} ₺
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400">
                                    %{commissionRate.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                        <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Giderler
                        </h3>

                        {/* Add Expense */}
                        <div className="flex gap-2 mb-3">
                            <select
                                className="flex-1 rounded-lg border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 border p-2 text-sm text-gray-900 dark:text-white"
                                value={newExpenseType}
                                onChange={e => setNewExpenseType(e.target.value)}
                            >
                                <option value="">Gider Tipi Seçin</option>
                                {EXPENSE_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Tutar"
                                className="w-32 rounded-lg border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 border p-2 text-sm text-gray-900 dark:text-white"
                                value={newExpenseAmount || ''}
                                onChange={e => setNewExpenseAmount(parseInt(e.target.value) || 0)}
                            />
                            <button
                                type="button"
                                onClick={addExpense}
                                className="bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Expense List */}
                        {expenses.length > 0 ? (
                            <div className="space-y-2">
                                {expenses.map(exp => (
                                    <div key={exp.id} className="flex justify-between items-center bg-white dark:bg-slate-800 rounded-lg p-2 text-sm">
                                        <span className="text-gray-700 dark:text-slate-300">{exp.type}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-amber-700 dark:text-amber-300">
                                                {exp.amount.toLocaleString('tr-TR')} ₺
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeExpense(exp.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center border-t border-amber-200 dark:border-amber-800 pt-2 mt-2">
                                    <span className="font-semibold text-amber-800 dark:text-amber-300">Toplam Gider</span>
                                    <span className="font-bold text-amber-800 dark:text-amber-300">
                                        {totalExpenses.toLocaleString('tr-TR')} ₺
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-amber-600 dark:text-amber-400 text-center py-2">
                                Henüz gider eklenmedi
                            </p>
                        )}
                    </div>

                    {/* Cross-Commission Section */}
                    {isCrossConsultant && propertyOwner && (
                        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-2">
                                    <ArrowRightLeft className="w-5 h-5" />
                                    Capraz Komisyon
                                </h3>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.enableCrossCommission}
                                        onChange={e => setFormData({ ...formData, enableCrossCommission: e.target.checked })}
                                        className="w-4 h-4 text-violet-600 rounded"
                                    />
                                    <span className="text-sm text-violet-700 dark:text-violet-300">Aktif</span>
                                </label>
                            </div>

                            <div className="bg-violet-100 dark:bg-violet-800/30 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <img src={propertyOwner.avatar} alt={propertyOwner.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="text-sm text-violet-600 dark:text-violet-400">Portfoy Sahibi</p>
                                        <p className="font-semibold text-violet-800 dark:text-violet-200">{propertyOwner.name}</p>
                                    </div>
                                </div>
                            </div>

                            {formData.enableCrossCommission && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-violet-700 dark:text-violet-300 mb-1">
                                            Portfoy Sahibi Payi (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="w-full rounded-lg border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800 border p-2 text-gray-900 dark:text-white"
                                            value={formData.propertyOwnerShareRate}
                                            onChange={e => setFormData({ ...formData, propertyOwnerShareRate: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-violet-700 dark:text-violet-300 mb-1">
                                            Portfoy Sahibine
                                        </label>
                                        <div className="bg-violet-200 dark:bg-violet-700/50 rounded-lg p-2 text-center font-bold text-violet-800 dark:text-violet-200">
                                            {propertyOwnerShareAmount.toLocaleString('tr-TR')} TL
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Revenue Sharing */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                        <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3">
                            Gelir Paylasimi
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-green-700 dark:text-green-300 mb-1">Ofis Payı (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full rounded-lg border-green-300 dark:border-green-700 bg-white dark:bg-slate-800 border p-2 text-gray-900 dark:text-white"
                                    value={formData.officeShareRate}
                                    onChange={e => setFormData({ ...formData, officeShareRate: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-green-700 dark:text-green-300 mb-1">Danışman Payı (%)</label>
                                <div className="bg-green-100 dark:bg-green-800/50 rounded-lg p-2 text-center font-bold text-green-800 dark:text-green-200">
                                    {consultantShareRate}%
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-slate-400">Toplam Komisyon</span>
                                <span className="font-medium">{commissionAmount.toLocaleString('tr-TR')} ₺</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-slate-400">Toplam Gider</span>
                                <span className="font-medium text-red-600">-{totalExpenses.toLocaleString('tr-TR')} ₺</span>
                            </div>
                            <div className="border-t border-gray-100 dark:border-slate-700 pt-2 flex justify-between">
                                <span className="font-semibold text-gray-800 dark:text-white">Net Kâr</span>
                                <span className="font-bold text-green-600">{netProfit.toLocaleString('tr-TR')} ₺</span>
                            </div>
                            <div className={`grid ${formData.enableCrossCommission ? 'grid-cols-3' : 'grid-cols-2'} gap-4 pt-2 border-t border-gray-100 dark:border-slate-700`}>
                                <div className="text-center">
                                    <div className="text-xs text-gray-500 dark:text-slate-400">Ofise Kalan</div>
                                    <div className="font-bold text-blue-600">{officeShareAmount.toLocaleString('tr-TR')} TL</div>
                                </div>
                                {formData.enableCrossCommission && propertyOwner && (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-slate-400">{propertyOwner.name}</div>
                                        <div className="font-bold text-violet-600">{propertyOwnerShareAmount.toLocaleString('tr-TR')} TL</div>
                                    </div>
                                )}
                                <div className="text-center">
                                    <div className="text-xs text-gray-500 dark:text-slate-400">
                                        {formData.enableCrossCommission ? 'Satici Danismana' : 'Danismana Kalan'}
                                    </div>
                                    <div className="font-bold text-purple-600">{consultantShareAmount.toLocaleString('tr-TR')} TL</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notlar</label>
                        <textarea
                            rows={2}
                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-3 text-gray-900 dark:text-white"
                            placeholder="Satışa dair notlar..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-6 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium disabled:opacity-50"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={saving || commissionAmount <= 0}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>🎉 Satışı Kaydet</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaleForm;

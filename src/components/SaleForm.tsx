import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, DollarSign, Calculator, Users, UserCheck, ArrowRightLeft, Percent, Building2, Handshake } from 'lucide-react';
import { Property, Sale, SaleExpense, Customer } from '../types';
import { useData } from '../context/DataContext';

interface SaleFormProps {
    property: Property;
    initialData?: Sale; // Added for editing
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

// Helper function to format number with thousand separators (no decimals)
const formatMoney = (value: number): string => {
    return Math.round(value).toLocaleString('tr-TR');
};

// Helper function to parse formatted money string to number
const parseMoney = (value: string): number => {
    // Remove thousand separators (.) and any non-numeric chars except comma
    const cleaned = value.replace(/\./g, '').replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
};

// Format input value with thousand separators while typing
const formatInputMoney = (value: string): string => {
    const num = parseMoney(value);
    return num > 0 ? num.toLocaleString('tr-TR') : '';
};

const SaleForm: React.FC<SaleFormProps> = ({ property, initialData, onClose, onSave }) => {
    const { customers, session, userProfile, teamMembers } = useData();

    // Detect if this is a cross-consultant sale (property owner != selling consultant)
    const propertyOwner = useMemo(() => {
        if (!property.user_id) return null;
        return teamMembers.find(m => m.id === property.user_id);
    }, [property.user_id, teamMembers]);

    const isCrossConsultant = propertyOwner && propertyOwner.id !== session?.user?.id;

    // Initialize form with initialData if available
    const [formData, setFormData] = useState({
        salePrice: initialData?.salePrice || property.price || 0,
        saleDate: initialData?.saleDate || new Date().toISOString().split('T')[0],
        buyerId: initialData?.buyerId || '',
        buyerName: initialData?.buyerName || '',
        consultantId: initialData?.consultantId || session?.user?.id || '',
        consultantName: initialData?.consultantName || userProfile?.name || '',
        officeShareRate: initialData?.officeShareRate || 50, // Default 50%
        notes: initialData?.notes || '',
        // Cross-commission fields
        enableCrossCommission: isCrossConsultant && (initialData ? !!initialData.sellerCommissionAmount : false) || (isCrossConsultant || false),
        propertyOwnerShareRate: initialData?.propertyOwnerShareRate ?? 30,
    });

    // Separate commission states for buyer and seller
    const [buyerCommissionAmount, setBuyerCommissionAmount] = useState<number>(initialData?.buyerCommissionAmount || 0);
    const [sellerCommissionAmount, setSellerCommissionAmount] = useState<number>(initialData?.sellerCommissionAmount || 0);

    // Display values for inputs (formatted strings)
    const [buyerCommissionDisplay, setBuyerCommissionDisplay] = useState<string>(
        initialData?.buyerCommissionAmount ? formatMoney(initialData.buyerCommissionAmount) : ''
    );
    const [sellerCommissionDisplay, setSellerCommissionDisplay] = useState<string>(
        initialData?.sellerCommissionAmount ? formatMoney(initialData.sellerCommissionAmount) : ''
    );

    const [expenses, setExpenses] = useState<SaleExpense[]>(initialData?.expenses || []);
    const [newExpenseType, setNewExpenseType] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState(0);

    // Partner Office (Ortak Satış) states
    const [hasPartnerOffice, setHasPartnerOffice] = useState<boolean>(initialData?.hasPartnerOffice || false);
    const [partnerOfficeName, setPartnerOfficeName] = useState<string>(initialData?.partnerOfficeName || '');
    const [partnerOfficeContact, setPartnerOfficeContact] = useState<string>(initialData?.partnerOfficeContact || '');
    const [partnerShareType, setPartnerShareType] = useState<'buyer_commission' | 'total_commission'>(
        initialData?.partnerShareType || 'buyer_commission'
    );
    const [partnerShareAmount, setPartnerShareAmount] = useState<number>(initialData?.partnerShareAmount || 0);
    const [partnerShareDisplay, setPartnerShareDisplay] = useState<string>(
        initialData?.partnerShareAmount ? formatMoney(initialData.partnerShareAmount) : ''
    );

    // Handle partner share input - format while typing
    const handlePartnerShareChange = (value: string) => {
        const numValue = parseMoney(value);
        setPartnerShareAmount(numValue);
        setPartnerShareDisplay(formatInputMoney(value));
    };

    // Calculate commission rates from amounts
    const buyerCommissionRate = formData.salePrice > 0 ? (buyerCommissionAmount / formData.salePrice) * 100 : 0;
    const sellerCommissionRate = formData.salePrice > 0 ? (sellerCommissionAmount / formData.salePrice) * 100 : 0;

    // Total commission
    const totalCommissionAmount = buyerCommissionAmount + sellerCommissionAmount;
    const totalCommissionRate = buyerCommissionRate + sellerCommissionRate;

    // Calculate partner share percentage based on type
    const partnerShareRate = useMemo(() => {
        if (!hasPartnerOffice || partnerShareAmount <= 0) return 0;
        if (partnerShareType === 'buyer_commission') {
            return buyerCommissionAmount > 0 ? (partnerShareAmount / buyerCommissionAmount) * 100 : 0;
        } else {
            return totalCommissionAmount > 0 ? (partnerShareAmount / totalCommissionAmount) * 100 : 0;
        }
    }, [hasPartnerOffice, partnerShareAmount, partnerShareType, buyerCommissionAmount, totalCommissionAmount]);

    // Calculated values
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = totalCommissionAmount - totalExpenses;
    // Net profit after partner share (if applicable)
    const effectivePartnerShare = hasPartnerOffice ? partnerShareAmount : 0;
    const netProfit = grossProfit - effectivePartnerShare;
    const officeShareAmount = (netProfit * formData.officeShareRate) / 100;
    const consultantShareRate = 100 - formData.officeShareRate;
    const totalConsultantShare = netProfit - officeShareAmount;

    // Cross-commission calculation
    const propertyOwnerShareAmount = formData.enableCrossCommission
        ? (totalConsultantShare * formData.propertyOwnerShareRate) / 100
        : 0;
    const sellingConsultantShareAmount = totalConsultantShare - propertyOwnerShareAmount;
    const consultantShareAmount = formData.enableCrossCommission ? sellingConsultantShareAmount : totalConsultantShare;

    // Handle buyer commission input - format while typing
    const handleBuyerCommissionChange = (value: string) => {
        const numValue = parseMoney(value);
        setBuyerCommissionAmount(numValue);
        setBuyerCommissionDisplay(formatInputMoney(value));
    };

    // Handle seller commission input - format while typing
    const handleSellerCommissionChange = (value: string) => {
        const numValue = parseMoney(value);
        setSellerCommissionAmount(numValue);
        setSellerCommissionDisplay(formatInputMoney(value));
    };

    // Add expense
    const addExpense = () => {
        if (!newExpenseType || newExpenseAmount <= 0) return;

        setExpenses([
            ...expenses,
            {
                id: crypto.randomUUID(),
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
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const sale: Sale = {
            id: initialData?.id || crypto.randomUUID(),
            propertyId: property.id,
            transactionType: 'sale',
            consultantId: formData.consultantId,
            consultantName: formData.consultantName,
            salePrice: formData.salePrice,
            saleDate: formData.saleDate,
            buyerId: formData.buyerId,
            buyerName: formData.buyerName,
            commissionRate: totalCommissionRate,
            commissionAmount: totalCommissionAmount,
            expenses,
            totalExpenses,
            officeShareRate: formData.officeShareRate,
            consultantShareRate,
            officeShareAmount,
            consultantShareAmount,
            netProfit,
            propertyOwnerShareRate: formData.enableCrossCommission ? formData.propertyOwnerShareRate : undefined,
            notes: formData.notes,
            propertyTitle: property.title,

            // Split commission details
            buyerCommissionAmount: buyerCommissionAmount,
            buyerCommissionRate: buyerCommissionRate,
            sellerCommissionAmount: sellerCommissionAmount,
            sellerCommissionRate: sellerCommissionRate,

            // Partner Office (Ortak Satış)
            hasPartnerOffice: hasPartnerOffice,
            partnerOfficeName: hasPartnerOffice ? partnerOfficeName : undefined,
            partnerOfficeContact: hasPartnerOffice ? partnerOfficeContact : undefined,
            partnerShareType: hasPartnerOffice ? partnerShareType : undefined,
            partnerShareAmount: hasPartnerOffice ? partnerShareAmount : undefined,
            partnerShareRate: hasPartnerOffice ? partnerShareRate : undefined,
        };

        onSave(sale);
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
                            <h2 className="text-2xl font-bold text-white">{initialData ? '📝 Satışı Düzenle' : '🎉 Satış Kaydı'}</h2>
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
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-3 pl-8 text-gray-900 dark:text-white font-semibold"
                                    value={formData.salePrice.toLocaleString('tr-TR')}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
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

                    {/* Commission - Buyer and Seller Separate */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Komisyon Girişi
                        </h3>

                        {/* Buyer Commission */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                                Alıcıdan Alınan Komisyon
                            </label>
                            <div className="flex gap-3 items-center">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="w-full rounded-lg border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 border p-3 pl-8 text-gray-900 dark:text-white font-semibold text-lg"
                                        value={buyerCommissionDisplay}
                                        onChange={e => handleBuyerCommissionChange(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-3.5 text-blue-400 font-medium">₺</span>
                                </div>
                                <div className="w-28 bg-blue-100 dark:bg-blue-800/50 rounded-lg p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Percent className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                        <span className="font-bold text-blue-800 dark:text-blue-200">
                                            {buyerCommissionRate.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seller Commission */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                                Satıcıdan Alınan Komisyon
                            </label>
                            <div className="flex gap-3 items-center">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="w-full rounded-lg border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 border p-3 pl-8 text-gray-900 dark:text-white font-semibold text-lg"
                                        value={sellerCommissionDisplay}
                                        onChange={e => handleSellerCommissionChange(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-3.5 text-blue-400 font-medium">₺</span>
                                </div>
                                <div className="w-28 bg-blue-100 dark:bg-blue-800/50 rounded-lg p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Percent className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                        <span className="font-bold text-blue-800 dark:text-blue-200">
                                            {sellerCommissionRate.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Commission Summary */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Toplam Komisyon</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-blue-800 dark:text-blue-200 text-lg">
                                        {formatMoney(totalCommissionAmount)} ₺
                                    </span>
                                    <span className="text-sm bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                        %{totalCommissionRate.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Partner Office - Ortak Satış */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                                <Handshake className="w-5 h-5" />
                                Ortak Satış
                            </h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasPartnerOffice}
                                    onChange={e => setHasPartnerOffice(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 rounded"
                                />
                                <span className="text-sm text-orange-700 dark:text-orange-300">Ortak ofis var</span>
                            </label>
                        </div>

                        {hasPartnerOffice && (
                            <div className="space-y-4">
                                {/* Partner Office Info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-orange-700 dark:text-orange-300 mb-1">
                                            <Building2 className="w-4 h-4 inline mr-1" />
                                            Ortak Ofis Adı
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Örn: ABC Emlak"
                                            className="w-full rounded-lg border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-800 border p-2 text-gray-900 dark:text-white"
                                            value={partnerOfficeName}
                                            onChange={e => setPartnerOfficeName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-orange-700 dark:text-orange-300 mb-1">
                                            Yetkili Kişi (opsiyonel)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Örn: Ahmet Bey"
                                            className="w-full rounded-lg border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-800 border p-2 text-gray-900 dark:text-white"
                                            value={partnerOfficeContact}
                                            onChange={e => setPartnerOfficeContact(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Share Type Selection */}
                                <div>
                                    <label className="block text-sm text-orange-700 dark:text-orange-300 mb-2">
                                        Paylaşım Türü
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPartnerShareType('buyer_commission')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${partnerShareType === 'buyer_commission'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                                                }`}
                                        >
                                            Alıcı Komisyonundan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPartnerShareType('total_commission')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${partnerShareType === 'total_commission'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                                                }`}
                                        >
                                            Toplam Komisyondan
                                        </button>
                                    </div>
                                </div>

                                {/* Partner Share Amount */}
                                <div>
                                    <label className="block text-sm text-orange-700 dark:text-orange-300 mb-2">
                                        Ortak Ofise Verilecek Tutar
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="0,00"
                                                className="w-full rounded-lg border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-800 border p-3 pl-8 text-gray-900 dark:text-white font-semibold text-lg"
                                                value={partnerShareDisplay}
                                                onChange={e => handlePartnerShareChange(e.target.value)}
                                            />
                                            <span className="absolute left-3 top-3.5 text-orange-400 font-medium">₺</span>
                                        </div>
                                        <div className="w-32 bg-orange-100 dark:bg-orange-800/50 rounded-lg p-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Percent className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                                                <span className="font-bold text-orange-800 dark:text-orange-200">
                                                    {partnerShareRate.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                                                {partnerShareType === 'buyer_commission' ? "alıcı kom." : "toplam kom."}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Partner Summary */}
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-slate-400">
                                            {partnerOfficeName || 'Ortak Ofis'}'e ödenecek
                                        </span>
                                        <span className="font-bold text-orange-600">
                                            {formatMoney(partnerShareAmount)} ₺
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                onChange={e => setNewExpenseAmount(parseFloat(e.target.value) || 0)}
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
                                                {formatMoney(exp.amount)} ₺
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
                                        {formatMoney(totalExpenses)} ₺
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
                                    Çapraz Komisyon
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
                                        <p className="text-sm text-violet-600 dark:text-violet-400">Portföy Sahibi</p>
                                        <p className="font-semibold text-violet-800 dark:text-violet-200">{propertyOwner.name}</p>
                                    </div>
                                </div>
                            </div>

                            {formData.enableCrossCommission && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-violet-700 dark:text-violet-300 mb-1">
                                            Portföy Sahibi Payı (%)
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
                                            Portföy Sahibine
                                        </label>
                                        <div className="bg-violet-200 dark:bg-violet-700/50 rounded-lg p-2 text-center font-bold text-violet-800 dark:text-violet-200">
                                            {formatMoney(propertyOwnerShareAmount)} ₺
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Revenue Sharing */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                        <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3">
                            Gelir Paylaşımı
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
                                <span className="text-gray-600 dark:text-slate-400">Alıcı Komisyonu</span>
                                <span className="font-medium">{formatMoney(buyerCommissionAmount)} ₺ <span className="text-xs text-gray-400">(%{buyerCommissionRate.toFixed(2)})</span></span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-slate-400">Satıcı Komisyonu</span>
                                <span className="font-medium">{formatMoney(sellerCommissionAmount)} ₺ <span className="text-xs text-gray-400">(%{sellerCommissionRate.toFixed(2)})</span></span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-gray-100 dark:border-slate-700 pt-2">
                                <span className="text-gray-600 dark:text-slate-400">Toplam Komisyon</span>
                                <span className="font-medium">{formatMoney(totalCommissionAmount)} ₺</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-slate-400">Toplam Gider</span>
                                <span className="font-medium text-red-600">-{formatMoney(totalExpenses)} ₺</span>
                            </div>
                            {hasPartnerOffice && partnerShareAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-slate-400">
                                        {partnerOfficeName || 'Ortak Ofis'} Payı
                                    </span>
                                    <span className="font-medium text-orange-600">-{formatMoney(partnerShareAmount)} ₺</span>
                                </div>
                            )}
                            <div className="border-t border-gray-100 dark:border-slate-700 pt-2 flex justify-between">
                                <span className="font-semibold text-gray-800 dark:text-white">Net Kâr</span>
                                <span className="font-bold text-green-600">{formatMoney(netProfit)} ₺</span>
                            </div>
                            <div className={`grid ${formData.enableCrossCommission ? 'grid-cols-3' : 'grid-cols-2'} gap-4 pt-2 border-t border-gray-100 dark:border-slate-700`}>
                                <div className="text-center">
                                    <div className="text-xs text-gray-500 dark:text-slate-400">Ofise Kalan</div>
                                    <div className="font-bold text-blue-600">{formatMoney(officeShareAmount)} ₺</div>
                                </div>
                                {formData.enableCrossCommission && propertyOwner && (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-slate-400">{propertyOwner.name}</div>
                                        <div className="font-bold text-violet-600">{formatMoney(propertyOwnerShareAmount)} ₺</div>
                                    </div>
                                )}
                                <div className="text-center">
                                    <div className="text-xs text-gray-500 dark:text-slate-400">
                                        {formData.enableCrossCommission ? 'Satıcı Danışmana' : 'Danışmana Kalan'}
                                    </div>
                                    <div className="font-bold text-purple-600">{formatMoney(consultantShareAmount)} ₺</div>
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
                            className="px-6 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"
                        >
                            🎉 Satışı Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaleForm;

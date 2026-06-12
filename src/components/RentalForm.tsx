import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Home, Calculator, Users, UserCheck, Calendar, Banknote } from 'lucide-react';
import { Property, Sale, SaleExpense } from '../types';
import { useData } from '../context/DataContext';

interface RentalFormProps {
    property: Property;
    onClose: () => void;
    onSave: (sale: Sale) => void;
}

const EXPENSE_TYPES = [
    'Reklam',
    'Ulaşım',
    'Sözleşme Masrafı',
    'Komisyon Paylaşımı',
    'Personel Primi',
    'Diğer'
];

const RentalForm: React.FC<RentalFormProps> = ({ property, onClose, onSave }) => {
    const { customers, session, userProfile, teamMembers } = useData();

    // Detect if this is a cross-consultant rental
    const propertyOwner = useMemo(() => {
        if (!property.user_id) return null;
        return teamMembers.find(m => m.id === property.user_id);
    }, [property.user_id, teamMembers]);

    const isCrossConsultant = propertyOwner && propertyOwner.id !== session?.user?.id;

    const [formData, setFormData] = useState({
        monthlyRent: property.price || 0,
        depositAmount: (property.price || 0) * 2, // Default: 2 months deposit
        leaseStartDate: new Date().toISOString().split('T')[0],
        leaseDuration: 12, // Default: 1 year
        tenantId: '',
        tenantName: '',
        consultantId: session?.user?.id || '',
        consultantName: userProfile?.name || '',
        commissionRate: 100, // Default: 1 month rent as commission (100% of monthly)
        officeShareRate: 50, // Default 50%
        notes: '',
        // Cross-commission fields
        enableCrossCommission: isCrossConsultant || false,
        propertyOwnerShareRate: 30,
    });

    const [expenses, setExpenses] = useState<SaleExpense[]>([]);
    const [newExpenseType, setNewExpenseType] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState(0);

    // Calculate lease end date
    const leaseEndDate = useMemo(() => {
        const start = new Date(formData.leaseStartDate);
        start.setMonth(start.getMonth() + formData.leaseDuration);
        return start.toISOString().split('T')[0];
    }, [formData.leaseStartDate, formData.leaseDuration]);

    // Calculated values - Commission is based on monthly rent
    const commissionAmount = (formData.monthlyRent * formData.commissionRate) / 100;
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

    // Handle tenant selection
    const handleTenantChange = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setFormData({
            ...formData,
            tenantId: customerId,
            tenantName: customer?.name || ''
        });
    };

    // Submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const sale: Sale = {
            id: `rental-${Date.now()}`,
            propertyId: property.id,
            transactionType: 'rental',

            // Use sale fields for rental data
            salePrice: commissionAmount, // Total commission
            saleDate: formData.leaseStartDate,
            buyerId: formData.tenantId,
            buyerName: formData.tenantName,

            // Rental specific
            monthlyRent: formData.monthlyRent,
            depositAmount: formData.depositAmount,
            leaseDuration: formData.leaseDuration,
            leaseEndDate: leaseEndDate,

            // Consultant
            consultantId: formData.consultantId,
            consultantName: formData.consultantName,

            // Commission
            commissionRate: formData.commissionRate,
            commissionAmount: commissionAmount,

            // Expenses
            expenses: expenses,
            totalExpenses: totalExpenses,

            // Revenue sharing
            officeShareRate: formData.officeShareRate,
            consultantShareRate: consultantShareRate,
            officeShareAmount: officeShareAmount,
            consultantShareAmount: consultantShareAmount,
            netProfit: netProfit,

            // Notes
            notes: formData.notes,

            // Property info
            propertyTitle: property.title,
        };

        onSave(sale);
    };

    // Filter customers for tenant selection (prefer tenants/buyers)
    const potentialTenants = useMemo(() => {
        return customers.filter(c =>
            c.customerType === 'Kiracı Adayı' ||
            c.customerType === 'Kiracı' ||
            c.customerType === 'Alıcı' ||
            c.status === 'Aktif'
        );
    }, [customers]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Home className="w-5 h-5 text-blue-500" />
                            Kiralama İşlemi
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            {property.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rental Details */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                            <Banknote className="w-4 h-4" />
                            Kira Bilgileri
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Aylık Kira (₺)
                                </label>
                                <input
                                    type="number"
                                    value={formData.monthlyRent}
                                    onChange={(e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Depozito (₺)
                                </label>
                                <input
                                    type="number"
                                    value={formData.depositAmount}
                                    onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lease Period */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Kira Süresi
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Başlangıç Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={formData.leaseStartDate}
                                    onChange={(e) => setFormData({ ...formData, leaseStartDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Süre (Ay)
                                </label>
                                <select
                                    value={formData.leaseDuration}
                                    onChange={(e) => setFormData({ ...formData, leaseDuration: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                >
                                    <option value={6}>6 Ay</option>
                                    <option value={12}>1 Yıl</option>
                                    <option value={24}>2 Yıl</option>
                                    <option value={36}>3 Yıl</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Bitiş Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={leaseEndDate}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600 text-slate-800 dark:text-white"
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tenant Selection */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Kiracı Bilgileri
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Kiracı Seçin
                                </label>
                                <select
                                    value={formData.tenantId}
                                    onChange={(e) => handleTenantChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    required
                                >
                                    <option value="">Kiracı Seçiniz...</option>
                                    {potentialTenants.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} - {c.phone} ({c.customerType || 'Müşteri'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Commission */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            Komisyon Hesaplama
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Komisyon Oranı (% aylık kira)
                                </label>
                                <input
                                    type="number"
                                    value={formData.commissionRate}
                                    onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    min="0"
                                    max="200"
                                />
                                <p className="text-xs text-gray-500 mt-1">100% = 1 aylık kira</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Ofis Payı (%)
                                </label>
                                <input
                                    type="number"
                                    value={formData.officeShareRate}
                                    onChange={(e) => setFormData({ ...formData, officeShareRate: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>

                        {/* Cross-consultant commission */}
                        {isCrossConsultant && (
                            <div className="border-t border-emerald-200 dark:border-emerald-800 pt-4 mt-4">
                                <label className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.enableCrossCommission}
                                        onChange={(e) => setFormData({ ...formData, enableCrossCommission: e.target.checked })}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                        Portföy sahibi ile komisyon paylaş ({propertyOwner?.name})
                                    </span>
                                </label>
                                {formData.enableCrossCommission && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Portföy Sahibi Payı (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.propertyOwnerShareRate}
                                            onChange={(e) => setFormData({ ...formData, propertyOwnerShareRate: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Commission Summary */}
                        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 mt-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-gray-600 dark:text-slate-400">Toplam Komisyon:</div>
                                <div className="font-semibold text-right text-slate-800 dark:text-white">
                                    {commissionAmount.toLocaleString('tr-TR')} ₺
                                </div>
                                <div className="text-gray-600 dark:text-slate-400">Giderler:</div>
                                <div className="font-semibold text-right text-red-600">
                                    -{totalExpenses.toLocaleString('tr-TR')} ₺
                                </div>
                                <div className="text-gray-600 dark:text-slate-400">Net Kar:</div>
                                <div className="font-semibold text-right text-emerald-600">
                                    {netProfit.toLocaleString('tr-TR')} ₺
                                </div>
                                <div className="border-t border-gray-200 dark:border-slate-600 col-span-2 my-2"></div>
                                <div className="text-gray-600 dark:text-slate-400">Ofis Payı ({formData.officeShareRate}%):</div>
                                <div className="font-semibold text-right text-slate-800 dark:text-white">
                                    {officeShareAmount.toLocaleString('tr-TR')} ₺
                                </div>
                                {formData.enableCrossCommission && propertyOwner && (
                                    <>
                                        <div className="text-gray-600 dark:text-slate-400">
                                            {propertyOwner.name} ({formData.propertyOwnerShareRate}%):
                                        </div>
                                        <div className="font-semibold text-right text-purple-600">
                                            {propertyOwnerShareAmount.toLocaleString('tr-TR')} ₺
                                        </div>
                                    </>
                                )}
                                <div className="text-gray-600 dark:text-slate-400">
                                    {formData.enableCrossCommission ? 'Sizin Payınız:' : `Danışman Payı (${consultantShareRate}%):`}
                                </div>
                                <div className="font-bold text-right text-blue-600 text-lg">
                                    {consultantShareAmount.toLocaleString('tr-TR')} ₺
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-red-900 dark:text-red-300">Giderler</h3>

                        <div className="flex gap-2">
                            <select
                                value={newExpenseType}
                                onChange={(e) => setNewExpenseType(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                            >
                                <option value="">Gider Tipi Seçin</option>
                                {EXPENSE_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Tutar"
                                value={newExpenseAmount || ''}
                                onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                                className="w-28 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                            />
                            <button
                                type="button"
                                onClick={addExpense}
                                className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {expenses.length > 0 && (
                            <div className="space-y-2">
                                {expenses.map(expense => (
                                    <div key={expense.id} className="flex justify-between items-center bg-white dark:bg-slate-700 p-2 rounded-lg">
                                        <span className="text-sm text-slate-800 dark:text-white">{expense.type}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-red-600">
                                                -{expense.amount.toLocaleString('tr-TR')} ₺
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeExpense(expense.id)}
                                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Notlar
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            rows={3}
                            placeholder="Kiralama ile ilgili notlar..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={!formData.tenantId || !formData.monthlyRent}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Kiralamayı Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RentalForm;

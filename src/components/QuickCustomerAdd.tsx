import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Customer } from '../types';
import { useData } from '../context/DataContext';

interface QuickCustomerAddProps {
    customerType: NonNullable<Customer['customerType']>;
    onCreated: (customer: Customer) => void;
}

// Satış/kiralama formunun içinden, rehberde olmayan kişiyi hızlıca müşteri olarak ekler.
// Üst formun içinde durduğu için butonlar type="button", Enter da üst formu göndermez.
const QuickCustomerAdd: React.FC<QuickCustomerAddProps> = ({ customerType, onCreated }) => {
    const { addCustomer } = useData();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    const reset = () => { setOpen(false); setName(''); setPhone(''); };

    const save = async () => {
        if (saving) return;
        if (!name.trim()) {
            toast.error('Lütfen ad soyad girin');
            return;
        }
        setSaving(true);
        try {
            const created = await addCustomer({
                id: crypto.randomUUID(),
                name: name.trim(),
                phone: phone.trim(),
                email: '',
                status: 'Aktif',
                customerType,
                source: 'Diğer',
                createdAt: new Date().toLocaleDateString('sv-SE'),
                interactions: [],
                avatar: '',
            });
            onCreated(created);
            toast.success(`${created.name} müşterilere eklendi`);
            reset();
        } catch (error) {
            if ((error as Error)?.message !== 'LIMIT_REACHED') toast.error('Müşteri eklenemedi');
        } finally {
            setSaving(false);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); save(); }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
                <UserPlus className="w-4 h-4" /> Yeni müşteri ekle
            </button>
        );
    }

    const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white';
    return (
        <div className="mt-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Yeni {customerType.toLowerCase()} ekle</span>
                <button type="button" onClick={reset} aria-label="Kapat" className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input autoFocus placeholder="Ad Soyad" value={name} onChange={e => setName(e.target.value)} onKeyDown={onKeyDown} className={inputClass} />
                <input placeholder="Telefon" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={onKeyDown} className={inputClass} />
            </div>
            <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
                {saving ? 'Kaydediliyor…' : 'Kaydet ve seç'}
            </button>
        </div>
    );
};

export default QuickCustomerAdd;

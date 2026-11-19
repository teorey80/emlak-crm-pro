import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Customer } from '../types';

interface CustomerSearchSelectProps {
    customers: Customer[];
    value: string;
    onChange: (customer: Customer | null) => void;
    placeholder?: string;
}

const normalizeText = (s: string) => s.toLocaleLowerCase('tr-TR').trim();
const digitsOnly = (s: string) => s.replace(/\D/g, '');

// Müşteri seçici: isim veya telefonun bir kısmı yazıldıkça listeyi daraltır.
// Telefon araması baştaki 0 / +90 farkına takılmaz (0532... ile 532... aynı sonucu verir).
const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({ customers, value, onChange, placeholder }) => {
    const [query, setQuery] = useState('');
    const selected = customers.find(c => c.id === value) || null;

    const results = useMemo(() => {
        const q = normalizeText(query);
        if (!q) return customers.slice(0, 50);
        const qDigits = digitsOnly(q).replace(/^(90|0)/, '');
        return customers.filter(c => {
            if (normalizeText(c.name || '').includes(q)) return true;
            if (qDigits.length >= 3) {
                const phones = [c.phone, c.secondPhone].map(p => digitsOnly(p || ''));
                return phones.some(p => p.includes(qDigits));
            }
            return false;
        }).slice(0, 50);
    }, [customers, query]);

    const inputClass = 'w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white';

    if (selected) {
        return (
            <div className="flex items-center justify-between gap-2 px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <div className="min-w-0">
                    <div className="font-medium text-slate-800 dark:text-white truncate">{selected.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {[selected.phone, selected.customerType].filter(Boolean).join(' · ')}
                    </div>
                </div>
                <button type="button" onClick={() => onChange(null)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0">
                    Değiştir
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                    placeholder={placeholder || 'İsim veya telefon yazın…'}
                    aria-label="Müşteri ara"
                    className={inputClass}
                />
                {query && (
                    <button type="button" onClick={() => setQuery('')} aria-label="Aramayı temizle" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            <ul role="listbox" aria-label="Müşteri sonuçları" className="mt-1 max-h-56 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-lg divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {results.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-500">Eşleşen müşteri yok. Aşağıdan yeni müşteri ekleyebilirsiniz.</li>
                ) : results.map(c => (
                    <li key={c.id}>
                        <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => { onChange(c); setQuery(''); }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700"
                        >
                            <span className="text-slate-800 dark:text-white">{c.name}</span>
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                {[c.phone, c.customerType].filter(Boolean).join(' · ')}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
            {!query && customers.length > 50 && (
                <p className="mt-1 text-xs text-slate-500">İlk 50 müşteri gösteriliyor; aramak için yazmaya başlayın.</p>
            )}
        </div>
    );
};

export default CustomerSearchSelect;

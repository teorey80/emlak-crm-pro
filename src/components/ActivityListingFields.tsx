import React from 'react';
import SitePicker from './SitePicker';

export type ListingTransactionType = 'Satılık' | 'Kiralık';
export type ListingSharingStatus = 'open' | 'restricted' | 'unknown';

interface ActivityListingFieldsProps {
  siteId?: string | null;
  onSiteChange: (id: string | null, name: string) => void;
  rooms?: string | null;
  onRoomsChange: (value: string) => void;
  transactionType?: ListingTransactionType | null;
  onTransactionTypeChange: (value: ListingTransactionType | '') => void;
  sharingStatus?: ListingSharingStatus | null;
  onSharingStatusChange: (value: ListingSharingStatus | '') => void;
  externalListingUrl?: string | null;
  onExternalListingUrlChange: (value: string) => void;
}

export function isValidListingUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const fieldClassName = 'w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-white';

export default function ActivityListingFields({
  siteId,
  onSiteChange,
  rooms,
  onRoomsChange,
  transactionType,
  onTransactionTypeChange,
  sharingStatus,
  onSharingStatusChange,
  externalListingUrl,
  onExternalListingUrlChange
}: ActivityListingFieldsProps) {
  return (
    <section className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/20 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Aracıdan Gelen İlan (opsiyonel)</h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Site, ilan türü ve paylaşım bilgileri etiketlerde aranabilir.</p>
      </div>

      <SitePicker value={siteId} onChange={onSiteChange} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Oda sayısı
          <input
            value={rooms || ''}
            onChange={event => onRoomsChange(event.target.value.replace(/\s/g, ''))}
            placeholder="Örn. 3+1"
            className={`${fieldClassName} mt-1 font-normal`}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          İlan türü
          <select value={transactionType || ''} onChange={event => onTransactionTypeChange(event.target.value as ListingTransactionType | '')} className={`${fieldClassName} mt-1 font-normal`}>
            <option value="">Seçiniz</option>
            <option value="Satılık">Satılık</option>
            <option value="Kiralık">Kiralık</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
          Paylaşım durumu
          <select value={sharingStatus || ''} onChange={event => onSharingStatusChange(event.target.value as ListingSharingStatus | '')} className={`${fieldClassName} mt-1 font-normal`}>
            <option value="">Seçiniz</option>
            <option value="open">Paylaşıma açık</option>
            <option value="restricted">Paylaşıma kapalı</option>
            <option value="unknown">Henüz sorulmadı / bilinmiyor</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
          WhatsApp’tan gelen ilan bağlantısı
          <input
            type="url"
            maxLength={2048}
            value={externalListingUrl || ''}
            onChange={event => onExternalListingUrlChange(event.target.value)}
            placeholder="https://…"
            className={`${fieldClassName} mt-1 font-normal`}
          />
        </label>
      </div>
    </section>
  );
}

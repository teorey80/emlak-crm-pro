import React, { useState } from 'react';
import { Building2, Plus, Trash2, Users } from 'lucide-react';
import SitePicker from './SitePicker';
import { useData } from '../context/DataContext';
import type { ShownProperty } from '../types';

interface ShownPropertiesPickerProps {
  value: ShownProperty[];
  onChange: (value: ShownProperty[]) => void;
}

// Aktivite listelerinde ve başlıkta kullanılan kısa açıklama
export function shownPropertyLabel(item: ShownProperty): string {
  if (item.propertyId) return item.title || 'Portföy';
  const place = [item.siteName, item.block && `${item.block} Blok`, item.unit && `D:${item.unit}`, item.rooms].filter(Boolean).join(' · ');
  return [place || 'Dış portföy', item.brokerName && `(${item.brokerName})`].filter(Boolean).join(' ');
}

const fieldClassName = 'w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-800 dark:text-white';
const emptyExternal: ShownProperty = { brokerCustomerId: null, brokerName: '', siteId: null, siteName: '', rooms: '', block: '', unit: '' };

export default function ShownPropertiesPicker({ value, onChange }: ShownPropertiesPickerProps) {
  const { properties, customers, session } = useData();
  const [addingExternal, setAddingExternal] = useState(false);
  const [external, setExternal] = useState<ShownProperty>(emptyExternal);
  const [manualBroker, setManualBroker] = useState(false);

  const brokers = customers.filter(c => c.customerType === 'Emlakçı');
  const myProperties = properties.filter(p => p.user_id === session?.user.id);
  const otherProperties = properties.filter(p => p.user_id !== session?.user.id);
  const selectedIds = new Set(value.map(item => item.propertyId).filter(Boolean));

  const addOwn = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || selectedIds.has(property.id)) return;
    onChange([...value, { propertyId: property.id, title: property.title }]);
  };

  const canAddExternal = Boolean(external.siteId || external.rooms?.trim() || external.block?.trim() || external.unit?.trim());
  const addExternal = () => {
    if (!canAddExternal) return;
    onChange([...value, {
      brokerCustomerId: external.brokerCustomerId || null,
      brokerName: external.brokerName?.trim() || null,
      siteId: external.siteId || null,
      siteName: external.siteName || null,
      rooms: external.rooms?.trim() || null,
      block: external.block?.trim() || null,
      unit: external.unit?.trim() || null,
    }]);
    setExternal(emptyExternal);
    setManualBroker(false);
    setAddingExternal(false);
  };

  return (
    <section className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Gezdirilen Portföyler</h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Bu gösterimde gezdirdiğiniz tüm evleri ekleyin: kendi portföyünüz veya başka emlakçının portföyü.</p>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((item, index) => (
            <li key={`${item.propertyId || 'ext'}-${index}`} className="flex items-center gap-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-2">
              {item.propertyId ? <Building2 className="w-4 h-4 text-indigo-600 shrink-0" /> : <Users className="w-4 h-4 text-amber-600 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{shownPropertyLabel(item)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.propertyId ? 'Portföyden' : 'Başka emlakçının portföyü'}</p>
              </div>
              <button type="button" aria-label="Portföyü çıkar" onClick={() => onChange(value.filter((_, i) => i !== index))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <select value="" onChange={e => addOwn(e.target.value)} className={fieldClassName} aria-label="Portföyden ekle">
        <option value="">+ Portföyden ekle…</option>
        {myProperties.length > 0 && <optgroup label="Benim portföyüm">
          {myProperties.map(p => <option key={p.id} value={p.id} disabled={selectedIds.has(p.id)}>#{p.id.slice(-4)} - {p.title}</option>)}
        </optgroup>}
        {otherProperties.length > 0 && <optgroup label="Ofis portföyü">
          {otherProperties.map(p => <option key={p.id} value={p.id} disabled={selectedIds.has(p.id)}>#{p.id.slice(-4)} - {p.title}</option>)}
        </optgroup>}
      </select>

      {!addingExternal ? (
        <button type="button" onClick={() => setAddingExternal(true)} className="flex items-center gap-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:underline">
          <Plus className="w-4 h-4" /> Başka emlakçının portföyünü ekle
        </button>
      ) : (
        <div className="rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800 bg-white/70 dark:bg-slate-900/40 p-3 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Emlakçı</label>
              <button type="button" onClick={() => { setManualBroker(!manualBroker); setExternal(prev => ({ ...prev, brokerCustomerId: null, brokerName: '' })); }} className="text-xs text-sky-700 dark:text-sky-300 underline">
                {manualBroker ? 'Listeden seç' : 'Listede yok, elle yaz'}
              </button>
            </div>
            {manualBroker || brokers.length === 0 ? (
              <input value={external.brokerName || ''} onChange={e => setExternal(prev => ({ ...prev, brokerName: e.target.value }))} placeholder="Örn. Ahmet Yılmaz - ABC Emlak" maxLength={120} className={`${fieldClassName} mt-1`} />
            ) : (
              <select value={external.brokerCustomerId || ''} onChange={e => { const broker = brokers.find(b => b.id === e.target.value); setExternal(prev => ({ ...prev, brokerCustomerId: broker?.id || null, brokerName: broker?.name || '' })); }} className={`${fieldClassName} mt-1`}>
                <option value="">Emlakçı seçiniz</option>
                {brokers.map(b => <option key={b.id} value={b.id}>{b.name}{b.phone ? ` - ${b.phone}` : ''}</option>)}
              </select>
            )}
          </div>

          <SitePicker value={external.siteId} onChange={(siteId, siteName) => setExternal(prev => ({ ...prev, siteId, siteName }))} />

          <div className="grid grid-cols-3 gap-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Oda
              <input value={external.rooms || ''} onChange={e => setExternal(prev => ({ ...prev, rooms: e.target.value.replace(/\s/g, '') }))} placeholder="3+1" maxLength={10} className={`${fieldClassName} mt-1 font-normal`} />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Blok
              <input value={external.block || ''} onChange={e => setExternal(prev => ({ ...prev, block: e.target.value }))} placeholder="A" maxLength={20} className={`${fieldClassName} mt-1 font-normal`} />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Daire
              <input value={external.unit || ''} onChange={e => setExternal(prev => ({ ...prev, unit: e.target.value }))} placeholder="12" maxLength={20} className={`${fieldClassName} mt-1 font-normal`} />
            </label>
          </div>

          <div className="flex gap-2">
            <button type="button" disabled={!canAddExternal} onClick={addExternal} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">Listeye ekle</button>
            <button type="button" onClick={() => { setAddingExternal(false); setExternal(emptyExternal); }} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200">Vazgeç</button>
          </div>
          {!canAddExternal && <p className="text-xs text-slate-500 dark:text-slate-400">Site, oda, blok veya daireden en az birini girin.</p>}
        </div>
      )}
    </section>
  );
}

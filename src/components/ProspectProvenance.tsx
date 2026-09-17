import React from 'react';
import type { ProspectCase } from '../types';
import { ENGAGEMENT_LABELS, formatProspectDate, prospectEngagementStatus, prospectSourceName } from '../utils/prospecting';

export default function ProspectProvenance({ item, detailed = false }: { item: ProspectCase; detailed?: boolean }) {
  const status = prospectEngagementStatus(item);
  return <div className="space-y-2" aria-label="Kayıt kaynağı ve görüşme durumu">
    <p className="text-xs text-slate-500 dark:text-slate-400 break-words">Liste aktarımı · {prospectSourceName(item)}</p>
    <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${status === 'reached' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : status === 'unanswered' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{ENGAGEMENT_LABELS[status]}</span>
    {detailed && <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
      <p>CRM’ye aktarım: {formatProspectDate(item.created_at)}</p>
      {item.engagement?.lastConversationAt && <p>CRM’de son görüşme: {formatProspectDate(item.engagement.lastConversationAt)} · {item.engagement.conversations} görüşme</p>}
      {!!item.engagement?.imported && <p>Listeden gelen {item.engagement.imported} eski görüşme ayrı korunuyor.</p>}
      <p>Görüşme durumu bu dairenin takip kaydına aittir. Kaynak notu, planlama ve ulaşılamayan arama, “Görüştüm” sayılmaz. Süreç ilerlediğinde kayıt kaynağı değişmez.</p>
    </div>}
  </div>;
}

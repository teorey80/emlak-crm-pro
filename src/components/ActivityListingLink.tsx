import React from 'react';

export default function ActivityListingLink({ url }: { url?: string | null }) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return (
      <a href={parsed.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 dark:text-sky-300 hover:underline">
        WhatsApp’tan gelen ilanı aç ↗
      </a>
    );
  } catch {
    return null;
  }
}

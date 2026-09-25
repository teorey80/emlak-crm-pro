import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, FolderOpen, ListTodo } from 'lucide-react';
import toast from 'react-hot-toast';
import { disconnectGoogle, getGoogleConnectUrl, getGoogleStatus, type GoogleConnectionStatus } from '../services/googleWorkspaceService';

const GoogleConnectionCard: React.FC = () => {
  const [status, setStatus] = useState<GoogleConnectionStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getGoogleStatus().then(setStatus).catch(caught => setError(caught instanceof Error ? caught.message : 'Google bağlantısı kontrol edilemedi.'));
    if (window.location.hash.includes('google=connected')) toast.success('Google hesabı bağlandı.');
    if (window.location.hash.includes('google=denied')) toast.error('Google erişimine izin verilmedi.');
  }, []);

  const connect = async () => {
    setBusy(true);
    try {
      const url = new URL(await getGoogleConnectUrl());
      if (url.hostname !== 'accounts.google.com') throw new Error('Google yönlendirme adresi geçersiz.');
      window.location.assign(url.toString());
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Google bağlantısı başlatılamadı.'); setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true);
    try { await disconnectGoogle(); setStatus({ connected: false, email: null, scopes: '' }); toast.success('Google bağlantısı kaldırıldı.'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Bağlantı kaldırılamadı.'); }
    finally { setBusy(false); }
  };

  return <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
    <div><h2 className="text-lg font-bold text-slate-800 dark:text-white">Google Bağlantısı</h2><p className="text-sm text-gray-500">Takvim, Görevler ve Drive hesabınızı CRM'ye bağlayın.</p></div>
    <div className="grid sm:grid-cols-3 gap-3 text-sm text-slate-600 dark:text-slate-300"><span className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Randevular</span><span className="flex items-center gap-2"><ListTodo className="w-4 h-4" /> Görevler</span><span className="flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Belgeler</span></div>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {status?.connected ? <div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm text-green-700"><CheckCircle2 className="w-4 h-4" /> {status.email} bağlı</p><button type="button" disabled={busy} onClick={() => void disconnect()} className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50">Bağlantıyı kaldır</button></div> : <button type="button" disabled={busy} onClick={() => void connect()} className="bg-sky-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">Google hesabını bağla</button>}
  </section>;
};

export default GoogleConnectionCard;

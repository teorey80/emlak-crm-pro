import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, Plus, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import { useData } from '../context/DataContext';
import { deleteGoogleTask, syncGoogleTask } from '../services/googleWorkspaceService';

interface CrmTask {
  id: string;
  title: string;
  notes: string;
  due_date: string | null;
  completed: boolean;
  google_task_id: string | null;
  sync_error: string | null;
  created_at: string;
}

const TasksPage: React.FC = () => {
  const { session, userProfile } = useData();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true); setError('');
    const { data, error } = await supabase.from('crm_tasks').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (error) setError(`Görevler yüklenemedi: ${error.message}`);
    else setTasks((data || []) as CrmTask[]);
    setLoading(false);
  }, [session?.user.id]);
  useEffect(() => { void load(); }, [load]);

  const sync = async (taskId: string) => {
    try {
      await syncGoogleTask(taskId);
      await supabase.from('crm_tasks').update({ sync_error: null }).eq('id', taskId);
      await load();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Google Görevler bağlantısı başarısız.';
      await supabase.from('crm_tasks').update({ sync_error: message }).eq('id', taskId);
      setTasks(current => current.map(task => task.id === taskId ? { ...task, sync_error: message } : task));
      toast.error(`Görev CRM'ye kaydedildi; Google Görevler'e aktarılamadı: ${message}`);
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.user.id || !title.trim()) return;
    const taskId = crypto.randomUUID();
    setBusyId(taskId);
    const { error } = await supabase.from('crm_tasks').insert({ id: taskId, user_id: session.user.id, office_id: userProfile.officeId || null, title: title.trim(), notes: notes.trim(), due_date: dueDate || null });
    if (error) { toast.error(`Görev kaydedilemedi: ${error.message}`); setBusyId(''); return; }
    setTitle(''); setNotes(''); setDueDate('');
    await load();
    await sync(taskId);
    setBusyId('');
  };

  const toggle = async (task: CrmTask) => {
    setBusyId(task.id);
    const { error } = await supabase.from('crm_tasks').update({ completed: !task.completed, updated_at: new Date().toISOString() }).eq('id', task.id);
    if (error) toast.error(`Görev güncellenemedi: ${error.message}`);
    else { await load(); await sync(task.id); }
    setBusyId('');
  };

  const remove = async (task: CrmTask) => {
    if (!window.confirm('Bu görevi CRM ve Google Görevler’den silmek istiyor musunuz?')) return;
    setBusyId(task.id);
    try {
      if (task.google_task_id) await deleteGoogleTask(task.id, task.google_task_id);
      const { error } = await supabase.from('crm_tasks').delete().eq('id', task.id);
      if (error) throw error;
      setTasks(current => current.filter(item => item.id !== task.id));
      toast.success('Görev silindi.');
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : 'Görev silinemedi.'); }
    finally { setBusyId(''); }
  };

  return <div className="max-w-4xl mx-auto space-y-6">
    <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Görevlerim</h1><p className="text-sm text-gray-500">Görevleri Google Görevler hesabınızda da takip edin.</p></div><button type="button" onClick={() => void load()} aria-label="Görevleri yenile"><RefreshCw className="w-5 h-5" /></button></div>
    <form onSubmit={create} className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 space-y-3">
      <label className="block text-sm font-medium">Yeni görev</label>
      <input required maxLength={255} value={title} onChange={event => setTitle(event.target.value)} placeholder="Örn: Müşteriyi ara" className="w-full rounded-lg border p-3 dark:bg-slate-700 dark:border-slate-600" />
      <div className="grid md:grid-cols-2 gap-3"><input value={notes} onChange={event => setNotes(event.target.value)} placeholder="Not (isteğe bağlı)" className="rounded-lg border p-3 dark:bg-slate-700 dark:border-slate-600" /><input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} className="rounded-lg border p-3 dark:bg-slate-700 dark:border-slate-600" /></div>
      <button type="submit" disabled={!!busyId} className="flex items-center gap-2 bg-sky-600 text-white rounded-lg px-4 py-2 disabled:opacity-50"><Plus className="w-4 h-4" /> Görev ekle</button>
    </form>
    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl divide-y dark:divide-slate-700">
      {loading ? <p className="p-5 text-sm text-gray-500">Görevler yükleniyor...</p> : error ? <p className="p-5 text-sm text-red-600">{error}</p> : tasks.length === 0 ? <p className="p-5 text-sm text-gray-500">Henüz görev yok.</p> : tasks.map(task =>
        <div key={task.id} className="flex items-start gap-3 p-4">
          <button type="button" disabled={busyId === task.id} onClick={() => void toggle(task)} aria-label={task.completed ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'} className="mt-1 text-sky-600">{task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}</button>
          <div className="flex-1"><p className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-slate-800 dark:text-white'}`}>{task.title}</p>{task.notes && <p className="text-sm text-gray-500">{task.notes}</p>}<p className="text-xs text-gray-400">{task.due_date ? `Son tarih: ${task.due_date} · ` : ''}{task.google_task_id && !task.sync_error ? 'Google Görevler ile eşitlendi' : 'Eşitleme bekliyor'}</p>{task.sync_error && <button type="button" onClick={() => void sync(task.id)} className="text-xs text-red-600 underline">Google eşitlemesini yeniden dene: {task.sync_error}</button>}</div>
          <button type="button" disabled={busyId === task.id} onClick={() => void remove(task)} aria-label="Görevi sil" className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>)}
    </div>
  </div>;
};

export default TasksPage;

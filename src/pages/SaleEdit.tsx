import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabaseClient';
import type { SaleExpense } from '../types';

interface SaleRecord {
  id: string;
  property_id: string | null;
  transaction_type: 'sale' | 'rental' | null;
  sale_price: number;
  sale_date: string;
  monthly_rent: number | null;
  deposit_amount: number | null;
  lease_duration: number | null;
  lease_end_date: string | null;
  buyer_commission_amount: number | null;
  seller_commission_amount: number | null;
  commission_amount: number;
  kdv_amount: number | null;
  office_share_amount: number | null;
  consultant_share_amount: number | null;
  expenses: SaleExpense[] | null;
  total_expenses: number | null;
  notes: string | null;
}

interface EditForm {
  transactionAmount: number;
  date: string;
  deposit: number;
  leaseDuration: number;
  leaseEndDate: string;
  buyerCommission: number;
  sellerCommission: number;
  commissionAmount: number;
  kdvAmount: number;
  officeShare: number;
  consultantShare: number;
  expenses: SaleExpense[];
  notes: string;
}

const numberValue = (value: number | null | undefined) => Number(value ?? 0);
const money = (value: number) => value.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const roundMoney = (value: number) => Math.round(value * 100) / 100;
const moneyInput = 'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white';

export default function SaleEdit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, refetchData } = useData();
  const requestedReturn = (location.state as { returnTo?: string } | null)?.returnTo;
  const returnTo = requestedReturn?.startsWith('/reports?') ? requestedReturn : '/reports?view=commission';
  const [record, setRecord] = useState<SaleRecord | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) { setError('İşlem kimliği bulunamadı.'); setLoading(false); return; }
      const { data, error: loadError } = await supabase.from('sales').select('*').eq('id', id).maybeSingle();
      if (!active) return;
      if (loadError || !data) {
        setError(loadError?.message || 'İşlem bulunamadı veya görüntüleme yetkiniz yok.');
      } else {
        const sale = data as SaleRecord;
        const savedExpenses = Array.isArray(sale.expenses) ? sale.expenses : [];
        setRecord(sale);
        setForm({
          transactionAmount: numberValue(sale.transaction_type === 'rental' ? sale.monthly_rent : sale.sale_price),
          date: sale.sale_date?.slice(0, 10) || '',
          deposit: numberValue(sale.deposit_amount),
          leaseDuration: numberValue(sale.lease_duration),
          leaseEndDate: sale.lease_end_date?.slice(0, 10) || '',
          buyerCommission: numberValue(sale.buyer_commission_amount),
          sellerCommission: numberValue(sale.seller_commission_amount),
          commissionAmount: numberValue(sale.commission_amount),
          kdvAmount: numberValue(sale.kdv_amount),
          officeShare: numberValue(sale.office_share_amount),
          consultantShare: numberValue(sale.consultant_share_amount),
          expenses: savedExpenses.length ? savedExpenses : numberValue(sale.total_expenses) > 0
            ? [{ id: 'legacy-expense', type: 'Önceki masraflar', amount: numberValue(sale.total_expenses) }] : [],
          notes: sale.notes || '',
        });
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [id]);

  const isRental = record?.transaction_type === 'rental';
  const expensesTotal = form?.expenses.reduce((sum, expense) => sum + numberValue(expense.amount), 0) || 0;
  const netProfit = (form?.commissionAmount || 0) - expensesTotal;
  const gross = (form?.commissionAmount || 0) + (form?.kdvAmount || 0);
  const propertyTitle = properties.find(property => property.id === record?.property_id)?.title || 'Portföy kaydı';

  const changeCommission = (nextCommission: number, changes: Partial<EditForm> = {}) => {
    setForm(previous => {
      if (!previous) return previous;
      const vatRatio = previous.commissionAmount > 0 ? previous.kdvAmount / previous.commissionAmount : 0;
      return { ...previous, ...changes, commissionAmount: nextCommission, kdvAmount: roundMoney(nextCommission * vatRatio) };
    });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!record || !form || saving) return;
    const values = [form.transactionAmount, form.commissionAmount, form.kdvAmount, form.officeShare, form.consultantShare, form.deposit, ...form.expenses.map(expense => Number(expense.amount))];
    if (!form.date || values.some(value => !Number.isFinite(value) || value < 0) || form.transactionAmount <= 0 || form.commissionAmount <= 0) {
      setError('Tarihi ve sıfırdan büyük işlem ile komisyon tutarlarını kontrol edin.');
      return;
    }
    if (isRental && (!Number.isInteger(form.leaseDuration) || form.leaseDuration < 0 || (form.leaseEndDate && form.leaseEndDate < form.date))) {
      setError('Kira süresi ve bitiş tarihini kontrol edin.');
      return;
    }
    if (expensesTotal > form.commissionAmount || form.officeShare + form.consultantShare > netProfit + 0.01) {
      setError('Masraflar komisyonu, ofis ve danışman payları net komisyonu aşamaz.');
      return;
    }
    const baseAmount = form.transactionAmount;
    const commissionRate = roundMoney(form.commissionAmount / baseAmount * 100);
    const payload = {
      sale_date: form.date,
      sale_price: isRental ? form.commissionAmount : form.transactionAmount,
      monthly_rent: isRental ? form.transactionAmount : record.monthly_rent,
      deposit_amount: isRental ? form.deposit : record.deposit_amount,
      lease_duration: isRental ? form.leaseDuration || null : record.lease_duration,
      lease_start_date: isRental ? form.date : null,
      lease_end_date: isRental ? form.leaseEndDate || null : record.lease_end_date,
      buyer_commission_amount: isRental ? numberValue(record.buyer_commission_amount) : form.buyerCommission,
      buyer_commission_rate: isRental ? 0 : roundMoney(form.buyerCommission / baseAmount * 100),
      seller_commission_amount: isRental ? numberValue(record.seller_commission_amount) : form.sellerCommission,
      seller_commission_rate: isRental ? 0 : roundMoney(form.sellerCommission / baseAmount * 100),
      commission_rate: commissionRate,
      commission_amount: form.commissionAmount,
      kdv_included: form.kdvAmount > 0,
      kdv_rate: form.commissionAmount > 0 ? roundMoney(form.kdvAmount / form.commissionAmount * 100) : 0,
      kdv_amount: form.kdvAmount,
      net_commission_ex_kdv: form.commissionAmount,
      gross_amount_with_kdv: gross,
      expenses: form.expenses,
      total_expenses: expensesTotal,
      net_profit: netProfit,
      office_share_amount: form.officeShare,
      consultant_share_amount: form.consultantShare,
      office_share_rate: netProfit > 0 ? roundMoney(form.officeShare / netProfit * 100) : 0,
      consultant_share_rate: netProfit > 0 ? roundMoney(form.consultantShare / netProfit * 100) : 0,
      notes: form.notes.trim() || null,
    };
    setSaving(true);
    setError('');
    const { data, error: saveError } = await supabase.from('sales').update(payload).eq('id', record.id).select('id').maybeSingle();
    if (saveError || !data) {
      setError(saveError?.message || 'İşlem kaydedilemedi. Düzenleme yetkinizi kontrol edin.');
      setSaving(false);
      return;
    }
    try {
      await refetchData();
      toast.success('İşlem güncellendi');
      navigate(returnTo);
    } catch {
      toast.success('İşlem güncellendi. Raporu yenileyerek son tutarları görebilirsiniz.');
      navigate(returnTo);
    }
  };

  if (loading) return <p role="status" className="p-6">İşlem yükleniyor…</p>;
  if (!record || !form) return <div className="space-y-4 p-6"><p role="alert" className="text-red-600">{error}</p><Link to={returnTo} className="text-sky-700 underline">Rapora dön</Link></div>;

  return <div className="mx-auto max-w-3xl space-y-6 pb-12">
    <Link to={returnTo} className="inline-flex items-center gap-2 text-sm text-sky-700 dark:text-sky-300 hover:underline"><ArrowLeft className="h-4 w-4" /> Komisyon raporuna dön</Link>
    <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isRental ? 'Kiralama' : 'Satış'} işlemini düzenle</h1>{record.property_id ? <Link to={`/properties/${record.property_id}`} className="mt-1 inline-block text-sm text-sky-700 dark:text-sky-300 hover:underline">{propertyTitle} →</Link> : <p className="mt-1 text-sm text-slate-500">{propertyTitle}</p>}</div>
    <form onSubmit={save} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <section className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">{isRental ? 'Gerçekleşen aylık kira (₺)' : 'Gerçekleşen satış bedeli (₺)'}<input className={moneyInput} type="number" min="0.01" step="0.01" required value={form.transactionAmount} onChange={event => setForm({ ...form, transactionAmount: Number(event.target.value) })} /></label>
        <label className="text-sm font-medium">{isRental ? 'Kira başlangıç tarihi' : 'Satış tarihi'}<input className={moneyInput} type="date" required value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label>
        {isRental && <><label className="text-sm font-medium">Depozito (₺)<input className={moneyInput} type="number" min="0" step="0.01" value={form.deposit} onChange={event => setForm({ ...form, deposit: Number(event.target.value) })} /></label><label className="text-sm font-medium">Kira süresi (ay)<input className={moneyInput} type="number" min="0" step="1" value={form.leaseDuration} onChange={event => setForm({ ...form, leaseDuration: Number(event.target.value) })} /></label><label className="text-sm font-medium">Kira bitiş tarihi<input className={moneyInput} type="date" value={form.leaseEndDate} onChange={event => setForm({ ...form, leaseEndDate: event.target.value })} /></label></>}
      </section>
      <section className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-700">
        <h2 className="font-semibold">Komisyon ve KDV</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {isRental ? <label className="text-sm font-medium">Komisyon (KDV hariç, ₺)<input className={moneyInput} type="number" min="0.01" step="0.01" required value={form.commissionAmount} onChange={event => changeCommission(Number(event.target.value))} /></label> : <>
            <label className="text-sm font-medium">Alıcıdan alınan komisyon (₺)<input className={moneyInput} type="number" min="0" step="0.01" value={form.buyerCommission} onChange={event => { const buyerCommission = Number(event.target.value); changeCommission(buyerCommission + form.sellerCommission, { buyerCommission }); }} /></label>
            <label className="text-sm font-medium">Satıcıdan alınan komisyon (₺)<input className={moneyInput} type="number" min="0" step="0.01" value={form.sellerCommission} onChange={event => { const sellerCommission = Number(event.target.value); changeCommission(form.buyerCommission + sellerCommission, { sellerCommission }); }} /></label>
          </>}
          <label className="text-sm font-medium">KDV tutarı (₺)<input className={moneyInput} type="number" min="0" step="0.01" value={form.kdvAmount} onChange={event => setForm({ ...form, kdvAmount: Number(event.target.value) })} /></label>
        </div>
        <div className="rounded-lg bg-sky-50 p-4 text-sm text-sky-900 dark:bg-sky-900/20 dark:text-sky-100"><p>Komisyon: <strong>{money(form.commissionAmount)} ₺</strong> · KDV: <strong>{money(form.kdvAmount)} ₺</strong></p><p className="mt-1">KDV dahil tahsilat: <strong>{money(gross)} ₺</strong></p></div>
      </section>
      <section className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Masraflar</h2><button type="button" onClick={() => setForm({ ...form, expenses: [...form.expenses, { id: crypto.randomUUID(), type: 'Diğer', amount: 0 }] })} className="inline-flex items-center gap-1 text-sm text-sky-700 dark:text-sky-300"><Plus className="h-4 w-4" /> Masraf ekle</button></div>
        {form.expenses.map((expense, index) => <div key={expense.id || index} className="grid grid-cols-[1fr_130px_32px] items-end gap-2"><label className="text-xs">Açıklama<input className={moneyInput} value={expense.type} onChange={event => setForm({ ...form, expenses: form.expenses.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value } : item) })} /></label><label className="text-xs">Tutar (₺)<input className={moneyInput} type="number" min="0" step="0.01" value={expense.amount} onChange={event => setForm({ ...form, expenses: form.expenses.map((item, itemIndex) => itemIndex === index ? { ...item, amount: Number(event.target.value) } : item) })} /></label><button type="button" aria-label="Masrafı kaldır" onClick={() => setForm({ ...form, expenses: form.expenses.filter((_, itemIndex) => itemIndex !== index) })} className="mb-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>)}
        <p className="text-sm">Toplam masraf: <strong>{money(expensesTotal)} ₺</strong> · Net komisyon: <strong>{money(netProfit)} ₺</strong></p>
      </section>
      <section className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-700"><h2 className="font-semibold">Paylar</h2><p className="text-xs text-slate-500">Komisyon veya masraf değiştiyse ofis ve danışman paylarını da kontrol edin.</p><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Ofis payı (₺)<input className={moneyInput} type="number" min="0" step="0.01" value={form.officeShare} onChange={event => setForm({ ...form, officeShare: Number(event.target.value) })} /></label><label className="text-sm font-medium">Danışman payı (₺)<input className={moneyInput} type="number" min="0" step="0.01" value={form.consultantShare} onChange={event => setForm({ ...form, consultantShare: Number(event.target.value) })} /></label></div><p className="text-xs text-slate-500">Diğer pay: {money(netProfit - form.officeShare - form.consultantShare)} ₺</p></section>
      <label className="block text-sm font-medium">Notlar<textarea className={`${moneyInput} min-h-24`} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3"><Link to={returnTo} className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600">Vazgeç</Link><button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}</button></div>
    </form>
  </div>;
}

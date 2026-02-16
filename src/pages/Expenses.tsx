import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Receipt, TrendingDown, Calendar, Filter, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Expense, ExpenseCategory } from '../types';
import toast from 'react-hot-toast';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  'kira': 'Kira',
  'fatura': 'Fatura',
  'maaş': 'Maaş',
  'diğer': 'Diğer'
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'kira': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'fatura': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'maaş': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'diğer': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
};

const Expenses: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, userProfile } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    amount: 0,
    category: 'diğer' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Check if user is broker
  const isBroker = userProfile?.role === 'ofis_broker' || userProfile?.role === 'broker';

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (filterCategory !== 'all') {
      result = result.filter(e => e.category === filterCategory);
    }

    if (filterMonth) {
      result = result.filter(e => e.date.startsWith(filterMonth));
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterCategory, filterMonth]);

  // Calculate totals
  const totals = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory: Record<string, number> = {};

    filteredExpenses.forEach(e => {
      const cat = e.category || 'diğer';
      byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    });

    return { total, byCategory };
  }, [filteredExpenses]);

  // Get unique months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(e => {
      if (e.date) {
        months.add(e.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const resetForm = () => {
    setFormData({
      title: '',
      amount: 0,
      category: 'diğer',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setEditingExpense(null);
  };

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        description: expense.description || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Gider başlığı gerekli');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Tutar 0\'dan büyük olmalı');
      return;
    }

    try {
      if (editingExpense) {
        await updateExpense({
          ...editingExpense,
          ...formData
        });
        toast.success('Gider güncellendi');
      } else {
        await addExpense(formData);
        toast.success('Gider eklendi');
      }
      closeModal();
    } catch (error) {
      console.error('Gider kaydetme hatası:', error);
      toast.error('Gider kaydedilemedi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu gideri silmek istediğinize emin misiniz?')) return;

    try {
      await deleteExpense(id);
      toast.success('Gider silindi');
    } catch (error) {
      console.error('Gider silme hatası:', error);
      toast.error('Gider silinemedi');
    }
  };

  // If not broker, show access denied
  if (!isBroker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Receipt className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Erişim Kısıtlı
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Gider yönetimi sadece Ofis Broker tarafından görüntülenebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gider Yönetimi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Ofis giderlerini takip edin</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Gider
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Gider</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {totals.total.toLocaleString('tr-TR')} ₺
              </p>
            </div>
          </div>
        </div>

        {/* By Category */}
        {(['kira', 'fatura', 'maaş', 'diğer'] as ExpenseCategory[]).map(cat => (
          <div key={cat} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">{CATEGORY_LABELS[cat]}</p>
            <p className="text-lg font-semibold text-slate-800 dark:text-white">
              {(totals.byCategory[cat] || 0).toLocaleString('tr-TR')} ₺
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtrele:</span>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
        >
          <option value="all">Tüm Kategoriler</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
        >
          <option value="">Tüm Aylar</option>
          {availableMonths.map(month => {
            const [year, m] = month.split('-');
            const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            return (
              <option key={month} value={month}>{monthName}</option>
            );
          })}
        </select>

        {(filterCategory !== 'all' || filterMonth) && (
          <button
            onClick={() => { setFilterCategory('all'); setFilterMonth(''); }}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Expenses List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Henüz gider kaydı yok</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {filteredExpenses.map(expense => (
              <div
                key={expense.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[expense.category]}`}>
                    {CATEGORY_LABELS[expense.category]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{expense.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(expense.date).toLocaleDateString('tr-TR')}
                      {expense.description && (
                        <span className="text-gray-400">• {expense.description}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                    -{expense.amount.toLocaleString('tr-TR')} ₺
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(expense)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingExpense ? 'Gider Düzenle' : 'Yeni Gider'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Başlık *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="Örn: Ocak Ayı Kirası"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tutar (₺) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  rows={2}
                  placeholder="Opsiyonel not..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  {editingExpense ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;

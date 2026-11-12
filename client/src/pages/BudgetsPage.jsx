import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { budgetsApi, categoriesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency } from '../utils/formatters';

const today = new Date();
const EMPTY_FORM = {
  category_id: '',
  amount: '',
  period: 'monthly',
  start_date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
  end_date: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10),
};

export default function BudgetsPage() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [bRes, cRes] = await Promise.all([budgetsApi.getAll(), categoriesApi.getAll({ type: 'expense' })]);
      setBudgets(bRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([budgetsApi.getAll(), categoriesApi.getAll({ type: 'expense' })])
      .then(([bRes, cRes]) => {
        if (!active) return;
        setBudgets(bRes.data);
        setCategories(cRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ category_id: b.category_id, amount: b.amount, period: b.period, start_date: b.start_date?.slice(0, 10), end_date: b.end_date?.slice(0, 10) });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) await budgetsApi.update(editing.id, form);
      else await budgetsApi.create(form);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await budgetsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Budget
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wallet}
            title="No budgets yet"
            description="Set spending limits by category to manage your finances"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = Math.min(100, Math.round((parseFloat(b.spent) / parseFloat(b.amount)) * 100));
            const over = parseFloat(b.spent) > parseFloat(b.amount);
            return (
              <div key={b.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: b.category_color || '#6366f1' }}>
                      {b.category_name?.[0] || 'B'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{b.category_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{b.period}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{formatCurrency(b.spent, cur)} spent</span>
                    <span className={over ? 'text-red-500 font-medium' : ''}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1.5">
                    <span className={over ? 'text-red-500 font-medium' : 'text-gray-400'}>
                      {over ? `${formatCurrency(parseFloat(b.spent) - parseFloat(b.amount), cur)} over budget` : `${formatCurrency(parseFloat(b.amount) - parseFloat(b.spent), cur)} remaining`}
                    </span>
                    <span className="text-gray-400">Limit: {formatCurrency(b.amount, cur)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Budget' : 'New Budget'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Budget Limit</label>
            <input type="number" step="0.01" min="1" className="input" placeholder="0.00"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>

          <div>
            <label className="label">Period</label>
            <select className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Budget"
        message={`Delete the budget for "${deleteTarget?.category_name}"?`}
      />
    </div>
  );
}

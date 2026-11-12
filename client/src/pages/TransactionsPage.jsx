import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react';
import { transactionsApi, categoriesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

const EMPTY_FORM = {
  type: 'expense', category_id: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10),
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ type: '', category_id: '', search: '' });
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    try {
      const params = { limit: LIMIT, offset: page * LIMIT };
      if (filters.type) params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id;

      const [txRes, catRes] = await Promise.all([
        transactionsApi.getAll(params),
        categoriesApi.getAll(),
      ]);
      setTransactions(txRes.data.data);
      setTotal(txRes.data.total);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    let active = true;
    const params = { limit: LIMIT, offset: page * LIMIT };
    if (filters.type) params.type = filters.type;
    if (filters.category_id) params.category_id = filters.category_id;

    Promise.all([transactionsApi.getAll(params), categoriesApi.getAll()])
      .then(([txRes, catRes]) => {
        if (!active) return;
        setTransactions(txRes.data.data);
        setTotal(txRes.data.total);
        setCategories(catRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (tx) => {
    setEditing(tx);
    setForm({
      type: tx.type,
      category_id: tx.category_id || '',
      amount: tx.amount,
      description: tx.description || '',
      date: tx.date?.slice(0, 10) || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, category_id: form.category_id || null };
      if (editing) {
        await transactionsApi.update(editing.id, payload);
      } else {
        await transactionsApi.create(payload);
      }
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
      await transactionsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredTx = transactions.filter((tx) => {
    if (!filters.search) return true;
    return (
      tx.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      tx.category_name?.toLowerCase().includes(filters.search.toLowerCase())
    );
  });

  const catForType = categories.filter((c) => c.type === form.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search transactions…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="input w-full sm:w-36"
          value={filters.type}
          onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(0); }}
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          className="input w-full sm:w-44"
          value={filters.category_id}
          onChange={(e) => { setFilters({ ...filters, category_id: e.target.value }); setPage(0); }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTx.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No transactions found"
            description="Add your first transaction to get started"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Description</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Category</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Date</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3">Amount</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs"
                          style={{ backgroundColor: tx.category_color || '#6366f1' }}>
                          {tx.category_name?.[0] || '?'}
                        </div>
                        <span className="text-sm text-gray-700">{tx.description || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{tx.category_name || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDate(tx.date)}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`text-sm font-semibold flex items-center justify-end gap-1 ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                        {formatCurrency(tx.amount, cur)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(tx)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
              <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'expense', category_id: '' })}
              className={`py-2 rounded-xl text-sm font-medium transition-colors ${form.type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'income', category_id: '' })}
              className={`py-2 rounded-xl text-sm font-medium transition-colors ${form.type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="label">Amount</label>
            <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>

          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">— No category —</option>
              {catForType.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <input type="text" className="input" placeholder="Optional note"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Transaction"
        message={`Remove "${deleteTarget?.description || 'this transaction'}" of ${formatCurrency(deleteTarget?.amount, cur)}?`}
      />
    </div>
  );
}

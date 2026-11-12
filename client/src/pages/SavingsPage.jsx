import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Target, PiggyBank, CheckCircle } from 'lucide-react';
import { savingsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

const EMPTY_FORM = { name: '', target_amount: '', target_date: '', color: '#10b981' };
const EMPTY_CONTRIB = { amount: '', note: '', date: new Date().toISOString().slice(0, 10) };

export default function SavingsPage() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [contribModal, setContribModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [contrib, setContrib] = useState(EMPTY_CONTRIB);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchGoals = useCallback(async () => {
    try {
      const res = await savingsApi.getAll();
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    savingsApi.getAll()
      .then((res) => { if (active) setGoals(res.data); })
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

  const openEdit = (g) => {
    setEditing(g);
    setForm({ name: g.name, target_amount: g.target_amount, target_date: g.target_date?.slice(0, 10) || '', color: g.color });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) await savingsApi.update(editing.id, form);
      else await savingsApi.create(form);
      setModalOpen(false);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await savingsApi.contribute(contribModal.id, contrib);
      setContribModal(null);
      setContrib(EMPTY_CONTRIB);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add contribution');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await savingsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchGoals();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="No savings goals yet"
            description="Set goals to track progress toward your financial dreams"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((parseFloat(g.current_amount) / parseFloat(g.target_amount)) * 100));
            const completed = g.status === 'completed';
            return (
              <div key={g.id} className={`card space-y-3 ${completed ? 'ring-2 ring-green-400' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: g.color }}>
                      {completed ? <CheckCircle size={18} /> : <PiggyBank size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{g.name}</p>
                      {g.target_date && <p className="text-xs text-gray-400">Target: {formatDate(g.target_date)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(g)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{formatCurrency(g.current_amount, cur)}</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: g.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {formatCurrency(parseFloat(g.target_amount) - parseFloat(g.current_amount), cur)} remaining of {formatCurrency(g.target_amount, cur)}
                  </p>
                </div>

                {!completed && (
                  <button
                    onClick={() => { setContribModal(g); setContrib(EMPTY_CONTRIB); setError(''); }}
                    className="w-full btn-primary py-1.5 text-sm"
                  >
                    Add Contribution
                  </button>
                )}
                {completed && (
                  <div className="text-center text-sm font-medium text-green-600 py-1">
                    🎉 Goal Achieved!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Goal' : 'New Savings Goal'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="label">Goal Name</label>
            <input type="text" className="input" placeholder="e.g. Emergency Fund"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Target Amount</label>
            <input type="number" step="0.01" min="1" className="input" placeholder="0.00"
              value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Target Date (optional)</label>
            <input type="date" className="input" value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" className="h-9 w-16 rounded-lg border border-gray-200 cursor-pointer"
                value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <span className="text-sm text-gray-500">{form.color}</span>
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

      {/* Contribution Modal */}
      <Modal isOpen={!!contribModal} onClose={() => setContribModal(null)} title={`Contribute to "${contribModal?.name}"`} size="sm">
        <form onSubmit={handleContribute} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="label">Amount</label>
            <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
              value={contrib.amount} onChange={(e) => setContrib({ ...contrib, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input type="text" className="input" placeholder="e.g. Monthly saving"
              value={contrib.note} onChange={(e) => setContrib({ ...contrib, note: e.target.value })} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={contrib.date}
              onChange={(e) => setContrib({ ...contrib, date: e.target.value })} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setContribModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding…' : 'Add Contribution'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Savings Goal"
        message={`Permanently delete "${deleteTarget?.name}"? All contributions will be removed.`}
      />
    </div>
  );
}

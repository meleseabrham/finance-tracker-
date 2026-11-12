import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Tag, Coins } from 'lucide-react';
import { categoriesApi, currenciesApi } from '../services/api';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';

const EMPTY_CATEGORY_FORM = { name: '', type: 'expense', color: '#6366f1', icon: 'tag' };
const EMPTY_CURRENCY_FORM = { code: '', name: '', symbol: '', color: '#6366f1' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [currencyForm, setCurrencyForm] = useState(EMPTY_CURRENCY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isCurrencyTab = tab === 'currency';

  const fetchData = useCallback(async () => {
    try {
      const [catRes, curRes] = await Promise.all([
        categoriesApi.getAll(),
        currenciesApi.getAll(),
      ]);
      setCategories(catRes.data);
      setCurrencies(curRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([categoriesApi.getAll(), currenciesApi.getAll()])
      .then(([catRes, curRes]) => {
        if (!active) return;
        setCategories(catRes.data);
        setCurrencies(curRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setError('');
    if (isCurrencyTab) {
      setCurrencyForm(EMPTY_CURRENCY_FORM);
    } else {
      setCategoryForm({ ...EMPTY_CATEGORY_FORM, type: tab });
    }
    setModalOpen(true);
  };

  const openEditCategory = (c) => {
    setEditing(c);
    setCategoryForm({ name: c.name, type: c.type, color: c.color, icon: c.icon });
    setError('');
    setModalOpen(true);
  };

  const openEditCurrency = (c) => {
    setEditing(c);
    setCurrencyForm({
      code: c.code,
      name: c.name,
      symbol: c.symbol || '',
      color: c.color || '#6366f1',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isCurrencyTab) {
        if (editing) await currenciesApi.update(editing.id, currencyForm);
        else await currenciesApi.create(currencyForm);
      } else {
        if (editing) await categoriesApi.update(editing.id, categoryForm);
        else await categoriesApi.create(categoryForm);
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
      if (isCurrencyTab) await currenciesApi.delete(deleteTarget.id);
      else await categoriesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {isCurrencyTab ? 'New Currency' : 'New Category'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 p-1 bg-gray-100 rounded-xl w-full sm:w-fit">
        {['expense', 'income', 'currency'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 sm:flex-initial px-3 sm:px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isCurrencyTab ? (
        currencies.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Coins}
              title="No currencies"
              description="Add currencies to manage your preferred options"
              action={<button onClick={openCreate} className="btn-primary">Create Currency</button>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {currencies.map((cur) => (
              <div key={cur.id} className="card flex items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: cur.color || '#6366f1' }}
                  >
                    {cur.symbol || cur.code}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-800 block truncate">
                      {cur.code} — {cur.name}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditCurrency(cur)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cur)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredCategories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Tag}
            title={`No ${tab} categories`}
            description="Create categories to organize your transactions"
            action={<button onClick={openCreate} className="btn-primary">Create Category</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="card flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.name[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800 truncate">{cat.name}</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openEditCategory(cat)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isCurrencyTab ? (editing ? 'Edit Currency' : 'New Currency') : (editing ? 'Edit Category' : 'New Category')}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          {isCurrencyTab ? (
            <>
              <div>
                <label className="label">Code</label>
                <input
                  type="text"
                  className="input uppercase"
                  placeholder="e.g. USD"
                  maxLength={10}
                  value={currencyForm.code}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. US Dollar"
                  value={currencyForm.name}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Symbol</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. $"
                  maxLength={10}
                  value={currencyForm.symbol}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-9 w-16 rounded-lg border border-gray-200 cursor-pointer"
                    value={currencyForm.color}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, color: e.target.value })}
                  />
                  <span className="text-sm text-gray-500">{currencyForm.color}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Groceries"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={categoryForm.type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-9 w-16 rounded-lg border border-gray-200 cursor-pointer"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  />
                  <span className="text-sm text-gray-500">{categoryForm.color}</span>
                </div>
              </div>
            </>
          )}

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
        title={isCurrencyTab ? 'Delete Currency' : 'Delete Category'}
        message={
          isCurrencyTab
            ? `Delete "${deleteTarget?.code} — ${deleteTarget?.name}"?`
            : `Delete "${deleteTarget?.name}"? Transactions with this category will become uncategorized.`
        }
      />
    </div>
  );
}

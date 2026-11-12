import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, currenciesApi } from '../services/api';
import { User, Globe, Check } from 'lucide-react';

const FALLBACK_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', currency: user?.currency || 'USD' });
  const [currencies, setCurrencies] = useState(FALLBACK_CURRENCIES);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fallbackDate] = useState(() => new Date());

  useEffect(() => {
    currenciesApi.getAll()
      .then((res) => {
        if (res.data?.length > 0) setCurrencies(res.data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await authApi.updateProfile(form);
      updateUser(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <Check size={14} /> Profile updated successfully
            </div>
          )}

          <div>
            <label className="label flex items-center gap-1.5">
              <User size={14} /> Display Name
            </label>
            <input type="text" className="input"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Globe size={14} /> Currency
            </label>
            <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={saving} className="bg-black w-full py-2.5 text-white rounded-lg ">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Account Info</h2>
        <p className="text-xs text-gray-400">Member since {new Date(user?.created_at || fallbackDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  );
}

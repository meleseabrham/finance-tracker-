import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import { reportsApi, transactionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import { formatCurrency, formatDate, MONTH_NAMES } from '../utils/formatters';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const year = new Date().getFullYear();
        const [s, m, bc, tx] = await Promise.all([
          reportsApi.getSummary(),
          reportsApi.getMonthly({ year }),
          reportsApi.getByCategory({ type: 'expense' }),
          transactionsApi.getAll({ limit: 5 }),
        ]);
        setSummary(s.data);
        setMonthly(m.data.map((d, i) => ({ ...d, name: MONTH_NAMES[i] })));
        setByCategory(bc.data.slice(0, 6).map((d) => ({ ...d, total: Number(d.total || 0) })));
        setRecentTx(tx.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cur = user?.currency || 'USD';

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your financial overview</p>
        </div>
        <Link to="/transactions" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Transaction
        </Link>
      </div> */}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(summary?.total_income, cur)}
          icon={ArrowUpCircle}
          color="green"
          subtitle="All time"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.total_expenses, cur)}
          icon={ArrowDownCircle}
          color="red"
          subtitle="All time"
        />
        <StatCard
          title="Net Savings"
          value={formatCurrency(summary?.net_savings, cur)}
          icon={Wallet}
          color={summary?.net_savings >= 0 ? 'indigo' : 'red'}
          subtitle="Income − Expenses"
        />
        <StatCard
          title="Transactions"
          value={summary?.transaction_count ?? 0}
          icon={TrendingUp}
          color="amber"
          subtitle="Total records"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Overview</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v, cur)} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#income)" name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenses)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by category */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Expenses by Category</h2>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={78}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  stroke="none"
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const pct = Math.round(percent * 100);
                    if (pct < 3) return null;
                    if (percent >= 0.995) {
                      return (
                        <text x={cx} y={cy} fill="#fff" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
                          100%
                        </text>
                      );
                    }
                    const r = innerRadius + (outerRadius - innerRadius) * 0.6;
                    const x = cx + r * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + r * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
                        {`${pct}%`}
                      </text>
                    );
                  }}
                >
                  {byCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color || `hsl(${i * 40}, 65%, 55%)`} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10} />
                <Tooltip formatter={(v) => formatCurrency(v, cur)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">No expense data yet</p>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
          <Link to="/transactions" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentTx.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: tx.category_color || '#6366f1' }}
                  >
                    {tx.category_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tx.description || tx.category_name || 'Transaction'}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, cur)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

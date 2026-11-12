import { useEffect, useState, useRef } from 'react';
import { reportsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, MONTH_NAMES } from '../utils/formatters';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  parseISO,
} from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Activity, ChevronDown } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import DateRangePicker from '../components/ui/DateRangePicker';

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Today (Day)' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
  { value: 'all', label: 'All Time' },
];

const RADIAN = Math.PI / 180;

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const pct = Math.round(percent * 100);
  if (pct < 3) return null;

  if (percent >= 0.995) {
    return (
      <text
        x={cx}
        y={cy}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-semibold pointer-events-none"
      >
        100%
      </text>
    );
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold pointer-events-none"
    >
      {`${pct}%`}
    </text>
  );
};

function CategoryBreakdownCard({ title, data, currency, emptyText, hueOffset = 0 }) {
  const grandTotal = data.reduce((sum, item) => sum + Number(item.total || 0), 0);

  return (
    <div className="card">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {data.length > 0 && grandTotal > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="48%"
                outerRadius={92}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                stroke="none"
                labelLine={false}
                label={renderPieLabel}
              >
                {data.map((e, i) => (
                  <Cell key={i} fill={e.color || `hsl(${i * 45 + hueOffset}, 65%, 55%)`} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => {
                  const pct = grandTotal > 0 ? Math.round((Number(v) / grandTotal) * 100) : 0;
                  return `${formatCurrency(v, currency)} (${pct}%)`;
                }}
              />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {data.map((cat, i) => {
              const pct = grandTotal > 0 ? Math.round((cat.total / grandTotal) * 100) : 0;
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color || `hsl(${i * 45 + hueOffset}, 65%, 55%)` }}
                    />
                    <span className="text-gray-600 truncate">{cat.name || 'Uncategorized'}</span>
                  </div>
                  <span className="font-medium text-gray-800 flex-shrink-0">
                    {formatCurrency(cat.total, currency)}{' '}
                    <span className="text-xs text-gray-400">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 text-center py-16">{emptyText}</p>
      )}
    </div>
  );
}

function FilterSelect({ value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`input flex items-center justify-between gap-2 text-left bg-white ${
          open ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
        }`}
      >
        <span className="truncate text-sm text-gray-800">{selected?.label ?? value}</span>
        <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 z-50 w-full min-w-[160px] bg-white rounded-xl shadow-lg border border-gray-100 p-1.5">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((y) => ({
    value: y,
    label: String(y),
  }));

  const [period, setPeriod] = useState('year');
  const [year, setYear] = useState(currentYear);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [byExpense, setByExpense] = useState([]);
  const [byIncome, setByIncome] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'day': {
        const d = format(now, 'yyyy-MM-dd');
        return { startDate: d, endDate: d, label: format(now, 'MMM d, yyyy') };
      }
      case 'week': {
        const s = format(startOfWeek(now), 'yyyy-MM-dd');
        const e = format(endOfWeek(now), 'yyyy-MM-dd');
        return { startDate: s, endDate: e, label: 'This Week' };
      }
      case 'month': {
        const s = format(startOfMonth(now), 'yyyy-MM-dd');
        const e = format(endOfMonth(now), 'yyyy-MM-dd');
        return { startDate: s, endDate: e, label: format(now, 'MMMM yyyy') };
      }
      case 'year':
        return { startDate: `${year}-01-01`, endDate: `${year}-12-31`, label: String(year) };
      case 'custom': {
        const { start, end } = customRange;
        const label =
          start && end
            ? `${format(parseISO(start), 'MMM d, yyyy')} – ${format(parseISO(end), 'MMM d, yyyy')}`
            : 'Custom Range';
        return { startDate: start, endDate: end, label };
      }
      case 'all':
      default:
        return { startDate: '', endDate: '', label: 'All Time' };
    }
  };

  const { startDate, endDate, label: periodLabel } = getDateRange();

  useEffect(() => {
    if (period === 'custom' && (!startDate || !endDate)) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const dateParams = {};
        if (startDate) dateParams.start_date = startDate;
        if (endDate) dateParams.end_date = endDate;

        const useDailySeries =
          period === 'day' ||
          period === 'week' ||
          period === 'month' ||
          (period === 'custom' &&
            startDate &&
            endDate &&
            differenceInDays(parseISO(endDate), parseISO(startDate)) <= 62);

        const seriesPromise =
          period === 'year'
            ? reportsApi.getMonthly({ year })
            : useDailySeries
              ? reportsApi.getDaily(dateParams)
              : reportsApi.getMonthly(period === 'all' ? { all: 'true' } : dateParams);

        const [s, ser, exp, inc] = await Promise.all([
          reportsApi.getSummary(dateParams),
          seriesPromise,
          reportsApi.getByCategory({ type: 'expense', ...dateParams }),
          reportsApi.getByCategory({ type: 'income', ...dateParams }),
        ]);

        setSummary(s.data);

        if (period === 'year') {
          setSeries(ser.data.map((d, i) => ({ ...d, name: MONTH_NAMES[i] })));
        } else if (useDailySeries) {
          setSeries(
            ser.data.map((d) => ({
              ...d,
              name: format(parseISO(d.date), 'MMM d'),
            }))
          );
        } else {
          setSeries(
            ser.data.map((d) => ({
              ...d,
              name: format(parseISO(`${d.period}-01`), 'MMM yyyy'),
            }))
          );
        }

        setByExpense(exp.data.slice(0, 8).map((d) => ({ ...d, total: Number(d.total || 0) })));
        setByIncome(inc.data.slice(0, 8).map((d) => ({ ...d, total: Number(d.total || 0) })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period, year, startDate, endDate]);

  const savingsRate = summary?.total_income > 0
    ? Math.round((summary.net_savings / summary.total_income) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <FilterSelect
            value={period}
            options={PERIOD_OPTIONS}
            onChange={(val) => setPeriod(val)}
            className="w-full sm:w-44"
          />

          {period === 'year' && (
            <FilterSelect
              value={year}
              options={yearOptions}
              onChange={(val) => setYear(Number(val))}
              className="w-full sm:w-28"
            />
          )}

          {period === 'custom' && (
            <DateRangePicker
              startDate={customRange.start}
              endDate={customRange.end}
              onChange={(start, end) => setCustomRange({ start, end })}
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Income" value={formatCurrency(summary?.total_income, cur)} icon={TrendingUp} color="green" />
            <StatCard title="Total Expenses" value={formatCurrency(summary?.total_expenses, cur)} icon={TrendingDown} color="red" />
            <StatCard title="Net Savings" value={formatCurrency(summary?.net_savings, cur)} icon={Wallet} color={summary?.net_savings >= 0 ? 'indigo' : 'red'} />
            <StatCard title="Savings Rate" value={`${savingsRate}%`} icon={Activity} color="amber" subtitle="Of total income" />
          </div>

          {/* Income vs Expenses bar chart */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Income vs Expenses — {periodLabel}
            </h2>
            {series.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={series} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCurrency(v, cur)} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f87171" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-16">No transactions for {periodLabel}</p>
            )}
          </div>

          {/* Net savings line chart */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Net Savings Trend — {periodLabel}
            </h2>
            {series.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={series.map((m) => ({ ...m, net: m.income - m.expenses }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCurrency(v, cur)} />
                  <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} name="Net Savings" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-16">No trend data for {periodLabel}</p>
            )}
          </div>

          {/* By-category pies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdownCard
              title="Expenses by Category"
              data={byExpense}
              currency={cur}
              emptyText={`No expense data for ${periodLabel}`}
              hueOffset={0}
            />
            <CategoryBreakdownCard
              title="Income by Category"
              data={byIncome}
              currency={cur}
              emptyText={`No income data for ${periodLabel}`}
              hueOffset={120}
            />
          </div>
        </>
      )}
    </div>
  );
}

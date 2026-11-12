import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500', text: 'text-indigo-600' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-500',  text: 'text-green-600' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-500',    text: 'text-red-600' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500',  text: 'text-amber-600' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
            <Icon size={20} className={c.icon} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

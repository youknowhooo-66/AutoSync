import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, ShoppingBag, Percent } from 'lucide-react';

interface KPIStatsProps {
  label: string;
  value: string;
  trend?: number;
  icon: 'revenue' | 'profit' | 'orders' | 'margin';
}

const icons = {
  revenue: <DollarSign className="text-emerald-600" />,
  profit: <TrendingUp className="text-indigo-600" />,
  orders: <ShoppingBag className="text-amber-600" />,
  margin: <Percent className="text-purple-600" />,
};

const bgColors = {
  revenue: 'bg-emerald-50',
  profit: 'bg-indigo-50',
  orders: 'bg-amber-50',
  margin: 'bg-purple-50',
};

export function KPIStats({ label, value, trend, icon }: KPIStatsProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColors[icon]}`}>
          {icons[icon]}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 font-medium text-sm">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
    </div>
  );
}

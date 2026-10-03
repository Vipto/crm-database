import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DashboardMetrics } from '../../types';

interface AnalyticsChartsProps {
  metrics: DashboardMetrics;
}

const CATEGORY_COLORS = [
  '#6366f1',
  '#10b981',
  '#06b6d4',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* Top Row: Acquisition over time & Onboarding Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acquisition Velocity */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Seller Acquisition Velocity</h3>
              <p className="text-xs text-slate-400">Total new leads vs onboarded sellers over time</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-vipto-500/10 text-vipto-300 border border-vipto-500/20 font-medium">
              Monthly Trend
            </span>
          </div>

          <div className="h-64 w-full">
            {metrics.acquisitionOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.acquisitionOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOnboarded" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Sellers Added"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                  <Area
                    type="monotone"
                    dataKey="onboarded"
                    name="Onboarded"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOnboarded)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No historical acquisition data yet
              </div>
            )}
          </div>
        </div>

        {/* Onboarding Conversion Funnel */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Onboarding Conversion Funnel</h3>
            <p className="text-xs text-slate-400 mb-4">Stage drop-off across seller pipeline</p>
          </div>

          <div className="space-y-3.5 my-auto">
            {metrics.onboardingFunnel.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{step.stage}</span>
                  <span className="text-slate-400">
                    <strong className="text-white">{step.count}</strong> ({step.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? 'bg-blue-500'
                        : idx === 1
                        ? 'bg-cyan-500'
                        : idx === 2
                        ? 'bg-indigo-500'
                        : idx === 3
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(step.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Overall Conversion:</span>
            <span className="font-semibold text-emerald-400">
              {metrics.totalSellers > 0
                ? `${Math.round((metrics.onboardedSellers / metrics.totalSellers) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Cities & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sellers by City */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Seller Clusters by City</h3>
              <p className="text-xs text-slate-400">Geographic footprint of registered sellers</p>
            </div>
          </div>

          <div className="h-60 w-full">
            {metrics.sellersByCity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.sellersByCity} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="city" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Sellers" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No city records available
              </div>
            )}
          </div>
        </div>

        {/* Sellers by Category */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Sellers by Category</h3>
              <p className="text-xs text-slate-400">Product category & vertical diversification</p>
            </div>
          </div>

          <div className="h-60 w-full flex items-center">
            {metrics.sellersByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.sellersByCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {metrics.sellersByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
                No categories available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Employee Workload & Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Workload */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Employee Workload & Output</h3>
              <p className="text-xs text-slate-400">Assigned accounts vs completed onboardings</p>
            </div>
          </div>

          <div className="h-56 w-full">
            {metrics.sellersByEmployee.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.sellersByEmployee} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="count" name="Assigned Sellers" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Onboarded" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No employee assignments yet
              </div>
            )}
          </div>
        </div>

        {/* Weekly Seller Additions */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Weekly Seller Additions by Day</h3>
              <p className="text-xs text-slate-400">Research & acquisition rhythm across the week</p>
            </div>
          </div>

          <div className="h-56 w-full">
            {metrics.weeklyAdditions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.weeklyAdditions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Sellers Added" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No weekly rhythm data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

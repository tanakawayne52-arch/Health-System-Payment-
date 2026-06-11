import React from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'teal';
  prefix?: string;
  suffix?: string;
}

interface RealTimeStatsWidgetProps {
  stats: StatCard[];
  loading?: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
}

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    text: 'text-amber-600',
    border: 'border-amber-200',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'bg-teal-100 text-teal-600',
    text: 'text-teal-600',
    border: 'border-teal-200',
  },
};

export const RealTimeStatsWidget: React.FC<RealTimeStatsWidgetProps> = ({
  stats,
  loading = false,
  lastUpdated,
  onRefresh,
}) => {
  const formatValue = (value: string | number, prefix?: string, suffix?: string) => {
    const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
    return `${prefix || ''}${formattedValue}${suffix || ''}`;
  };

  const renderChange = (change?: number, changeLabel?: string) => {
    if (change === undefined) return null;

    const isPositive = change > 0;
    const isNeutral = change === 0;

    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${
        isNeutral ? 'text-slate-500' : isPositive ? 'text-emerald-600' : 'text-red-600'
      }`}>
        {isNeutral ? (
          <Minus className="w-3 h-3" />
        ) : isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{isPositive ? '+' : ''}{change}%</span>
        {changeLabel && <span className="text-slate-400">{changeLabel}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-slate-600">Live Statistics</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {lastUpdated && (
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const colors = colorClasses[stat.color];
          return (
            <div
              key={index}
              className={`relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} p-5 transition-all hover:shadow-md`}
            >
              {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatValue(stat.value, stat.prefix, stat.suffix)}
                  </p>
                  {renderChange(stat.change, stat.changeLabel)}
                </div>
                <div className={`p-3 rounded-xl ${colors.icon}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RealTimeStatsWidget;

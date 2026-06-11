import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: { value: string; positive: boolean };
  delay?: number;
}

export default function StatCard({ label, value, icon: Icon, change, delay = 0 }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow duration-200 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">{label}</span>
        <Icon className="w-5 h-5 text-[#0d9488]" />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[32px] font-bold text-[#1e293b] leading-tight">{value}</span>
        {change && (
          <span className={`text-xs font-medium mb-1.5 ${change.positive ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
            {change.positive ? '+' : ''}{change.value}
          </span>
        )}
      </div>
    </div>
  );
}

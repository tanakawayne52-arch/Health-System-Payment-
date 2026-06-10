import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PieChartComponentProps {
  data: { name: string; value: number; color: string }[];
  totalLabel?: string;
  height?: number | string;
  showLegend?: boolean;
  innerRadius?: string | number;
  outerRadius?: string | number;
  paddingAngle?: number;
  showLabel?: boolean;
  showTooltip?: boolean;
  labelFormatter?: (name: string, percent: number) => string;
  tooltipFormatter?: (value: number) => string;
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({ 
  data, 
  totalLabel = 'Total', 
  height = '100%',
  showLegend = false,
  innerRadius = '70%',
  outerRadius = '90%',
  paddingAngle = 5,
  showLabel = false,
  showTooltip = true,
  labelFormatter,
  tooltipFormatter,
}) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  
  // Split data for two-column legend
  const half = Math.ceil(data.length / 2);
  const leftLegend = data.slice(0, half);
  const rightLegend = data.slice(half);

  return (
    <div className="flex flex-col items-center w-full" style={{ height }}>
      {/* Chart with Total in Middle */}
      <div className="relative w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={paddingAngle}
              dataKey="value"
              stroke="none"
              label={showLabel ? ({ name, percent }: any) => {
                const formatted = labelFormatter ? labelFormatter(name, Math.round(percent)) : `${name} (${Math.round(percent)}%)`;
                return formatted;
              } : false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                formatter={(value: any) => {
                  const numericValue = Number(value);
                  return tooltipFormatter ? tooltipFormatter(numericValue) : numericValue.toLocaleString();
                }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  padding: '8px 12px',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        
        {/* Central Label */}
        {innerRadius !== 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              {totalLabel}
            </span>
            <span className="text-xl font-black text-slate-900 leading-none">
              {total.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Two-Column Legend */}
      {showLegend && (
        <div className="w-full mt-6 grid grid-cols-2 gap-x-8 gap-y-2">
          {/* Left Column Items */}
          <div className="flex flex-col gap-2">
            {leftLegend.map((item, i) => (
              <div key={i} className="flex items-center gap-2 group/item cursor-default">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-700 truncate leading-tight group-hover/item:text-slate-900 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 leading-none">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column Items */}
          <div className="flex flex-col gap-2">
            {rightLegend.map((item, i) => (
              <div key={i} className="flex items-center gap-2 group/item cursor-default">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-700 truncate leading-tight group-hover/item:text-slate-900 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 leading-none">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChartComponent;

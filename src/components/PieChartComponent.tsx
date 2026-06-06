import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const DEFAULT_COLORS = [
  '#0d9488',
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#a4de6c',
  '#d084d0',
  '#76d6da',
];

interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartComponentProps {
  data: ChartDataPoint[];
  title?: string;
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
  showLabel?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  legendPosition?: 'top' | 'right' | 'bottom' | 'left';
  colors?: string[];
  labelFormatter?: (name: string, percent: number) => string;
  tooltipFormatter?: (value: number, name: string) => React.ReactNode;
  responsive?: boolean;
  paddingAngle?: number;
  startAngle?: number;
  endAngle?: number;
  className?: string;
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  title,
  innerRadius,
  outerRadius = 100,
  height = 350,
  showLabel = true,
  showLegend = true,
  showTooltip = true,
  legendPosition = 'bottom',
  colors = DEFAULT_COLORS,
  tooltipFormatter = (value) => value.toLocaleString(),
  startAngle = 90,
  endAngle = -270,
  className = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-slate-500 text-sm">No data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const labels = data.map(d => d.name);
  const values = data.map(d => d.value);
  const backgroundColors = data.map((d, i) => d.color || colors[i % colors.length]);

  const chartType = innerRadius ? 'doughnut' : 'pie';
  const ChartComponent = chartType === 'doughnut' ? Doughnut : Pie;

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        cutout: innerRadius ? `${(innerRadius / outerRadius) * 100}%` : undefined,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    rotation: startAngle,
    circumference: endAngle - startAngle,
    layout: {
      padding: 12,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const percent = total > 0 ? ((value / total) * 100) : 0;
                return {
                  text: `${label}: ${value} (${Math.round(percent)}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: !chart.getDataVisibility(i),
                  index: i,
                  pointStyle: 'circle',
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        enabled: showTooltip,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${tooltipFormatter(value, label)} (${percent}%)`;
          },
        },
      },
      datalabels: {
        color: '#fff',
        formatter: (value: number, ctx: any) => {
          if (!showLabel) return '';
          const totalVal = ctx.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          const pct = Math.round((value / totalVal) * 100);
          return pct < 5 ? '' : `${pct}%`;
        },
        anchor: 'center' as const,
        align: 'center' as const,
        clamp: true,
        clip: true,
        font: {
          weight: 'bold' as const,
          size: 13,
        },
      },
    },
  };

  return (
    <div className={`w-full ${className}`}>
      {title && <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>}

      <div style={{ height: `${height}px` }}>
        <ChartComponent data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default PieChartComponent;

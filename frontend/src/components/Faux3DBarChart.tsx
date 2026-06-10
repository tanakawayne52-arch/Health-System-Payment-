type Series = { key: string; color: string; name?: string };

function shade(hex: string, percent: number) {
  const f = parseInt(hex.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = Math.abs(percent) / 100,
    R = f >> 16,
    G = (f >> 8) & 0x00FF,
    B = f & 0x0000FF;
  const newR = Math.round((t - R) * p) + R;
  const newG = Math.round((t - G) * p) + G;
  const newB = Math.round((t - B) * p) + B;
  return `#${(newR << 16 | newG << 8 | newB).toString(16).padStart(6, '0')}`;
}

export default function Faux3DBarChart({
  data,
  categoriesKey = 'name',
  series = [{ key: 'value', color: '#0d9488' }],
  height = 300,
}: {
  data: any[];
  categoriesKey?: string;
  series?: Series[];
  height?: number;
}) {
  const padding = { left: 40, right: 24, top: 24, bottom: 40 };
  const width = 900; // svg viewBox width; container should control layout via CSS

  const maxVal = Math.max(1, ...data.flatMap(d => series.map(s => Number(d[s.key] || 0))));
  const categories = data.map(d => d[categoriesKey]);

  const groupWidth = (width - padding.left - padding.right) / Math.max(1, categories.length);
  const barGroupInner = Math.min(48, groupWidth * 0.7);

  return (
    <div style={{ width: '100%', height }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        {/* Y axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padding.top + (1 - t) * (height - padding.top - padding.bottom);
          return <line key={i} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />;
        })}

        {/* Bars */}
        {data.map((d, idx) => {
          const gx = padding.left + idx * groupWidth + groupWidth / 2 - barGroupInner / 2;
          return series.map((s, sIndex) => {
            const val = Number(d[s.key] || 0);
            const h = (val / maxVal) * (height - padding.top - padding.bottom);
            const barWidth = barGroupInner / series.length * 0.9;
            const offset = sIndex * (barWidth + 4);
            const x = gx + offset;
            const y = padding.top + (height - padding.top - padding.bottom) - h;
            const depth = Math.max(6, Math.min(14, barWidth * 0.35));

            const front = `M ${x} ${y} h ${barWidth} v ${h} h ${-barWidth} Z`;
            const top = `M ${x} ${y} l ${depth} ${-depth} h ${barWidth} l ${-depth} ${depth} Z`;
            const side = `M ${x + barWidth} ${y} l ${depth} ${-depth} v ${h} l ${-depth} ${depth} Z`;

            const fill = s.color;
            const topFill = shade(fill, 18);
            const sideFill = shade(fill, -12);

            return (
              <g key={`${idx}-${s.key}`}>
                <path d={top} fill={topFill} />
                <path d={side} fill={sideFill} />
                <path d={front} fill={fill} />
              </g>
            );
          });
        })}

        {/* X labels */}
        {data.map((d, idx) => {
          const gx = padding.left + idx * groupWidth + groupWidth / 2;
          const y = height - 10;
          return (
            <text key={idx} x={gx} y={y} fontSize={11} fill="#475569" textAnchor="middle">{String(d[categoriesKey])}</text>
          );
        })}
      </svg>
    </div>
  );
}

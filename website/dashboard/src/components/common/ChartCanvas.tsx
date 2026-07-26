import React from 'react';
import { TimeSeriesPoint } from '../../types/analytics';

interface ChartCanvasProps {
  data: TimeSeriesPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
  height?: number;
  unit?: string;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  data,
  color = 'var(--aura-primary)',
  type = 'area',
  height = 180,
  unit = ''
}) => {
  if (!data || data.length === 0) return null;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1 || 1;

  const width = 600;
  const padding = 20;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * plotWidth;
    const y = height - padding - ((d.value - minVal) / (maxVal - minVal)) * plotHeight;
    return { x, y, label: d.timestamp, value: d.value };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`grad_${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = padding + ratio * plotHeight;
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="var(--aura-border)"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Area fill */}
        {type === 'area' && (
          <path d={areaD} fill={`url(#grad_${color.replace(/[^a-zA-Z0-9]/g, '')})`} />
        )}

        {/* Line */}
        {type !== 'bar' && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Bars */}
        {type === 'bar' &&
          points.map((p, i) => {
            const barW = (plotWidth / data.length) * 0.5;
            const barH = height - padding - p.y;
            return (
              <rect
                key={i}
                x={p.x - barW / 2}
                y={p.y}
                width={barW}
                height={barH}
                fill={color}
                rx="4"
              />
            );
          })}

        {/* Data Points */}
        {points.map((p, i) => (
          <g key={i} className="chart-point-group">
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="var(--aura-bg-surface)"
              stroke={color}
              strokeWidth="2"
            />
            {/* Label below */}
            <text
              x={p.x}
              y={height - 2}
              textAnchor="middle"
              fill="var(--aura-text-muted)"
              fontSize="10"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

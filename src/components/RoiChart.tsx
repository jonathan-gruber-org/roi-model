import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RoiMonthlyPoint } from '../types/roi';
import { formatCurrency0 } from '../utils/format';

export function RoiChart({ data }: { data: RoiMonthlyPoint[] }) {
  return (
    <div className="card">
      <div className="card__title">Cumulative ROI (36 months)</div>
      <div className="chartWrap">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(226,232,240,0.85)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148,163,184,0.35)' }}
              tickLine={{ stroke: 'rgba(148,163,184,0.35)' }}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency0(Number(v))}
              tick={{ fill: 'rgba(226,232,240,0.85)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148,163,184,0.35)' }}
              tickLine={{ stroke: 'rgba(148,163,184,0.35)' }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(148,163,184,0.35)',
                borderRadius: 10,
                color: 'rgba(226,232,240,0.95)',
              }}
              labelFormatter={(label) => `Month ${label}`}
              formatter={(value) => formatCurrency0(Number(value))}
            />
            <Line
              type="monotone"
              dataKey="roi"
              stroke="rgba(59,130,246,0.95)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

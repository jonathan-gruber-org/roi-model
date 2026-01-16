import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  ReferenceLine,
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
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(148, 163, 184, 0.35)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(11, 16, 32, 0.72)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.55)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.55)' }}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency0(Number(v))}
              tick={{ fill: 'rgba(11, 16, 32, 0.72)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.55)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.55)' }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid rgba(148, 163, 184, 0.45)',
                borderRadius: 10,
                color: 'rgba(11, 16, 32, 0.92)',
              }}
              labelFormatter={(label) => `Month ${label}`}
              formatter={(value) => formatCurrency0(Number(value))}
            />
            <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.7)" strokeDasharray="3 4" />
            <Line
              type="monotone"
              dataKey="roi"
              stroke="rgba(0, 201, 228, 0.95)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

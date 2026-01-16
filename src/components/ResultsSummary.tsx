import type { RoiResult } from '../types/roi';
import { formatCurrency0, formatHours } from '../utils/format';

export function ResultsSummary({ result }: { result: RoiResult }) {
  const { totals, breakdown, monthly } = result;
  const roi36 = monthly.length ? monthly[monthly.length - 1].roi : NaN;
  const breakevenMonth = monthly.find((p) => Number.isFinite(p.roi) && p.roi >= 0)?.month;
  const breakevenLabel = Number.isFinite(breakevenMonth) ? `Month ${breakevenMonth}` : '—';

  return (
    <div className="card">
      <div className="card__title">Results</div>
      <div className="kpiGrid kpiGrid--3">
        <div className="kpi">
          <div className="kpi__label">Annual $ saved</div>
          <div className="kpi__value">{formatCurrency0(totals.dollarsSaved)}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Annual hours saved</div>
          <div className="kpi__value">{formatHours(totals.hoursSaved)}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Breakeven</div>
          <div className="kpi__value">{breakevenLabel}</div>
          <div className="kpi__sub">Cumulative ROI crosses $0</div>
        </div>
        <div className="kpi kpi--wide">
          <div className="kpi__label">Cumulative ROI at 36 months</div>
          <div className="kpi__value">{formatCurrency0(roi36)}</div>
        </div>
      </div>

      <div className="divider" />

      <div className="subhead">Breakdown by use case</div>
      <div className="breakdown">
        <BreakdownRow title="From TicketOps to Self Service" hours={breakdown.ticketops.hoursSaved} dollars={breakdown.ticketops.dollarsSaved} totalDollars={totals.dollarsSaved} />
        <BreakdownRow title="Developer onboarding" hours={breakdown.onboarding.hoursSaved} dollars={breakdown.onboarding.dollarsSaved} totalDollars={totals.dollarsSaved} />
        <BreakdownRow title="Developer Efficiency Gains" hours={breakdown.efficiency.hoursSaved} dollars={breakdown.efficiency.dollarsSaved} totalDollars={totals.dollarsSaved} />
        <BreakdownRow title="Manual tasks to Agentic Workflows" hours={breakdown.agentic.hoursSaved} dollars={breakdown.agentic.dollarsSaved} totalDollars={totals.dollarsSaved} />
      </div>
    </div>
  );
}

function BreakdownRow({
  title,
  hours,
  dollars,
  totalDollars,
}: {
  title: string;
  hours: number;
  dollars: number;
  totalDollars: number;
}) {
  const pct = Number.isFinite(dollars) && Number.isFinite(totalDollars) && totalDollars > 0 ? Math.round((dollars / totalDollars) * 100) : null;
  return (
    <div className="breakdownRow">
      <div className="breakdownRow__title">
        <span>{title}</span>
        {pct !== null ? <span className="badge">{pct}%</span> : null}
      </div>
      <div className="breakdownRow__metric">
        <div className="breakdownRow__metricLabel">Hours/yr</div>
        <div className="breakdownRow__metricValue">{formatHours(hours)}</div>
      </div>
      <div className="breakdownRow__metric">
        <div className="breakdownRow__metricLabel">$/yr</div>
        <div className="breakdownRow__metricValue">{formatCurrency0(dollars)}</div>
      </div>
    </div>
  );
}

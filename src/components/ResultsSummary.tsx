import type { RoiResult } from '../types/roi';
import { formatCurrency0, formatHours } from '../utils/format';

export function ResultsSummary({ result }: { result: RoiResult }) {
  const { totals, breakdown } = result;

  return (
    <div className="card">
      <div className="card__title">Results</div>
      <div className="kpiGrid">
        <div className="kpi">
          <div className="kpi__label">Total annual hours saved</div>
          <div className="kpi__value">{formatHours(totals.hoursSaved)}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Total annual $ saved</div>
          <div className="kpi__value">{formatCurrency0(totals.dollarsSaved)}</div>
        </div>
      </div>

      <div className="divider" />

      <div className="subhead">Breakdown by use case</div>
      <div className="breakdown">
        <BreakdownRow title="from ticketops to Self Service" hours={breakdown.ticketops.hoursSaved} dollars={breakdown.ticketops.dollarsSaved} />
        <BreakdownRow title="Developer onboarding" hours={breakdown.onboarding.hoursSaved} dollars={breakdown.onboarding.dollarsSaved} />
        <BreakdownRow title="Developer Efficiency Gains" hours={breakdown.efficiency.hoursSaved} dollars={breakdown.efficiency.dollarsSaved} />
        <BreakdownRow title="Manual tasks to Agentic Workflows" hours={breakdown.agentic.hoursSaved} dollars={breakdown.agentic.dollarsSaved} />
      </div>
    </div>
  );
}

function BreakdownRow({ title, hours, dollars }: { title: string; hours: number; dollars: number }) {
  return (
    <div className="breakdownRow">
      <div className="breakdownRow__title">{title}</div>
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

import React from 'react';
import './App.css';

import { ExcelEngine, validateAssumptions, validateInputs } from './engine/ExcelEngine';
import type { RoiAssumptions, RoiInputs, RoiResult } from './types/roi';
import { clampNumber } from './utils/format';
import { AssumptionsAccordion } from './components/AssumptionsAccordion';
import { Field } from './components/Field';
import { SliderField } from './components/SliderField';
import { ResultsSummary } from './components/ResultsSummary';
import { RoiChart } from './components/RoiChart';

const FALLBACK_DEFAULTS: RoiInputs = {
  developers: 50,
  avgYearlyLoadedCost: 200000,

  ticketsPerDevPerMonth: 4,
  avgHandlingTimeHours: 0.75,
  pctTicketsMigrated: 25,

  devsOnboardedPerYear: 12,
  timeToOnboardWeeks: 2,
  onboardingEfficiencyGainPct: 30,
  seniorEngineerTimePerNewDevHours: 10,

  nonCoreTimePerDevPerMonthHours: 16,
  efficiencyGainPct: 10,

  agenticWorkflowsLive: 5,
  timeSavedPerWorkflowTriggerHours: 0.25,
  workflowTriggersPerDevPerMonth: 8,
};

const FALLBACK_ASSUMPTIONS: RoiAssumptions = {
  licenseCost: 0,
  portFte: 0,
  launchOffset: 0,
  adoptionMonths: 0,
};

export default function App() {
  const [engine, setEngine] = React.useState<ExcelEngine | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [inputs, setInputs] = React.useState<RoiInputs>(FALLBACK_DEFAULTS);
  const [assumptions, setAssumptions] = React.useState<RoiAssumptions>(FALLBACK_ASSUMPTIONS);

  const [result, setResult] = React.useState<RoiResult | null>(null);
  const [calcError, setCalcError] = React.useState<string | null>(null);
  const [calculating, setCalculating] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const e = await ExcelEngine.load('/roi_model.xlsx');
        const init = e.getInitialState();
        if (cancelled) return;
        setEngine(e);
        setInputs(init.inputs);
        setAssumptions(init.assumptions);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCalculate = async () => {
    setCalcError(null);
    setResult(null);

    const errs = [...validateInputs(inputs), ...validateAssumptions(assumptions)];
    if (errs.length) {
      setCalcError(errs.join(' '));
      return;
    }

    if (!engine) {
      setCalcError('Excel engine is not ready yet.');
      return;
    }

    setCalculating(true);
    try {
      // This is synchronous, but we yield a tick to keep the button responsive.
      await new Promise((r) => setTimeout(r, 0));
      const next = engine.calculate(inputs, assumptions);
      setResult(next);
      // Keep assumptions in sync in case workbook normalizes/rounds values.
      setAssumptions(next.assumptions);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : String(err));
    } finally {
      setCalculating(false);
    }
  };

  const set = <K extends keyof RoiInputs>(key: K, value: number, clamp?: { min?: number; max?: number }) => {
    const next = clamp ? clampNumber(value, clamp) : value;
    setInputs((prev) => ({ ...prev, [key]: next }));
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="header__title">Port ROI Calculator</div>
          <div className="header__subtitle">Excel-backed model (client-side) — click Calculate to run the workbook formulas.</div>
        </div>
        <div className="header__actions">
          <button
            className="header__link header__button"
            type="button"
            onClick={() => {
              window.print();
            }}
          >
            Download PDF
          </button>
          <a className="header__link" href="/roi_model.xlsx" target="_blank" rel="noreferrer">
            View workbook
          </a>
        </div>
      </header>

      {loading ? (
        <div className="card">
          <div className="card__title">Loading model…</div>
          <div className="muted">Fetching and initializing the Excel workbook.</div>
        </div>
      ) : loadError ? (
        <div className="card card--error">
          <div className="card__title">Could not load ROI model</div>
          <div className="errorText">{loadError}</div>
          <div className="muted">Ensure the file exists at <code className="code">public/roi_model.xlsx</code>.</div>
        </div>
      ) : null}

      <div className="grid">
        <div className="left">
          <div className="card">
            <div className="card__title">Inputs</div>

            <div className="section">
              <div className="section__title">Company</div>
              <div className="fields">
                <SliderField
                  label="Number of developers"
                  value={inputs.developers}
                  onChange={(v) => set('developers', v, { min: 100, max: 5000 })}
                  min={100}
                  max={5000}
                  step={100}
                />
                <Field
                  label="Average developer loaded cost (yearly)"
                  tooltip="Avg yearly loaded cost"
                  value={inputs.avgYearlyLoadedCost}
                  onChange={(v) => set('avgYearlyLoadedCost', v, { min: 0 })}
                  step={1000}
                  prefix="$"
                />
              </div>
            </div>

            <div className="section">
              <div className="section__title">from ticketops to Self Service</div>
              <div className="fields">
                <SliderField
                  label="Tickets opened per dev per month"
                  value={inputs.ticketsPerDevPerMonth}
                  onChange={(v) => set('ticketsPerDevPerMonth', v, { min: 0, max: 20 })}
                  min={0}
                  max={20}
                  step={1}
                />
                <Field
                  label="Avg handling time per ticket"
                  value={inputs.avgHandlingTimeHours}
                  onChange={(v) => set('avgHandlingTimeHours', v, { min: 0 })}
                  step={0.1}
                  suffix="hrs"
                />
                <Field
                  label="% tickets migrated to self-service"
                  value={inputs.pctTicketsMigrated}
                  onChange={(v) => set('pctTicketsMigrated', v, { min: 0, max: 100 })}
                  step={1}
                  suffix="%"
                />
              </div>
            </div>

            <div className="section">
              <div className="section__title">Developer onboarding</div>
              <div className="fields">
                <Field
                  label="Devs onboarded per year"
                  value={inputs.devsOnboardedPerYear}
                  onChange={(v) => set('devsOnboardedPerYear', v, { min: 0 })}
                  step={1}
                />
                <Field
                  label="Time required to onboard a new developer"
                  value={inputs.timeToOnboardWeeks}
                  onChange={(v) => set('timeToOnboardWeeks', v, { min: 0 })}
                  step={1}
                  suffix="wks"
                />
                <Field
                  label="Developer onboarding efficiency gains"
                  value={inputs.onboardingEfficiencyGainPct}
                  onChange={(v) => set('onboardingEfficiencyGainPct', v, { min: 0, max: 100 })}
                  step={1}
                  suffix="%"
                />
                <Field
                  label="Senior engineer time per new dev"
                  value={inputs.seniorEngineerTimePerNewDevHours}
                  onChange={(v) => set('seniorEngineerTimePerNewDevHours', v, { min: 0 })}
                  step={0.5}
                  suffix="hrs"
                />
              </div>
            </div>

            <div className="section">
              <div className="section__title">
                <span>Developer Efficiency Gains</span>
                <span className="tooltipIcon tooltipIcon--section" title="Central source of truth & lower cognitive load" aria-label="Central source of truth & lower cognitive load">
                  i
                </span>
              </div>
              <div className="fields">
                <Field
                  label="Non-core time per dev per month"
                  value={inputs.nonCoreTimePerDevPerMonthHours}
                  onChange={(v) => set('nonCoreTimePerDevPerMonthHours', v, { min: 0 })}
                  step={1}
                  suffix="hrs"
                />
                <Field
                  label="Efficiency gain with Port"
                  value={inputs.efficiencyGainPct}
                  onChange={(v) => set('efficiencyGainPct', v, { min: 0, max: 100 })}
                  step={1}
                  suffix="%"
                />
              </div>
            </div>

            <div className="section">
              <div className="section__title">Manual tasks to Agentic Workflows</div>
              <div className="fields">
                <Field
                  label="# agentic workflows live"
                  value={inputs.agenticWorkflowsLive}
                  onChange={(v) => set('agenticWorkflowsLive', v, { min: 0 })}
                  step={1}
                />
                <Field
                  label="Time saved per workflow trigger"
                  value={inputs.timeSavedPerWorkflowTriggerHours}
                  onChange={(v) => set('timeSavedPerWorkflowTriggerHours', v, { min: 0 })}
                  step={0.05}
                  suffix="hrs"
                />
                <Field
                  label="Workflow triggers per dev per month"
                  value={inputs.workflowTriggersPerDevPerMonth}
                  onChange={(v) => set('workflowTriggersPerDevPerMonth', v, { min: 0 })}
                  step={1}
                />
              </div>
            </div>

            <div className="actions">
              <button className="btn" onClick={onCalculate} disabled={loading || !!loadError || calculating}>
                {calculating ? 'Calculating…' : 'Calculate ROI'}
              </button>
              {calcError ? <div className="errorText">{calcError}</div> : <div className="muted">No recalculation happens until you click.</div>}
            </div>
          </div>

          <AssumptionsAccordion assumptions={assumptions} onChange={setAssumptions} />
        </div>

        <div className="right">
          {result ? (
            <>
              <ResultsSummary result={result} />
              <RoiChart data={result.monthly} />
            </>
          ) : (
            <div className="card">
              <div className="card__title">Results & chart</div>
              <div className="muted">Enter inputs and click <b>Calculate ROI</b> to run the Excel model.</div>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="muted">Model source: <code className="code">public/roi_model.xlsx</code> (evaluated with HyperFormula in the browser).</div>
      </footer>
    </div>
  );
}

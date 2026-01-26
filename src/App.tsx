import React from 'react';
import './App.css';

import { ExcelEngine, validateAssumptions, validateInputs } from './engine/ExcelEngine';
import type { RoiAssumptions, RoiInputs, RoiResult } from './types/roi';
import { clampNumber } from './utils/format';
import { AssumptionsAccordion } from './components/AssumptionsAccordion';
import { Field } from './components/Field';
import { SliderField } from './components/SliderField';
import { SectionHeader } from './components/SectionHeader';
import { ResultsSummary } from './components/ResultsSummary';
import { RoiChart } from './components/RoiChart';

function Chevron() {
  return (
    <svg className="useCaseSection__chevron" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5.25 7.5L10 12.25L14.75 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
        const e = await ExcelEngine.load('/roi_model_v2.xlsx');
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
      <header className="topbar">
        <div className="topbar__brand">
          <img className="topbar__logo" src="/port.svg" alt="Port" />
          <div>
            <div className="topbar__title">Port ROI Calculator</div>
            <div className="topbar__subtitle">Internal ROI model (client-side Excel evaluation)</div>
          </div>
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
          <a className="header__link" href="/roi_model_v2.xlsx" target="_blank" rel="noreferrer">
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
          <div className="muted">Ensure the file exists at <code className="code">public/roi_model_v2.xlsx</code>.</div>
        </div>
      ) : null}

      <div className="grid">
        <div className="left">
          <div className="card">
            <div className="cardHeader">
              <div className="card__title">Inputs</div>
            </div>

            <div className="section">
              <SectionHeader
                icon="company"
                title="Company"
                description="Baseline inputs to estimate the value of time saved."
              />
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

            <details className="section useCaseSection" open>
              <summary className="useCaseSection__summary">
                <SectionHeader
                  icon="ticketops"
                  title="From TicketOps to Self Service"
                  description="Estimate support load reduction by shifting tickets to self-service."
                  right={<Chevron />}
                />
              </summary>
              <div className="useCaseSection__content">
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
                  label="Average handling time per ticket"
                  value={inputs.avgHandlingTimeHours}
                  onChange={(v) => set('avgHandlingTimeHours', v, { min: 0 })}
                  step={0.1}
                  suffix="hours"
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
            </details>

            <details className="section useCaseSection" open>
              <summary className="useCaseSection__summary">
                <SectionHeader
                  icon="onboarding"
                  title="Developer onboarding"
                  description="Model reduction in time to onboard new developers."
                  right={<Chevron />}
                />
              </summary>
              <div className="useCaseSection__content">
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
                  suffix="weeks"
                />
                <Field
                  label="Accelerated developer onboarding gain"
                  tooltip="Developer onboarding efficiency gains"
                  value={inputs.onboardingEfficiencyGainPct}
                  onChange={(v) => set('onboardingEfficiencyGainPct', v, { min: 0, max: 90 })}
                  step={1}
                  suffix="%"
                />
                <Field
                  label="Senior engineer time per new dev"
                  value={inputs.seniorEngineerTimePerNewDevHours}
                  onChange={(v) => set('seniorEngineerTimePerNewDevHours', v, { min: 0 })}
                  step={0.5}
                  suffix="hours"
                />
                </div>
              </div>
            </details>

            <details className="section useCaseSection" open>
              <summary className="useCaseSection__summary">
                <SectionHeader
                  icon="efficiency"
                  title="Developer Efficiency Gains"
                  description="Central source of truth & lower cognitive load."
                  right={<Chevron />}
                />
              </summary>
              <div className="useCaseSection__content">
                <div className="fields">
                <SliderField
                  label="Non-core time per dev per month"
                  tooltip="dashboards, permissions, requests, investigations, looking for information"
                  value={inputs.nonCoreTimePerDevPerMonthHours}
                  onChange={(v) => set('nonCoreTimePerDevPerMonthHours', v, { min: 0, max: 20 })}
                  min={0}
                  max={20}
                  step={1}
                  suffix="hours"
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
            </details>

            <details className="section useCaseSection" open>
              <summary className="useCaseSection__summary">
                <SectionHeader
                  icon="agentic"
                  title="Manual tasks to Agentic Workflows"
                  description="Model time saved by automating repetitive workflow triggers."
                  right={<Chevron />}
                />
              </summary>
              <div className="useCaseSection__content">
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
                  suffix="hours"
                />
                <Field
                  label="Workflow triggers per dev per month"
                  value={inputs.workflowTriggersPerDevPerMonth}
                  onChange={(v) => set('workflowTriggersPerDevPerMonth', v, { min: 0 })}
                  step={1}
                />
                </div>
              </div>
            </details>

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

    </div>
  );
}

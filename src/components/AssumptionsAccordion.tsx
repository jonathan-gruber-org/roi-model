import type { RoiAssumptions } from '../types/roi';
import { Field } from './Field';

export function AssumptionsAccordion({
  assumptions,
  onChange,
}: {
  assumptions: RoiAssumptions;
  onChange: (next: RoiAssumptions) => void;
}) {
  const set = <K extends keyof RoiAssumptions>(key: K, value: number, clamp?: { min?: number; max?: number }) => {
    let next = value;
    if (clamp?.min !== undefined && Number.isFinite(next)) next = Math.max(clamp.min, next);
    if (clamp?.max !== undefined && Number.isFinite(next)) next = Math.min(clamp.max, next);
    onChange({ ...assumptions, [key]: next });
  };

  return (
    <div className="card">
      <details className="accordion">
        <summary className="accordion__summary">
          <span className="accordion__title">Assumptions</span>
          <span className="accordion__hint">Editable</span>
        </summary>

        <div className="accordion__content">
          <div className="fields">
            <Field
              label="Yearly license cost"
              value={assumptions.licenseCost}
              onChange={(v) => set('licenseCost', v, { min: 0 })}
              step={1000}
              prefix="$"
            />
            <Field
              label="Full Time Engineers dedicated to IDP"
              value={assumptions.portFte}
              onChange={(v) => set('portFte', v, { min: 0 })}
              step={0.5}
            />
            <Field
              label="Launch month offset"
              value={assumptions.launchOffset}
              onChange={(v) => set('launchOffset', v, { min: 0 })}
              step={1}
            />
            <Field
              label="Months to reach 100% adoption"
              value={assumptions.adoptionMonths}
              onChange={(v) => set('adoptionMonths', v, { min: 0 })}
              step={1}
            />
          </div>
        </div>
      </details>
    </div>
  );
}

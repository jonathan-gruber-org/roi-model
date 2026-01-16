import React from 'react';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  prefix?: string;
  hint?: string;
  tooltip?: string;
};

export function Field({ label, value, onChange, min, max, step, suffix, prefix, hint, tooltip }: Props) {
  const id = React.useId();

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        <span>{label}</span>
        {tooltip ? (
          <span className="tooltipIcon" title={tooltip} aria-label={tooltip}>
            i
          </span>
        ) : null}
      </label>
      <div className="field__control">
        {prefix ? <div className="field__affix field__affix--prefix">{prefix}</div> : null}
        <input
          id={id}
          className="field__input"
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step ?? 'any'}
          onChange={(e) => {
            const next = e.target.value === '' ? NaN : Number(e.target.value);
            onChange(next);
          }}
        />
        {suffix ? <div className="field__affix field__affix--suffix">{suffix}</div> : null}
      </div>
      {hint ? <div className="field__hint">{hint}</div> : null}
    </div>
  );
}

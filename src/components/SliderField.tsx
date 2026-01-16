import React from 'react';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  tooltip?: string;
};

export function SliderField({ label, value, onChange, min, max, step, suffix, tooltip }: Props) {
  const id = React.useId();
  const displayValue = Number.isFinite(value) ? value : min;

  return (
    <div className="sliderField">
      <div className="sliderField__top">
        <label className="sliderField__label" htmlFor={id}>
          <span>{label}</span>
          {tooltip ? (
            <span className="tooltipIcon" title={tooltip} aria-label={tooltip}>
              i
            </span>
          ) : null}
        </label>
        <div className="sliderField__value">
          {displayValue}
          {suffix ? <span className="sliderField__suffix">{suffix}</span> : null}
        </div>
      </div>

      <input
        id={id}
        className="sliderField__range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChange(next);
        }}
      />
      <div className="sliderField__minMax">
        <div>
          {min}
          {suffix ? ` ${suffix}` : ''}
        </div>
        <div>
          {max}
          {suffix ? ` ${suffix}` : ''}
        </div>
      </div>
    </div>
  );
}


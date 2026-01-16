import type { ReactNode } from 'react';

type IconName = 'company' | 'ticketops' | 'onboarding' | 'efficiency' | 'agentic';

function Icon({ name }: { name: IconName }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'company':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M4 20V6a2 2 0 0 1 2-2h7v16" />
          <path {...common} d="M13 8h5a2 2 0 0 1 2 2v10" />
          <path {...common} d="M7 8h2" />
          <path {...common} d="M7 12h2" />
          <path {...common} d="M7 16h2" />
          <path {...common} d="M16 12h2" />
          <path {...common} d="M16 16h2" />
        </svg>
      );
    case 'ticketops':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M6 7h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9a2 2 0 0 1 2-2Z" />
          <path {...common} d="M9 12h6" />
        </svg>
      );
    case 'onboarding':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
          <path {...common} d="M5 20a7 7 0 0 1 14 0" />
          <path {...common} d="M18 8h3" />
          <path {...common} d="M19.5 6.5v3" />
        </svg>
      );
    case 'efficiency':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M12 20a8 8 0 1 1 8-8" />
          <path {...common} d="M12 12l5-3" />
          <path {...common} d="M20 12h2" />
        </svg>
      );
    case 'agentic':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M12 3v2" />
          <path {...common} d="M5 7l1.5 1.5" />
          <path {...common} d="M19 7l-1.5 1.5" />
          <path {...common} d="M4 14v-2a6 6 0 0 1 12 0v2" />
          <path {...common} d="M8 14v-1" />
          <path {...common} d="M16 14v-1" />
          <path {...common} d="M7 21h10a3 3 0 0 0 3-3v-2H4v2a3 3 0 0 0 3 3Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function SectionHeader({
  icon,
  title,
  description,
  right,
}: {
  icon: IconName;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="sectionHeader">
      <div className="sectionHeader__left">
        <div className="sectionHeader__icon" aria-hidden="true">
          <Icon name={icon} />
        </div>
        <div className="sectionHeader__text">
          <div className="sectionHeader__title">{title}</div>
          {description ? <div className="sectionHeader__desc">{description}</div> : null}
        </div>
      </div>
      {right ? <div className="sectionHeader__right">{right}</div> : null}
    </div>
  );
}


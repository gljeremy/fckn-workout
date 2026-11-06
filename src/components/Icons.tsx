import type { ReactNode } from 'react';

const Svg = ({ children, size = 20, className }: { children: ReactNode; size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const BackIcon = () => (
  <Svg>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const RestartIcon = () => (
  <Svg>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
  </Svg>
);
export const CheckIcon = ({ size = 14 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const CloseIcon = () => (
  <Svg>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const CopyIcon = () => (
  <Svg size={18}>
    <rect x="8" y="8" width="12" height="12" rx="2.5" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Svg>
);
export const ExternalIcon = () => (
  <Svg size={18}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </Svg>
);
export const GridIcon = () => (
  <Svg size={18}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </Svg>
);

/** The fckn workout mark: a week of bars inside a rounded tile. */
export const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" className="logo-tile" />
    <rect x="6" y="15" width="4" height="11" rx="2" className="logo-bar" />
    <rect x="12" y="9" width="4" height="17" rx="2" className="logo-bar" />
    <circle cx="20" cy="24" r="1.6" className="logo-dot" />
    <rect x="24" y="12" width="4" height="14" rx="2" className="logo-bar" />
  </svg>
);

// ─── Choice illustrations (48×48) ───────────────────────────────────────────

export const Art = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 48 48" className="choice-art" aria-hidden="true">
    {children}
  </svg>
);

/** A clock face with the session length shaded in. */
export function ClockArt({ minutes }: { minutes: number }) {
  const frac = Math.min(minutes, 90) / 90;
  const a = frac * 2 * Math.PI;
  const x = 24 + 15 * Math.sin(a);
  const y = 24 - 15 * Math.cos(a);
  const large = frac > 0.5 ? 1 : 0;
  return (
    <Art>
      <circle cx="24" cy="24" r="15" className="art-track" />
      {frac >= 1 ? (
        <circle cx="24" cy="24" r="15" className="art-fill" />
      ) : (
        <path d={`M24 24 L24 9 A15 15 0 ${large} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`} className="art-fill" />
      )}
    </Art>
  );
}

/** Seven dots with the training days filled. */
export function DaysArt({ slots }: { slots: number[] }) {
  return (
    <Art>
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          x={3 + i * 6.2}
          y={slots.includes(i) ? 14 : 28}
          width={4.4}
          height={slots.includes(i) ? 20 : 6}
          rx={2.2}
          className={slots.includes(i) ? 'art-fill' : 'art-track'}
        />
      ))}
    </Art>
  );
}

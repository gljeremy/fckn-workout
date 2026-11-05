import type { DayKind } from '../model/types';
import { TRAINING_DAYS } from '../model/week';

interface Props {
  days: { kind: DayKind; size?: number }[];
  /** Show weekday letters underneath. */
  letters?: boolean;
  className?: string;
  title?: string;
}

const W = 14;
const GAP = 6;
const LETTERS = 'MTWTFSS';

/**
 * A routine's week as seven columns: a coloured bar for each training day
 * (coloured by day type, height by session size) and a dot for each rest day.
 */
export function WeekGlyph({ days, letters, className, title }: Props) {
  const slots = TRAINING_DAYS[days.length] ?? TRAINING_DAYS[3];
  const h = letters ? 70 : 56;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${7 * W + 6 * GAP} ${h}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {Array.from({ length: 7 }, (_, i) => {
        const x = i * (W + GAP);
        const at = slots.indexOf(i);
        const base = 54;
        if (at === -1) {
          return <circle key={i} cx={x + W / 2} cy={base - 3} r={2.6} className="glyph-rest" />;
        }
        const d = days[at];
        const barH = 18 + Math.round((d.size ?? 0.7) * 34);
        return <rect key={i} x={x} y={base - barH} width={W} height={barH} rx={4} className={`glyph-bar kind-${d.kind}`} />;
      })}
      {letters &&
        Array.from({ length: 7 }, (_, i) => (
          <text key={i} x={i * (W + GAP) + W / 2} y={68} textAnchor="middle" className="glyph-letter">
            {LETTERS[i]}
          </text>
        ))}
    </svg>
  );
}

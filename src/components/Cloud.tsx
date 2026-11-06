import type { CSSProperties } from 'react';
import type { Match, Routine } from '../model/engine';
import { WeekGlyph } from './WeekGlyph';

// Home spots (percent of the cloud area) for every routine, kept clear of the
// middle, where the three best matches sit.
const HOMES: [number, number][] = [
  [6, 8], [18, 3], [94, 8], [82, 3], [4, 28], [14, 19], [96, 28], [86, 19],
  [8, 49], [18, 37], [92, 49], [82, 37], [5, 70], [15, 60], [95, 70], [85, 60],
  [31, 4], [69, 4], [25, 22], [75, 22], [10, 88], [90, 88], [26, 86], [74, 86], [50, 94],
];
const FEATURED: [number, number][] = [
  [50, 19],
  [30, 52],
  [70, 52],
];
// Phones are narrow: spread the three apart and lower.
const FEATURED_PHONE: [number, number][] = [
  [50, 24],
  [24, 66],
  [76, 66],
];

interface Props {
  matches: Match[];
  routines: Map<string, Routine>;
  strong: Set<string>;
  onOpen: (id: string, trigger: HTMLElement) => void;
}

export function Cloud({ matches, routines, strong, onOpen }: Props) {
  const featured = matches.filter((m) => !m.excluded).slice(0, 3).map((m) => m.template.id);
  const order = [...matches].sort((a, b) => a.template.id.localeCompare(b.template.id));
  return (
    <div className="cloud" aria-hidden="false">
      {order.map((m, i) => {
        const id = m.template.id;
        const f = featured.indexOf(id);
        const [x, y] = f >= 0 ? FEATURED[f] : HOMES[i % HOMES.length];
        const [px, py] = f >= 0 ? FEATURED_PHONE[f] : [x, y];
        const r = routines.get(id);
        const max = Math.max(...(r?.days.map((d) => d.minutes) ?? [1]));
        const days = r?.days.map((d) => ({ kind: d.kind, size: d.minutes / max })) ?? m.template.week.map((d) => ({ kind: d.kind }));
        const state = f >= 0 ? 'featured' : strong.has(id) ? 'fit' : 'faded';
        const label = `${m.template.name}, ${m.template.days} days a week`;
        const minutes = r ? Math.round(r.days.reduce((s, d) => s + d.minutes, 0) / r.days.length) + 5 : null;
        return (
          <button
            type="button"
            key={id}
            className={`tile tile-${state}`}
            style={{ '--x': `${x}%`, '--y': `${y}%`, '--px': `${px}%`, '--py': `${py}%`, animationDelay: `${(i % 7) * -0.9}s` } as CSSProperties}
            onClick={(e) => onOpen(id, e.currentTarget)}
            tabIndex={f >= 0 ? 0 : -1}
            aria-label={f >= 0 ? `Open ${label}` : label}
            data-testid={f >= 0 ? 'featured-tile' : undefined}
          >
            <span className="tile-card">
              <WeekGlyph days={days} className="tile-glyph" />
            </span>
            {f >= 0 && (
              <span className="tile-label">
                <span className="tile-name">{m.template.name}</span>
                <span className="tile-meta">
                  {m.template.days} days{minutes ? ` · ~${minutes} min` : ''}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { sessionMinutes, weeklySets, type Match, type Routine } from '../model/engine';
import { EQUIPMENT_NAMES } from '../model/exercises';
import { liftosaurLink, programText } from '../model/liftosaur';
import type { Focus, Goal, Level, Setup } from '../model/types';
import { CheckIcon, CloseIcon, CopyIcon, ExternalIcon } from './Icons';
import { KIND_LABEL } from '../model/week';
import { WeekGlyph } from './WeekGlyph';

const GOAL: Record<Goal, string> = { muscle: 'Building muscle', strength: 'Strength', both: 'Size and strength', fitness: 'General fitness' };
const LEVEL: Record<Level, string> = { new: 'New lifters', some: 'Some experience', seasoned: 'Seasoned lifters' };
const SETUP: Record<Setup, string> = {
  gym: 'Full gym',
  homeBarbell: 'Home barbell gym',
  dumbbells: 'Dumbbells and a bench',
  kettlebell: 'Kettlebell',
  bodyweight: 'Bodyweight and a pull-up bar',
};
const MUSCLE: Record<Focus, string> = { chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms', legs: 'Legs', glutes: 'Glutes', core: 'Core' };

const best = <K extends string>(rec: Record<K, number>) => (Object.keys(rec) as K[]).sort((a, b) => rec[b] - rec[a])[0];

function useCopy(): [string | null, (key: string, text: string) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number>(0);
  const copy = (key: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(key);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(null), 1800);
      },
      () => setCopied(null),
    );
  };
  return [copied, copy];
}

interface Props {
  matches: Match[];
  routines: Map<string, Routine>;
  selected: string;
  strong: Set<string>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function Results({ matches, routines, selected, strong, onSelect, onClose }: Props) {
  const match = matches.find((m) => m.template.id === selected) ?? matches[0];
  const r = routines.get(match.template.id)!;
  const t = match.template;
  const [link, setLink] = useState<{ id: string; url: string } | null>(null);
  const [copied, copy] = useCopy();
  const dialog = useRef<HTMLDivElement>(null);
  // Which day is expanded, per routine; a new routine starts on its first day.
  const [expanded, setExpanded] = useState({ id: t.id, day: 0 });
  const openDay = expanded.id === t.id ? expanded.day : 0;
  const setOpenDay = (day: number) => setExpanded({ id: t.id, day });

  useEffect(() => {
    let live = true;
    void liftosaurLink(r).then((url) => live && setLink({ id: t.id, url }));
    return () => {
      live = false;
    };
  }, [r, t.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    dialog.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sets = weeklySets(r);
  const topMuscles = (Object.keys(sets) as Focus[]).filter((k) => sets[k] > 0).sort((a, b) => sets[b] - sets[a]);
  const exercisesPerWeek = r.days.reduce((s, d) => s + d.exercises.length, 0);
  const max = Math.max(...r.days.map((d) => d.minutes));
  const url = link?.id === t.id ? link.url : null;
  const isBest = matches.findIndex((m) => !m.excluded) === matches.indexOf(match);
  const ranked = [...matches].sort((a, b) => Number(a.excluded) - Number(b.excluded) || b.score - a.score);

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="results" role="dialog" aria-modal="true" aria-labelledby="routine-name" tabIndex={-1} ref={dialog}>
        <article className="detail">
          <div className="detail-art">
            <WeekGlyph days={r.days.map((d) => ({ kind: d.kind, size: d.minutes / max }))} letters className="detail-glyph" title={`${t.days} training days a week`} />
            <ul className="legend">
              {[...new Set(r.days.map((d) => d.kind))].map((k) => (
                <li key={k}>
                  <i className={`swatch kind-${k}`} />
                  {KIND_LABEL[k]}
                </li>
              ))}
            </ul>
            {match.reasons.length > 0 && (
              <ul className="reasons" aria-label="Why it fits">
                {match.reasons.map((reason) => (
                  <li key={reason}>
                    <CheckIcon size={15} />
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="detail-body">
            <button type="button" className="icon-btn close" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
            <p className="eyebrow">
              {match.excluded ? "Doesn't match your days or equipment" : isBest ? 'Best match' : `${match.score}% match`}
            </p>
            <h2 id="routine-name">{t.name}</h2>
            <p className="tagline">{t.tagline}</p>

            <div className="stat-row">
              <div className="stat">
                <span>Days a week</span>
                <strong>{t.days}</strong>
              </div>
              <div className="stat">
                <span>Session</span>
                <strong>~{sessionMinutes(r)} min</strong>
              </div>
              <div className="stat">
                <span>Match</span>
                <strong>{match.score}%</strong>
              </div>
            </div>

            <dl className="specs">
              <div><dt>Split</dt><dd>{t.split}</dd></div>
              <div><dt>Best for</dt><dd>{GOAL[best(t.goals)]}</dd></div>
              <div><dt>Level</dt><dd>{LEVEL[best(t.levels)]}</dd></div>
              <div><dt>Equipment</dt><dd>{SETUP[r.answers.setup]}</dd></div>
              <div><dt>Exercises a week</dt><dd>{exercisesPerWeek}</dd></div>
              <div>
                <dt>Sets a week</dt>
                <dd className="muscles">
                  {topMuscles.map((k) => (
                    <span key={k}>
                      {MUSCLE[k]} {sets[k]}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="wide"><dt>Progression</dt><dd>{t.progression}</dd></div>
            </dl>

            <div className="days">
              {r.days.map((d, i) => (
                <details key={`${t.id}-${i}`} open={openDay === i} onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && setOpenDay(i)}>
                  <summary>
                    <i className={`swatch kind-${d.kind}`} />
                    <span className="day-name">{d.name}</span>
                    <span className="day-meta">
                      {d.exercises.length} exercises · ~{d.minutes + 5} min
                    </span>
                  </summary>
                  <ol>
                    {d.exercises.map((e, j) => (
                      <li key={j}>
                        <span className="ex-name">
                          {e.option.name}
                          <em>{EQUIPMENT_NAMES[e.option.equipment]}</em>
                        </span>
                        <span className="ex-rx">
                          {e.rx.setCount} × {e.rx.repsText}
                          {e.rx.weight ? ` · ${e.rx.weight.value} ${e.rx.weight.units}` : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>

            <div className="cta">
              <a
                className={`btn btn-primary${url ? '' : ' disabled'}`}
                href={url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!url}
              >
                Open in Liftosaur
                <ExternalIcon />
              </a>
              <button type="button" className="btn btn-quiet" disabled={!url} onClick={() => url && copy('link', url)}>
                {copied === 'link' ? <CheckIcon size={18} /> : <CopyIcon />}
                {copied === 'link' ? 'Copied' : 'Copy import link'}
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => copy('text', programText(r))}>
                {copied === 'text' ? <CheckIcon size={18} /> : <CopyIcon />}
                {copied === 'text' ? 'Copied' : 'Copy Liftoscript'}
              </button>
            </div>
            <p className="howto">
              In the Liftosaur app, go to <b>Choose program → Import from link</b> and paste the import link. Or open it in Liftosaur&apos;s
              web editor to tweak it first.
            </p>
          </div>
        </article>

        <aside className="matches" aria-label="Other routines">
          <h3>Your matches</h3>
          <ul>
            {ranked.map((m, i) => {
              const mr = routines.get(m.template.id)!;
              const mmax = Math.max(...mr.days.map((d) => d.minutes));
              return (
                <li key={m.template.id}>
                  <button
                    type="button"
                    className={`match${m.template.id === t.id ? ' on' : ''}${strong.has(m.template.id) ? '' : ' weak'}`}
                    onClick={() => onSelect(m.template.id)}
                    aria-current={m.template.id === t.id}
                  >
                    <WeekGlyph days={mr.days.map((d) => ({ kind: d.kind, size: d.minutes / mmax }))} className="match-glyph" />
                    <span className="match-text">
                      <span className="match-name">{m.template.name}</span>
                      <span className="match-meta">
                        {m.excluded ? 'Other days or gear' : `${m.template.days} days · ${m.score}%`}
                      </span>
                    </span>
                    {i === 0 && !m.excluded && <span className="badge-best">Best match</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}

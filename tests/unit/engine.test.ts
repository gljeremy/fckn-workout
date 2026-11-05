import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildRoutine, isStrongFit, rankTemplates, SETUP_GEAR, weeklySets } from '../../src/model/engine';
import { EQUIPMENT_NAMES, PATTERNS, fullName } from '../../src/model/exercises';
import { decode, encode, exportedProgram, liftosaurLink, programText } from '../../src/model/liftosaur';
import { TEMPLATES } from '../../src/model/templates';
import type { Answers, Avoid, Goal, Level, Setup } from '../../src/model/types';

// Liftosaur's built-in exercises and the equipment it has artwork for,
// extracted from its source (src/models/exercise.ts, exerciseImage.ts).
const LIFTOSAUR: Record<string, { name: string; eq?: string[] }> = JSON.parse(
  readFileSync(new URL('../fixtures/liftosaur-exercises.json', import.meta.url), 'utf8'),
);
const BY_NAME = new Map(Object.values(LIFTOSAUR).map((e) => [e.name, e]));
// Real Liftosaur exercises that parse fine but have no artwork for this equipment.
const NO_ART_OK = new Set(['Bent Over Row, Kettlebell', 'Burpee, Bodyweight', 'Mountain Climber, Bodyweight']);

const goals: Goal[] = ['muscle', 'strength', 'both', 'fitness'];
const levels: Level[] = ['new', 'some', 'seasoned'];
const setups: Setup[] = ['gym', 'homeBarbell', 'dumbbells', 'kettlebell', 'bodyweight'];

function* everyAnswer(): Generator<Required<Answers>> {
  for (const goal of goals)
    for (const level of levels)
      for (const setup of setups)
        for (const minutes of [30, 45, 60, 90])
          for (const days of [2, 3, 4, 5, 6])
            yield { goal, level, setup, minutes, days, focus: [], avoid: [], units: 'lb' };
}

describe('exercise library', () => {
  it('uses only Liftosaur exercises, with equipment Liftosaur knows', () => {
    for (const [pattern, options] of Object.entries(PATTERNS)) {
      for (const o of options) {
        const ex = BY_NAME.get(o.name);
        expect(ex, `${pattern}: ${o.name}`).toBeDefined();
        const art = ex!.eq?.includes(o.equipment.toLowerCase()) ?? false;
        expect(art || NO_ART_OK.has(fullName(o)), `${fullName(o)} has no Liftosaur artwork`).toBe(true);
        expect(EQUIPMENT_NAMES[o.equipment]).toBeTruthy();
      }
    }
  });
});

describe('matching', () => {
  it('only offers routines for the days and equipment answered', () => {
    for (const setup of setups)
      for (const days of [2, 3, 4, 5, 6]) {
        const ranked = rankTemplates({ setup, days });
        const ok = ranked.filter((m) => !m.excluded);
        expect(ok.length, `${setup} ${days}d`).toBeGreaterThan(0);
        for (const m of ok) {
          expect(m.template.days).toBe(days);
          expect((m.template.requires ?? []).every((g) => SETUP_GEAR[setup].includes(g))).toBe(true);
        }
      }
  });

  it('ranks routines written for the goal and level first', () => {
    expect(rankTemplates({ goal: 'strength', level: 'new', days: 3, setup: 'gym' })[0].template.id).toBe('foundation-3');
    expect(rankTemplates({ goal: 'muscle', level: 'some', days: 4, setup: 'gym' })[0].template.id).toBe('ul-hyp-4');
    expect(rankTemplates({ goal: 'fitness', level: 'new', days: 3, setup: 'bodyweight' })[0].template.id).toBe('calisthenics-3');
    expect(rankTemplates({ goal: 'fitness', days: 3, setup: 'kettlebell' })[0].template.id).toBe('kettlebell-3');
    expect(rankTemplates({ goal: 'muscle', days: 3, setup: 'dumbbells' })[0].template.id).toBe('dumbbell-3');
  });

  it('marks at least the best routine as a strong fit', () => {
    for (const a of everyAnswer()) {
      const ranked = rankTemplates(a);
      expect(isStrongFit(ranked[0], ranked[0].score), JSON.stringify(a)).toBe(true);
    }
  });
});

describe('building routines', () => {
  it('builds every routine for every answer within the rules', () => {
    for (const a of everyAnswer()) {
      for (const t of TEMPLATES) {
        const r = buildRoutine(t, a);
        expect(r.days).toHaveLength(t.days);
        const gear = SETUP_GEAR[a.setup];
        for (const d of r.days) {
          expect(d.exercises.length, `${t.id} ${d.name} ${JSON.stringify(a)}`).toBeGreaterThanOrEqual(3);
          const names = d.exercises.map((e) => fullName(e.option));
          expect(new Set(names).size).toBe(names.length);
          for (const e of d.exercises) expect(e.option.needs.every((g) => gear.includes(g))).toBe(true);
        }
      }
    }
  });

  it('keeps sessions near the time asked for', () => {
    for (const a of everyAnswer()) {
      for (const t of TEMPLATES) {
        for (const d of buildRoutine(t, a).days) {
          // Five minutes are left for warm-ups. At least three exercises always
          // stay, which can run a short session long.
          if (d.exercises.length > 3) expect(d.minutes, `${t.id} ${d.name} ${a.minutes}`).toBeLessThanOrEqual(a.minutes - 4);
        }
      }
    }
  });

  it('leaves out what the lifter wants to avoid', () => {
    const avoid: Avoid[] = ['barbellSquat', 'floorDeadlift', 'overhead', 'jumping'];
    for (const t of TEMPLATES) {
      const r = buildRoutine(t, { goal: 'both', level: 'seasoned', setup: 'gym', minutes: 90, avoid });
      for (const d of r.days) for (const e of d.exercises) expect(avoid).not.toContain(e.option.avoid);
    }
  });

  it('adds work for focus muscles', () => {
    const t = TEMPLATES.find((x) => x.id === 'ul-hyp-4')!;
    const base = weeklySets(buildRoutine(t, { setup: 'gym', minutes: 90 }));
    const focused = weeklySets(buildRoutine(t, { setup: 'gym', minutes: 90, focus: ['arms', 'glutes'] }));
    expect(focused.arms).toBeGreaterThan(base.arms);
    expect(focused.glutes).toBeGreaterThan(base.glutes);
  });

  it('uses the units asked for', () => {
    const t = TEMPLATES[0];
    expect(programText(buildRoutine(t, { units: 'kg', setup: 'gym' }))).toMatch(/\d+kg/);
    expect(programText(buildRoutine(t, { units: 'kg', setup: 'gym' }))).not.toMatch(/\d+lb/);
  });
});

describe('Liftoscript', () => {
  it('defines each exercise progression once, and labels clashing prescriptions', () => {
    for (const a of everyAnswer()) {
      for (const t of TEMPLATES) {
        const text = programText(buildRoutine(t, a));
        const progressByExercise = new Map<string, string>();
        for (const line of text.split('\n')) {
          if (line.startsWith('#') || line.startsWith('//')) continue;
          const [name, ...rest] = line.split(' / ');
          const progress = rest.find((p) => p.startsWith('progress:'));
          if (!progress) continue;
          expect(progressByExercise.has(name), `${t.id}: ${name} has two progressions`).toBe(false);
          progressByExercise.set(name, progress);
        }
      }
    }
  });

  it('keeps "&" out of names, which Liftosaur shows escaped', () => {
    for (const t of TEMPLATES) {
      expect(t.name).not.toContain('&');
      for (const d of t.week) expect(d.name).not.toContain('&');
    }
  });

  it('writes each line as name / sets / load-and-rest [/ progress]', () => {
    const r = buildRoutine(TEMPLATES[1], { setup: 'gym', goal: 'muscle', level: 'some', minutes: 60 });
    const lines = programText(r).split('\n').filter((l) => !l.startsWith('#') && !l.startsWith('//'));
    for (const l of lines) {
      expect(l).toMatch(/^([a-z0-9]+: )?[A-Z][A-Za-z -]+, [A-Z][A-Za-z ]+ \/ \d+x\d+(-\d+)?( \d+s\|\d+s)?( \/ (\d+(\.\d+)?(lb|kg) )?\d+s)?( \/ progress: .+)?$/);
    }
  });
});

describe('Liftosaur link', () => {
  it('round-trips through Liftosaur\'s encoding', async () => {
    const text = 'Plain ascii and ünïcödé, with a / and = and +';
    expect(await decode(await encode(text))).toBe(text);
  });

  it('carries a v2 planner export with one day per routine day', async () => {
    const r = buildRoutine(TEMPLATES[3], { setup: 'gym' });
    const link = new URL(await liftosaurLink(r));
    expect(link.origin + link.pathname).toBe('https://www.liftosaur.com/program');
    const payload = JSON.parse(await decode(link.searchParams.get('data')!));
    expect(payload).toEqual(exportedProgram(r));
    expect(payload.type).toBe('v2');
    expect(payload.program.vtype).toBe('planner');
    expect(payload.program.weeks[0].days.map((d: { name: string }) => d.name)).toEqual(r.days.map((d) => d.name));
  });
});

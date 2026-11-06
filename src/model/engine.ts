import { PATTERNS, fullName, type Option } from './exercises';
import { TEMPLATES, type Template } from './templates';
import type { Answers, DayKind, Focus, Gear, Goal, Level, Pattern, Role, Setup, Slot, Units } from './types';

export const SETUP_GEAR: Record<Setup, Gear[]> = {
  gym: ['barbell', 'dumbbell', 'cable', 'leverageMachine', 'bodyweight', 'kettlebell', 'band', 'ezbar', 'trapbar', 'bar', 'bench', 'box', 'parallelBars', 'abWheel', 'anchor', 'rack', 'preacherBench'],
  homeBarbell: ['barbell', 'dumbbell', 'bodyweight', 'band', 'bar', 'bench', 'rack'],
  dumbbells: ['dumbbell', 'bodyweight', 'bench'],
  kettlebell: ['kettlebell', 'bodyweight'],
  bodyweight: ['bodyweight', 'bar'],
};

const LEVELS: Level[] = ['new', 'some', 'seasoned'];

/** Answers with the gaps filled, for building a routine before the quiz is done. */
export function withDefaults(a: Answers): Required<Answers> {
  return {
    goal: a.goal ?? 'muscle',
    level: a.level ?? 'some',
    days: a.days ?? 3,
    minutes: a.minutes ?? 60,
    setup: a.setup ?? 'gym',
    focus: a.focus ?? [],
    avoid: a.avoid ?? [],
    units: a.units ?? 'lb',
  };
}

// ─── Matching ───────────────────────────────────────────────────────────────

export interface Match {
  template: Template;
  /** 0–100. */
  score: number;
  /** Ruled out by a hard answer (days or equipment). */
  excluded: boolean;
  reasons: string[];
}

const GOAL_WORDS: Record<Goal, string> = {
  muscle: 'building muscle',
  strength: 'getting stronger',
  both: 'size and strength together',
  fitness: 'all-round fitness',
};
const LEVEL_WORDS: Record<Level, string> = { new: 'newer lifters', some: 'lifters with some experience', seasoned: 'seasoned lifters' };
const SETUP_WORDS: Record<Setup, string> = {
  gym: 'a full gym',
  homeBarbell: 'a home barbell setup',
  dumbbells: 'dumbbells',
  kettlebell: 'a kettlebell',
  bodyweight: 'just your body weight',
};

export function scoreTemplate(t: Template, a: Answers): Match {
  const reasons: string[] = [];
  let excluded = false;
  if (a.days != null && t.days !== a.days) excluded = true;
  if (a.setup != null) {
    const gear = SETUP_GEAR[a.setup];
    if (t.setups[a.setup] === 0 || (t.requires ?? []).some((g) => !gear.includes(g))) excluded = true;
  }

  const goal = a.goal ? t.goals[a.goal] : 0.75;
  const level = a.level ? t.levels[a.level] : 0.75;
  const setup = a.setup ? t.setups[a.setup] : 0.75;
  const focus = a.focus?.length ? focusFit(t, a.focus) : t.emphasis ? 0.6 : 0.75;
  const time = a.minutes != null ? timeFit(t, a.minutes) : 0.75;
  const score = Math.round(100 * (0.34 * goal + 0.2 * level + 0.18 * setup + 0.14 * focus + 0.14 * time));

  if (a.goal && goal >= 0.85) reasons.push(`Written for ${GOAL_WORDS[a.goal]}.`);
  if (a.level && level >= 0.85) reasons.push(`Pitched at ${LEVEL_WORDS[a.level]}.`);
  if (a.days != null && !excluded) reasons.push(`${t.days} days a week, as you asked.`);
  if (a.setup && setup >= 0.9) reasons.push(`Made for ${SETUP_WORDS[a.setup]}.`);
  if (a.focus?.length && t.emphasis && focusFit(t, a.focus) >= 0.75) reasons.push('Extra work for the muscles you picked.');
  if (a.minutes != null && time >= 0.9) reasons.push(`Fits a ${a.minutes >= 90 ? '90+' : a.minutes}-minute session.`);
  return { template: t, score, excluded, reasons };
}

function focusFit(t: Template, focus: Focus[]): number {
  if (!t.emphasis) return 0.7;
  const hits = focus.filter((f) => t.emphasis!.includes(f)).length;
  // A routine that emphasises other muscles is a poor fit for this lifter's picks.
  return hits === 0 ? 0.2 : 0.75 + 0.25 * (hits / focus.length);
}

function timeFit(t: Template, minutes: number): number {
  const [lo, hi] = t.minutes;
  if (minutes >= lo && minutes <= hi) return 1;
  const off = minutes < lo ? lo - minutes : minutes - hi;
  return Math.max(0.3, 1 - off / 40);
}

/** Ties go to the routines most people look for. */
const POPULAR = ['ul-hyp-4', 'ppl-6', 'foundation-3', 'fullbody-hyp-3', 'ppl-ul-5', 'powerbuilding-4'];
const popularity = (id: string) => {
  const i = POPULAR.indexOf(id);
  return i === -1 ? POPULAR.length : i;
};

/** Every routine, best first; excluded ones last. */
export function rankTemplates(a: Answers): Match[] {
  return TEMPLATES.map((t) => scoreTemplate(t, a)).sort(
    (x, y) =>
      Number(x.excluded) - Number(y.excluded) || y.score - x.score || popularity(x.template.id) - popularity(y.template.id),
  );
}

/** A "strong fit": not excluded and close to the best score (the best always counts). */
export function isStrongFit(m: Match, best: number): boolean {
  return !m.excluded && m.score >= Math.min(best, Math.max(60, best - 12));
}

// ─── Building ───────────────────────────────────────────────────────────────

export interface Prescription {
  /** Liftoscript set groups, e.g. "3x8-12" or "3x1". */
  sets: string;
  setCount: number;
  /** Top of the rep range, for timing. */
  maxReps: number;
  repsText: string;
  weight?: { value: number; units: Units };
  /** Seconds held per set, for planks and the like. */
  hold?: number;
  rest: number;
  progress?: string;
}

export interface BuiltExercise {
  option: Option;
  pattern: Pattern;
  role: Role;
  label?: string;
  rx: Prescription;
}

export interface BuiltDay {
  name: string;
  kind: DayKind;
  exercises: BuiltExercise[];
  minutes: number;
}

export interface Routine {
  template: Template;
  answers: Required<Answers>;
  days: BuiltDay[];
  name: string;
}

// Liftosaur's workout-time model: get ready, then 7 s a rep, then rest.
const PREPARE_SECONDS = 20;
const SECONDS_PER_REP = 7;
/** Left over for warm-ups, which Liftosaur's estimate leaves out. */
const WARMUP_MINUTES = 5;

function allowed(option: Option, a: Required<Answers>): boolean {
  const gear = SETUP_GEAR[a.setup];
  if (!option.needs.every((g) => gear.includes(g))) return false;
  if (option.avoid && a.avoid.includes(option.avoid)) return false;
  if (option.minLevel && LEVELS.indexOf(a.level) < LEVELS.indexOf(option.minLevel)) return false;
  return true;
}

/** The exercises a lifter could use for a pattern, best first. */
export function optionsFor(pattern: Pattern, a: Required<Answers>): Option[] {
  return PATTERNS[pattern].filter((o) => allowed(o, a));
}

const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);

function startingWeight(option: Option, role: Role, a: Required<Answers>): number | undefined {
  if (option.lb === 0) return undefined;
  const factor = option.compound
    ? { new: 1, some: 1.5, seasoned: 2 }[a.level]
    : { new: 1, some: 1.3, seasoned: 1.6 }[a.level];
  // Accessory slots run lighter than a main lift for the same exercise.
  const roleFactor = role === 'main' ? 1 : role === 'second' ? 0.85 : 0.75;
  const lb = option.lb * factor * roleFactor;
  if (a.units === 'kg') {
    const kg = roundTo(lb / 2.2046, 2.5);
    return option.equipment === 'barbell' ? Math.max(20, kg) : kg;
  }
  const rounded = roundTo(lb, 5);
  return option.equipment === 'barbell' ? Math.max(45, rounded) : rounded;
}

function increment(a: Required<Answers>, big: boolean): string {
  if (a.units === 'kg') return big ? '5kg' : '2.5kg';
  return big ? '10lb' : '5lb';
}

/** Rest between sets, in seconds: long for heavy strength work, short for pump and conditioning. */
const REST: Record<Goal, Record<Role, number>> = {
  strength: { main: 180, second: 120, acc: 75, core: 60, cond: 45 },
  both: { main: 150, second: 105, acc: 75, core: 60, cond: 45 },
  muscle: { main: 120, second: 90, acc: 60, core: 45, cond: 45 },
  fitness: { main: 90, second: 75, acc: 60, core: 45, cond: 30 },
};

const LOWER: Pattern[] = ['squat', 'hinge', 'hingeAcc', 'single', 'quad', 'ham', 'glute', 'calf'];

export function prescribe(option: Option, pattern: Pattern, role: Role, a: Required<Answers>, extraSets = 0): Prescription {
  const weight = startingWeight(option, role, a);
  const lower = LOWER.includes(pattern);
  const short = a.minutes <= 30;

  if (option.hold) {
    const sets = 3 + extraSets;
    return { sets: `${sets}x1`, setCount: sets, maxReps: 1, repsText: `${option.hold}s hold`, hold: option.hold, rest: 60 };
  }

  let sets: number;
  let lo: number;
  let hi: number;
  if (role === 'main') {
    const table: Record<Goal, Record<Level, [number, number, number]>> = {
      strength: { new: [3, 5, 5], some: [4, 4, 6], seasoned: [5, 3, 5] },
      both: { new: [3, 5, 8], some: [4, 5, 8], seasoned: [4, 4, 6] },
      muscle: { new: [3, 8, 10], some: [3, 6, 10], seasoned: [4, 6, 10] },
      fitness: { new: [3, 8, 10], some: [3, 8, 12], seasoned: [3, 8, 12] },
    };
    [sets, lo, hi] = table[a.goal][a.level];
  } else if (role === 'second') {
    [sets, lo, hi] = a.goal === 'strength' ? [3, 6, 8] : a.goal === 'fitness' ? [3, 10, 12] : [3, 8, 12];
  } else if (role === 'cond') {
    [sets, lo, hi] = [4, 12, 15];
  } else {
    [sets, lo, hi] = a.goal === 'fitness' ? [2, 12, 15] : [3, 10, 15];
  }
  let rest = REST[a.goal][role];
  if (short && role !== 'main') sets = Math.max(2, sets - 1);
  // Unloaded moves are lighter on recovery than the barbell work they stand in for.
  if (weight == null) rest = Math.min(rest, 90);
  sets += extraSets;

  const bodyweight = weight == null;
  if (bodyweight) {
    // Unloaded moves progress by reps: start low in the range, add one each time.
    const reps = role === 'main' || role === 'second' ? Math.max(5, lo) : lo;
    return {
      sets: `${sets}x${reps}`,
      setCount: sets,
      maxReps: reps,
      repsText: `${reps}+ reps`,
      rest,
      progress: 'custom() {~\n  if (completedReps >= reps) {\n    reps += 1\n  }\n~}',
    };
  }

  const range = lo === hi ? `${lo}` : `${lo}-${hi}`;
  const big = lower && !!option.compound && option.equipment === 'barbell';
  const inc = increment(a, big);
  const progress = lo === hi ? `lp(${inc})` : `dp(${inc}, ${lo}, ${hi})`;
  return {
    sets: `${sets}x${range}`,
    setCount: sets,
    maxReps: hi,
    repsText: `${range} reps`,
    weight: { value: weight, units: a.units },
    rest,
    progress,
  };
}

/** Muscles each pattern counts toward, for focus answers. */
const FOCUS_PATTERNS: Record<Focus, Pattern[]> = {
  chest: ['hpush', 'ipush', 'chestIso'],
  back: ['hpull', 'vpull'],
  shoulders: ['vpush', 'lateral', 'rear'],
  arms: ['biceps', 'triceps'],
  legs: ['squat', 'single', 'quad', 'ham', 'calf'],
  glutes: ['glute', 'hinge', 'hingeAcc'],
  core: ['core'],
};
/** Extra exercises for a focus muscle, in order of preference; the day gets the first it lacks. */
const FOCUS_EXTRA: Record<Focus, Pattern[]> = {
  chest: ['chestIso', 'ipush'],
  back: ['vpull', 'hpull'],
  shoulders: ['lateral', 'rear'],
  arms: ['triceps', 'biceps'],
  legs: ['quad', 'ham', 'single'],
  glutes: ['glute', 'single'],
  core: ['core'],
};
/** Stand-ins for a day whose own exercises the lifter's gear can't cover. */
const FILLER: Record<DayKind, Pattern[]> = {
  full: ['single', 'hpush', 'hpull', 'core', 'glute'],
  upper: ['hpush', 'hpull', 'ipush', 'core'],
  lower: ['single', 'glute', 'hingeAcc', 'core'],
  push: ['ipush', 'hpush', 'triceps', 'core'],
  pull: ['hpull', 'hingeAcc', 'glute', 'core'],
  legs: ['single', 'glute', 'calf', 'core'],
  arms: ['hpush', 'hpull', 'ipush', 'core'],
  chestBack: ['ipush', 'hpull', 'core'],
  cond: ['cond', 'single', 'core'],
};
const UPPER_KINDS: DayKind[] =['upper', 'push', 'pull', 'arms', 'chestBack', 'full', 'cond'];
const LOWER_KINDS: DayKind[] = ['lower', 'legs', 'full', 'cond'];
const isLowerFocus = (f: Focus) => f === 'legs' || f === 'glutes';

const ROLE_LABEL: Record<Role, string> = { main: 'heavy', second: 'volume', acc: 'light', core: 'core', cond: 'finisher' };

/** Minutes for an exercise, the way Liftosaur estimates it (src/models/workoutTimeEstimate.ts). */
export function minutesFor(rx: Prescription, unilateral = false): number {
  const work = (rx.hold ?? rx.maxReps * SECONDS_PER_REP) * (unilateral ? 2 : 1);
  return (rx.setCount * (PREPARE_SECONDS + work + rx.rest)) / 60;
}

export function buildRoutine(template: Template, answers: Answers): Routine {
  const a = withDefaults(answers);
  const budget = a.minutes - WARMUP_MINUTES;
  const gear = SETUP_GEAR[a.setup].filter((g) => !template.nativeSetup || SETUP_GEAR[template.nativeSetup].includes(g));
  const eligible = (pattern: Pattern) => optionsFor(pattern, a).filter((o) => o.needs.every((g) => gear.includes(g)));
  const used = new Map<string, number>(); // option name → times used this week
  const firstScheme = new Map<string, string>(); // exercise → its first prescription

  const days: BuiltDay[] = template.week.map((d) => {
    const slots = [...d.slots];
    // Focus muscles get an extra exercise on days that train them.
    for (const f of a.focus) {
      const fits = isLowerFocus(f) ? LOWER_KINDS : f === 'core' ? [...UPPER_KINDS, ...LOWER_KINDS] : UPPER_KINDS;
      if (!fits.includes(d.kind)) continue;
      const extra = [...new Set([...FOCUS_EXTRA[f], ...FOCUS_PATTERNS[f]])].find(
        (p) => !slots.some((sl) => sl.pattern === p) && eligible(p).some((o) => o.muscle === f),
      );
      if (!extra) continue;
      slots.push({ pattern: extra, role: f === 'core' ? 'core' : 'acc', prio: 5 });
    }
    const candidates: BuiltExercise[] = [];
    const order: number[] = [];
    const add = (slot: Slot, i: number) => {
      // Never the same exercise twice in one day.
      const options = eligible(slot.pattern).filter(
        (o) => !candidates.some((c) => fullName(c.option) === fullName(o)),
      );
      if (!options.length) return;
      // Main lifts stay the same all week; everything else rotates for variety.
      const option =
        slot.role === 'main'
          ? options[0]
          : (options.find((o) => !used.has(fullName(o))) ??
            [...options].sort((x, y) => (used.get(fullName(x)) ?? 0) - (used.get(fullName(y)) ?? 0))[0]);
      const focused = a.focus.some((f) => FOCUS_PATTERNS[f].includes(slot.pattern));
      const rx = prescribe(option, slot.pattern, slot.role, a, focused ? 1 : 0);
      candidates.push({ option, pattern: slot.pattern, role: slot.role, rx });
      // Focus muscles' exercises are the last to go when time runs short.
      order.push(slot.prio + (focused ? 4.5 : 0) + (slots.length - i) * 0.01);
    };
    slots.forEach(add);
    // When the gear rules out too much, fill in with stand-ins for the day.
    for (const p of FILLER[d.kind]) {
      if (candidates.length >= 4) break;
      add({ pattern: p, role: p === 'core' ? 'core' : p === 'cond' ? 'cond' : 'acc', prio: 0.5 }, slots.length);
    }

    const byPrio = candidates.map((c, i) => ({ c, p: order[i], i })).sort((x, y) => x.p - y.p);
    const duration = (e: BuiltExercise) => minutesFor(e.rx, e.option.unilateral);
    let total = candidates.reduce((sum, e) => sum + duration(e), 0);
    for (const { c } of byPrio) {
      const floor = c.role === 'main' ? 3 : 2;
      while (total > budget && c.rx.setCount > floor) {
        total -= duration(c) / c.rx.setCount;
        c.rx.setCount--;
        c.rx.sets = `${c.rx.setCount}x${c.rx.sets.split('x')[1]}`;
      }
    }
    const keep = new Set(candidates.map((_, i) => i));
    for (const { c, i } of byPrio) {
      if (total <= budget || keep.size <= 2) break;
      const remaining = candidates.filter((_, index) => keep.has(index) && index !== i);
      if (!remaining.some((x, ix) => remaining.some((y, iy) => ix < iy && duration(x) + duration(y) <= budget))) continue;
      keep.delete(i);
      total -= duration(c);
    }
    const exercises = candidates.filter((_, i) => keep.has(i));
    total = exercises.reduce((sum, e) => sum + duration(e), 0);
    for (const e of exercises) used.set(fullName(e.option), (used.get(fullName(e.option)) ?? 0) + 1);
    return { name: d.name, kind: d.kind, exercises, minutes: Math.round(total) };
  });

  // The same exercise with a different prescription on another day needs its
  // own label, or Liftosaur would share (and clash on) one progression.
  const labels = new Map<string, string>(); // exercise + scheme → label
  const taken = new Set<string>();
  for (const d of days) {
    for (const e of d.exercises) {
      const key = fullName(e.option);
      const scheme = `${e.rx.sets}|${e.rx.weight?.value ?? ''}|${e.rx.progress ?? ''}`;
      const first = firstScheme.get(key);
      if (first == null) {
        firstScheme.set(key, scheme);
        continue;
      }
      if (first === scheme) continue;
      let label = labels.get(`${key}|${scheme}`);
      if (!label) {
        const base = ROLE_LABEL[e.role];
        label = base;
        for (let n = 2; taken.has(`${key}|${label}`); n++) label = `${base}${n}`;
        labels.set(`${key}|${scheme}`, label);
        taken.add(`${key}|${label}`);
      }
      e.label = label;
    }
  }

  return { template, answers: a, days, name: `fckn workout: ${template.name}` };
}

/** Hard sets per week for each muscle group. */
export function weeklySets(r: Routine): Record<Focus, number> {
  const out: Record<Focus, number> = { chest: 0, back: 0, shoulders: 0, arms: 0, legs: 0, glutes: 0, core: 0 };
  for (const d of r.days) for (const e of d.exercises) out[e.option.muscle] += e.rx.setCount;
  return out;
}

/** Average session length including the five warm-up minutes. */
export function sessionMinutes(r: Routine): number {
  return Math.round(r.days.reduce((s, d) => s + d.minutes, 0) / r.days.length) + WARMUP_MINUTES;
}

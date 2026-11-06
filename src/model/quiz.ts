import type { Answers, Avoid, Focus, Goal, Level, Setup, Units } from './types';

export type QuestionId = keyof Answers;

export interface Choice<V> {
  value: V;
  title: string;
  sub?: string;
}

export interface Question<V = unknown> {
  id: QuestionId;
  title: string;
  /** One line under the title, when the question needs it. */
  hint?: string;
  multi?: boolean;
  /** For multi-select: the choice that means "none of these". */
  none?: V;
  choices: Choice<V>[];
  /** The choice to badge as recommended, given the answers so far. */
  recommend?: (a: Answers) => V | undefined;
}

export const QUESTIONS: Question[] = [
  {
    id: 'goal',
    title: "What's the main goal?",
    choices: [
      { value: 'muscle', title: 'Build muscle', sub: 'Size and shape' },
      { value: 'strength', title: 'Get stronger', sub: 'Lift heavier' },
      { value: 'both', title: 'Both', sub: 'Strong and built' },
      { value: 'fitness', title: 'Get fit', sub: 'Healthy, fit, capable' },
    ] satisfies Choice<Goal>[],
  },
  {
    id: 'level',
    title: 'How long have you been lifting?',
    choices: [
      { value: 'new', title: 'New', sub: 'Under 6 months' },
      { value: 'some', title: 'A while', sub: '6 months to 2 years' },
      { value: 'seasoned', title: 'Years', sub: 'More than 2 years' },
    ] satisfies Choice<Level>[],
  },
  {
    id: 'days',
    title: 'How many days a week can you train?',
    choices: [
      { value: 2, title: '2', sub: 'Busy weeks' },
      { value: 3, title: '3', sub: 'The sweet spot' },
      { value: 4, title: '4', sub: 'Upper and lower' },
      { value: 5, title: '5', sub: 'Dedicated' },
      { value: 6, title: '6', sub: 'All in' },
    ] satisfies Choice<number>[],
    recommend: (a) => (a.level === 'new' ? 3 : a.goal === 'fitness' ? 3 : 4),
  },
  {
    id: 'minutes',
    title: 'How long is a session?',
    hint: 'Including a few minutes to warm up.',
    choices: [
      { value: 30, title: '30 min', sub: 'In and out' },
      { value: 45, title: '45 min', sub: 'Lunch break' },
      { value: 60, title: '60 min', sub: 'The usual' },
      { value: 90, title: '90 min', sub: 'No rush' },
    ] satisfies Choice<number>[],
    recommend: (a) => (a.days != null && a.days >= 5 ? 45 : 60),
  },
  {
    id: 'setup',
    title: 'Where do you train?',
    choices: [
      { value: 'gym', title: 'Full gym', sub: 'Barbells, machines, cables' },
      { value: 'homeBarbell', title: 'Home gym', sub: 'Barbell, rack, dumbbells, bench' },
      { value: 'dumbbells', title: 'Dumbbells', sub: 'A pair and a bench' },
      { value: 'kettlebell', title: 'Kettlebell', sub: 'One or two bells' },
      { value: 'bodyweight', title: 'Bodyweight', sub: 'A pull-up bar helps' },
    ] satisfies Choice<Setup>[],
  },
  {
    id: 'focus',
    title: 'Anything you want to bring up?',
    hint: 'Pick any. They get extra work where your gear and session time allow.',
    multi: true,
    none: 'balanced',
    choices: [
      { value: 'chest', title: 'Chest' },
      { value: 'back', title: 'Back' },
      { value: 'shoulders', title: 'Shoulders' },
      { value: 'arms', title: 'Arms' },
      { value: 'legs', title: 'Legs' },
      { value: 'glutes', title: 'Glutes' },
      { value: 'core', title: 'Core' },
      { value: 'balanced', title: 'Keep it balanced' },
    ] satisfies Choice<Focus | 'balanced'>[],
  },
  {
    id: 'avoid',
    title: 'Anything to leave out?',
    hint: 'Sore knees, a cranky back, or just not your thing.',
    multi: true,
    none: 'nothing',
    choices: [
      { value: 'barbellSquat', title: 'Barbell squats', sub: 'Swap for leg press or goblets' },
      { value: 'floorDeadlift', title: 'Floor deadlifts', sub: 'Swap for Romanian deadlifts' },
      { value: 'overhead', title: 'Overhead pressing', sub: 'Swap for incline work' },
      { value: 'jumping', title: 'Jumping', sub: 'No burpees or jump squats' },
      { value: 'nothing', title: 'Nothing', sub: "I'm good with it all" },
    ] satisfies Choice<Avoid | 'nothing'>[],
  },
  {
    id: 'units',
    title: 'Pounds or kilograms?',
    choices: [
      { value: 'lb', title: 'Pounds', sub: 'lb' },
      { value: 'kg', title: 'Kilograms', sub: 'kg' },
    ] satisfies Choice<Units>[],
  },
];

/** The first question not answered yet, or null when the quiz is done. */
export function nextQuestion(a: Answers): Question | null {
  return QUESTIONS.find((q) => a[q.id] === undefined) ?? null;
}

export function answeredCount(a: Answers): number {
  return QUESTIONS.filter((q) => a[q.id] !== undefined).length;
}

// ─── URL hash ───────────────────────────────────────────────────────────────

const NUMERIC: QuestionId[] = ['days', 'minutes'];

/** Reads answers from a hash like "#goal=muscle&days=4&focus=arms,glutes". */
export function parseHash(hash: string): Answers {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const out: Answers = {};
  for (const q of QUESTIONS) {
    const raw = params.get(q.id);
    if (raw == null) continue;
    if (q.multi) {
      const picked = raw ? raw.split(',') : [];
      const valid = picked.filter((v) => q.choices.some((c) => c.value === v) && v !== q.none);
      (out as Record<string, unknown>)[q.id] = valid;
    } else {
      const value = NUMERIC.includes(q.id) ? Number(raw) : raw;
      if (q.choices.some((c) => c.value === value)) (out as Record<string, unknown>)[q.id] = value;
    }
  }
  return out;
}

export function toHash(a: Answers): string {
  const params = new URLSearchParams();
  for (const q of QUESTIONS) {
    const v = a[q.id];
    if (v === undefined) continue;
    params.set(q.id, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = params.toString().replace(/%2C/g, ',');
  return s ? `#${s}` : '';
}

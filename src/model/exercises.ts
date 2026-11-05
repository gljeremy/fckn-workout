import type { Avoid, Focus, Gear, Level, Pattern } from './types';

/** Liftosaur's equipment keys and the names Liftoscript uses for them. */
export const EQUIPMENT_NAMES = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  leverageMachine: 'Leverage Machine',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Band',
  ezbar: 'EZ Bar',
  trapbar: 'Trap Bar',
} as const;
export type Equipment = keyof typeof EQUIPMENT_NAMES;

export interface Option {
  /** Liftosaur's built-in exercise name. */
  name: string;
  equipment: Equipment;
  /** Everything the lifter needs to do it (equipment plus, say, a pull-up bar). */
  needs: Gear[];
  /** A new lifter's working weight in lb; 0 for unloaded bodyweight moves. */
  lb: number;
  /** Held for time (seconds per set) rather than counted in reps. */
  hold?: number;
  compound?: boolean;
  /** One side at a time, so each set takes twice as long. */
  unilateral?: boolean;
  avoid?: Avoid;
  minLevel?: Level;
  muscle: Focus;
}

const ONE_SIDE = new Set([
  'Bulgarian Split Squat', 'Bent Over One Arm Row', 'Russian Twist', 'Reverse Lunge',
  'Split Squat', 'Step up', 'Pistol Squat', 'Single Leg Deadlift', 'Side Plank', 'Single Leg Hip Thrust',
]);
const DUMBBELL_ONE_SIDE = new Set(['Bicep Curl', 'Hammer Curl', 'Preacher Curl']);
const SUPPORT: Record<string, Gear[]> = {
  'Squat': ['rack'],
  'Front Squat': ['rack'],
  'Bench Press': ['bench'],
  'Incline Bench Press': ['bench'],
  'Bulgarian Split Squat': ['bench'],
  'Step up': ['box'],
  'Nordic Curl': ['anchor'],
  'Hip Thrust': ['bench'],
  'Single Leg Hip Thrust': ['bench'],
  'Chest Dip': ['parallelBars'],
  'Triceps Dip': ['parallelBars'],
  'Bench Dip': ['bench'],
  'Incline Push Up': ['bench'],
  'Pullover': ['bench'],
  'Chest Fly': ['bench'],
  'Skullcrusher': ['bench'],
  'Preacher Curl': ['preacherBench'],
  'Face Pull': ['anchor'],
  'Ab Wheel': ['abWheel'],
};

function needs(name: string, equipment: Equipment): Gear[] {
  const support = equipment === 'leverageMachine' || equipment === 'cable' ||
    (name === 'Squat' && equipment !== 'barbell') ? [] : SUPPORT[name] ?? [];
  return [equipment, ...support, ...(equipment === 'barbell' && /Bench Press/.test(name) ? ['rack' as const] : [])];
}

const o = (name: string, equipment: Equipment, lb: number, muscle: Focus, extra: Partial<Option> = {}): Option => ({
  name,
  equipment,
  needs: needs(name, equipment),
  lb,
  muscle,
  unilateral: ONE_SIDE.has(name) || (equipment === 'dumbbell' && DUMBBELL_ONE_SIDE.has(name)),
  ...extra,
});
const bar: Partial<Option> = { needs: ['bodyweight', 'bar'] };

/**
 * Movement patterns and the exercises that fill them, best first. The engine
 * takes the first option the lifter's equipment, level and "avoid" answers
 * allow, rotating through the rest for variety.
 */
export const PATTERNS: Record<Pattern, Option[]> = {
  squat: [
    o('Squat', 'barbell', 65, 'legs', { compound: true, avoid: 'barbellSquat' }),
    o('Front Squat', 'barbell', 55, 'legs', { compound: true, avoid: 'barbellSquat', minLevel: 'some' }),
    o('Leg Press', 'leverageMachine', 140, 'legs', { compound: true }),
    o('Goblet Squat', 'dumbbell', 30, 'legs', { compound: true }),
    o('Goblet Squat', 'kettlebell', 35, 'legs', { compound: true }),
    o('Bulgarian Split Squat', 'bodyweight', 0, 'legs', { compound: true, minLevel: 'some' }),
    o('Squat', 'bodyweight', 0, 'legs', { compound: true }),
  ],
  hinge: [
    o('Deadlift', 'barbell', 95, 'glutes', { compound: true, avoid: 'floorDeadlift' }),
    o('Trap Bar Deadlift', 'trapbar', 115, 'glutes', { compound: true, avoid: 'floorDeadlift' }),
    o('Romanian Deadlift', 'barbell', 75, 'glutes', { compound: true }),
    o('Romanian Deadlift', 'dumbbell', 30, 'glutes', { compound: true }),
    o('Kettlebell Swing', 'kettlebell', 35, 'glutes', { compound: true }),
    o('Single Leg Deadlift', 'bodyweight', 0, 'glutes', { compound: true }),
  ],
  hingeAcc: [
    o('Romanian Deadlift', 'barbell', 75, 'glutes', { compound: true }),
    o('Romanian Deadlift', 'dumbbell', 30, 'glutes', { compound: true }),
    o('Back Extension', 'leverageMachine', 50, 'glutes'),
    o('Good Morning', 'barbell', 45, 'glutes', { minLevel: 'some' }),
    o('Single Leg Deadlift', 'dumbbell', 20, 'glutes'),
    o('Kettlebell Swing', 'kettlebell', 35, 'glutes', { compound: true }),
    o('Single Leg Deadlift', 'bodyweight', 0, 'glutes'),
  ],
  single: [
    o('Bulgarian Split Squat', 'dumbbell', 15, 'legs', { compound: true }),
    o('Reverse Lunge', 'dumbbell', 15, 'legs', { compound: true }),
    o('Step up', 'dumbbell', 15, 'legs', { compound: true }),
    o('Reverse Lunge', 'kettlebell', 25, 'legs', { compound: true }),
    o('Split Squat', 'kettlebell', 25, 'legs', { compound: true }),
    o('Reverse Lunge', 'bodyweight', 0, 'legs', { compound: true }),
    o('Split Squat', 'bodyweight', 0, 'legs', { compound: true }),
    o('Pistol Squat', 'bodyweight', 0, 'legs', { compound: true, minLevel: 'seasoned' }),
  ],
  quad: [
    o('Leg Extension', 'leverageMachine', 50, 'legs'),
    o('Leg Press', 'leverageMachine', 140, 'legs', { compound: true }),
    o('Goblet Squat', 'dumbbell', 30, 'legs', { compound: true }),
    o('Sissy Squat', 'bodyweight', 0, 'legs', { minLevel: 'some' }),
    o('Split Squat', 'bodyweight', 0, 'legs'),
  ],
  ham: [
    o('Lying Leg Curl', 'leverageMachine', 50, 'legs'),
    o('Seated Leg Curl', 'leverageMachine', 50, 'legs'),
    o('Romanian Deadlift', 'dumbbell', 30, 'legs', { compound: true }),
    o('Nordic Curl', 'bodyweight', 0, 'legs', { minLevel: 'some' }),
    o('Single Leg Deadlift', 'bodyweight', 0, 'legs'),
  ],
  glute: [
    o('Hip Thrust', 'barbell', 95, 'glutes', { compound: true }),
    o('Hip Thrust', 'leverageMachine', 90, 'glutes', { compound: true }),
    o('Glute Bridge', 'dumbbell', 35, 'glutes'),
    o('Hip Abductor', 'leverageMachine', 70, 'glutes'),
    o('Glute Kickback', 'cable', 20, 'glutes'),
    o('Single Leg Hip Thrust', 'bodyweight', 0, 'glutes'),
    o('Hip Thrust', 'bodyweight', 0, 'glutes'),
    o('Glute Bridge March', 'bodyweight', 0, 'glutes'),
  ],
  calf: [
    o('Standing Calf Raise', 'leverageMachine', 90, 'legs'),
    o('Seated Calf Raise', 'leverageMachine', 70, 'legs'),
    o('Standing Calf Raise', 'dumbbell', 25, 'legs'),
    o('Standing Calf Raise', 'bodyweight', 0, 'legs'),
  ],
  hpush: [
    o('Bench Press', 'barbell', 65, 'chest', { compound: true }),
    o('Bench Press', 'dumbbell', 25, 'chest', { compound: true }),
    o('Chest Press', 'leverageMachine', 60, 'chest', { compound: true }),
    o('Bench Press', 'kettlebell', 25, 'chest', { compound: true }),
    o('Push Up', 'bodyweight', 0, 'chest', { compound: true }),
  ],
  ipush: [
    o('Incline Bench Press', 'dumbbell', 20, 'chest', { compound: true }),
    o('Incline Bench Press', 'barbell', 55, 'chest', { compound: true }),
    o('Incline Chest Press', 'leverageMachine', 50, 'chest', { compound: true }),
    o('Chest Dip', 'bodyweight', 0, 'chest', { compound: true, minLevel: 'some' }),
    o('Diamond Push Up', 'bodyweight', 0, 'chest', { compound: true }),
    o('Incline Push Up', 'bodyweight', 0, 'chest', { compound: true }),
  ],
  vpush: [
    o('Overhead Press', 'barbell', 45, 'shoulders', { compound: true, avoid: 'overhead' }),
    o('Shoulder Press', 'dumbbell', 15, 'shoulders', { compound: true, avoid: 'overhead' }),
    o('Shoulder Press', 'leverageMachine', 40, 'shoulders', { compound: true, avoid: 'overhead' }),
    o('Arnold Press', 'kettlebell', 25, 'shoulders', { compound: true, avoid: 'overhead' }),
    o('Pike Push Up', 'bodyweight', 0, 'shoulders', { compound: true, avoid: 'overhead' }),
    // Without overhead work, an incline press covers the front of the shoulder.
    o('Incline Bench Press', 'dumbbell', 20, 'shoulders', { compound: true }),
    o('Incline Bench Press', 'barbell', 55, 'shoulders', { compound: true }),
    o('Incline Push Up', 'bodyweight', 0, 'shoulders', { compound: true }),
  ],
  hpull: [
    o('Bent Over Row', 'barbell', 65, 'back', { compound: true }),
    o('Seated Row', 'cable', 70, 'back', { compound: true }),
    o('Bent Over One Arm Row', 'dumbbell', 30, 'back', { compound: true }),
    o('T Bar Row', 'leverageMachine', 50, 'back', { compound: true }),
    o('Bent Over Row', 'kettlebell', 35, 'back', { compound: true }),
    o('Inverted Row', 'bodyweight', 0, 'back', { compound: true, ...bar }),
  ],
  vpull: [
    o('Pull Up', 'bodyweight', 0, 'back', { compound: true, ...bar, minLevel: 'some' }),
    o('Lat Pulldown', 'cable', 70, 'back', { compound: true }),
    o('Chin Up', 'bodyweight', 0, 'back', { compound: true, ...bar }),
    o('Pull Up', 'band', 0, 'back', { compound: true, needs: ['band', 'bar'] }),
    o('Pullover', 'dumbbell', 20, 'back'),
    o('Negative Pull Up', 'bodyweight', 0, 'back', { compound: true, ...bar }),
  ],
  rear: [
    o('Face Pull', 'band', 0, 'shoulders'),
    o('Reverse Fly', 'leverageMachine', 40, 'shoulders'),
    o('Reverse Fly', 'dumbbell', 10, 'shoulders'),
  ],
  lateral: [
    o('Lateral Raise', 'dumbbell', 10, 'shoulders'),
    o('Lateral Raise', 'cable', 10, 'shoulders'),
    o('Lateral Raise', 'kettlebell', 10, 'shoulders'),
  ],
  chestIso: [
    o('Chest Fly', 'cable', 20, 'chest'),
    o('Pec Deck', 'leverageMachine', 50, 'chest'),
    o('Chest Fly', 'dumbbell', 15, 'chest'),
    o('Push Up', 'bodyweight', 0, 'chest'),
  ],
  biceps: [
    o('Bicep Curl', 'dumbbell', 15, 'arms'),
    o('Bicep Curl', 'cable', 30, 'arms'),
    o('Hammer Curl', 'dumbbell', 15, 'arms'),
    o('Preacher Curl', 'ezbar', 35, 'arms'),
    o('Bicep Curl', 'barbell', 45, 'arms'),
    o('Chin Up', 'bodyweight', 0, 'arms', bar),
  ],
  triceps: [
    o('Triceps Pushdown', 'cable', 30, 'arms'),
    o('Skullcrusher', 'ezbar', 35, 'arms'),
    o('Triceps Extension', 'dumbbell', 20, 'arms'),
    o('Skullcrusher', 'barbell', 40, 'arms'),
    o('Triceps Dip', 'bodyweight', 0, 'arms', { minLevel: 'some' }),
    o('Diamond Push Up', 'bodyweight', 0, 'arms'),
    o('Bench Dip', 'bodyweight', 0, 'arms'),
  ],
  core: [
    o('Hanging Leg Raise', 'bodyweight', 0, 'core', { ...bar, minLevel: 'some' }),
    o('Cable Crunch', 'cable', 50, 'core'),
    o('Plank', 'bodyweight', 0, 'core', { hold: 45 }),
    o('Dead Bug', 'bodyweight', 0, 'core'),
    o('Ab Wheel', 'bodyweight', 0, 'core', { minLevel: 'some' }),
    o('Side Plank', 'bodyweight', 0, 'core', { hold: 30 }),
    o('Russian Twist', 'bodyweight', 0, 'core'),
  ],
  cond: [
    o('Kettlebell Swing', 'kettlebell', 35, 'glutes', { compound: true }),
    o('Kettlebell Swing', 'dumbbell', 30, 'glutes', { compound: true }),
    o('Burpee', 'bodyweight', 0, 'core', { compound: true, avoid: 'jumping' }),
    o('Jump Squat', 'bodyweight', 0, 'legs', { compound: true, avoid: 'jumping' }),
    o('Mountain Climber', 'bodyweight', 0, 'core', { compound: true }),
  ],
};

/** Liftoscript's "Name, Equipment" for an option. */
export function fullName(option: Option): string {
  return `${option.name}, ${EQUIPMENT_NAMES[option.equipment]}`;
}

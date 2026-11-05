export type Goal = 'muscle' | 'strength' | 'both' | 'fitness';
export type Level = 'new' | 'some' | 'seasoned';
export type Setup = 'gym' | 'homeBarbell' | 'dumbbells' | 'kettlebell' | 'bodyweight';
export type Focus = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'glutes' | 'core';
export type Avoid = 'barbellSquat' | 'floorDeadlift' | 'overhead' | 'jumping';
export type Units = 'lb' | 'kg';

/** What the quiz has collected so far. Unanswered questions are undefined. */
export interface Answers {
  goal?: Goal;
  level?: Level;
  days?: number;
  minutes?: number;
  setup?: Setup;
  focus?: Focus[];
  avoid?: Avoid[];
  units?: Units;
}

/** Liftosaur's equipment keys, plus `bar` for a pull-up bar. */
export type Gear =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'leverageMachine'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'ezbar'
  | 'trapbar'
  | 'bar';

export type Role = 'main' | 'second' | 'acc' | 'core' | 'cond';

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'hingeAcc'
  | 'single'
  | 'quad'
  | 'ham'
  | 'glute'
  | 'calf'
  | 'hpush'
  | 'ipush'
  | 'vpush'
  | 'hpull'
  | 'vpull'
  | 'rear'
  | 'lateral'
  | 'chestIso'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'cond';

/** A day type, used for colour in the week glyph. */
export type DayKind = 'full' | 'upper' | 'lower' | 'push' | 'pull' | 'legs' | 'arms' | 'chestBack' | 'cond';

export interface Slot {
  pattern: Pattern;
  role: Role;
  /** Higher survives when a short session has to drop exercises. */
  prio: number;
}

export interface TemplateDay {
  name: string;
  kind: DayKind;
  slots: Slot[];
}

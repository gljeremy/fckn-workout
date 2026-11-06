import type { DayKind } from './types';

/** Which weekdays (0 = Monday) a routine with this many days trains on. */
export const TRAINING_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

export const KIND_LABEL: Record<DayKind, string> = {
  full: 'Full body',
  upper: 'Upper',
  lower: 'Lower',
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  arms: 'Arms & shoulders',
  chestBack: 'Chest & back',
  cond: 'Strength + conditioning',
};

import type { DateId } from './date';

export type Container = {
  left: number;
  right: number;
  width: number;
};

export enum Handles {
  START = 'start',
  END = 'end'
}

export enum ExerciseVariant {
  STRENGTH = 'Strength',
  CARDIO = 'Cardio',
  MOBILITY = 'Mobility'
}

export enum ActivityVariant {
  DEFAULT = 'Default',
  EXERCISE = 'Exercise'
}

export type ExerciseSet = {
  idx: number;
  reps?: number;
  weight?: number;
  rest?: number;
  duration?: number;
};

export type ExerciseSplit = {
  idx: number;
  distance: number;
  duration: number;
};

export type ExerciseStrength = {
  variant: ExerciseVariant.STRENGTH;
  title: string;
  sets: ExerciseSet[];
};

export type ExerciseMobility = {
  variant: ExerciseVariant.MOBILITY;
  title: string;
  sets: ExerciseSet[];
};

export type ExerciseCardio = {
  variant: ExerciseVariant.CARDIO;
  title: string;
  duration: number;
  distance: number;
  splits: ExerciseSplit[];
};

export type Exercise = ExerciseStrength | ExerciseMobility | ExerciseCardio;

export type ActivityData = {
  exercise?: Exercise[];
};

export type Activity = {
  id: string;
  title: string;
  variant: ActivityVariant;
  group: string;
  notes?: string;
  start: string;
  end: string;
  timezone: number;
  data?: ActivityData;
  createdAt: string;
  user: string;
  v: number;
};

export type GetActivitiesParams = {
  variant?: ActivityVariant;
  title?: string;
  group?: string;
  start?: string;
  end?: string;
  timezone?: number;
};

export type PostActivityArgs = {
  title: string;
  variant: ActivityVariant;
  group: string;
  notes?: string;
  start: string;
  end: string;
  timezone: number;
  data?: ActivityData;
  color: string;
  createdAt: string;
  user: string;
  id: string;
  v: number;
};

export type PostActivityPayload = {
  title: string;
  variant: ActivityVariant;
  group: string;
  notes?: string;
  start: string;
  end: string;
  timezone: number;
  data?: ActivityData;
  color?: string;
};

export type PatchActivityArgs = {
  id: string;
  title: string;
  variant: ActivityVariant;
  group: string;
  notes?: string;
  start: string;
  end: string;
  timezone: number;
  data?: ActivityData;
  color: string;
  createdAt: string;
  user: string;
  v: number;
};

export type PatchActivityParams = string;
export type PatchActivityPayload = {
  title: string;
  variant: ActivityVariant;
  group: string;
  notes?: string;
  start: string;
  end: string;
  timezone: number;
  data?: ActivityData;
  color?: string;
  v?: number;
};

export type DeleteActivityParams = { id: string };

type DerivedProperties = {
  dateId: DateId;
  startPercentage: number;
  endPercentage: number;
  width: number;
  style: string;
  isStart: boolean;
  isEnd: boolean;
};

export type FormattedActivity = Activity & DerivedProperties;

export type FormattedActivities = {
  [key: DateId]: {
    ids: FormattedActivity['id'][];
    items: Record<FormattedActivity['id'], FormattedActivity>;
  };
};

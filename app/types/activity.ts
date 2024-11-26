import type { DateId } from './date';

export enum ExerciseVariant {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  MOBILITY = 'mobility'
}

export enum ActivityVariant {
  DEFAULT = 'Default',
  EXERCISE = 'Exercise'
}

type ExerciseSet = {
  idx: number;
  reps?: number;
  weight?: number;
  rest?: number;
  duration?: number;
};

type ExerciseSplit = {
  idx: number;
  distance: number;
  duration: number;
};

type ExerciseStrength = {
  title: string;
  sets: ExerciseSet[];
};

type ExerciseMobility = {
  title: string;
  sets: ExerciseSet[];
};

type ExerciseCardio = {
  title: string;
  duration: number;
  distance: number;
  splits: ExerciseSplit[];
};

type Exercise = ExerciseStrength | ExerciseMobility | ExerciseCardio;

type ActivityData = {
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

export type ActivityDefaultForm = {
  title: string;
  variant: ActivityVariant.DEFAULT;
  group: string;
  notes: string;
  start: string;
  end: string;
  timezone: number;
  color: string;
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
  color?: string;
  createdAt?: string;
  user?: string;
  id?: string;
  v?: number;
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
  color?: string;
  createdAt?: string;
  user?: string;
  v?: number;
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

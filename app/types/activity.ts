import type { DateId } from './date';

export enum ExerciseType {
  WORKOUT = 'workout',
  CARDIO = 'cardio',
  MOBILITY = 'mobility'
}

export enum ActivityContext {
  FORM = 'form'
}

type ExerciseSet<T extends ActivityContext.FORM | undefined = undefined> =
  T extends undefined
    ? {
        idx: number;
        reps?: number;
        weight?: number;
        rest?: number;
        duration?: number;
      }
    : {
        reps?: string;
        weight?: string;
        rest?: string;
        duration?: string;
      };

type ExerciseSplit<T extends ActivityContext.FORM | undefined = undefined> =
  T extends undefined
    ? {
        idx: number;
        pace: number;
      }
    : {
        pace: string;
      };

export type ExerciseWorkout<
  T extends ActivityContext.FORM | undefined = undefined
> = {
  title: string;
  sets: ExerciseSet<T>[];
};

export type ExerciseCardio<
  T extends ActivityContext.FORM | undefined = undefined
> = {
  title: string;
  duration: T extends undefined ? number : string;
  distance: T extends undefined ? number : string;
  splits: ExerciseSplit<T>[];
};

export type ExerciseMobility<
  T extends ActivityContext.FORM | undefined = undefined
> = {
  title: string;
  sets: ExerciseSet<T>[];
};

export enum ActivityVariant {
  DEFAULT = 'Default',
  EXERCISE = 'Exercise'
}

type Exercise<T extends ActivityContext.FORM | undefined = undefined> =
  | ExerciseWorkout<T>[]
  | ExerciseCardio<T>
  | ExerciseMobility<T>[]
  | undefined;

type ServerProperties = {
  createdAt: string;
  user: string;
  v: number;
};

export type ActivityBase<
  T extends Exercise<U> | undefined = undefined,
  U extends ActivityContext.FORM | undefined = undefined
> = {
  id: string;
  title: string;
  variant: ActivityVariant;
  group?: string;
  notes?: string;
  start: string;
  end: string;
  timezone: number;
} & (T extends undefined
  ? {}
  : {
      data: { exercise: T };
    }) &
  (U extends undefined ? ServerProperties : {});

export type Activity<
  T extends ExerciseType | undefined = undefined,
  U extends ActivityContext.FORM | undefined = undefined
> = T extends ExerciseType.WORKOUT
  ? ActivityBase<ExerciseWorkout<U>[], U>
  : T extends ExerciseType.CARDIO
  ? ActivityBase<ExerciseCardio<U>, U>
  : T extends ExerciseType.MOBILITY
  ? ActivityBase<ExerciseMobility<U>[], U>
  : ActivityBase<undefined, U>;

type ExtraProperties = {
  dateId: DateId;
  startPercentage: number;
  endPercentage: number;
  width: number;
  style: string;
  isStart: boolean;
  isEnd: boolean;
};

export type FormattedActivity<
  T extends ExerciseType | undefined = undefined,
  U extends ActivityContext.FORM | undefined = undefined
> = Activity<T, U> &
  (U extends ActivityContext.FORM ? Partial<ExtraProperties> : ExtraProperties);

export type FormattedActivities = {
  [key: DateId]: {
    ids: FormattedActivity['id'][];
    items: Record<FormattedActivity['id'], FormattedActivity>;
  };
};

export type PostActivityPayload = Omit<
  | Activity<undefined, ActivityContext.FORM>
  | Activity<ExerciseType.CARDIO, ActivityContext.FORM>
  | Activity<ExerciseType.MOBILITY, ActivityContext.FORM>
  | Activity<ExerciseType.WORKOUT, ActivityContext.FORM>,
  'id'
> & { color: string };

export type PatchActivityPayload = Pick<
  | Activity<undefined, ActivityContext.FORM>
  | Activity<ExerciseType.CARDIO, ActivityContext.FORM>
  | Activity<ExerciseType.MOBILITY, ActivityContext.FORM>
  | Activity<ExerciseType.WORKOUT, ActivityContext.FORM>,
  'id'
> &
  Partial<
    Omit<
      | Activity<undefined, ActivityContext.FORM>
      | Activity<ExerciseType.CARDIO, ActivityContext.FORM>
      | Activity<ExerciseType.MOBILITY, ActivityContext.FORM>
      | Activity<ExerciseType.WORKOUT, ActivityContext.FORM>,
      'id'
    >
  > & { color: string };

export type DeleteActivityPayload = Pick<Activity, 'id'>;

export type ActivityPayload<
  T extends 'create' | 'update' | 'delete' | undefined = undefined
> = T extends 'create'
  ? PostActivityPayload
  : T extends 'update'
  ? PatchActivityPayload
  : T extends 'delete'
  ? DeleteActivityPayload
  : any;

type ExerciseSet<T extends 'form' | undefined = undefined> = T extends undefined
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

type ExerciseSplit<T extends 'form' | undefined = undefined> =
  T extends undefined
    ? {
        idx: number;
        pace: number;
      }
    : {
        pace: string;
      };

export type ExerciseWorkout<T extends 'form' | undefined = undefined> = {
  title: string;
  sets: ExerciseSet<T>[];
};

export type ExerciseCardio<T extends 'form' | undefined = undefined> = {
  title: string;
  duration: T extends undefined ? number : string;
  distance: T extends undefined ? number : string;
  splits: ExerciseSplit<T>[];
};

export type ExerciseMobility<T extends 'form' | undefined = undefined> = {
  title: string;
  sets: ExerciseSet<T>[];
};

export type ActivityVariant = 'Default' | 'Exercise';

type Exercise<T extends 'form' | undefined = undefined> =
  | ExerciseWorkout<T>[]
  | ExerciseCardio<T>
  | ExerciseMobility<T>[]
  | undefined;

export type ActivityBase<
  T extends Exercise<U> | undefined = undefined,
  U extends 'form' | undefined = undefined
> = {
  id: string;
  title: string;
  variant: ActivityVariant;
  group?: string;
  notes?: string;
  start: string;
  end: string;
  timezone: number;
  createdAt: string;
  user: string;
  v: number;
} & (T extends undefined
  ? {}
  : {
      data: { exercise: T };
    });

export type Activity<
  T extends 'workout' | 'cardio' | 'mobility' | undefined = undefined,
  U extends 'form' | undefined = undefined
> = T extends 'workout'
  ? ActivityBase<ExerciseWorkout<U>[], U>
  : T extends 'cardio'
  ? ActivityBase<ExerciseCardio<U>, U>
  : T extends 'mobility'
  ? ActivityBase<ExerciseMobility<U>[], U>
  : ActivityBase;

export type FormattedActivity<
  T extends 'workout' | 'cardio' | 'mobility' | undefined = undefined,
  U extends 'form' | undefined = undefined
> = Activity<T, U> & {
  dateId: string; // yyyy-mm-dd
  startPercentage: number;
  endPercentage: number;
  width: number;
  style: string;
  isStart: boolean;
  isEnd: boolean;
};

export type PostActivityPayload = Omit<
  | (Activity & { data?: undefined })
  | Activity<'cardio'>
  | Activity<'mobility'>
  | Activity<'workout'>,
  'id'
>;

export type PatchActivityPayload = Pick<
  | (Activity & { data?: undefined })
  | Activity<'cardio'>
  | Activity<'mobility'>
  | Activity<'workout'>,
  'id'
> &
  Partial<
    Omit<
      | (Activity & { data?: undefined })
      | Activity<'cardio'>
      | Activity<'mobility'>
      | Activity<'workout'>,
      'id'
    >
  >;

export type DeleteActivityPayload = Pick<Activity, 'id'>;

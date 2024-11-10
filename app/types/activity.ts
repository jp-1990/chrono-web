// pub title: String,
// pub variant: ActivityVariant, // 'default' | 'exercise'
// pub group: Option<String>,
// pub notes: Option<String>,
// pub start: String,
// pub end: String,
// pub timezone: i8,
// pub data: Option<ActivityData>, // 'exercise': // [ ]
//
// #[derive(Clone, Debug, Serialize, Deserialize)]
// pub struct StrengthExercise {
//     pub title: String,
//     pub sets: Vec<Set>,
// }
//
// #[derive(Clone, Debug, Serialize, Deserialize)]
// pub struct MobilityExercise {
//     pub title: String,
//     pub sets: Vec<Set>,
// }
//
// #[derive(Clone, Debug, Serialize, Deserialize)]
// pub struct CardioExercise {
//     pub title: String,
//     pub duration: u32,
//     pub distance: u32,
// }
//
//pub struct Set {
//     pub idx: u8,
//     #[serde(skip_serializing_if = "Option::is_none")]
//     pub reps: Option<u32>,
//     #[serde(skip_serializing_if = "Option::is_none")]
//     pub weight: Option<u32>,
//     #[serde(skip_serializing_if = "Option::is_none")]
//     pub rest: Option<u32>,
//     #[serde(skip_serializing_if = "Option::is_none")]
//     pub duration: Option<u32>,
// }

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

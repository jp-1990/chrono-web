import { add } from 'date-fns';
import {
  watch,
  toRaw,
  type ComputedRef,
  type Ref,
  type UnwrapRef,
  ref,
  computed
} from 'vue';
import { DEFAULT_COLOR } from '~/constants/colors';
import {
  ActivityVariant,
  ExerciseVariant,
  type Activity,
  type ActivityData,
  type PatchActivityArgs,
  type PostActivityArgs
} from '~/types/activity';
import type { DerivedActivities } from '~/utils/activity';
import { applyTZOffset } from '~/utils/date';
import { logging } from '~/utils/logging';
import { db, useUserState } from './state';
import { apiRequest } from '~/utils/api-request';
import {
  deleteActivity,
  patchActivity,
  postActivity
} from '~/utils/api-activity';

type FormStateData = {
  title: string | undefined;
  variant: ActivityVariant;
  group: string | undefined;
  notes: string | undefined;
  start: string;
  end: string;
  timezone: number;
  data: ActivityData | undefined;
  color: string;
  id: string | undefined;
};

type FormStateValid = {
  title: boolean | undefined;
  group: boolean | undefined;
  end: boolean | undefined;
  start: boolean | undefined;
};

type FormState = {
  data: FormStateData;
  valid: FormStateValid;
};

function getDefaultStartDate() {
  return applyTZOffset(new Date()).toISOString().slice(0, -8);
}

function getDefaultEndDate() {
  return applyTZOffset(add(new Date(), { minutes: 5 }))
    .toISOString()
    .slice(0, -8);
}

function getTimezoneOffset() {
  return new Date().getTimezoneOffset();
}

function unrefFormState<T extends Ref<any>>(input: T): UnwrapRef<T> {
  const output: any = { data: {}, valid: {} };

  const primativeKeys = [
    'id',
    'title',
    'variant',
    'group',
    'notes',
    'start',
    'end',
    'timezone',
    'color'
  ];

  const objectKeys = ['data'];

  for (const key of primativeKeys) {
    const value = input.value.data[key];
    output.data[key] = value;
  }

  for (const key of objectKeys) {
    const value = toRaw(input.value.data)[key];
    if (value?.exercise) {
      output.data.data ??= {};
      output.data.data.exercise = structuredClone(value.exercise);
    }
  }

  for (const key of Object.keys(input.value.valid)) {
    const value = input.value.valid[key];
    output.valid[key] = value;
  }

  return output;
}

function preparePayload<T extends 'create' | 'update'>(
  mode: T,
  payload: FormState,
  userId: string
) {
  const output = payload.data as any;
  output.start = new Date(output.start).toISOString().replace('.000Z', 'Z');
  output.end = new Date(output.end).toISOString().replace('.000Z', 'Z');
  output.createdAt = new Date().toISOString();
  output.user = userId;
  output.v = 1;

  if (payload.data.data?.exercise) {
    const preparedExercises: any[] = [];

    for (const exercise of payload.data.data.exercise) {
      const preparedExercise = { ...exercise } as any;
      if (preparedExercise.duration) {
        preparedExercise.duration = parseInt(preparedExercise.duration, 10);
      }
      if (preparedExercise.distance) {
        preparedExercise.distance = parseInt(preparedExercise.distance, 10);
      }
      if (preparedExercise.splits) {
        preparedExercise.splits = preparedExercise.splits.map(
          (e: any, i: number) => {
            return {
              idx: i,
              distance: isNaN(parseInt(e.distance, 10))
                ? undefined
                : parseInt(e.distance, 10),
              duration: isNaN(parseInt(e.duration, 10))
                ? undefined
                : parseInt(e.duration, 10)
            };
          }
        );
      }
      if (preparedExercise.sets) {
        preparedExercise.sets = preparedExercise.sets.map(
          (e: any, i: number) => {
            return {
              idx: i,
              reps: isNaN(parseInt(e.reps, 10))
                ? undefined
                : parseInt(e.reps, 10),
              weight: isNaN(parseInt(e.weight, 10))
                ? undefined
                : parseInt(e.weight, 10),
              rest: isNaN(parseInt(e.rest, 10))
                ? undefined
                : parseInt(e.rest, 10),
              duration: isNaN(parseInt(e.duration, 10))
                ? undefined
                : parseInt(e.duration, 10)
            };
          }
        );
      }

      preparedExercises.push(preparedExercise);
    }

    output.data.exercise = preparedExercises;
  }

  switch (mode) {
    case 'create': {
      return output as PostActivityArgs;
    }
    case 'update': {
      return output as PatchActivityArgs;
    }
  }
}

function validatePayload(payload: FormState) {
  const formStateValid = !Object.values(payload.valid).some((e) => e === false);
  if (!formStateValid) {
    logging.error({
      message: '[ActivityDefault:onSubmit]: invalid form state'
    });
    return false;
  }
  return true;
}

// todo: how do we handle this?
function detectDrift(a: Object, b: Object) {
  let drift = false;
  // for (const key of Object.keys(a)) {
  //   if (key === 'createdAt' || key === 'id') continue;
  //   if (a[key] !== b[key]) {
  //     drift = true;
  //     break;
  //   }
  // }

  // if (drift) {
  //   logging.error({
  //     message: '[ActivityDefault:onSubmit]: response does not match payload'
  //   });
  // }

  return drift;
}

export const getExerciseDefaultValue = {
  [ExerciseVariant.STRENGTH]: function () {
    return {
      variant: ExerciseVariant.STRENGTH,
      title: undefined,
      sets: [{ idx: 0, reps: undefined, weight: undefined }]
    };
  },
  [ExerciseVariant.MOBILITY]: function () {
    return {
      variant: ExerciseVariant.MOBILITY,
      title: undefined,
      sets: [{ idx: 0, duration: undefined }]
    };
  },
  [ExerciseVariant.CARDIO]: function () {
    return {
      variant: ExerciseVariant.CARDIO,
      title: undefined,
      duration: undefined,
      distance: undefined,
      splits: []
    };
  }
} as const;

type UseActivityFormArgs = {
  activity: ComputedRef<Activity | undefined>;
  derivedActivities: ComputedRef<DerivedActivities | null | undefined>;
  mode: ComputedRef<'create' | 'update' | undefined>;
  onClose: (event: MouseEvent | KeyboardEvent) => void;
  variant: ActivityVariant;
  exerciseVariant?: ExerciseVariant;
};

export function useActivityForm({
  activity,
  derivedActivities,
  mode,
  onClose,
  variant,
  exerciseVariant
}: UseActivityFormArgs) {
  const { user, updateUserActivityColor } = useUserState();

  watch(activity, (activity) => {
    if (activity && mode.value !== undefined) {
      formState.value.data.id = activity.id;
      formState.value.data.title = activity.title;
      formState.value.data.group = activity.group;
      formState.value.data.notes = activity.notes;
      formState.value.data.timezone = activity.timezone;
      formState.value.data.data = activity.data;

      formState.value.data.color =
        user.value.activities[activity.title] ?? DEFAULT_COLOR;
      formState.value.data.start = applyTZOffset(new Date(activity.start))
        .toISOString()
        .slice(0, -8);
      formState.value.data.end = applyTZOffset(new Date(activity.end))
        .toISOString()
        .slice(0, -8);
    }
  });

  watch(mode, (mode) => {
    resetFormState();
    if (mode === 'create' || mode === 'update') {
      if (exerciseVariant && !formState.value.data.data?.exercise?.length) {
        formState.value.data.data!.exercise = [
          getExerciseDefaultValue[exerciseVariant]() as any
        ];
      }
    }
  });

  const formState = ref({
    data: {
      id: undefined as string | undefined,
      title: undefined as string | undefined,
      variant,
      group: undefined as string | undefined,
      notes: undefined as string | undefined,
      start: getDefaultStartDate(),
      end: getDefaultEndDate(),
      timezone: getTimezoneOffset(),
      color: DEFAULT_COLOR,
      data: undefined as ActivityData | undefined
    },
    valid: {
      title: undefined as boolean | undefined,
      group: undefined as boolean | undefined,
      notes: undefined as boolean | undefined,
      start: undefined as boolean | undefined,
      end: undefined as boolean | undefined
    }
  });

  function setExerciseDefaultState() {
    formState.value.data.color = user.value.activities['Exercise'] ?? '#04da00';
    formState.value.data.title = exerciseVariant ?? 'Exercise';
    formState.value.data.variant = ActivityVariant.EXERCISE;
    formState.value.data.group = 'Exercise';
    formState.value.data.data = { exercise: [] };
  }

  function resetFormState() {
    formState.value.data.id = undefined;
    formState.value.data.title = undefined;
    formState.value.data.variant = variant;
    formState.value.data.group = undefined;
    formState.value.data.notes = undefined;
    formState.value.data.start = getDefaultStartDate();
    formState.value.data.end = getDefaultEndDate();
    formState.value.data.timezone = getTimezoneOffset();
    formState.value.data.color = DEFAULT_COLOR;
    formState.value.data.data = undefined;

    if (variant === ActivityVariant.EXERCISE) {
      setExerciseDefaultState();
    }

    formState.value.valid.title = undefined;
    formState.value.valid.group = undefined;
    formState.value.valid.notes = undefined;
    formState.value.valid.start = undefined;
    formState.value.valid.end = undefined;
  }

  const formStateValid = computed(() => {
    return !Object.values(formState.value.valid).some((e) => e === false);
  });

  async function onSubmit(event: MouseEvent | KeyboardEvent) {
    // todo: validate payload
    const unrefedData = unrefFormState(formState);

    switch (mode.value) {
      case 'create': {
        const validPayload = validatePayload(unrefedData);
        if (!validPayload) return;

        const preparedPayload = preparePayload(
          'create',
          unrefedData,
          user.value.id
        );
        if (!preparedPayload) return;

        const tempId = `temp-${preparedPayload.start}${preparedPayload.end}`;
        preparedPayload.id = tempId;

        derivedActivities.value?.createActivity(preparedPayload, tempId);
        const prevColor =
          user.value.activities[preparedPayload.title] ?? DEFAULT_COLOR;
        updateUserActivityColor(preparedPayload.title, preparedPayload.color);

        apiRequest(postActivity, preparedPayload).then((response) => {
          if (response.data) {
            // todo: what do we do if there is drift?
            let dataDrift = false;
            if (navigator.onLine) {
              dataDrift = detectDrift(response.data, preparedPayload);
            }
            if (!navigator.onLine) {
              response.data.id = `${response.data.id}-offline`;
            }

            if (!dataDrift) {
              derivedActivities.value?.deleteActivity(tempId);
              derivedActivities.value?.createActivity(response.data as any);
              db.activities.delete({ id: tempId });
              db.activities.add(response.data);
            }
          }

          // rollback local changes
          if (response.error) {
            derivedActivities.value?.deleteActivity(tempId);
            db.activities.delete({ id: tempId });
            updateUserActivityColor(preparedPayload.title, prevColor);
          }
        });

        break;
      }
      case 'update': {
        if (!unrefedData.data.id) return;

        const prevValues = await db.activities.findById({
          id: unrefedData.data.id
        });

        const validPayload = validatePayload(unrefedData);
        if (!validPayload) return;

        const preparedPayload = preparePayload(
          'update',
          unrefedData,
          user.value.id
        );
        if (!preparedPayload) return;

        derivedActivities.value?.updateActivity(preparedPayload);
        const prevColor =
          user.value.activities[preparedPayload.title] ?? DEFAULT_COLOR;
        updateUserActivityColor(preparedPayload.title, preparedPayload.color);

        apiRequest(patchActivity, preparedPayload).then((response) => {
          // todo: what do we do if there is drift?
          // if (response.data && navigator.onLine) {
          //   // confirm that the response from the server matches what we sent
          //   const dataDrift = detectDrift(response.data, validPayload);
          // }

          // rollback local changes
          if (response.error) {
            derivedActivities.value?.updateActivity(prevValues as any);
            db.activities.put(prevValues);
            updateUserActivityColor(preparedPayload.title, prevColor);
          }
        });

        break;
      }
    }
    onClose(event);
  }

  async function onDelete(event: MouseEvent | KeyboardEvent) {
    if (!formState.value.data.id) return;

    const prevValues = await db.activities.findById({
      id: formState.value.data.id
    });

    derivedActivities.value?.deleteActivity(formState.value.data.id);

    apiRequest(deleteActivity, {
      id: formState.value.data.id
    }).then((response) => {
      // rollback local changes
      if (response.error) {
        derivedActivities.value?.createActivity(
          prevValues as any,
          prevValues.id
        );
        db.activities.add(prevValues);
      }
    });

    onClose(event);
  }

  return {
    formState,
    formStateValid,
    resetFormState,
    onSubmit,
    onDelete
  };
}

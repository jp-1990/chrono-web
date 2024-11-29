import type { DerivedActivities } from '#build/imports';
import { add } from 'date-fns';
import { DEFAULT_COLOR } from '~/constants/colors';
import type {
  Activity,
  ActivityData,
  ActivityVariant,
  PatchActivityArgs,
  PostActivityArgs
} from '~/types/activity';

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

function validatePayload<T extends 'create' | 'update'>(
  mode: T,
  payload: FormState,
  userId: string
) {
  const formStateValid = !Object.values(payload.valid).some((e) => e === false);
  if (!formStateValid) {
    logging.error({
      message: '[ActivityDefault:onSubmit]: response does not match payload'
    });
    return;
  }

  switch (mode) {
    case 'create': {
      const output = payload.data as any as PostActivityArgs;
      output.start = new Date(output.start).toISOString().replace('.000Z', 'Z');
      output.end = new Date(output.end).toISOString().replace('.000Z', 'Z');
      output.createdAt = new Date().toISOString();
      output.user = userId;
      output.v = 1;

      return output;
    }
    case 'update': {
      const output = payload.data as any as PatchActivityArgs;
      output.start = new Date(output.start).toISOString().replace('.000Z', 'Z');
      output.end = new Date(output.end).toISOString().replace('.000Z', 'Z');
      output.createdAt = new Date().toISOString();
      output.user = userId;
      output.v = 1;

      return output;
    }
  }
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

type UseActivityFormArgs = {
  activity: ComputedRef<Activity | undefined>;
  derivedActivities: DerivedActivities | null | undefined;
  mode: ComputedRef<'create' | 'update' | undefined>;
  onClose: (event: MouseEvent | KeyboardEvent) => void;
  variant: ActivityVariant;
};

export function useActivityForm({
  activity,
  derivedActivities,
  mode,
  onClose,
  variant
}: UseActivityFormArgs) {
  const { user, updateUserActivityColor } = useUserState();

  watch(activity, (activity) => {
    resetFormState();
    if (activity && mode.value !== undefined) {
      formState.value.data.id = activity.id;
      formState.value.data.title = activity.title;
      formState.value.data.group = activity.group;
      formState.value.data.notes = activity.notes;
      formState.value.data.timezone = activity.timezone;
      formState.value.data.data = activity.data;

      formState.value.data.color = user.value.activities[activity.title];
      formState.value.data.start = applyTZOffset(new Date(activity.start))
        .toISOString()
        .slice(0, -8);
      formState.value.data.end = applyTZOffset(new Date(activity.end))
        .toISOString()
        .slice(0, -8);
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
  }

  const formStateValid = computed(() => {
    return !Object.values(formState.value.valid).some((e) => e === false);
  });

  async function onSubmit(event: MouseEvent | KeyboardEvent) {
    // todo: validate & prepare payload
    const unrefedData = {
      data: { ...unref(formState).data },
      valid: { ...unref(formState).valid }
    };

    switch (mode.value) {
      case 'create': {
        const validPayload = validatePayload(
          'create',
          unrefedData,
          user.value.id
        );
        if (!validPayload) return;

        const tempId = `temp-${validPayload.start}${validPayload.end}`;
        validPayload.id = tempId;

        derivedActivities?.createActivity(validPayload, tempId);
        const prevColor = user.value.activities[validPayload.title];
        updateUserActivityColor(validPayload.title, validPayload.color);

        const response = await apiRequest(postActivity, validPayload);

        if (response.data) {
          // todo: what do we do if there is drift?
          let dataDrift = false;
          if (navigator.onLine) {
            dataDrift = detectDrift(response.data, validPayload);
          }
          if (!navigator.onLine) {
            response.data.id = `${response.data.id}-offline`;
          }

          if (!dataDrift) {
            derivedActivities?.replaceTempIdWithId(response.data.id, tempId);
            db.activities.delete({ id: tempId });
            db.activities.add(response.data);
          }
        }

        // rollback local changes
        if (response.error) {
          derivedActivities?.deleteActivity(tempId);
          db.activities.delete({ id: tempId });
          updateUserActivityColor(validPayload.title, prevColor);
        }

        break;
      }
      case 'update': {
        if (!unrefedData.data.id) return;

        const prevValues = await db.activities.findById({
          id: unrefedData.data.id
        });

        const validPayload = validatePayload(
          'update',
          unrefedData,
          user.value.id
        );
        if (!validPayload) return;

        derivedActivities?.updateActivity(validPayload);
        const prevColor = user.value.activities[validPayload.title];
        updateUserActivityColor(validPayload.title, validPayload.color);

        const response = await apiRequest(patchActivity, validPayload);

        // todo: what do we do if there is drift?
        // if (response.data && navigator.onLine) {
        //   // confirm that the response from the server matches what we sent
        //   const dataDrift = detectDrift(response.data, validPayload);
        // }

        // rollback local changes
        if (response.error) {
          derivedActivities?.updateActivity(prevValues as any);
          db.activities.put(prevValues);
          updateUserActivityColor(validPayload.title, prevColor);
        }

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

    derivedActivities?.deleteActivity(formState.value.data.id);

    const response = await apiRequest(deleteActivity, {
      id: formState.value.data.id
    });

    // rollback local changes
    if (response.error) {
      derivedActivities?.createActivity(prevValues as any, prevValues.id);
      db.activities.add(prevValues);
    }

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

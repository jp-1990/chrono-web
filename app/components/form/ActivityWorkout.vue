<template>
  <side-panel
    :id="scope"
    :is-open="!!props.mode"
    @on-close="onClose"
    @on-submit="onSubmit"
    @on-extra="onDelete"
  >
    <template v-slot:title-text>{{
      props.mode === 'update' ? 'Update Session' : 'Add Session'
    }}</template>
    <template v-slot:description-text>Record a workout session</template>
    <template v-slot:description-extra v-if="props.mode === 'update'"
      >[ Current Duration:{{ duration.hours ? ` ${duration.hours}h` : '' }}
      {{ duration.minutes ? ` ${duration.minutes}m` : '' }}
      ]</template
    >
    <template v-slot:content>
      <div class="flex justify-between mb-1">
        <form-input-datetime
          ref="startDateRef"
          v-model:value="formState.data.start"
          v-model:valid="formState.valid.startDate"
          label="Start"
          required
          :validators="[validateStartDate]"
        />

        <form-input-datetime
          v-model:value="formState.data.end"
          v-model:valid="formState.valid.endDate"
          label="End"
          required
          :validators="[validateEndDate]"
        />
      </div>

      <section class="flex flex-col">
        <div
          v-for="(exercise, exerciseIndex) in formState.data.data.exercise"
          class="flex flex-col"
        >
          <FormExerciseStrength
            v-if="exercise.variant === ExerciseVariant.STRENGTH"
            :index="exerciseIndex"
            :data="exercise"
            :show-add-exercise="
              exerciseIndex === formState.data.data?.exercise?.length - 1
            "
            :scope="scope"
            @add-exercise="addExercise"
            @remove-exercise="removeExercise"
          />

          <FormExerciseCardio
            v-if="exercise.variant === ExerciseVariant.CARDIO"
            :index="exerciseIndex"
            :data="exercise"
            :show-add-exercise="
              exerciseIndex === formState.data.data?.exercise?.length - 1
            "
            :scope="scope"
            @add-exercise="addExercise"
            @remove-exercise="removeExercise"
          />

          <FormExerciseMobility
            v-if="exercise.variant === ExerciseVariant.MOBILITY"
            :index="exerciseIndex"
            :data="exercise"
            :show-add-exercise="
              exerciseIndex === formState.data.data?.exercise?.length - 1
            "
            :scope="scope"
            @add-exercise="addExercise"
            @remove-exercise="removeExercise"
          />
        </div>
      </section>

      <form-input-textarea
        v-model:value="formState.data.notes"
        v-model:valid="formState.valid.notes"
        label="Notes"
        placeholder="Notes"
      />

      <span class="h-4" />
    </template>
    <template v-if="props.mode === 'update'" v-slot:extra-button-text>
      <delete-icon :size="20" class="text-slate-700 mr-1.5" />
      Delete
      <span class="ml-2" />
    </template>
    <template v-slot:submit-text>
      <check-icon
        v-if="props.mode === 'update'"
        :size="20"
        class="text-slate-50 mr-1.5"
      />
      <add-icon
        v-if="props.mode === 'create'"
        :size="20"
        class="text-slate-50 mr-1.5"
      />
      {{ `${props.mode === 'update' ? 'Update' : 'Create'} Session` }}
      <span class="ml-2" />
    </template>
  </side-panel>
</template>

<script setup lang="ts">
import AddIcon from 'vue-material-design-icons/Plus.vue';
import CheckIcon from 'vue-material-design-icons/Check.vue';
import DeleteIcon from 'vue-material-design-icons/Delete.vue';
import { watch, nextTick } from 'vue';
import { add } from 'date-fns';
import type { Validation } from '~/types/form';
import {
  ActivityVariant,
  ExerciseVariant,
  type Activity
} from '~/types/activity';
import type { DerivedActivities } from '~/utils/activity';
import FormExerciseStrength from './FormExerciseStrength.vue';
import FormExerciseMobility from './FormExerciseMobility.vue';

const { user } = useUserState();

const scope = 'form-activity-workout';

const props = defineProps<{
  mode: 'create' | 'update' | undefined;
  data?: Activity;
  activities?: DerivedActivities | null;
}>();
const emit = defineEmits<{
  (
    e: 'onClose',
    v: MouseEvent | KeyboardEvent,
    reason: 'submit' | 'cancel'
  ): void;
}>();

const startDateRef = ref<HTMLElement | null>(null);

watch(props, (props) => {
  // resetFormState();
  if (!!props.mode) {
    startDateRef.value?.focus();

    // todo:: does incoming data work?
    if (props.mode === 'update' && props.data) {
      formState.value.data = {
        ...formState.value.data,
        ...props.data,
        start: applyTZOffset(new Date(props.data.start))
          .toISOString()
          .slice(0, -8),
        end: applyTZOffset(new Date(props.data.end)).toISOString().slice(0, -8)
      };
    }
  }
});

const getExerciseDefaultValue = {
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
      splits: [{ idx: 0, duration: undefined, distance: undefined }]
    };
  }
} as const;

async function addExercise(variant: ExerciseVariant) {
  formState.value.data.data.exercise.push(getExerciseDefaultValue[variant]());
  await nextTick();
  const el: HTMLInputElement | null = document.querySelector(
    `#${scope}-exercise-${formState.value.data.data.exercise.length - 1}`
  );
  el?.focus();
}

function removeExercise(index: number) {
  formState.value.data.data.exercise =
    formState.value.data.data.exercise.filter((_, i) => i !== index);
}

const formState = ref<{
  data: Activity;
  valid: Validation;
}>({
  data: {
    id: '',
    title: 'workout',
    variant: ActivityVariant.EXERCISE,
    group: 'exercise',
    notes: '',
    start: applyTZOffset(new Date(Date.now())).toISOString().slice(0, -8),
    end: applyTZOffset(add(new Date(Date.now()), { minutes: 5 }))
      .toISOString()
      .slice(0, -8),
    timezone: new Date().getTimezoneOffset(),
    data: {
      exercise: [
        {
          variant: ExerciseVariant.STRENGTH,
          title: '',
          sets: [{ idx: 0, reps: undefined, weight: undefined }]
        }
      ]
    }
  },
  valid: {
    title: undefined as boolean | undefined,
    startDate: undefined as boolean | undefined,
    endDate: undefined as boolean | undefined
  }
});

const duration = computed(() => {
  return millisecondsToHoursAndMinutes(
    new Date(formState.value.data.end).getTime() -
      new Date(formState.value.data.start).getTime()
  );
});

function resetFormState() {
  formState.value.data.id = '';
  formState.value.data.notes = '';
  formState.value.data.start = applyTZOffset(new Date(Date.now()))
    .toISOString()
    .slice(0, -8);
  formState.value.data.end = applyTZOffset(
    add(new Date(Date.now()), { minutes: 5 })
  )
    .toISOString()
    .slice(0, -8);

  formState.value.valid.title = undefined;
  formState.value.valid.startDate = undefined;
  formState.value.valid.endDate = undefined;

  formState.value.data.data.exercise = [
    {
      variant: 'Strength',
      title: '',
      sets: [{ reps: undefined, weight: undefined }]
    }
  ];
}

function validateStartDate(v: string) {
  // todo:: validate
  return true;
}

function validateEndDate(v: string) {
  // todo:: validate
  return true;
}

async function onSubmit(event: MouseEvent | KeyboardEvent) {
  // todo: validate & prepare payload
  const unrefedData = toRaw(unref(formState)).data;

  const data = {
    exercise: unrefedData.data.exercise.map((e) => {
      return {
        variant: e.variant,
        title: e.title,
        sets: e.sets.map((s, i) => {
          return {
            idx: i,
            reps: s.reps ? parseInt(s.reps, 10) : 0,
            weight: s.weight ? parseInt(s.weight, 10) : 0
          };
        })
      };
    })
  };

  const payload = {
    title: unrefedData.title,
    variant: unrefedData.variant,
    group: unrefedData.group,
    notes: unrefedData.notes,
    timezone: unrefedData.timezone,
    start: new Date(unrefedData.start).toISOString(),
    end: new Date(unrefedData.end).toISOString(),
    data,
    color: '#04da00',
    id: ''
  };

  console.log(formState.value.data);
  switch (props.mode) {
    case 'create': {
      const tempId = `temp-${Date.now().toString()}`;
      // todo: do we need the serverside properties in the type?
      props.activities?.createActivity(payload as any, tempId);

      // todo: add to local cache
      user.value.activities[unrefedData.title] = payload.color;
      // todo: this is shit - race conditions
      window.localStorage.setItem('userState', JSON.stringify(user.value));

      const response = await apiRequest(postActivity, payload);
      console.log('create::response', response);

      // todo: confirm that the response from the server matches what we sent
      // update local state again if necessary?
      // todo: deal with unsuccessful response

      if (response.data) {
        props.activities?.replaceTempIdWithId(response.data.id, tempId);
      }

      break;
    }
    case 'update': {
      if (!props.data?.id) return;

      // todo: do we need the serverside properties in the type?
      props.activities?.updateActivity(payload as any);
      // todo: update item in local cache
      user.value.activities[unrefedData.title] = payload.color;
      // todo: this is shit - race conditions
      window.localStorage.setItem('userState', JSON.stringify(user.value));

      const response = await apiRequest(
        patchActivity,
        { id: props.data.id },
        payload
      );
      console.log('update::response', response);

      // todo: confirm that the response from the server matches what we sent
      // update local state again if necessary?
      // todo: deal with unsuccessful response

      break;
    }
  }

  emit('onClose', event, 'submit');
}

async function onDelete(event: MouseEvent | KeyboardEvent) {
  if (!props.data?.id) return;

  // todo:remove item from local cache
  props.activities?.deleteActivity(props.data.id);

  const response = await apiRequest(deleteActivity, { id: props.data.id });
  console.log('deleted::response', response);

  // todo: deal with unsuccessful response

  emit('onClose', event, 'submit');
}

function onClose(event: MouseEvent | KeyboardEvent) {
  resetFormState();
  emit('onClose', event, 'cancel');
}
</script>

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
          v-model:valid="formState.valid.start"
          label="Start"
          required
          :validators="[validateStartDate]"
        />

        <form-input-datetime
          v-model:value="formState.data.end"
          v-model:valid="formState.valid.end"
          label="End"
          required
          :validators="[validateEndDate]"
        />
      </div>

      <section class="flex flex-col">
        <div
          v-if="formState.data.data?.exercise"
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
            :scope="scope"
            @add-exercise="addExercise"
            @remove-exercise="removeExercise"
          />

          <FormExerciseMobility
            v-if="exercise.variant === ExerciseVariant.MOBILITY"
            :index="exerciseIndex"
            :data="exercise"
            :scope="scope"
            @add-exercise="addExercise"
            @remove-exercise="removeExercise"
          />
        </div>

        <div
          class="flex w-full items-center justify-end sm:justify-start ml-1.5 mt-4 my-2.5"
        >
          <span class="mx-2 sm:hidden sm:mx-1.5 text-sm text-slate-700"
            >Add an exercise</span
          >
          <button
            class="relative p-1 sm:p-0.5 mr-1.5 rounded-[4px] focus:outline focus:outline-slate-500 focus:outline-1"
            @click="() => addExercise(ExerciseVariant.STRENGTH)"
          >
            <div
              class="flex justify-center items-center p-[5px] w-9 h-9 sm:w-7 sm:h-7 bg-slate-700 text-slate-50 rounded-[5px] sm:rounded-[3px]"
            >
              <strength-icon
                class="flex justify-center items-center w-full h-full [&_svg]:h-full [&_svg]:w-full"
              />
            </div>
            <add-icon
              :size="12"
              class="absolute z-10 top-0 right-0 flex justify-center items-center w-4 h-4 sm:w-3 sm:h-3 bg-slate-500 text-white border-[0.5px] border-slate-700 rounded-[3px] sm:rounded-[2px]"
            />
          </button>
          <button
            class="relative p-1 sm:p-0.5 mr-1.5 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
            @click="() => addExercise(ExerciseVariant.CARDIO)"
          >
            <div
              class="flex justify-center items-center p-[5px] sm:p-1 w-9 h-9 sm:w-7 sm:h-7 bg-slate-700 text-slate-50 rounded-[5px] sm:rounded-[3px]"
            >
              <cardio-icon
                class="flex justify-center items-center w-full h-full [&_svg]:h-full [&_svg]:w-full"
              />
              <add-icon
                :size="12"
                class="absolute z-10 top-0 right-0 flex justify-center items-center w-4 h-4 sm:w-3 sm:h-3 bg-slate-500 text-white border-[0.5px] border-slate-700 rounded-[3px] sm:rounded-[2px]"
              />
            </div>
          </button>
          <button
            class="relative p-1 sm:p-0.5 mr-1.5 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
            @click="() => addExercise(ExerciseVariant.MOBILITY)"
          >
            <div
              class="flex justify-center items-center p-[3px] w-9 h-9 sm:w-7 sm:h-7 bg-slate-700 text-slate-50 rounded-[5px] sm:rounded-[3px]"
            >
              <mobility-icon
                class="flex justify-center items-center w-full h-full [&_svg]:h-full [&_svg]:w-full"
              />
              <add-icon
                :size="12"
                class="absolute z-10 top-0 right-0 flex justify-center items-center w-4 h-4 sm:w-3 sm:h-3 bg-slate-500 text-white border-[0.5px] border-slate-700 rounded-[3px] sm:rounded-[2px]"
              />
            </div>
          </button>
          <span class="mx-2 hidden sm:flex sm:mx-1.5 text-sm text-slate-700"
            >Add an exercise</span
          >
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
import StrengthIcon from 'vue-material-design-icons/Dumbbell.vue';
import CardioIcon from 'vue-material-design-icons/Run.vue';
import MobilityIcon from 'vue-material-design-icons/Meditation.vue';
import { nextTick } from 'vue';
import {
  ActivityVariant,
  ExerciseVariant,
  type FormattedActivity
} from '~/types/activity';
import type { DerivedActivities } from '~/utils/activity';
import FormExerciseStrength from './FormExerciseStrength.vue';
import FormExerciseMobility from './FormExerciseMobility.vue';
import { getExerciseDefaultValue } from '~/composables/useActivityForm';

const props = defineProps<{
  mode: 'create' | 'update' | undefined;
  data?: FormattedActivity;
  activities?: DerivedActivities | null;
}>();
const emit = defineEmits<{
  (
    e: 'onClose',
    v: MouseEvent | KeyboardEvent | undefined,
    reason: 'submit' | 'cancel'
  ): void;
}>();

watch(props, (props) => {
  if (!!props.mode) {
    startDateRef.value?.focus();
  }
});

const scope = 'form-activity-workout';
const startDateRef = ref<HTMLElement | null>(null);

const mode = computed(() => props.mode);
const activity = computed(() => props.data);
const derivedActivities = computed(() => props.activities);

const { formState, resetFormState, onDelete, onSubmit } = useActivityForm({
  activity,
  mode,
  derivedActivities,
  variant: ActivityVariant.EXERCISE,
  onClose
});

async function addExercise(variant: ExerciseVariant) {
  formState.value.data.data?.exercise?.push(
    getExerciseDefaultValue[variant]() as any
  );
  await nextTick();
  const el: HTMLInputElement | null = document.querySelector(
    `#${scope}-exercise-${
      (formState.value.data.data?.exercise?.length || 0) - 1
    }`
  );
  el?.focus();
}

function removeExercise(index: number) {
  if (formState.value.data.data?.exercise) {
    formState.value.data.data.exercise =
      formState.value.data.data.exercise.filter((_, i) => i !== index);
  }
}

const duration = computed(() => {
  return millisecondsToHoursAndMinutes(
    new Date(formState.value.data.end).getTime() -
      new Date(formState.value.data.start).getTime()
  );
});

function validateStartDate(v: string | undefined) {
  // todo:: validate
  return true;
}

function validateEndDate(v: string | undefined) {
  // todo:: validate
  return true;
}

function onClose(event: MouseEvent | KeyboardEvent | undefined) {
  resetFormState();
  emit('onClose', event, 'cancel');
}
</script>

<template>
  <side-panel
    id="activity-mobility"
    :is-open="!!props.mode"
    @on-close="onClose"
    @on-submit="onSubmit"
    @on-extra="onDelete"
  >
    <template v-slot:title-text>{{
      props.mode === 'update' ? 'Update Mobility' : 'Add Mobility'
    }}</template>
    <template v-slot:description-text>Record a mobility session</template>
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
          v-for="(exercise, exerciseIndex) in formState.data.data?.exercise"
          class="flex flex-col"
        >
          <div class="flex">
            <span class="flex flex-col w-full">
              <FormExerciseMobility
                :index="0"
                :data="exercise as any"
                :scope="scope"
                :hide-delete="exerciseIndex === 0"
                @add-exercise="addExercise"
                @remove-exercise="removeExercise"
              />
            </span>
          </div>

          <button
            v-if="
              exerciseIndex === (formState.data.data?.exercise?.length || 0) - 1
            "
            class="flex items-center justify-end sm:justify-start ml-3 mt-2.5 mb-2.5 p-0.5 pr-2 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
            @click="() => addExercise(ExerciseVariant.MOBILITY)"
          >
            <add-icon
              :size="16"
              class="bg-slate-700 p-0.5 text-slate-50 rounded-[3px]"
            />
            <span class="mx-2 sm:mx-1.5 text-sm text-slate-700"
              >Add another exercise</span
            >
          </button>
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
      {{ `${props.mode === 'update' ? 'Update' : 'Create'} Mobility` }}
      <span class="ml-2" />
    </template>
  </side-panel>
</template>

<script setup lang="ts">
import AddIcon from 'vue-material-design-icons/Plus.vue';
import CheckIcon from 'vue-material-design-icons/Check.vue';
import DeleteIcon from 'vue-material-design-icons/Delete.vue';
import { watch } from 'vue';
import {
  ActivityVariant,
  ExerciseVariant,
  type FormattedActivity
} from '~/types/activity';
import type { DerivedActivities } from '~/utils/activity';

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

const mode = computed(() => props.mode);
const activity = computed(() => props.data);
const derivedActivities = computed(() => props.activities);

const scope = 'form-activity-mobility';
const startDateRef = ref<HTMLElement | null>(null);

const { formState, resetFormState, onDelete, onSubmit } = useActivityForm({
  activity,
  mode,
  derivedActivities,
  variant: ActivityVariant.EXERCISE,
  exerciseVariant: ExerciseVariant.MOBILITY,
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

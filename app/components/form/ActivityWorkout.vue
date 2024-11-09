<template>
  <side-panel :id="scope" :is-open="!!props.mode" @on-close="onClose" @on-submit="onSubmit" @on-extra="onDelete">
    <template v-slot:title-text>{{ props.mode === 'update' ? "Update Session" : "Add Session" }}</template>
    <template v-slot:description-text>Record a workout session</template>
    <template v-slot:description-extra v-if="props.mode === 'update'">[ Current Duration:{{ duration.hours ?
      ` ${duration.hours}h` : '' }}
      {{ duration.minutes ?
        ` ${duration.minutes}m` : '' }}
      ]</template>
    <template v-slot:content>
      <div class="flex justify-between mb-1">
        <form-input-datetime ref="startDateRef" v-model:value="formState.data.start"
          v-model:valid="formState.valid.startDate" label="Start" required :validators="[validateStartDate]" />

        <form-input-datetime v-model:value="formState.data.end" v-model:valid="formState.valid.endDate" label="End"
          required :validators="[validateEndDate]" />
      </div>

      <section class="flex flex-col">
        <div v-for="(exercise, exerciseIndex) in formState.data.data.exercise" class="flex flex-col">

          <div class="flex">
            <span class="flex flex-col w-full">
              <form-input-text :id="`${scope}-exercise-${exerciseIndex}`" v-model:value="exercise.title"
                v-model:valid="formState.valid.notes" label="Exercise" placeholder="Exercise" />
            </span>
            <span v-if="exerciseIndex === 0" class="flex items-center w-[18px] ml-2 mr-1 font-bold text-xs" />
            <button v-if="exerciseIndex > 0"
              class="flex items-center mt-[32px] ml-1 mb-1 px-1 font-bold rounded-[3px] text-xs focus:outline focus:outline-slate-500 focus:outline-1"
              @click="removeExercise(exerciseIndex)">
              <close-icon :size="18" class="text-slate-500" />
            </button>
          </div>

          <div v-for="(row, rowIndex) in exercise.sets" class="flex items-center ml-4 mt-2.5 last-of-type:mb-1">

            <div class="flex items-center mr-4">
              <label :for="`${scope}-exercise-reps-${exerciseIndex}-${rowIndex}`" class="text-[10px] mr-1">Reps</label>
              <input :id="`${scope}-exercise-reps-${exerciseIndex}-${rowIndex}`"
                class="border w-9 h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
                v-model="row.reps" />
            </div>
            <div class="flex items-center mr-4">
              <label :for="`${scope}-exercise-weight-${rowIndex}`" class="text-[10px] mr-1">Weight</label>
              <input :id="`${scope}-exercise-weight-${rowIndex}`"
                class="border w-9 h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
                v-model="row.weight" /><span class="font-light text-[10px] text-slate-300 ml-0.5">kg</span>
            </div>

            <button v-if="rowIndex !== exercise.sets.length - 1"
              class="flex items-center px-1 py-0.5 rounded-[3px] font-bold text-xs focus:outline focus:outline-slate-500 focus:outline-1"
              @click="
                removeRepsRow({
                  exerciseIndex,
                  rowIndex
                })
                ">
              <close-icon :size="18" class="text-red-500 mr-px" />
            </button>

            <button v-if="rowIndex === exercise.sets.length - 1"
              class="flex items-center px-1 py-0.5 text-xs text-slate-800 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
              @click="
                addRepsRow({
                  exerciseIndex,
                  reps: row.reps,
                  weight: row.weight
                })
                ">
              <add-icon :size="18" class="text-slate-800 mr-px" />
              <span class="mr-1.5">Add</span>
            </button>

          </div>

          <button v-if="exerciseIndex === formState.data.data.exercise.length - 1"
            class="flex items-center self-start ml-3 mt-2.5 mb-2.5 p-0.5 pr-2 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
            @click="addExercise">
            <add-icon :size="16" class="bg-slate-700 p-0.5 text-slate-50 mr-2 rounded-[3px]" />
            <span class="text-sm text-slate-700">Add another exercise</span>
          </button>
        </div>
      </section>

      <form-input-textarea v-model:value="formState.data.notes" v-model:valid="formState.valid.notes" label="Notes"
        placeholder="Notes" />

      <span class="h-4" />

    </template>
    <template v-if="props.mode === 'update'" v-slot:extra-button-text>
      <delete-icon :size="20" class="text-slate-700 mr-1.5" />
      Delete
      <span class="ml-2" />
    </template>
    <template v-slot:submit-text>
      <check-icon v-if="props.mode === 'update'" :size="20" class="text-slate-50 mr-1.5" />
      <add-icon v-if="props.mode === 'create'" :size="20" class="text-slate-50 mr-1.5" />
      {{ `${props.mode === 'update' ? 'Update' : 'Create'} Session` }}
      <span class="ml-2" />
    </template>
  </side-panel>

</template>

<script setup lang="ts">
import AddIcon from 'vue-material-design-icons/Plus.vue';
import CheckIcon from 'vue-material-design-icons/Check.vue';
import DeleteIcon from 'vue-material-design-icons/Delete.vue';
import CloseIcon from 'vue-material-design-icons/Close.vue';
import { watch, nextTick } from 'vue';
import {
  add,
} from 'date-fns';
import type { Validation } from '~/types/form';
import type { Activity, ActivityBase, ExerciseWorkout } from '~/types/activity';

const scope = 'form-activity-workout';

const props = defineProps<{
  mode: 'create' | 'update' | undefined;
  data?: Activity<'workout', 'form'>;
}>();
const emit = defineEmits<{
  (e: 'onClose', v: MouseEvent | KeyboardEvent): void;
}>();

const startDateRef = ref<HTMLElement | null>(null);

watch(
  props,
  (props) => {
    resetFormState();
    if (!!props.mode) {
      startDateRef.value?.focus();

      // todo:: does incoming data work?
      if (props.mode === 'update' && props.data) {
        formState.value.data = { ...formState.value.data, ...props.data };
      }
    }
  }
)


async function addExercise() {
  formState.value.data.data.exercise.push({ title: '', sets: [{ reps: '', weight: '' }] });
  await nextTick();
  const el: HTMLInputElement | null = document.querySelector(`#${scope}-exercise-${formState.value.data.data.exercise.length - 1}`)
  el?.focus();
};

function removeExercise(index: number) {
  formState.value.data.data.exercise = formState.value.data.data.exercise.filter((_, i) => i !== index);
};

async function addRepsRow({
  exerciseIndex,
  reps = '',
  weight = ''
}: {
  exerciseIndex: number;
  reps?: string;
  weight?: string;
}) {
  formState.value.data.data.exercise[exerciseIndex].sets.push(
    { reps, weight }
  );
  await nextTick();
  const el: HTMLInputElement | null = document.querySelector(
    `#${scope}-exercise-reps-${exerciseIndex}-${formState.value.data.data.exercise[exerciseIndex].sets.length - 1}`
  )
  el?.focus();
};

function removeRepsRow({
  exerciseIndex,
  rowIndex
}: {
  exerciseIndex: number;
  rowIndex: number;
}) {
  formState.value.data.data.exercise[exerciseIndex].sets = formState.value.data.data.exercise[
    exerciseIndex
  ].sets.filter((_, i) => i !== rowIndex);
};

const formState = ref<{ data: Activity<'workout', 'form'>; valid: Validation }>({
  data: {
    id: '',
    title: 'workout',
    variant: 'exercise',
    group: 'workout',
    notes: '',
    start: applyTZOffset(new Date(Date.now())).toISOString().slice(0, -8),
    end: applyTZOffset(add(new Date(Date.now()), { minutes: 5 }))
      .toISOString()
      .slice(0, -8),
    timezone: new Date().getTimezoneOffset(),
    data: { exercise: [{ title: '', sets: [{ reps: '', weight: '' }] }] }
  },
  valid: {
    title: undefined as boolean | undefined,
    startDate: undefined as boolean | undefined,
    endDate: undefined as boolean | undefined
  }
});

const duration = computed(() => {
  return millisecondsToHoursAndMinutes(new Date(formState.value.data.end).getTime() - new
    Date(formState.value.data.start).getTime());
});

function resetFormState() {
  formState.value.data.id = '';
  formState.value.data.title = '';
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

  formState.value.data.data.exercise = [{ title: '', sets: [{ reps: '', weight: '' }] }]
};

function validateStartDate(v: string) {
  // todo:: validate
  return true
}

function validateEndDate(v: string) {
  // todo:: validate
  return true
}

function onSubmit() {
  console.log(formState.value.data);
  switch (props.mode) {
    case 'create':
      console.log('create::submitting');
      break;
    case 'update':
      console.log('update::submitting');
      break;
  }
}

function onDelete() {
  console.log('deleting');
}

function onClose(event) {
  emit('onClose', event);
}

</script>

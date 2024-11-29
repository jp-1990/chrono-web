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
          ref="startRef"
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
          v-for="(exercise, exerciseIndex) in formState.data.data.exercise"
          class="flex flex-col"
        >
          <div class="flex">
            <span class="flex flex-col w-full">
              <form-input-text
                :id="`${scope}-exercise-${exerciseIndex}`"
                v-model:value="exercise.title"
                v-model:valid="formState.valid.notes"
                label="Exercise"
                placeholder="Exercise"
              />
            </span>
            <span
              v-if="exerciseIndex === 0"
              class="flex items-center w-[18px] ml-2 mr-1 font-bold text-xs"
            />
            <button
              v-if="exerciseIndex > 0"
              class="flex items-center mt-[32px] ml-1 mb-1 px-1 font-bold rounded-[3px] text-xs focus:outline focus:outline-slate-500 focus:outline-1"
              @click="removeExercise(exerciseIndex)"
            >
              <close-icon :size="18" class="text-slate-500" />
            </button>
          </div>

          <button
            v-if="exerciseIndex === formState.data.data.exercise.length - 1"
            class="flex items-center self-start ml-3 mt-2.5 mb-2.5 p-0.5 pr-2 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
            @click="addExercise"
          >
            <add-icon
              :size="16"
              class="bg-slate-700 p-0.5 text-slate-50 mr-2 rounded-[3px]"
            />
            <span class="text-sm text-slate-700">Add another exercise</span>
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
import { watch } from 'vue';
import { add } from 'date-fns';
import type { Validation } from '~/types/form';
import type { Activity } from '~/types/activity';

const scope = 'form-activity-mobility';

const props = defineProps<{
  mode: 'create' | 'update' | undefined;
  data?: Activity<'mobility', 'form'>;
}>();
const emit = defineEmits<{
  (e: 'onClose', v: MouseEvent | KeyboardEvent): void;
}>();

const startRef = ref<HTMLElement | null>(null);

watch(props, (props) => {
  resetFormState();
  if (!!props.mode) {
    startRef.value?.focus();

    // todo:: does this work?
    if (props.mode === 'update' && props.data) {
      formState.value.data = { ...formState.value.data, ...props.data };
    }
  }
});

async function addExercise() {
  formState.value.data.data.exercise.push({ title: '', sets: [] });
  await nextTick();
  const el: HTMLInputElement | null = document.querySelector(
    `#${scope}-exercise-${formState.value.data.data.exercise.length - 1}`
  );
  el?.focus();
}

const removeExercise = (index: number) => {
  formState.value.data.data.exercise =
    formState.value.data.data.exercise.filter((_, i) => i !== index);
};

const formState = ref<{
  data: Activity<'mobility', 'form'>;
  valid: Validation;
}>({
  data: {
    id: '',
    title: 'mobility',
    variant: 'exercise',
    group: 'mobility',
    notes: '',
    start: applyTZOffset(new Date(Date.now())).toISOString().slice(0, -8),
    end: applyTZOffset(add(new Date(Date.now()), { minutes: 5 }))
      .toISOString()
      .slice(0, -8),
    timezone: new Date().getTimezoneOffset(),
    data: {
      exercise: [{ title: '', sets: [] }]
    }
  },
  valid: {
    title: undefined as boolean | undefined,
    group: undefined as boolean | undefined,
    start: undefined as boolean | undefined,
    end: undefined as boolean | undefined
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
  formState.value.data.timezone = new Date().getTimezoneOffset();
  formState.value.data.data.exercise = [{ title: '', sets: [] }];

  formState.value.valid.start = undefined;
  formState.value.valid.end = undefined;
}

function validateStartDate(v: string) {
  // todo:: validate
  return true;
}

function validateEndDate(v: string) {
  // todo:: validate
  return true;
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

<template>
  <side-panel
    :id="scope"
    :is-open="!!props.mode"
    @on-close="onClose"
    @on-submit="onSubmit"
    @on-extra="onDelete"
  >
    <template v-slot:title-text>{{
      props.mode === 'update' ? 'Update Cardio' : 'Add Cardio'
    }}</template>
    <template v-slot:description-text>Record a cardio activity</template>
    <template v-slot:description-extra v-if="props.mode === 'update'"
      >[ Current Duration:{{ duration.hours ? ` ${duration.hours}h` : '' }}
      {{ duration.minutes ? ` ${duration.minutes}m` : '' }}
      ]</template
    >
    <template v-slot:content>
      <form-input-datetime
        ref="startRef"
        v-model:value="formState.data.start"
        v-model:valid="formState.valid.start"
        label="Start"
        required
        :validators="[validateStartDate]"
      />

      <section class="flex flex-col">
        <div class="flex flex-col">
          <div class="flex">
            <span class="flex flex-col w-full">
              <form-input-text
                v-model:value="formState.data.data.exercise.title"
                v-model:valid="formState.valid.notes"
                label="Exercise"
                placeholder="Exercise"
              />
            </span>
            <span
              class="flex items-center w-[18px] ml-2 mr-1 font-bold text-xs"
            />
          </div>

          <div class="flex items-center ml-4 mt-2.5">
            <label :for="`${scope}-distance`" class="text-xs w-16"
              >Distance</label
            >
            <input
              :id="`${scope}-distance`"
              class="border w-10 h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
              v-model="formState.data.data.exercise.distance"
            />
          </div>
          <div class="flex items-center ml-4 mt-2">
            <label :for="`${scope}-duration`" class="text-xs w-16">Time</label>
            <input
              :id="`${scope}-duration`"
              class="border w-10 h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
              v-model="formState.data.data.exercise.duration"
            />
          </div>
        </div>
      </section>

      <div class="flex mt-4 justify-between">
        <label class="text-xs">Splits</label>
        <span class="ml-1 mr-7 text-xs font-light text-slate-500"
          >[ Avg. pace: {{ avgPace }} ]</span
        >
      </div>

      <div
        v-for="(row, rowIndex) in formState.data.data.exercise.splits"
        :class="[rowIndex === 0 ? 'mt-1.5' : 'mt-2.5']"
        class="flex items-center ml-4 last-of-type:mb-1"
      >
        <div class="flex items-center mr-4">
          <span for="update-exercise-reps" class="text-xs mr-1"
            >Km<span class="ml-0.5 font-mono">{{
              `${rowIndex < 10 ? `0${rowIndex + 1}` : rowIndex + 1}`
            }}</span></span
          >
          <label :for="`${scope}-pace-${rowIndex}`" class="text-xs ml-1 mr-1.5"
            >Pace</label
          >
          <input
            :id="`${scope}-pace-${rowIndex}`"
            class="border w-10 h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
            v-model="row.pace"
          />
        </div>

        <button
          v-if="rowIndex !== formState.data.data.exercise.splits.length - 1"
          class="flex items-center px-1 py-0.5 rounded-[3px] font-bold text-xs focus:outline focus:outline-slate-500 focus:outline-1"
          @click="
            removeSplitsRow({
              rowIndex
            })
          "
        >
          <close-icon :size="18" class="text-red-500 mr-px" />
        </button>

        <button
          v-if="rowIndex === formState.data.data.exercise.splits.length - 1"
          class="flex items-center px-1 py-0.5 text-xs text-slate-800 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
          @click="
            addSplitsRow({
              pace: row.pace
            })
          "
        >
          <add-icon :size="18" class="text-slate-800 mr-px" />
          <span class="mr-1.5">Add</span>
        </button>
      </div>

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
      {{ `${props.mode === 'update' ? 'Update' : 'Create'} Cardio` }}
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

const scope = 'form-activity-cardio';

const props = defineProps<{
  mode: 'create' | 'update' | undefined;
  data?: Activity<'cardio', 'form'>;
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

async function addSplitsRow({ pace = '' }: { pace: string }) {
  formState.value.data.data.exercise.splits.push({ pace });
  await nextTick();
  const el: HTMLInputElement | null = document.querySelector(
    `#${scope}-pace-${formState.value.data.data.exercise.splits.length - 1}`
  );
  el?.focus();
}

const removeSplitsRow = ({ rowIndex }: { rowIndex: number }) => {
  formState.value.data.data.exercise.splits =
    formState.value.data.data.exercise.splits.filter((_, i) => i !== rowIndex);
};

const formState = ref<{ data: Activity<'cardio', 'form'>; valid: Validation }>({
  data: {
    id: '',
    title: 'cardio',
    variant: 'exercise',
    group: 'cardio',
    notes: '',
    start: applyTZOffset(new Date(Date.now())).toISOString().slice(0, -8),
    end: applyTZOffset(add(new Date(Date.now()), { minutes: 5 }))
      .toISOString()
      .slice(0, -8),
    timezone: new Date().getTimezoneOffset(),
    data: {
      exercise: {
        title: '',
        distance: '',
        duration: '',
        splits: [{ pace: '' }]
      }
    }
  },
  valid: {
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

const avgPace = computed(() => {
  let total = 0;
  for (const split of formState.value.data.data.exercise.splits) {
    total += +split.pace;
  }
  if (total === 0) return '-';
  return (total / formState.value.data.data.exercise.splits.length).toFixed(2);
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
  formState.value.data.data.exercise = {
    title: '',
    distance: '',
    duration: '',
    splits: [{ pace: '' }]
  };

  formState.value.valid.start = undefined;
  formState.value.valid.end = undefined;
}

function validateStartDate(v: string) {
  // todo:: validate
  console.log('called: validateStartDate', 'with', v);
  return true;
}

function validateEndDate(v: string) {
  // todo:: validate
  console.log('called: validateEndDate', 'with', v);
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

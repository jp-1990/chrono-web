<template>
  <side-panel :id="scope" :is-open="!!props.mode" @on-close="onClose" @on-submit="onSubmit" @on-extra="onDelete"
    :disable-submit="!isFormStateValid">
    <template v-slot:title-text>{{ props.mode === 'update' ? "Update Activity" : "Add Activity" }}</template>
    <template v-slot:description-text>Record the time spent doing an activity</template>
    <template v-slot:description-extra v-if="props.mode === 'update'">[ Current Duration:{{ duration.hours ?
      ` ${duration.hours}h` : '' }}
      {{ duration.minutes ?
        ` ${duration.minutes}m` : '' }}
      ]</template>
    <template v-slot:content>
      <form-input-text ref="titleRef" v-model:value="formState.data.title" v-model:valid="formState.valid.title"
        required label="Title" placeholder="Title" />

      <form-input-text v-model:value="formState.data.group" v-model:valid="formState.valid.group" required label="Group"
        placeholder="Group" />

      <form-input-textarea v-model:value="formState.data.notes" v-model:valid="formState.valid.notes" label="Notes"
        placeholder="Notes" />

      <div class="flex justify-between my-1">
        <form-input-datetime v-model:value="formState.data.start" v-model:valid="formState.valid.startDate"
          label="Start" required :validators="[validateStartDate]" />

        <form-input-datetime v-model:value="formState.data.end" v-model:valid="formState.valid.endDate" label="End"
          required :validators="[validateEndDate]" />
      </div>

      <color-select v-model="formState.data.color" :force-closed="!props.mode" />

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
      {{ `${props.mode === 'update' ? 'Update' : 'Create'} Activity` }}
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
  add,
} from 'date-fns';
import type { Activity } from '~/types/activity';
import type { Validation } from '~/types/form';
import { DEFAULT_COLOR } from '~/constants/colors';

const props = defineProps<{
  mode: 'create' | 'update' | undefined;
  data?: Activity;
}>();
const emit = defineEmits<{
  (e: 'onClose', v?: MouseEvent | KeyboardEvent): void;
}>();

const scope = 'form-activity-default';

const titleRef = ref<HTMLElement | null>(null);

watch(
  props,
  (props) => {
    resetFormState();
    if (!!props.mode) {
      titleRef.value?.focus();

      if (props.mode === 'update' && props.data) {
        formState.value.data = { ...formState.value.data, ...props.data };
      }
    }
  }
)

const formState = ref<{ data: Omit<Activity & { color: string }, 'id'>; valid: Validation }>({
  data: {
    title: '',
    variant: 'Default',
    group: '',
    notes: '',
    start: applyTZOffset(new Date(Date.now())).toISOString().slice(0, -8),
    end: applyTZOffset(add(new Date(Date.now()), { minutes: 5 }))
      .toISOString()
      .slice(0, -8),
    timezone: new Date().getTimezoneOffset(),
    color: DEFAULT_COLOR
  },
  valid: {
    title: undefined as boolean | undefined,
    group: undefined as boolean | undefined,
    startDate: undefined as boolean | undefined,
    endDate: undefined as boolean | undefined
  }
});

const isFormStateValid = computed(() => {
  return !Object.values(formState.value.valid).some(e => e === false)
});

const duration = computed(() => {
  return millisecondsToHoursAndMinutes(new Date(formState.value.data.end).getTime() - new
    Date(formState.value.data.start).getTime());
});

function resetFormState() {
  formState.value.data.title = '';
  formState.value.data.notes = '';
  formState.value.data.group = '';
  formState.value.data.start = applyTZOffset(new Date(Date.now()))
    .toISOString()
    .slice(0, -8);
  formState.value.data.end = applyTZOffset(
    add(new Date(Date.now()), { minutes: 5 })
  )
    .toISOString()
    .slice(0, -8);
  formState.value.data.timezone = new Date().getTimezoneOffset()
  formState.value.data.color = DEFAULT_COLOR

  formState.value.valid.title = undefined;
  formState.value.valid.group = undefined;
  formState.value.valid.startDate = undefined;
  formState.value.valid.endDate = undefined;
};


function onTitleBlur() {
  // todo:: autoset color based on users colors
  // if (itemsKey.value[formState.value.data.title]) {
  //   formState.value.data.color = itemsKey.value[formState.value.data.title][1];
  // }
};

function validateStartDate(v: string) {
  // todo:: validate
  console.log('called: validateStartDate', 'with', v);
  return true
}

function validateEndDate(v: string) {
  // todo:: validate
  console.log('called: validateEndDate', 'with', v);
  return true
}

async function onSubmit() {
  switch (props.mode) {
    case 'create': {
      // todo: validate & prepare payload
      const unrefedData = toRaw(unref(formState)).data;
      const payload: Parameters<typeof postActivity>[0] = {} as any;
      payload.title = unrefedData.title;
      payload.variant = unrefedData.variant;
      payload.group = unrefedData.group;
      payload.notes = unrefedData.notes;
      payload.timezone = unrefedData.timezone;
      payload.start = new Date(unrefedData.start).toISOString();
      payload.end = new Date(unrefedData.end).toISOString();

      const response = await apiRequest(postActivity, payload);
      console.log('create::response', response);
      break;
    }
    case 'update': {
      if (!props.data?.id) return

      // todo: validate & prepare payload
      const unrefedData = toRaw(unref(formState)).data;
      const payload: Parameters<typeof patchActivity>[0] = {} as any;
      payload.id = props.data.id;
      payload.title = unrefedData.title;
      payload.variant = unrefedData.variant;
      payload.group = unrefedData.group;
      payload.notes = unrefedData.notes;
      payload.timezone = unrefedData.timezone;
      payload.start = new Date(unrefedData.start).toISOString();
      payload.end = new Date(unrefedData.end).toISOString();


      const response = await apiRequest(patchActivity, payload);
      console.log('update::response', response);
      break;
    }
  }

  emit('onClose');
}

async function onDelete() {
  if (!props.data?.id) return

  const response = await apiRequest(deleteActivity, { id: props.data.id });
  console.log('deleted::response', response);

  emit('onClose');
}

function onClose(event: MouseEvent | KeyboardEvent) {
  emit('onClose', event);
}

</script>

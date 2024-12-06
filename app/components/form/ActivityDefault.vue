<template>
  <side-panel
    :id="scope"
    :is-open="!!props.mode"
    @on-close="onClose"
    @on-submit="onSubmit"
    @on-extra="onDelete"
    :disable-submit="!formStateValid"
  >
    <template v-slot:title-text>{{
      props.mode === 'update' ? 'Update Activity' : 'Add Activity'
    }}</template>
    <template v-slot:description-text
      >Record the time spent doing an activity</template
    >
    <template v-slot:description-extra v-if="props.mode === 'update'"
      >[ Current Duration:{{ duration.hours ? ` ${duration.hours}h` : '' }}
      {{ duration.minutes ? ` ${duration.minutes}m` : '' }}
      ]</template
    >
    <template v-slot:content>
      <form class="flex flex-col">
        <form-input-text
          ref="titleRef"
          v-model:value="formState.data.title"
          v-model:valid="formState.valid.title"
          required
          label="Title"
          placeholder="Title"
          @on-blur="onTitleBlur"
        />

        <form-input-text
          v-model:value="formState.data.group"
          v-model:valid="formState.valid.group"
          required
          label="Group"
          placeholder="Group"
        />

        <form-input-textarea
          v-model:value="formState.data.notes"
          v-model:valid="formState.valid.notes"
          label="Notes"
          placeholder="Notes"
        />

        <div class="flex justify-between my-1">
          <form-input-datetime
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

        <color-select
          v-model="formState.data.color"
          :force-closed="!props.mode"
        />
      </form>

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
      {{ `${props.mode === 'update' ? 'Update' : 'Create'} Activity` }}
      <span class="ml-2" />
    </template>
  </side-panel>
</template>

<script setup lang="ts">
import AddIcon from 'vue-material-design-icons/Plus.vue';
import CheckIcon from 'vue-material-design-icons/Check.vue';
import DeleteIcon from 'vue-material-design-icons/Delete.vue';
import { ActivityVariant, type FormattedActivity } from '~/types/activity';
import { DEFAULT_COLOR } from '~/constants/colors';
import { useUserState } from '#imports';
import type { DerivedActivities } from '~/utils/activity';

const props = defineProps<{
  mode: 'create' | 'update' | undefined;
  data?: FormattedActivity;
  activities?: DerivedActivities | null;
}>();
const emit = defineEmits<{
  (
    e: 'onClose',
    v: MouseEvent | KeyboardEvent,
    reason: 'submit' | 'cancel'
  ): void;
}>();

watch(props, (props) => {
  if (!!props.mode) {
    titleRef.value?.focus();
  }
});

const { user } = useUserState();

const titleRef = ref<HTMLElement | null>(null);

const mode = computed(() => props.mode);
const activity = computed(() => props.data);
const derivedActivities = computed(() => props.activities);

const scope = 'form-activity-default';

const { formState, formStateValid, resetFormState, onDelete, onSubmit } =
  useActivityForm({
    activity,
    mode,
    derivedActivities,
    variant: ActivityVariant.DEFAULT,
    onClose
  });

const duration = computed(() => {
  return millisecondsToHoursAndMinutes(
    new Date(formState.value.data.end).getTime() -
      new Date(formState.value.data.start).getTime()
  );
});

function onTitleBlur() {
  if (formState.value.data.title) {
    formState.value.data.color =
      user.value.activities[formState.value.data.title] ?? DEFAULT_COLOR;
  }
}

function validateStartDate(v: string) {
  // todo:: validate
  return true;
}

function validateEndDate(v: string) {
  // todo:: validate
  return true;
}

function onClose(event: MouseEvent | KeyboardEvent) {
  resetFormState();
  emit('onClose', event, 'cancel');
}
</script>

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

      <FormExerciseCardio
        v-if="formState.data.data?.exercise?.[0]"
        :index="0"
        :data="formState.data.data.exercise[0] as any"
        :scope="scope"
        :hide-delete="true"
      />

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

const scope = 'form-activity-cardio';
const startDateRef = ref<HTMLElement | null>(null);

const mode = computed(() => props.mode);
const activity = computed(() => props.data);
const derivedActivities = computed(() => props.activities);

const { formState, resetFormState, onDelete, onSubmit } = useActivityForm({
  activity,
  mode,
  derivedActivities,
  variant: ActivityVariant.EXERCISE,
  exerciseVariant: ExerciseVariant.CARDIO,
  onClose
});

watch(formState.value.data, (form) => {
  if (form.start && form.end) {
    if (form.data?.exercise?.[0]) {
      const startDate = new Date(form.start).getTime();
      const endDate = new Date(form.end).getTime();

      const duration = endDate - startDate;
      (form as any).data.exercise[0].duration = Math.max(duration / 1000, 0);
    }
  }
});

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

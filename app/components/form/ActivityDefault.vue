<template>
  <side-panel
    :id="scope"
    :is-open="!!props.mode"
    @on-close="onClose"
    @on-submit="onSubmit"
    @on-extra="onDelete"
    :disable-submit="!isFormStateValid"
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
import { watch } from 'vue';
import { add } from 'date-fns';
import {
  ActivityVariant,
  type ActivityDefaultForm,
  type FormattedActivity,
  type PatchActivityArgs,
  type PostActivityArgs
} from '~/types/activity';
import type { Validation } from '~/types/form';
import { DEFAULT_COLOR } from '~/constants/colors';
import { useUserState } from '#imports';
import type { DerivedActivities } from '~/utils/activity';

const userState = useUserState();

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

const scope = 'form-activity-default';

const titleRef = ref<HTMLElement | null>(null);

watch(props, (props) => {
  resetFormState();
  if (!!props.mode) {
    titleRef.value?.focus();

    if (props.mode === 'update' && props.data) {
      formState.value.data.title = props.data.title;
      formState.value.data.group = props.data.group;
      formState.value.data.start = applyTZOffset(new Date(props.data.start))
        .toISOString()
        .slice(0, -8);
      formState.value.data.end = applyTZOffset(new Date(props.data.end))
        .toISOString()
        .slice(0, -8);
      formState.value.data.color =
        userState.value.activities[props.data.title] ?? DEFAULT_COLOR;
    }
  }
});

const formState = ref<{
  data: ActivityDefaultForm;
  valid: Validation;
}>({
  data: {
    title: '',
    variant: ActivityVariant.DEFAULT,
    group: '',
    notes: '',
    start: applyTZOffset(new Date()).toISOString().slice(0, -8),
    end: applyTZOffset(add(new Date(), { minutes: 5 }))
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
  return !Object.values(formState.value.valid).some((e) => e === false);
});

const duration = computed(() => {
  return millisecondsToHoursAndMinutes(
    new Date(formState.value.data.end).getTime() -
      new Date(formState.value.data.start).getTime()
  );
});

function resetFormState() {
  formState.value.data.title = '';
  formState.value.data.notes = '';
  formState.value.data.group = '';
  formState.value.data.start = applyTZOffset(new Date())
    .toISOString()
    .slice(0, -8);
  formState.value.data.end = applyTZOffset(add(new Date(), { minutes: 5 }))
    .toISOString()
    .slice(0, -8);
  formState.value.data.timezone = new Date().getTimezoneOffset();
  formState.value.data.color = DEFAULT_COLOR;

  formState.value.valid.title = undefined;
  formState.value.valid.group = undefined;
  formState.value.valid.startDate = undefined;
  formState.value.valid.endDate = undefined;
}

function onTitleBlur() {
  if (formState.value.data.title) {
    formState.value.data.color =
      userState.value.activities[formState.value.data.title] ?? DEFAULT_COLOR;
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

const onSubmit = async (event: MouseEvent | KeyboardEvent) => {
  // todo: validate & prepare payload
  const unrefedData = toRaw(unref(formState)).data;

  switch (props.mode) {
    case 'create': {
      const payload: PostActivityArgs = {
        title: unrefedData.title,
        variant: unrefedData.variant,
        group: unrefedData.group,
        notes: unrefedData.notes,
        timezone: unrefedData.timezone,
        start: new Date(unrefedData.start).toISOString().replace('.000Z', 'Z'),
        end: new Date(unrefedData.end).toISOString().replace('.000Z', 'Z'),
        color: unrefedData.color,
        createdAt: new Date().toISOString(),
        user: userState.value.id,
        id: '',
        v: 1
      };

      const tempId = `temp-${payload.start}${payload.end}`;
      payload.id = tempId;

      props.activities?.createActivity(payload, tempId);

      const prevColor = userState.value.activities[unrefedData.title];
      if (prevColor !== unrefedData.color) {
        userState.value.activities[unrefedData.title] = unrefedData.color;
      }

      const response = await apiRequest(postActivity, payload);

      if (response.data) {
        let dataDrift = false;
        if (navigator.onLine) {
          // confirm that the response from the server matches what we sent
          for (const key of Object.keys(response.data)) {
            if (key === 'createdAt' || key === 'id') continue;
            if (response.data[key] !== payload[key]) {
              dataDrift = true;
              break;
            }
          }

          if (dataDrift) {
            // todo: now what?
            logging.error(
              {
                message:
                  '[ActivityDefault:onSubmit]: response does not match payload'
              },
              {
                fn: postActivity.name
              }
            );
          }
        }
        if (!navigator.onLine) {
          response.data.id = `${response.data.id}-offline`;
        }

        if (!dataDrift) {
          props.activities?.replaceTempIdWithId(response.data.id, tempId);
          db.activities.delete({ id: tempId });
          db.activities.add(response.data);
        }
      }

      if (response.error) {
        // rollback local changes
        props.activities?.deleteActivity(tempId);
        db.activities.delete({ id: tempId });
        if (prevColor !== unrefedData.color) {
          userState.value.activities[unrefedData.title] = unrefedData.color;
        }
      }

      break;
    }
    case 'update': {
      if (!props.data?.id) return;

      const prevValue = await db.activities.findById({ id: props.data.id });

      const payload: PatchActivityArgs = {
        title: unrefedData.title,
        variant: unrefedData.variant,
        group: unrefedData.group,
        notes: unrefedData.notes,
        timezone: unrefedData.timezone,
        start: new Date(unrefedData.start).toISOString().replace('.000Z', 'Z'),
        end: new Date(unrefedData.end).toISOString().replace('.000Z', 'Z'),
        color: unrefedData.color,
        createdAt: new Date().toISOString(),
        user: userState.value.id,
        id: props.data.id,
        v: 1
      };

      props.activities?.updateActivity(payload);

      const prevColor = userState.value.activities[unrefedData.title];
      if (prevColor !== unrefedData.color) {
        userState.value.activities[unrefedData.title] = unrefedData.color;
      }

      const response = await apiRequest(patchActivity, payload);

      if (response.data && navigator.onLine) {
        // confirm that the response from the server matches what we sent
        let dataDrift = false;
        for (const key of Object.keys(response.data)) {
          if (key === 'createdAt' || key === 'id') continue;
          if (response.data[key] !== payload[key]) {
            dataDrift = true;
            break;
          }
        }

        if (dataDrift) {
          // todo: now what?
          logging.error(
            {
              message:
                '[ActivityDefault:onSubmit]: response does not match payload'
            },
            { fn: patchActivity.name }
          );
        }
      }

      // rollback local changes
      if (response.error) {
        props.activities?.updateActivity(prevValue);
        db.activities.put(prevValue);
        if (prevColor !== unrefedData.color) {
          userState.value.activities[unrefedData.title] = unrefedData.color;
        }
      }

      break;
    }
  }

  emit('onClose', event, 'submit');
};

async function onDelete(event: MouseEvent | KeyboardEvent) {
  if (!props.data?.id) return;

  const prevValue = await db.activities.findById({ id: props.data.id });

  props.activities?.deleteActivity(props.data.id);

  const response = await apiRequest(deleteActivity, { id: props.data.id });

  // rollback local changes
  if (response.error) {
    props.activities?.createActivity(prevValue, prevValue.id);
    db.activities.add(prevValue);
  }

  emit('onClose', event, 'submit');
}

function onClose(event: MouseEvent | KeyboardEvent) {
  emit('onClose', event, 'cancel');
}
</script>

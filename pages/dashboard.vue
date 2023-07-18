<template>
  <div class="relative flex flex-col flex-1 bg-slate-200">
    <!-- header -->
    <section class="flex justify-between items-center mx-2 mt-2">
      <calendar
        :selected-month="selectedMonth"
        :selected-year="selectedYear"
        @on-change="onCalendarChange"
      />
    </section>

    <section class="flex flex-col bg-slate-200 p-4 pt-2">
      <!-- times row -->
      <div class="flex cursor-default">
        <div class="h-6 w-10 mr-1 bg-slate-200"></div>
        <ul class="flex flex-1 mb-px">
          <li
            v-for="hour in hoursInDay"
            class="h-5 w-[4.166666666666667%] bg-slate-200 font-mono font-light text-xs text-slate-400 border-l border-slate-300"
          >
            <div class="flex justify-center -translate-x-1/2 bg-slate-200">
              {{ format(hour, 'HHmm') }}
            </div>
          </li>
        </ul>
      </div>

      <!-- table rows -->
      <section
        v-on="{
          mouseup: mouseDownState.pressed ? onMouseUp : null,
          mousemove: mouseDownState.pressed ? onMouseMove : null
        }"
        class="flex flex-1 cursor-default"
      >
        <ul class="flex flex-1 flex-col mb-16">
          <li
            v-for="date in datesInSelectedMonthYear"
            :key="date.toDateString()"
            :class="['w-full']"
            class="flex flex-row"
          >
            <!-- day date -->
            <div
              class="w-10 h-14 mr-1 flex justify-center bg-slate-100 rounded-sm"
            >
              <div
                class="flex flex-col justify-center font-mono text-slate-400"
              >
                <span class="font-light text-sm leading-none">
                  {{ format(date, 'E').toUpperCase() }}
                </span>
                <span class="font-bold text-lg leading-none">
                  {{ format(date, 'dd').toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- tasks -->
            <div class="h-14 flex flex-1 bg-slate-50 mb-0.5 rounded-sm">
              <!-- @insert-new-shift="onInsertNewShift" -->
              <item-row
                @change-item-start-time="onMouseDown"
                @change-item-end-time="onMouseDown"
                :date="date"
                :ids="formattedItems[getDateId(date)]?.ids"
                :items="formattedItems[getDateId(date)]?.items"
              />
            </div>
          </li>
        </ul>
      </section>
    </section>
  </div>

  <!-- drag tracker -->
  <div
    v-if="mouseDownState.pressed"
    class="flex flex-col justify-center fixed bottom-2 left-64 h-8 w-16 ml-2 pl-2 bg-slate-900 text-slate-50 font-mono rounded-sm"
  >
    <span>{{ dragTime }}</span>
  </div>

  <!-- add button -->
  <div
    @click="onToggleNewTaskModal"
    role="button"
    class="fixed bottom-4 right-8 h-14 w-14 flex items-center justify-center bg-slate-800 rounded-xl"
  >
    <add-icon :size="30" class="text-slate-200" />
  </div>

  <side-panel
    :is-open="newTaskModalOpen"
    @on-close="onToggleNewTaskModal"
    @on-submit="onAddTask"
  >
    <template v-slot:title-text>Add Task</template>
    <template v-slot:content>
      <label for="title" class="text-xs mt-2 mb-1">Title*</label>
      <input
        @blur="onTitleBlur"
        id="title"
        :class="[formState.valid.title === false ? 'border-red-600' : '']"
        class="border px-1"
        placeholder="Title"
        name="title"
        v-model="formState.data.title"
      />

      <label for="group" class="text-xs mt-2 mb-1">Group*</label>
      <input
        @blur="onGroupBlur"
        id="group"
        :class="[formState.valid.group === false ? 'border-red-600' : '']"
        class="border px-1"
        placeholder="Group"
        name="group"
        v-model="formState.data.group"
      />

      <label for="notes" class="text-xs mt-2 mb-1">Notes</label>
      <input
        id="notes"
        class="border px-1"
        placeholder="Notes"
        name="notes"
        v-model="formState.data.notes"
      />

      <label for="start" class="text-xs mt-2 mb-1">Start*</label>
      <input
        @blur="onStartDateBlur"
        type="datetime-local"
        id="start"
        :class="[formState.valid.startDate === false ? 'border-red-600' : '']"
        class="border px-1"
        name="start"
        v-model="formState.data.startDate"
      />

      <label for="end" class="text-xs mt-2 mb-1">End*</label>
      <input
        @blur="onEndDateBlur"
        type="datetime-local"
        id="end"
        :class="[formState.valid.endDate === false ? 'border-red-600' : '']"
        class="border px-1"
        name="end"
        v-model="formState.data.endDate"
      />

      <label for="color" class="text-xs mt-2 mb-1">Color</label>
      <div
        id="color"
        :style="`background-color:${formState.data.color}`"
        @click="onToggleSelectColor"
        @keyup.enter="onToggleSelectColor"
        role="button"
        tabindex="0"
        class="h-8 w-12 m-px mb-1 rounded-sm"
        name="color"
      ></div>

      <div v-if="selectColorOpen" class="flex flex-wrap">
        <div
          v-for="color in colorSelection"
          :style="`background-color:${color}`"
          @click="setSelectedColor(color)"
          @keyup.enter="setSelectedColor(color)"
          tabindex="0"
          role="button"
          class="h-8 w-12 m-px rounded-sm"
        ></div>
      </div>

      <div>{{ JSON.stringify(formState.valid) }}</div>
    </template>
    <template v-slot:submit-text>Create Task</template>
  </side-panel>
</template>

<script setup lang="ts">
import {
  add,
  sub,
  format,
  startOfMonth,
  startOfYear,
  endOfMonth
} from 'date-fns';
import { ref, computed } from 'vue';
import AddIcon from 'vue-material-design-icons/Plus.vue';
import {
  getDatesInMonthYear,
  getAllHoursInDay,
  getDateId,
  minutesToHoursAndMinutes,
  timeOfDayToPercentage,
  roundSeconds
} from '~~/utils/date';
import { Handles, Container, FormattedItem, PostItemArgs } from '~/types/item';
import { Validation } from '~/types/form';
import { Diff, formatItems, getItemDate } from '~/utils/item';
import { getItems } from '~/utils/api';
import {
  validateDateRange,
  validateGroup,
  validateStartDate,
  validateTitle
} from '~/utils/form/validation';

const now = new Date();
const timeZoneOffset = minutesToHoursAndMinutes(now.getTimezoneOffset());
const applyTZOffset = (date: Date) =>
  sub(date, { hours: timeZoneOffset.hours, minutes: timeZoneOffset.minutes });

const hoursInDay = ref(getAllHoursInDay());

// MONTH YEAR SELECT

const {
  selectedMonth,
  selectedYear,
  startDate,
  endDate,
  datesInSelectedMonthYear
} = useMonthYearSelect();

const onCalendarChange = (month: Date, year: Date) => {
  selectedMonth.value = month;
  selectedYear.value = year;
};

// TASKS

const { data, pending, error, refresh } = await useAsyncData(
  'getItems',
  async () => getItems({ startDate: startDate.value, endDate: endDate.value }),
  { watch: [startDate, endDate] }
);

const formattedItems = computed(() =>
  formatItems(
    getDatesInMonthYear(
      selectedMonth.value.getMonth(),
      selectedYear.value.getFullYear()
    ),
    data.value
  )
);

// ADD TASK

const formState = ref<{ data: PostItemArgs; valid: Validation }>({
  data: {
    title: '',
    group: '',
    notes: '',
    startDate: applyTZOffset(new Date(Date.now())).toISOString().slice(0, -8),
    endDate: applyTZOffset(add(new Date(Date.now()), { minutes: 5 }))
      .toISOString()
      .slice(0, -8),
    color: 'rgb(38, 203, 255)'
  },
  valid: {
    title: undefined as boolean | undefined,
    group: undefined as boolean | undefined,
    startDate: undefined as boolean | undefined,
    endDate: undefined as boolean | undefined
  }
});

const formStateNotValid = computed(() => {
  return Object.values(formState.value.valid).some((v) => !v);
});

const newTaskModalOpen = ref(false);
const onToggleNewTaskModal = () => {
  if (newTaskModalOpen.value) {
    formState.value.data.title = '';
    formState.value.data.notes = '';
    formState.value.data.group = '';
    formState.value.data.startDate = applyTZOffset(new Date(Date.now()))
      .toISOString()
      .slice(0, -8);
    formState.value.data.endDate = applyTZOffset(
      add(new Date(Date.now()), { minutes: 5 })
    )
      .toISOString()
      .slice(0, -8);
    formState.value.data.color = 'rgb(38, 203, 255)';

    for (const key of Object.keys(formState.value.valid)) {
      formState.value.valid[key] = undefined;
    }
  }
  newTaskModalOpen.value = !newTaskModalOpen.value;
};

const colorSelection = [
  'rgb(229, 229, 229)',
  'rgb(126, 126, 126)',
  'rgb(50, 50, 50)',
  'rgb(0, 0, 0)',
  'rgb(0, 63, 6)',
  'rgb(0, 118, 19)',
  'rgb(4, 218, 0)',
  'rgb(255, 214, 0)',
  'rgb(255, 86, 0)',
  'rgb(177, 64, 0)',
  'rgb(86, 26, 0)',
  'rgb(0, 0, 128)',
  'rgb(0, 0, 255)',
  'rgb(38, 203, 255)',
  'rgb(255, 0, 199)',
  'rgb(192, 0, 150)',
  'rgb(234, 0, 0)',
  'rgb(126, 0, 0)',
  'rgb(75, 0, 111)',
  'rgb(155, 0, 250)',
  'rgb(0, 128, 128)'
];

const selectColorOpen = ref(false);
const onToggleSelectColor = () =>
  (selectColorOpen.value = !selectColorOpen.value);

const setSelectedColor = (color: string) => {
  formState.value.data.color = color;
  selectColorOpen.value = false;
};

const onTitleBlur = () => validateTitle(formState);
const onGroupBlur = () => validateGroup(formState);
const onStartDateBlur = () => validateStartDate(formState, formattedItems);
const onEndDateBlur = () => validateDateRange(formState, formattedItems);

const onAddTask = async () => {
  validateTitle(formState);
  validateGroup(formState);
  validateStartDate(formState, formattedItems);
  validateDateRange(formState, formattedItems);
  if (formStateNotValid.value) return;

  selectColorOpen.value = false;
  newTaskModalOpen.value = false;

  try {
    await postItem(formState.value.data);
    refresh();
  } catch (e) {
    console.log('error', e);
  }
};

// MOUSE EVENTS

const computedBreakpoint = computed(() => {
  const baseTime = new Date('2000-01-01T00:00:00.000Z');
  const hours = Math.floor(0 / 60);
  const minutes = 5 % 60;

  baseTime.setUTCHours(hours);
  baseTime.setUTCMinutes(minutes);

  return timeOfDayToPercentage(baseTime);
});

const { onMouseDown, onMouseMove, onMouseUp, dragTime, mouseDownState } =
  useStartEndDrag(computedBreakpoint.value);
</script>

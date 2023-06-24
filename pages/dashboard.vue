<template>
  <div class="relative flex flex-col flex-1 bg-slate-200">
    <!-- header -->
    <section class="flex justify-between items-center mx-2 mt-2">
      <div class="flex flex-col w-36 px-2 py-2">
        <div
          @click="onToggleMonthYearModal"
          class="flex relative bg-white cursor-pointer border border-slate-300 rounded-sm"
        >
          <input
            inputmode="none"
            autocomplete="off"
            readonly
            class="w-full h-8 ml-9 cursor-pointer font-mono font-light text-slate-500 bg-transparent outline-none"
            :value="`${format(selectedMonth, 'MMM').toUpperCase()} ${format(
              selectedYear,
              'yyyy'
            )}`"
          />
          <month-calendar-icon
            :size="18"
            class="absolute mt-px top-1/2 -translate-y-1/2 left-1.5 text-slate-500"
          />
        </div>
        <div class="relative">
          <div
            v-if="monthYearModelOpen"
            class="absolute top-0.5 z-10 flex flex-col bg-white border border-slate-300 w-48 pb-0.5 rounded-sm"
          >
            <div class="flex justify-center items-center">
              <div
                class="flex items-center font-mono text-slate-400 text-xl my-1"
              >
                <div @click="decrementYear" class="cursor-pointer">
                  <left-icon :size="18" />
                </div>
                <span class="px-7 mx-3 border text-slate-500">{{
                  format(selectedYear, 'yyyy')
                }}</span>
                <div @click="incrementYear" class="cursor-pointer">
                  <right-icon :size="18" />
                </div>
              </div>
            </div>
            <div class="flex flex-wrap content-start px-px">
              <div
                v-for="month in monthsInYear"
                @click="selectMonth(month)"
                :class="[
                  month.valueOf() === selectedMonth.valueOf()
                    ? 'bg-slate-500 text-slate-200'
                    : 'bg-slate-200 text-slate-500'
                ]"
                class="flex items-center h-8 m-0.5 px-4 font-mono font-light cursor-pointer"
              >
                <span>{{ format(month, 'MMM').toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- <button @click="getAllTasks">Get Tasks</button> -->
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
              <cell-detailed
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

    <!-- modal background -->
    <div
      @click="onToggleNewTaskModal"
      :class="[
        newTaskModalOpen
          ? 'w-full opacity-20 [transition:opacity_0.2s_cubic-bezier(0.4,0,0.2,1)_0s]'
          : 'w-0 opacity-0 [transition:width,_0s,_linear,_1s,opacity_0.2s_cubic-bezier(0.4,0,0.2,1)_0s]'
      ]"
      class="absolute z-20 h-full bg-black"
    ></div>
  </div>

  <!-- add button -->
  <div
    @click="onToggleNewTaskModal"
    role="button"
    class="absolute bottom-4 right-8 h-14 w-14 flex items-center justify-center bg-slate-800 rounded-xl"
  >
    <add-icon :size="30" class="text-slate-200" />
  </div>

  <!-- side panel -->
  <div
    :class="[newTaskModalOpen ? 'w-96 border-l p-2' : 'w-0 border-none p-0']"
    class="absolute z-30 right-0 flex flex-col h-screen overflow-hidden bg-white border-l-slate-200 transition-all duration-200"
  >
    <!-- title -->
    <div class="flex justify-between items-start mb-2">
      <h1 class="text-2xl ml-2 mt-1 font-bold">Add Task</h1>
      <close-icon @click="onToggleNewTaskModal" :size="30" role="button" />
    </div>

    <!-- content -->
    <div class="flex flex-col mx-2">
      <label for="title" class="text-xs mt-2 mb-1">Title</label>
      <input
        id="title"
        class="border px-1"
        placeholder="Title"
        name="title"
        v-model="formState.title"
      />

      <label for="group" class="text-xs mt-2 mb-1">Group</label>
      <input
        id="group"
        class="border px-1"
        placeholder="Group"
        name="group"
        v-model="formState.group"
      />

      <label for="notes" class="text-xs mt-2 mb-1">Notes</label>
      <input
        id="notes"
        class="border px-1"
        placeholder="Notes"
        name="notes"
        v-model="formState.notes"
      />

      <label for="start" class="text-xs mt-2 mb-1">Start</label>
      <input
        type="datetime-local"
        id="start"
        class="border px-1"
        name="start"
        v-model="formState.startDate"
      />

      <label for="end" class="text-xs mt-2 mb-1">End</label>
      <input
        type="datetime-local"
        id="end"
        class="border px-1"
        name="end"
        v-model="formState.endDate"
      />

      <label for="color" class="text-xs mt-2 mb-1">Color</label>
      <div
        id="color"
        :style="`background-color:${formState.color}`"
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
    </div>

    <div class="flex flex-1"></div>
    {{ formState }}
    <button
      @click="onAddTask"
      type="submit"
      class="h-14 bg-slate-700 rounded-sm text-lg text-slate-200"
    >
      Create
    </button>
  </div>
</template>

<script setup lang="ts">
import { add, sub, format, startOfMonth, startOfYear } from 'date-fns';
import { ref, computed } from 'vue';
import MonthCalendarIcon from 'vue-material-design-icons/CalendarFilter.vue';
import LeftIcon from 'vue-material-design-icons/ArrowLeftBold.vue';
import RightIcon from 'vue-material-design-icons/ArrowRightBold.vue';
import AddIcon from 'vue-material-design-icons/Plus.vue';
import CloseIcon from 'vue-material-design-icons/Close.vue';
import {
  getDatesInMonthYear,
  getAllHoursInDay,
  getAllMonthsInYear,
  minutesToHoursAndMinutes
} from '~~/utils/date';
import { Handles, Container, FormattedItem } from '~/types/item';
import { formatItems } from '~/utils/item';

const now = new Date();
const timeZoneOffset = minutesToHoursAndMinutes(now.getTimezoneOffset());

const hoursInDay = ref(getAllHoursInDay());
const monthsInYear = ref(getAllMonthsInYear(now.getFullYear()));

// month year select

const selectedMonth = ref(startOfMonth(now));
const selectedYear = ref(startOfYear(now));

const monthYearModelOpen = ref(false);

const onToggleMonthYearModal = () => {
  monthYearModelOpen.value = !monthYearModelOpen.value;
};

const incrementYear = () => {
  selectedYear.value = add(selectedYear.value, { years: 1 });
};
const decrementYear = () => {
  selectedYear.value = sub(selectedYear.value, { years: 1 });
};
const selectMonth = (date: Date) => {
  selectedMonth.value = date;
};

// row dates

const datesInSelectedMonthYear = computed(() => {
  return getDatesInMonthYear(
    selectedMonth.value.getMonth(),
    selectedYear.value.getFullYear()
  );
});

// tasks

const formattedItems = formatItems(
  datesInSelectedMonthYear.value,
  getTestData() as any
);

console.log(formattedItems);

// get tasks
// const getAllTasks = async () => {
//   try {
//     const response = await fetch('http://localhost:4000/graphql', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         authorization:
//           'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZjI1YTE3YjgxZmFkOTQ0MzA4MjBmMzgiLCJpYXQiOjE2ODA0MjQ3ODYsImV4cCI6MTY4ODIwMDc4Nn0.1DlG74ddbP71P62p-JY5G1Jwy5oPM_Zc42MZp0__zNY'
//       },
//       body: JSON.stringify({
//         query: `
//           query {
//             allTasks {
//               id
//               title
//               group
//               description
//               colour
//               start
//               end
//               createdAt
//               percentageTimes {
//                 startPercentage
//                 endPercentage
//               }
//               luminance
//               user {
//                 id
//                 name
//               }
//             }
//           }
//         `
//       })
//     });

//     const { data } = await response.json();
//     console.log(data);
//   } catch (error) {
//     console.error(error);
//     // Handle any errors that occur during the request
//   }
// };

// add task

const newTaskModalOpen = ref(false);
const onToggleNewTaskModal = () => {
  newTaskModalOpen.value = !newTaskModalOpen.value;
  formState.value.startDate = sub(new Date(), {
    hours: timeZoneOffset.hours,
    minutes: timeZoneOffset.minutes
  })
    .toISOString()
    .slice(0, -8);
  formState.value.endDate = sub(new Date(), {
    hours: timeZoneOffset.hours,
    minutes: timeZoneOffset.minutes
  })
    .toISOString()
    .slice(0, -8);
};

const formState = ref({
  title: '',
  group: '',
  notes: '',
  startDate: '',
  endDate: '',
  color: 'rgb(38, 203, 255)'
});

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
  'rgb(2, 0, 80)',
  'rgb(0, 22, 218)',
  'rgb(38, 203, 255)',
  'rgb(255, 0, 199)',
  'rgb(192, 0, 150)',
  'rgb(234, 0, 0)',
  'rgb(126, 0, 0)',
  'rgb(75, 0, 111)',
  'rgb(155, 0, 250)',
  'rgb(0, 94, 115)'
];

const selectColorOpen = ref(false);
const onToggleSelectColor = () =>
  (selectColorOpen.value = !selectColorOpen.value);

const setSelectedColor = (color: string) => {
  formState.value.color = color;
  selectColorOpen.value = false;
};

const onAddTask = () => {
  selectColorOpen.value = false;
  newTaskModalOpen.value = false;
  console.log('form-state:', formState.value);
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

const initialMouseDown = {
  handle: undefined as Handles | undefined,
  startX: 0,
  pressed: false,
  container: undefined as Container | undefined,
  target: undefined as FormattedItem | undefined,
  min: 0,
  max: 100
};
const mouseDownState = ref({ ...initialMouseDown });
const resetMouseDownState = () => {
  mouseDownState.value = { ...initialMouseDown };
};

const onMouseDown = (
  event: MouseEvent,
  handle: Handles,
  container: Container,
  target: FormattedItem,
  min: number,
  max: number
) => {
  console.log('mousedown');
  if (mouseDownState.value.pressed) return;

  mouseDownState.value.handle = handle;
  mouseDownState.value.startX = event.pageX;
  mouseDownState.value.pressed = true;
  mouseDownState.value.container = container;
  mouseDownState.value.target = target;
  mouseDownState.value.min = min;
  mouseDownState.value.max = max;
};

const onMouseUp = (event: MouseEvent) => {
  console.log('mouseup');

  const { handle, startX, target, container, min, max } = mouseDownState.value;
  if (!handle || !target || !container) return;

  const diff = new Diff(
    event.pageX,
    startX,
    container,
    handle,
    target,
    min,
    max,
    computedBreakpoint.value
  );
  diff.applyBreakpoint();
  diff.restrictMinValue();
  diff.restrictMaxValue();

  const newDate = getItemDate({
    difference: diff.value,
    date: target[handle]
  });

  console.log(newDate);

  if (handle === Handles.START) {
    const width = target.width - diff.value;
    const startPercentage = timeOfDayToPercentage(newDate);
    const style = `left: ${startPercentage}%; width: ${width}%;`;

    target.width = width;
    target.style = style;
    target.start = roundSeconds(newDate);
    target.startPercentage = timeOfDayToPercentage(newDate);
  }

  if (handle === Handles.END) {
    const width = target.width + diff.value;
    const style = `left: ${target.startPercentage}%; width: ${width}%;`;

    target.width = width;
    target.style = style;
    target.end = newDate;
    target.endPercentage = timeOfDayToPercentage(newDate);
  }

  resetMouseDownState();
};

const onMouseMove = (event: MouseEvent) => {
  console.log('mousemove');
  const { handle, target, startX, container, min, max } = mouseDownState.value;
  if (!handle || !target || !container) return;

  const itemContainerEnd = container?.right || event.pageX;
  const pageX = Math.min(event.pageX, itemContainerEnd);

  const diff = new Diff(
    pageX,
    startX,
    container,
    handle,
    target,
    min,
    max,
    computedBreakpoint.value
  );
  diff.restrictMaxValue();
  diff.restrictMinValue();

  const newDate = getItemDate({
    difference: diff.value,
    date: target[handle]
  });

  if (handle === Handles.START) {
    const width = target.width - diff.value;
    const startPercentage = timeOfDayToPercentage(newDate);
    const style = `left: ${startPercentage}%; width: ${width}%;`;
    target.style = style;
  }

  if (handle === Handles.END) {
    const width = target.width + diff.value;
    const style = `left: ${target.startPercentage}%; width: ${width}%;`;
    target.style = style;
  }
};
</script>

<template>
  <div class="relative flex flex-col flex-1 bg-white">
    <section class="flex justify-between items-start mx-3 mt-3">

      <div>
        <key :keys="itemsKey" />
      </div>

      <div class="flex">
        <div>
          <calendar :selected-month="selectedMonth" :selected-year="selectedYear" @on-change="onCalendarChange" />
        </div>

        <button id="create-item" @click="onOpenActivityDefaultCreate"
          class="hidden sm:flex ml-2 justify-center items-center h-9 py-2 pl-3 pr-4 rounded-[4px] text-slate-50 bg-slate-800 focus:outline-slate-700">
          <add-icon :size="22" class="text-slate-50 mr-1" />
          <span class="min-w-fit"> Create Task </span>
        </button>
      </div>
    </section>

    <button id="create-item-mobile" @click="onOpenActivityDefaultCreate"
      class="fixed z-20 right-2 bottom-16 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-slate-700 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-50" />
    </button>
    <button id="create-item-mobile" @click="onOpenActivityDefaultUpdate"
      class="fixed z-20 right-16 bottom-16 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-slate-700 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-50" />
    </button>
    <button id="create-session-mobile" @click="onOpenActivityWorkoutCreate"
      class="fixed z-20 right-2 bottom-32 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-blue-500 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="update-session-mobile" @click="onOpenActivityWorkoutUpdate"
      class="fixed z-20 right-2 bottom-48 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-blue-300 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="create-cardio-mobile" @click="onOpenActivityCardioCreate"
      class="fixed z-20 right-16 bottom-32 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-orange-500 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="update-cardio-mobile" @click="onOpenActivityCardioUpdate"
      class="fixed z-20 right-16 bottom-48 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-orange-300 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="create-cardio-mobile" @click="onOpenActivityMobilityCreate"
      class="fixed z-20 right-32 bottom-32 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-purple-500 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="update-cardio-mobile" @click="onOpenActivityMobilityUpdate"
      class="fixed z-20 right-32 bottom-48 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-purple-300 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>

    <section class="flex flex-col bg-slate-white pl-1 pr-2 sm:p-4 pt-2">
      <!-- times row -->
      <div class="flex cursor-default">
        <div class="h-6 w-6 mr-1 bg-white"></div>
        <ul class="flex w-[calc(100%_-_1.5rem)] mb-px">
          <li v-for="hour in hoursInDay"
            :class="[+format(hour, 'HH') % 4 !== 0 ? 'border-l-0 sm:border-l' : 'border-l']"
            class="h-5 w-[4.166666666666667%] max-w-[4.166666666666667%] bg-white font-mono font-light text-xs text-slate-400 border-slate-300">
            <div :class="[+format(hour, 'HH') % 4 !== 0 ? 'hidden sm:flex' : 'flex']"
              class="justify-center -translate-x-1/2 bg-white">
              {{ format(hour, 'HHmm') }}
            </div>
          </li>
        </ul>
      </div>

      <!-- table rows -->
      <section @mouseup="($event) => {
        const target = onMouseUp($event);
        if (!target) return
        onOpenActivityDefaultUpdate(target);
      }" @mousemove="onMouseMove" class="flex flex-1 cursor-default">
        <ul class="flex flex-1 flex-col mb-2">
          <li v-for="date in datesInSelectedMonthYear" :key="date.toDateString()" :class="['w-full']"
            class="flex flex-row">
            <!-- day date -->
            <div class="w-6 h-6 mr-1 flex justify-center border border-slate-200 rounded-sm">
              <div class="flex flex-col justify-center items-center font-mono text-slate-500">
                <span class="font-light text-[7px]/[7px] my-px leading-none">
                  {{ format(date, 'E').toUpperCase() }}
                </span>
                <span class="font-bold text-[10px]/[10px] leading-none">
                  {{ format(date, 'dd').toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- tasks -->
            <div class="h-6 flex flex-1 bg-white mb-0.5 rounded-sm">
              <item-row @change-item-start-time="onMouseDown" @change-item-end-time="onMouseDown" @item-click="(_$event, target) =>
                !mouseDownState.pressed && onOpenActivityDefaultUpdate(target)
                " :date="date" :ids="data?.[getDateId(date)]?.ids" :items="data?.[getDateId(date)]?.items" />
            </div>
          </li>
        </ul>
      </section>
    </section>
  </div>

  <!-- drag tracker -->
  <div v-if="mouseDownState.pressed"
    class="flex flex-col justify-center fixed bottom-2 left-64 h-8 w-16 ml-2 pl-2 bg-slate-800 text-slate-50 font-mono rounded-sm">
    <span>{{ dragTime }}</span>
  </div>

  <form-activity-default
    :mode="activityModal.open?.includes('default') ? activityModal.open.split(':')[1] as 'create' | 'update' : undefined"
    :data="activityModal.data" @on-close="onCloseActivityModal" />

  <form-activity-workout
    :mode="activityModal.open?.includes('workout') ? activityModal.open.split(':')[1] as 'create' | 'update' : undefined"
    @on-close="onCloseActivityModal" />

  <form-activity-cardio
    :mode="activityModal.open?.includes('cardio') ? activityModal.open.split(':')[1] as 'create' | 'update' : undefined"
    @on-close="onCloseActivityModal" />

  <form-activity-mobility
    :mode="activityModal.open?.includes('mobility') ? activityModal.open.split(':')[1] as 'create' | 'update' : undefined"
    @on-close="onCloseActivityModal" />

</template>

<script setup lang="ts">
import {
  add,
  sub,
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { ref, computed } from 'vue';
import AddIcon from 'vue-material-design-icons/Plus.vue';
import {
  getDatesInMonthYear,
  getAllHoursInDay,
  getDateId,
  timeOfDayToPercentage,
  applyTZOffset,
  buildLocalDatetime
} from '~~/utils/date';
import {
  type PostItemArgs,
} from '~/types/item';
import { type Validation } from '~/types/form';
import { DEFAULT_COLOR } from '~/constants/colors';
import { useAuthCheck } from '~/composables/useAuthCheck';
import { useMonthYearSelect } from '~/composables/useMonthYearSelect';
import { getActivities } from '~/utils/api-activity'


useAuthCheck();
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

// ITEMS

// todo: swap for get activites
const { data, pending, error, refresh } = await useAsyncData(
  getActivities.name,
  async () =>
    getActivities({
      start: [startDate.value.getFullYear(), startDate.value.getMonth(), startDate.value.getDate()],
      end: [endDate.value.getFullYear(), endDate.value.getMonth(), endDate.value.getDate()]
    }),
  {
    watch: [startDate, endDate],
    server: false,
    transform: (activities) => {
      const dates = getDatesInMonthYear(
        selectedMonth.value.getMonth(),
        selectedMonth.value.getFullYear(),
      )

      return formatActivities(dates, activities);
    },
  }
);

const itemsKey = computed(() => {
  const key: Record<string, [number, string]> = {};
  const seenIds: Record<string, boolean> = {};

  const localStart = buildLocalDatetime(
    startDate.value.getFullYear(), startDate.value.getMonth(), startDate.value.getDate(), '00:00:00.000'
  ).getTime();
  const localEnd = buildLocalDatetime(
    endDate.value.getFullYear(), endDate.value.getMonth(), endDate.value.getDate(), '23:59:59.999'
  ).getTime();

  for (const date of Object.keys(data.value ?? {})) {
    for (const id of data.value?.[date]?.ids ?? []) {
      const activity = data.value?.[date]?.items[id]
      if (!activity) continue;
      if (seenIds[activity.id]) continue;

      let start = new Date(activity.start).getTime();
      let end = new Date(activity.end).getTime();

      start = start < localStart ? localStart : start;
      end = end > localEnd ? localEnd : end;

      const duration = end - start;

      //todo: remove
      function getRandomHexColor() {
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        return `#${randomColor.padStart(6, '0')}`;
      }

      key[activity.title] = [duration + (key[activity.title]?.[0] ?? 0), getRandomHexColor()];
      seenIds[activity.id] = true;
    }
  }

  return key;
});

// MODAL


const formState = ref<{ id: string; data: PostItemArgs; valid: Validation }>({
  id: '',
  data: {
    title: '',
    group: '',
    notes: '',
    startDate: applyTZOffset(new Date(Date.now())).toISOString().slice(0, -8),
    endDate: applyTZOffset(add(new Date(Date.now()), { minutes: 5 }))
      .toISOString()
      .slice(0, -8),
    color: DEFAULT_COLOR
  },
  valid: {
    title: undefined as boolean | undefined,
    group: undefined as boolean | undefined,
    startDate: undefined as boolean | undefined,
    endDate: undefined as boolean | undefined
  }
});

const resetFormState = () => {
  formState.value.id = '';
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
  formState.value.data.color = DEFAULT_COLOR;

  formState.value.valid.title = undefined;
  formState.value.valid.group = undefined;
  formState.value.valid.startDate = undefined;
  formState.value.valid.endDate = undefined;

};

const activityModal = ref<{
  data: any,
  open: 'default:create' | 'default:update'
  | 'cardio:create' | 'cardio:update'
  | 'mobility:create' | 'mobility:update'
  | 'workout:create' | 'workout:update'
  | undefined
}>({
  data: undefined,
  open: undefined
});

const modalVariants = ['default', 'workout', 'cardio', 'mobility'];

function onCloseActivityModal() {
  // todo: if update, and update cancelled, reset activity times to previous state
  activityModal.value.open = undefined;
  activityModal.value.data = undefined;
}

const [
  [onOpenActivityDefaultCreate, onOpenActivityDefaultUpdate],
  [onOpenActivityWorkoutCreate, onOpenActivityWorkoutUpdate],
  [onOpenActivityCardioCreate, onOpenActivityCardioUpdate],
  [onOpenActivityMobilityCreate, onOpenActivityMobilityUpdate],
] = modalVariants.map(variant => {
  function openCreate() {
    activityModal.value.open = `${variant}:create` as any;
  }
  // todo: not any
  function openUpdate(data: any) {
    console.log('data', data);
    activityModal.value.data = data;
    activityModal.value.open = `${variant}:update` as any;
  }
  return [openCreate, openUpdate];
})


// const onOpenUpdateTaskModal = (task: FormattedItem | undefined) => {
//   const taskData = data.value?.find((t) => t.id === task?.id);
//
//   if (taskData && task) {
//     const end = task.isEnd ? task.end : new Date(+taskData.end);
//     const start = task.isStart ? task.start : new Date(+taskData.start);
//
//     // parse weights
//     if (taskData.title === 'weights') {
//       try {
//         const exercise = JSON.parse(taskData.description);
//       } catch (_) {
//         const exercise: any[] = [];
//         const exercises = taskData.description.split(',');
//
//         for (const e of exercises) {
//           const [sets, reps, ...name] = e.trim().split(' ');
//           const output = { name: name.join(' ').trim(), data: [] as any[] };
//           for (let i = 0; i < parseInt(sets); i++) {
//             output.data.push({ reps: parseInt(reps.slice(1)), weight: '' });
//           }
//           exercise.push(output);
//         }
//
//       }
//     }
//
//     formState.value.id = taskData.id;
//     formState.value.data.title = taskData.title;
//     formState.value.data.notes = taskData.description;
//     formState.value.data.group = taskData.group;
//     formState.value.data.color = taskData.colour;
//     formState.value.data.start = applyTZOffset(start)
//       .toISOString()
//       .slice(0, -8);
//     formState.value.data.end = applyTZOffset(end)
//       .toISOString()
//       .slice(0, -8);
//
//     taskModal.value.open = 'update';
//     taskModal.value.task = task;
//
//     // titleRefUpdate.value!.focus();
//   }
// };
//
// const onCloseUpdateTaskModal = () => {
//   const taskData = data.value?.find((t) => t.id === taskModal.value.task?.id);
//
//   if (taskData && taskModal.value.task) {
//     let start;
//     let end;
//     let width;
//     let style;
//     let startPercentage;
//     let endPercentage;
//
//     // isStart && isEnd
//     if (taskModal.value.task.isStart && taskModal.value.task.isEnd) {
//       start = new Date(+taskData.start);
//       end = new Date(+taskData.end);
//       startPercentage = timeOfDayToPercentage(start);
//       endPercentage = timeOfDayToPercentage(end);
//       width = endPercentage - startPercentage;
//     }
//
//     // isStart && !isEnd
//     if (taskModal.value.task.isStart && !taskModal.value.task.isEnd) {
//       start = new Date(+taskData.start);
//       end = endOfDay(taskModal.value.task.end);
//       startPercentage = timeOfDayToPercentage(start);
//       endPercentage = 100;
//       width = endPercentage - startPercentage;
//     }
//
//     // !isStart && isEnd
//     if (!taskModal.value.task.isStart && taskModal.value.task.isEnd) {
//       start = startOfDay(taskModal.value.task.start);
//       end = new Date(+taskData.end);
//       startPercentage = 0;
//       endPercentage = timeOfDayToPercentage(end);
//       width = endPercentage;
//     }
//
//     // !isStart && !isEnd
//     if (!taskModal.value.task.isStart && !taskModal.value.task.isEnd) {
//       start = startOfDay(taskModal.value.task.start);
//       end = endOfDay(taskModal.value.task.end);
//       startPercentage = 0;
//       endPercentage = 100;
//       width = 100;
//     }
//
//     style = `left: ${startPercentage}%; width: ${width}%;`;
//
//     taskModal.value.task.start = start;
//     taskModal.value.task.end = end;
//     taskModal.value.task.width = width;
//     taskModal.value.task.style = style;
//     taskModal.value.task.startPercentage = startPercentage;
//     taskModal.value.task.endPercentage = endPercentage;
//
//     taskModal.value.open = undefined;
//     taskModal.value.task = undefined;
//     resetFormState();
//   }
// };



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

const openCreateTaskModalListener = (e: KeyboardEvent) => {
  if (e.key === 'i' && activityModal.value.open === undefined) {
    e.preventDefault();
    onOpenActivityDefaultCreate();
  }
};

useEventListener('keydown', openCreateTaskModalListener);
</script>

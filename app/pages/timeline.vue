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

        <button id="create-item" @click="onOpenCreateTaskModal"
          class="hidden sm:flex ml-2 justify-center items-center h-9 py-2 pl-3 pr-4 rounded-[4px] text-slate-50 bg-slate-800 focus:outline-slate-700">
          <add-icon :size="22" class="text-slate-50 mr-1" />
          <span class="min-w-fit"> Create Task </span>
        </button>
      </div>
    </section>

    <button id="create-item-mobile" @click="onOpenCreateTaskModal"
      class="fixed z-20 right-2 bottom-16 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-slate-700 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-50" />
    </button>
    <button id="create-session-mobile" @click="onOpenCreateWorkoutModal"
      class="fixed z-20 right-2 bottom-32 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-blue-500 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="update-session-mobile" @click="onOpenUpdateWorkoutModal"
      class="fixed z-20 right-2 bottom-48 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-blue-300 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="create-cardio-mobile" @click="onOpenCreateCardioModal"
      class="fixed z-20 right-16 bottom-32 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-orange-500 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="update-cardio-mobile" @click="onOpenUpdateCardioModal"
      class="fixed z-20 right-16 bottom-48 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-orange-300 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="create-cardio-mobile" @click="onOpenCreateMobilityModal"
      class="fixed z-20 right-32 bottom-32 flex sm:hidden justify-center items-center h-12 w-12 rounded-full bg-purple-500 drop-shadow-lg focus:outline-slate-700">
      <add-icon :size="24" class="text-slate-100" />
    </button>
    <button id="update-cardio-mobile" @click="onOpenUpdateMobilityModal"
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
        onOpenUpdateTaskModal(target);
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
                !mouseDownState.pressed && onOpenUpdateTaskModal(target)
                " :date="date" :ids="formattedItems[getDateId(date)]?.ids"
                :items="formattedItems[getDateId(date)]?.items" />
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

  <form-activity-default :mode="taskModal.open" @on-close="onCloseCreateTaskModal" />

  <form-activity-workout :mode="workoutModal.open" @on-close="onCloseCreateWorkoutModal" />

  <form-activity-cardio :mode="cardioModal.open" @on-close="onCloseCreateCardioModal" />

  <form-activity-mobility :mode="mobilityModal.open" @on-close="onCloseCreateMobilityModal" />



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
  applyTZOffset
} from '~~/utils/date';
import {
  type FormattedItem,
  type PostItemArgs,
  type PatchItemArgs,
  type DeleteItemArgs
} from '~/types/item';
import { type Validation } from '~/types/form';
import { formatItems } from '~/utils/item';
import { getItems, postItem, patchItem, deleteItem } from '~/utils/api-item';
import {
  validateDate,
  validateGroup,
  validateTitle
} from '~/utils/form/validation';
import { DEFAULT_COLOR } from '~/constants/colors';
import { useAuthCheck } from '~/composables/useAuthCheck';
import { useMonthYearSelect } from '~/composables/useMonthYearSelect';


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

const { data, pending, error, refresh } = await useAsyncData(
  'getItems',
  async () =>
    getItems({
      startDate: sub(startDate.value, { days: 1 }),
      endDate: add(endDate.value, { days: 1 })
    }),
  { watch: [startDate, endDate], server: false }
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

const itemsKey = computed(() => {
  const key: Record<string, [number, string]> = {};

  const startMonthMs = startOfMonth(selectedMonth.value).getTime();
  const endMonthMs = endOfMonth(selectedMonth.value).getTime();

  for (const item of data.value ?? []) {
    if (+item.end <= startMonthMs) continue;
    if (+item.start >= endMonthMs) continue;

    const itemStart = +item.start < startMonthMs ? startMonthMs : +item.start;
    const itemEnd = +item.end > endMonthMs ? endMonthMs : +item.end;

    const duration = itemEnd - itemStart;
    key[item.title] = [duration + (key[item.title]?.[0] ?? 0), item.colour];
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

const formStateNotValid = computed(() => {
  return Object.values(formState.value.valid).some((v) => !v);
});

const mobilityModal = ref<{
  task: FormattedItem | undefined;
  open: 'create' | 'update' | undefined;
}>({
  task: undefined,
  open: undefined
});

const onOpenCreateMobilityModal = () => {
  mobilityModal.value.open = 'create';
};

const onCloseCreateMobilityModal = () => {
  mobilityModal.value.open = undefined;
};

const onOpenUpdateMobilityModal = () => {
  mobilityModal.value.open = 'update';
};

const onCloseUpdateMobilityModal = () => {
  mobilityModal.value.open = undefined;
};

const cardioModal = ref<{
  task: FormattedItem | undefined;
  open: 'create' | 'update' | undefined;
}>({
  task: undefined,
  open: undefined
});

const onOpenCreateCardioModal = () => {
  cardioModal.value.open = 'create';
};

const onCloseCreateCardioModal = () => {
  cardioModal.value.open = undefined;
};

const onOpenUpdateCardioModal = () => {
  cardioModal.value.open = 'update';
};

const onCloseUpdateCardioModal = () => {
  cardioModal.value.open = undefined;
};

const workoutModal = ref<{
  task: FormattedItem | undefined;
  open: 'create' | 'update' | undefined;
}>({
  task: undefined,
  open: undefined
});

const onOpenCreateWorkoutModal = () => {
  workoutModal.value.open = 'create';
};

const onCloseCreateWorkoutModal = () => {
  workoutModal.value.open = undefined;
};

const onOpenUpdateWorkoutModal = () => {
  workoutModal.value.open = 'update';
};

const onCloseUpdateWorkoutModal = () => {
  workoutModal.value.open = undefined;
};

const taskModal = ref<{
  task: FormattedItem | undefined;
  open: 'create' | 'update' | undefined;
}>({
  task: undefined,
  open: undefined
});



const onOpenCreateTaskModal = () => {
  taskModal.value.open = 'create';
};

const onCloseCreateTaskModal = () => {
  taskModal.value.open = undefined;
};

const onOpenUpdateTaskModal = (task: FormattedItem | undefined) => {
  const taskData = data.value?.find((t) => t.id === task?.id);

  if (taskData && task) {
    const end = task.isEnd ? task.end : new Date(+taskData.end);
    const start = task.isStart ? task.start : new Date(+taskData.start);

    // parse weights
    if (taskData.title === 'weights') {
      try {
        const exercise = JSON.parse(taskData.description);
      } catch (_) {
        const exercise: any[] = [];
        const exercises = taskData.description.split(',');

        for (const e of exercises) {
          const [sets, reps, ...name] = e.trim().split(' ');
          const output = { name: name.join(' ').trim(), data: [] as any[] };
          for (let i = 0; i < parseInt(sets); i++) {
            output.data.push({ reps: parseInt(reps.slice(1)), weight: '' });
          }
          exercise.push(output);
        }

      }
    }

    formState.value.id = taskData.id;
    formState.value.data.title = taskData.title;
    formState.value.data.notes = taskData.description;
    formState.value.data.group = taskData.group;
    formState.value.data.color = taskData.colour;
    formState.value.data.start = applyTZOffset(start)
      .toISOString()
      .slice(0, -8);
    formState.value.data.end = applyTZOffset(end)
      .toISOString()
      .slice(0, -8);

    taskModal.value.open = 'update';
    taskModal.value.task = task;

    // titleRefUpdate.value!.focus();
  }
};

const onCloseUpdateTaskModal = () => {
  const taskData = data.value?.find((t) => t.id === taskModal.value.task?.id);

  if (taskData && taskModal.value.task) {
    let start;
    let end;
    let width;
    let style;
    let startPercentage;
    let endPercentage;

    // isStart && isEnd
    if (taskModal.value.task.isStart && taskModal.value.task.isEnd) {
      start = new Date(+taskData.start);
      end = new Date(+taskData.end);
      startPercentage = timeOfDayToPercentage(start);
      endPercentage = timeOfDayToPercentage(end);
      width = endPercentage - startPercentage;
    }

    // isStart && !isEnd
    if (taskModal.value.task.isStart && !taskModal.value.task.isEnd) {
      start = new Date(+taskData.start);
      end = endOfDay(taskModal.value.task.end);
      startPercentage = timeOfDayToPercentage(start);
      endPercentage = 100;
      width = endPercentage - startPercentage;
    }

    // !isStart && isEnd
    if (!taskModal.value.task.isStart && taskModal.value.task.isEnd) {
      start = startOfDay(taskModal.value.task.start);
      end = new Date(+taskData.end);
      startPercentage = 0;
      endPercentage = timeOfDayToPercentage(end);
      width = endPercentage;
    }

    // !isStart && !isEnd
    if (!taskModal.value.task.isStart && !taskModal.value.task.isEnd) {
      start = startOfDay(taskModal.value.task.start);
      end = endOfDay(taskModal.value.task.end);
      startPercentage = 0;
      endPercentage = 100;
      width = 100;
    }

    style = `left: ${startPercentage}%; width: ${width}%;`;

    taskModal.value.task.start = start;
    taskModal.value.task.end = end;
    taskModal.value.task.width = width;
    taskModal.value.task.style = style;
    taskModal.value.task.startPercentage = startPercentage;
    taskModal.value.task.endPercentage = endPercentage;

    taskModal.value.open = undefined;
    taskModal.value.task = undefined;
    resetFormState();
  }
};


// ADD TASK

const onAddTask = async () => {
  validateTitle(formState);
  validateGroup(formState);
  validateDate(formState, formattedItems);
  if (formStateNotValid.value) return;

  taskModal.value.open = undefined;

  if (formState.value.data.title === 'weights') {
    // const notes = formatExerciseState();
    // formState.value.data.notes = notes;
  }

  try {
    await postItem(formState.value.data);
    await refresh();

    formState.value.data.title = '';
    formState.value.data.notes = '';
    formState.value.data.group = '';
    formState.value.data.startDate = formState.value.data.endDate;
    formState.value.data.endDate = applyTZOffset(
      add(new Date(formState.value.data.endDate), { minutes: 5 })
    )
      .toISOString()
      .slice(0, -8);
  } catch (e) {
    console.log('error', e);
  }
};

// UPDATE TASK

const onUpdateTask = async () => {
  validateTitle(formState);
  validateGroup(formState);
  validateDate(formState, formattedItems);
  if (formStateNotValid.value) return;

  taskModal.value.open = undefined;

  if (formState.value.data.title === 'weights') {
    // const notes = formatExerciseState();
    // formState.value.data.notes = notes;
  }

  try {
    const patchArgs: PatchItemArgs = formState.value.data as any;
    patchArgs.id = formState.value.id;

    if (patchArgs.group === taskModal.value.task?.group)
      patchArgs.group = undefined;
    if (patchArgs.color === taskModal.value.task?.colour)
      patchArgs.color = undefined;

    await patchItem(patchArgs);
    await refresh();

    resetFormState();
  } catch (e) {
    console.log('error', e);
  }
};

// DELETE TASK

const onDeleteTask = async () => {
  taskModal.value.open = undefined;

  try {
    const deleteArgs: DeleteItemArgs = { id: formState.value.id };

    await deleteItem(deleteArgs);
    await refresh();

    resetFormState();
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

const openCreateTaskModalListener = (e) => {
  if (e.key === 'i' && taskModal.value.open === undefined) {
    e.preventDefault();
    onOpenCreateTaskModal();
  }
};

useEventListener('keydown', openCreateTaskModalListener);
</script>

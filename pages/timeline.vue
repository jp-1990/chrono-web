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
          mouseup: mouseDownState.pressed
            ? ($event) => {
                const target = onMouseUp($event);
                onOpenUpdateTaskModal(target);
              }
            : null,
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
                @item-click="
                  (_$event, target) =>
                    !mouseDownState.pressed && onOpenUpdateTaskModal(target)
                "
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

  <!-- key -->
  <div
    v-if="Object.keys(itemsKey).length"
    class="flex flex-col justify-center fixed bottom-4 left-4 w-56 p-1 bg-slate-100 rounded-sm"
  >
    <ul class="flex flex-col">
      <li
        v-for="(value, key) in itemsKey"
        class="flex items-center text-slate-500"
      >
        <div :style="`background-color: ${value[1]}`" class="w-6 h-6 m-1"></div>
        <div class="ml-1 mr-1 flex items-center flex-1 justify-between">
          <p>
            {{ key }}
          </p>
          <div class="flex font-mono font-light text-slate-400">
            <p class="mr-0.5">
              {{ millisecondsToHoursAndMinutes(value[0]).hours }}h
            </p>
            <p class="w-8 flex justify-end">
              {{ millisecondsToHoursAndMinutes(value[0]).minutes }}m
            </p>
          </div>
        </div>
      </li>
    </ul>
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
    @click="onOpenCreateTaskModal"
    role="button"
    class="fixed bottom-4 right-8 h-14 w-14 flex items-center justify-center bg-slate-800 rounded-xl"
  >
    <add-icon :size="30" class="text-slate-200" />
  </div>

  <!-- create panel -->
  <side-panel
    :is-open="taskModal.open === 'create'"
    @on-close="onCloseCreateTaskModal"
    @on-submit="onAddTask"
  >
    <template v-slot:title-text>Add Task</template>
    <template v-slot:content>
      <label for="create-title" class="text-xs mt-2 mb-1">Title*</label>
      <input
        @blur="onTitleBlur"
        id="create-title"
        ref="titleRefCreate"
        :class="[formState.valid.title === false ? 'border-red-600' : '']"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        placeholder="Title"
        name="create-title"
        v-model="formState.data.title"
      />

      <label for="create-group" class="text-xs mt-2 mb-1">Group*</label>
      <input
        @blur="onGroupBlur"
        id="create-group"
        :class="[formState.valid.group === false ? 'border-red-600' : '']"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        placeholder="Group"
        name="create-group"
        v-model="formState.data.group"
      />

      <label for="create-notes" class="text-xs mt-2 mb-1">Notes</label>
      <input
        id="create-notes"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        placeholder="Notes"
        name="create-notes"
        v-model="formState.data.notes"
      />

      <label for="create-start" class="text-xs mt-2 mb-1">Start*</label>
      <input
        @blur="onStartDateBlur"
        type="datetime-local"
        id="create-start"
        :class="[formState.valid.startDate === false ? 'border-red-600' : '']"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        name="create-start"
        v-model="formState.data.startDate"
      />

      <label for="create-end" class="text-xs mt-2 mb-1">End*</label>
      <input
        @blur="onEndDateBlur"
        type="datetime-local"
        id="create-end"
        :class="[formState.valid.endDate === false ? 'border-red-600' : '']"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        name="create-end"
        v-model="formState.data.endDate"
      />

      <color-select
        @on-change="setColor"
        :value="formState.data.color"
        :force-closed="taskModal.open !== 'create'"
      />
    </template>
    <template v-slot:submit-text>Create Task</template>
  </side-panel>

  <!-- update panel -->
  <side-panel
    :is-open="taskModal.open === 'update'"
    @on-close="onCloseUpdateTaskModal"
    @on-submit="onUpdateTask"
  >
    <template v-slot:title-text>Update Task</template>
    <template v-slot:content>
      <label for="update-title" class="text-xs mt-2 mb-1">Title*</label>
      <input
        @blur="onTitleBlur"
        id="update-title"
        ref="titleRefUpdate"
        :class="[formState.valid.title === false ? 'border-red-600' : '']"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        placeholder="Title"
        name="update-title"
        v-model="formState.data.title"
      />

      <label for="update-group" class="text-xs mt-2 mb-1">Group*</label>
      <input
        @blur="onGroupBlur"
        id="update-group"
        :class="[formState.valid.group === false ? 'border-red-600' : '']"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        placeholder="Group"
        name="update-group"
        v-model="formState.data.group"
      />

      <label for="update-notes" class="text-xs mt-2 mb-1">Notes</label>
      <input
        id="update-notes"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        placeholder="Notes"
        name="update-notes"
        v-model="formState.data.notes"
      />

      <label for="update-start" class="text-xs mt-2 mb-1">Start*</label>
      <input
        @blur="onStartDateBlur"
        type="datetime-local"
        id="update-start"
        :class="[formState.valid.startDate === false ? 'border-red-600' : '']"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        name="update-start"
        v-model="formState.data.startDate"
      />

      <label for="update-end" class="text-xs mt-2 mb-1">End*</label>
      <input
        @blur="onEndDateBlur"
        type="datetime-local"
        id="update-end"
        :class="[formState.valid.endDate === false ? 'border-red-600' : '']"
        class="border py-1 px-2 rounded-sm focus:outline-none focus:border-slate-700"
        name="update-end"
        v-model="formState.data.endDate"
      />

      <color-select
        @on-change="setColor"
        :value="formState.data.color"
        :force-closed="taskModal.open !== 'update'"
      />
    </template>
    <template v-slot:submit-text>Update Task</template>
    <template v-slot:extra-button>
      <div class="w-2"></div>
      <button
        id="side-panel-delete"
        @click="onDeleteTask"
        class="flex-1 h-14 rounded-sm text-lg bg-red-600 text-slate-200 focus:outline-none focus:border-2 focus:border-slate-400"
      >
        Delete
      </button>
    </template>
  </side-panel>
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
  FormattedItem,
  PostItemArgs,
  PatchItemArgs,
  DeleteItemArgs
} from '~/types/item';
import { Validation } from '~/types/form';
import { formatItems } from '~/utils/item';
import { getItems, postItem, patchItem, deleteItem } from '~/utils/api-item';
import {
  validateDate,
  validateGroup,
  validateTitle
} from '~/utils/form/validation';
import { DEFAULT_COLOR } from '~/constants/colors';

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

const titleRefCreate = ref<HTMLElement | null>(null);
const titleRefUpdate = ref<HTMLElement | null>(null);

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

const setColor = (color: string) => (formState.value.data.color = color);

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
  resetFormState();
  taskModal.value.open = undefined;
};

const onOpenUpdateTaskModal = (task: FormattedItem | undefined) => {
  const taskData = data.value?.find((t) => t.id === task?.id);

  if (taskData && task) {
    const end = task.isEnd ? task.end : new Date(+taskData.end);
    const start = task.isStart ? task.start : new Date(+taskData.start);

    formState.value.id = taskData.id;
    formState.value.data.title = taskData.title;
    formState.value.data.notes = taskData.description;
    formState.value.data.group = taskData.group;
    formState.value.data.color = taskData.colour;
    formState.value.data.startDate = applyTZOffset(start)
      .toISOString()
      .slice(0, -8);
    formState.value.data.endDate = applyTZOffset(end)
      .toISOString()
      .slice(0, -8);

    taskModal.value.open = 'update';
    taskModal.value.task = task;

    titleRefUpdate.value!.focus();
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

const onTitleBlur = () => {
  if (itemsKey.value[formState.value.data.title]) {
    formState.value.data.color = itemsKey.value[formState.value.data.title][1];
  }
  return validateTitle(formState);
};
const onGroupBlur = () => validateGroup(formState);
const onStartDateBlur = () => validateDate(formState, formattedItems);
const onEndDateBlur = () => validateDate(formState, formattedItems);

// ADD TASK

const onAddTask = async () => {
  validateTitle(formState);
  validateGroup(formState);
  validateDate(formState, formattedItems);
  if (formStateNotValid.value) return;

  taskModal.value.open = undefined;

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

onMounted(() => {
  window?.addEventListener('keydown', (e) => {
    if (e.key === 'i' && taskModal.value.open === undefined) {
      e.preventDefault();
      onOpenCreateTaskModal();
      titleRefCreate.value!.focus();
    }
  });
});
</script>

<template>
  <div class="relative flex flex-col flex-1 bg-white">
    <section class="flex justify-between items-start mx-3 mt-3">
      <div>
        <key :keys="itemsKey" />
      </div>

      <div class="flex">
        <div>
          <calendar
            :selected-month="selectedMonth"
            :selected-year="selectedYear"
            @on-change="onCalendarChange"
          />
        </div>

        <button
          id="create-item"
          @click="onOpenActivityDefaultCreate"
          class="hidden sm:flex ml-2 justify-center items-center h-9 py-2 pl-3 pr-4 rounded-[4px] text-slate-50 bg-slate-800 focus:outline-slate-700"
        >
          <add-icon :size="22" class="text-slate-50 mr-1" />
          <span class="min-w-fit"> Create Task </span>
        </button>
      </div>
    </section>

    <button
      id="create-item-mobile"
      @click="toggleAddOptions"
      class="fixed z-20 right-2 bottom-16 flex justify-center items-center h-14 w-14 rounded-full bg-slate-900 drop-shadow-lg focus:outline-slate-700"
    >
      <add-icon :size="32" class="text-slate-50" />
    </button>
    <div v-if="addOptions" class="flex gap-3 fixed z-20 right-2 bottom-[132px]">
      <button
        id="create-cardio-mobile"
        @click="onOpenActivityMobilityCreate"
        class="flex justify-center items-center h-14 w-14 rounded-full bg-slate-500 drop-shadow-lg focus:outline-slate-700"
      >
        <mobility-icon :size="38" class="text-slate-100" />
      </button>
      <button
        id="create-cardio-mobile"
        @click="onOpenActivityCardioCreate"
        class="flex justify-center items-center h-14 w-14 rounded-full bg-slate-600 drop-shadow-lg focus:outline-slate-700"
      >
        <cardio-icon :size="32" class="text-slate-100" />
      </button>
      <button
        id="create-session-mobile"
        @click="onOpenActivityWorkoutCreate"
        class="flex justify-center items-center h-14 w-14 rounded-full bg-slate-700 drop-shadow-lg focus:outline-slate-700"
      >
        <strength-icon :size="32" class="text-slate-100" />
      </button>
      <button
        id="create-item-mobile"
        @click="onOpenActivityDefaultCreate"
        class="flex justify-center items-center h-14 w-14 rounded-full bg-slate-800 drop-shadow-lg focus:outline-slate-700"
      >
        <add-icon :size="32" class="text-slate-50" />
      </button>
    </div>

    <section class="flex flex-col bg-slate-white pl-1 pr-2 sm:p-4 pt-2">
      <!-- times row -->
      <div class="flex cursor-default">
        <div class="h-6 w-6 mr-1 bg-white"></div>
        <ul class="flex w-[calc(100%_-_1.5rem)] mb-px">
          <li
            v-for="hour in hoursInDay"
            :class="[
              +format(hour, 'HH') % 4 !== 0
                ? 'border-l-0 sm:border-l'
                : 'border-l'
            ]"
            class="h-5 w-[4.166666666666667%] max-w-[4.166666666666667%] bg-white font-mono font-light text-xs text-slate-400 border-slate-300"
          >
            <div
              :class="[
                +format(hour, 'HH') % 4 !== 0 ? 'hidden sm:flex' : 'flex'
              ]"
              class="justify-center -translate-x-1/2 bg-white"
            >
              {{ format(hour, 'HHmm') }}
            </div>
          </li>
        </ul>
      </div>

      <!-- table rows -->
      <section
        @mouseup="
          ($event) => {
            const { target, prevStyle, prevStart, prevEnd } = onMouseUp($event);
            if (!target) return;
            const fn = updateMap[target.title] ?? updateMap['default'];
            fn($event, target, prevStyle, prevStart, prevEnd);
          }
        "
        @mousemove="onMouseMove"
        class="flex flex-1 cursor-default"
      >
        <ul class="flex flex-1 flex-col mb-2">
          <li
            v-for="date in datesInSelectedMonthYear"
            :key="date.toDateString()"
            :class="['w-full']"
            class="flex flex-row"
          >
            <!-- day date -->
            <div
              class="w-6 h-6 mr-1 flex justify-center border border-slate-200 rounded-sm"
            >
              <div
                class="flex flex-col justify-center items-center font-mono text-slate-500"
              >
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
              <item-row
                @change-item-start-time="onMouseDown"
                @change-item-end-time="onMouseDown"
                @item-click="
                  ($event, target) => {
                    if (mouseDownState.pressed) return;
                    const fn =
                      updateMap[target?.title || 'default'] ??
                      updateMap['default'];
                    fn($event, target);
                  }
                "
                :date="date"
                :ids="data?.activities[getDateId(date)]?.ids"
                :items="data?.activities[getDateId(date)]?.items"
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
    class="flex flex-col justify-center fixed bottom-2 left-64 h-8 w-16 ml-2 pl-2 bg-slate-800 text-slate-50 font-mono rounded-sm"
  >
    <span>{{ dragTime }}</span>
  </div>

  <form-activity-default
    :mode="activityModal.open?.includes('default') ? activityModal.open.split(':')[1] as 'create' | 'update' : undefined"
    :data="activityModal.data"
    :activities="data"
    @on-close="onCloseActivityModal"
  />

  <form-activity-workout
    :mode="activityModal.open?.includes('workout') ? activityModal.open.split(':')[1] as 'create' | 'update' : undefined"
    :data="activityModal.data"
    :activities="data"
    @on-close="onCloseActivityModal"
  />

  <form-activity-cardio
    :mode="activityModal.open?.includes('cardio') ? activityModal.open.split(':')[1] as 'create' | 'update' : undefined"
    :data="activityModal.data"
    :activities="data"
    @on-close="onCloseActivityModal"
  />

  <form-activity-mobility
    :mode="activityModal.open?.includes('mobility') ? activityModal.open.split(':')[1] as 'create' | 'update' : undefined"
    :data="activityModal.data"
    :activities="data"
    @on-close="onCloseActivityModal"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAsyncData } from '#imports';
import { format } from 'date-fns';
import AddIcon from 'vue-material-design-icons/Plus.vue';
import StrengthIcon from 'vue-material-design-icons/Dumbbell.vue';
import CardioIcon from 'vue-material-design-icons/Run.vue';
import MobilityIcon from 'vue-material-design-icons/Meditation.vue';

import { DEFAULT_COLOR } from '../constants/colors';
import { useAuthCheck } from '../composables/useAuthCheck';
import { useMonthYearSelect } from '../composables/useMonthYearSelect';
import { useStartEndDrag } from '../composables/useStartEndDrag';
import { useWindowEventListener } from '../composables/useEventListener';
import { useUserState } from '../composables/state';
import type { FormattedActivity } from '../types/activity';
import { getActivities } from '../utils/api-activity';
import { apiRequest } from '../utils/api-request';
import { DerivedActivities } from '../utils/activity';
import {
  getDatesInMonthYear,
  getAllHoursInDay,
  getDateId,
  buildLocalDatetime,
  dragBreakpoint
} from '../utils/date';
import { db } from '../utils/indexeddb';
import requestQueue from '../utils/request-queue';

useAuthCheck();

const { user } = useUserState();

const hoursInDay = getAllHoursInDay();

// MONTH YEAR SELECT

const {
  selectedMonth,
  selectedYear,
  startDate,
  endDate,
  datesInSelectedMonthYear,
  onCalendarChange
} = useMonthYearSelect();

// ITEMS

const { data, pending, error, refresh } = await useAsyncData(
  getActivities.id,
  async () => {
    const start = [
      startDate.value.getFullYear(),
      startDate.value.getMonth(),
      startDate.value.getDate()
    ] as const;
    const end = [
      endDate.value.getFullYear(),
      endDate.value.getMonth(),
      endDate.value.getDate()
    ] as const;

    const startString = new Date(buildLocalDatetime(...start)).toISOString();
    const endString = new Date(
      buildLocalDatetime(...end, '23:59:59.999')
    ).toISOString();

    return await apiRequest(getActivities, {
      start: startString,
      end: endString
    });
  },
  {
    watch: [startDate, endDate],
    server: false,
    transform: (activities) => {
      if (!activities) return null;
      const dates = getDatesInMonthYear(
        selectedMonth.value.getMonth(),
        selectedYear.value.getFullYear()
      );

      const derrivedActivities = new DerivedActivities(dates, activities.data);
      return derrivedActivities;
    }
  }
);

const itemsKey = computed(() => {
  const key: Record<string, [number, string]> = {};
  const seenIds: Record<string, boolean> = {};

  const localStart = buildLocalDatetime(
    startDate.value.getFullYear(),
    startDate.value.getMonth(),
    startDate.value.getDate(),
    '00:00:00.000'
  ).getTime();
  const localEnd = buildLocalDatetime(
    endDate.value.getFullYear(),
    endDate.value.getMonth(),
    endDate.value.getDate(),
    '23:59:59.999'
  ).getTime();

  for (const date of Object.keys(data.value?.activities ?? {})) {
    for (const id of data.value?.activities[date]?.ids ?? []) {
      const activity = data.value?.activities[date]?.items[id];
      if (!activity) continue;
      if (seenIds[activity.id]) continue;

      let start = new Date(activity.start).getTime();
      let end = new Date(activity.end).getTime();

      start = start < localStart ? localStart : start;
      end = end > localEnd ? localEnd : end;

      const duration = end - start;

      key[activity.title] = [
        duration + (key[activity.title]?.[0] ?? 0),
        user.value.activities?.[activity.title] ?? DEFAULT_COLOR
      ];
      seenIds[activity.id] = true;
    }
  }

  return key;
});

// MODAL

const addOptions = ref<boolean>(false);

function toggleAddOptions() {
  addOptions.value = !addOptions.value;
}

function closeAddOptions() {
  addOptions.value = false;
}

const activityModal = ref<{
  open:
    | 'default:create'
    | 'default:update'
    | 'cardio:create'
    | 'cardio:update'
    | 'mobility:create'
    | 'mobility:update'
    | 'workout:create'
    | 'workout:update'
    | undefined;
  data?: FormattedActivity;
  prevStyle?: string;
  prevStart?: string;
  prevEnd?: string;
}>({
  data: undefined,
  open: undefined,
  prevStyle: undefined,
  prevEnd: undefined,
  prevStart: undefined
});

const modalVariants = ['default', 'workout', 'cardio', 'mobility'];

function onCloseActivityModal(
  _e: MouseEvent | KeyboardEvent | undefined,
  reason: 'submit' | 'cancel'
) {
  if (
    activityModal.value.open?.split(':')[1] === 'update' &&
    reason === 'cancel' &&
    activityModal.value.data
  ) {
    if (activityModal.value.prevStyle) {
      activityModal.value.data.style = activityModal.value.prevStyle;
    }
    if (activityModal.value.prevStart) {
      activityModal.value.data.start = activityModal.value.prevStart;
    }
    if (activityModal.value.prevEnd) {
      activityModal.value.data.end = activityModal.value.prevEnd;
    }
  }
  activityModal.value.open = undefined;
  activityModal.value.data = undefined;
}

const [
  [onOpenActivityDefaultCreate, onOpenActivityDefaultUpdate],
  [onOpenActivityWorkoutCreate, onOpenActivityWorkoutUpdate],
  [onOpenActivityCardioCreate, onOpenActivityCardioUpdate],
  [onOpenActivityMobilityCreate, onOpenActivityMobilityUpdate]
] = modalVariants.map((variant) => {
  function openCreate() {
    closeAddOptions();
    activityModal.value.open = `${variant}:create` as any;
  }
  function openUpdate(
    _e: MouseEvent,
    data?: FormattedActivity,
    prevStyle?: string,
    prevStart?: string,
    prevEnd?: string
  ) {
    closeAddOptions();
    activityModal.value.data = data;
    activityModal.value.prevStyle = prevStyle;
    activityModal.value.prevStart = prevStart;
    activityModal.value.prevEnd = prevEnd;
    activityModal.value.open = `${variant}:update` as any;
  }
  return [openCreate, openUpdate];
});

const updateMap = {
  default: onOpenActivityDefaultUpdate,
  Cardio: onOpenActivityCardioUpdate,
  Mobility: onOpenActivityMobilityUpdate,
  Exercise: onOpenActivityWorkoutUpdate
};

// MOUSE EVENTS

const { onMouseDown, onMouseMove, onMouseUp, dragTime, mouseDownState } =
  useStartEndDrag(dragBreakpoint);

const openCreateTaskModalListener = (e: KeyboardEvent) => {
  if (e.key === 'i' && activityModal.value.open === undefined) {
    e.preventDefault();
    onOpenActivityDefaultCreate();
  }
};

useWindowEventListener('keydown', openCreateTaskModalListener);
useWindowEventListener('online', async () => {
  // todo: reimplement this with new reqqueue
  // await db.reqQueue.process();
  await requestQueue.drain();
  await refresh();

  const start = [
    startDate.value.getFullYear(),
    startDate.value.getMonth(),
    startDate.value.getDate()
  ] as const;
  const end = [
    endDate.value.getFullYear(),
    endDate.value.getMonth(),
    endDate.value.getDate()
  ] as const;

  const startString = new Date(buildLocalDatetime(...start)).toISOString();
  const endString = new Date(
    buildLocalDatetime(...end, '23:59:59.999')
  ).toISOString();

  const cachedActivities = await db.activities.find({
    start: startString,
    end: endString
  });

  const idsToRemove: string[] = [];
  for (const cachedActivity of cachedActivities) {
    !data.value?.ids.has(cachedActivity.id) &&
      idsToRemove.push(cachedActivity.id);
  }

  if (idsToRemove.length) db.activities.delete(idsToRemove);
});
</script>

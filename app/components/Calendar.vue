<template>
  <div class="flex flex-col w-32 min-w-[128px]">
    <div
      ref="calendarButtonEl"
      @click="toggleModal"
      class="flex justify-between items-center relative bg-white cursor-pointer border border-slate-300 rounded-sm"
    >
      <month-calendar-icon :size="18" class="ml-2 mt-0.5 text-slate-500" />
      <input
        id="month-year-select"
        inputmode="none"
        autocomplete="off"
        readonly
        class="h-8 max-w-[72px] cursor-pointer font-mono font-light text-slate-500 bg-transparent outline-none"
        :value="`${format(selectedMonth, 'MMM').toUpperCase()} ${format(
          selectedYear,
          'yyyy'
        )}`"
      />
      <div class="mr-1"></div>
    </div>
    <div ref="calendarEl" class="relative">
      <div
        v-if="modalOpen"
        class="absolute top-0.5 z-20 flex flex-col bg-white border border-slate-300 w-48 pb-0.5 rounded-sm"
      >
        <div class="flex justify-center items-center">
          <div class="flex items-center font-mono text-slate-100 text-xl my-1">
            <div
              @click="decrementYear"
              class="cursor-pointer bg-primary-blue rounded-sm p-0.5 pr-1"
            >
              <left-icon :size="16" />
            </div>
            <span
              class="px-7 mx-2.5 border border-slate-300 rounded-sm text-slate-500"
              >{{ format(selectedYear, 'yyyy') }}</span
            >
            <div
              @click="incrementYear"
              class="cursor-pointer bg-primary-blue rounded-sm p-0.5 pl-1"
            >
              <right-icon :size="16" />
            </div>
          </div>
        </div>
        <div class="flex flex-wrap content-start px-px">
          <div
            v-for="month in monthsInYear"
            @click="selectMonth(month)"
            :class="[
              month.valueOf() === selectedMonth.valueOf()
                ? 'bg-primary-blue text-slate-100'
                : 'bg-white text-slate-500'
            ]"
            class="flex items-center h-8 m-0.5 px-4 font-mono font-light cursor-pointer rounded-sm"
          >
            <span>{{ format(month, 'MMM').toUpperCase() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { add, sub, format, startOfMonth, startOfYear } from 'date-fns';
import { ref } from 'vue';
import MonthCalendarIcon from 'vue-material-design-icons/CalendarFilter.vue';
import LeftIcon from 'vue-material-design-icons/ArrowLeftBold.vue';
import RightIcon from 'vue-material-design-icons/ArrowRightBold.vue';
import { getAllMonthsInYear } from '~/utils/date';

const emit = defineEmits<{
  (e: 'onChange', month: Date, year: Date): void;
}>();
const props = defineProps<{
  selectedMonth?: Date;
  selectedYear?: Date;
}>();

const now = new Date();
const monthsInYear = ref(getAllMonthsInYear(now.getFullYear()));

const modalOpen = ref(false);
const toggleModal = () => (modalOpen.value = !modalOpen.value);

const selectedMonth = ref(props.selectedMonth ?? startOfMonth(now));
const selectedYear = ref(props.selectedYear ?? startOfYear(now));

const incrementYear = () => {
  selectedYear.value = add(selectedYear.value, { years: 1 });
  emit('onChange', selectedMonth.value, selectedYear.value);
};
const decrementYear = () => {
  selectedYear.value = sub(selectedYear.value, { years: 1 });
  emit('onChange', selectedMonth.value, selectedYear.value);
};
const selectMonth = (date: Date) => {
  selectedMonth.value = date;
  emit('onChange', selectedMonth.value, selectedYear.value);
};

const calendarEl = ref(null);
const calendarButtonEl = ref(null);

const closeUserMenuListener = (event) => {
  if (
    !(calendarEl.value as any)?.contains(event.target) &&
    !(calendarButtonEl.value as any)?.contains(event.target)
  ) {
    if (modalOpen.value) modalOpen.value = false;
  }
};

useEventListener('click', closeUserMenuListener);
</script>

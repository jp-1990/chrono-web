<template>
  <div
    ref="calendarButtonEl"
    @click="toggleModal"
    class="flex items-center w-20 h-9 p-1.5 relative cursor-pointer rounded-[4px] bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200"
  >
    <month-calendar-icon :size="24" class="mr-2" />
    <div class="flex flex-col items-center w-8">
      <div class="text-[14px]/[14px] font-mono">
        {{ format(selectedMonth, 'MMM').toUpperCase() }}
      </div>
      <div class="text-[10px]/[10px] font-mono font-light">
        {{ format(selectedYear, 'yyyy') }}
      </div>
    </div>
  </div>

  <div ref="calendarEl" class="relative">
    <div
      v-if="modalOpen"
      class="absolute top-0.5 right-0 z-20 flex flex-col bg-transparent w-[184px]"
    >
      <div
        class="flex justify-center items-center h-9 bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-[4px] text-slate-200"
      >
        <div class="flex items-center justify-between w-full p-2">
          <div
            @click="decrementYear"
            class="h-5 w-5 flex justify-center items-center cursor-pointer bg-slate-600/60 rounded-sm"
          >
            <left-icon :size="20" />
          </div>

          <span class="text-slate-200 text-lg">{{
            format(selectedYear, 'yyyy')
          }}</span>

          <div
            @click="incrementYear"
            class="h-5 w-5 flex justify-center items-center cursor-pointer bg-slate-600/60 rounded-sm"
          >
            <right-icon :size="20" />
          </div>
        </div>
      </div>

      <div
        class="flex flex-wrap content-start p-0.5 bg-white rounded-b-[4px] drop-shadow-lg"
      >
        <div
          v-for="month in monthsInYear"
          @click="selectMonth(month)"
          :class="[
            month.valueOf() === selectedMonth.valueOf()
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-600'
          ]"
          class="flex items-center justify-center m-0.5 h-8 w-14 text-sm font-mono font-light cursor-pointer rounded-sm"
        >
          <span>{{ format(month, 'MMM').toUpperCase() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { add, sub, format, startOfMonth, startOfYear } from 'date-fns';
import { ref } from 'vue';
import MonthCalendarIcon from 'vue-material-design-icons/CalendarFilter.vue';
import LeftIcon from 'vue-material-design-icons/ChevronLeft.vue';
import RightIcon from 'vue-material-design-icons/ChevronRight.vue';
import { useWindowEventListener } from '../composables/useEventListener';
import { getAllMonthsInYear } from '../utils/date';

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
function toggleModal() {
  modalOpen.value = !modalOpen.value;
}

const selectedMonth = ref(props.selectedMonth ?? startOfMonth(now));
const selectedYear = ref(props.selectedYear ?? startOfYear(now));

function incrementYear() {
  selectedYear.value = add(selectedYear.value, { years: 1 });
  emit('onChange', selectedMonth.value, selectedYear.value);
}

function decrementYear() {
  selectedYear.value = sub(selectedYear.value, { years: 1 });
  emit('onChange', selectedMonth.value, selectedYear.value);
}

function selectMonth(date: Date) {
  selectedMonth.value = date;
  modalOpen.value = false;
  emit('onChange', selectedMonth.value, selectedYear.value);
}

const calendarEl = ref(null);
const calendarButtonEl = ref(null);

function closeCalendarListener(event) {
  if (
    !(calendarEl.value as any)?.contains(event.target) &&
    !(calendarButtonEl.value as any)?.contains(event.target)
  ) {
    if (modalOpen.value) modalOpen.value = false;
  }
}

useWindowEventListener('click', closeCalendarListener);
</script>

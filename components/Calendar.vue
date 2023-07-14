<template>
  <div class="flex flex-col w-36 px-2 py-2">
    <div
      @click="toggleModal"
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
        v-if="modalOpen"
        class="absolute top-0.5 z-30 flex flex-col bg-white border border-slate-300 w-48 pb-0.5 rounded-sm"
      >
        <div class="flex justify-center items-center">
          <div class="flex items-center font-mono text-slate-400 text-xl my-1">
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

  <div
    v-if="modalOpen"
    @click="toggleModal"
    class="fixed z-20 h-full w-full bg-transparent"
  ></div>
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
</script>

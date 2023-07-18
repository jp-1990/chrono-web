import { endOfMonth, startOfMonth, startOfYear } from 'date-fns';

export const useMonthYearSelect = () => {
  const now = new Date();

  const selectedMonth = ref(startOfMonth(now));
  const selectedYear = ref(startOfYear(now));

  const datesInSelectedMonthYear = computed(() => {
    return getDatesInMonthYear(
      selectedMonth.value.getMonth(),
      selectedYear.value.getFullYear()
    );
  });

  const startDate = computed(() => {
    return applyTZOffset(
      startOfMonth(
        new Date(
          selectedYear.value.getFullYear(),
          selectedMonth.value.getMonth()
        )
      )
    );
  });

  const endDate = computed(() => {
    return applyTZOffset(
      endOfMonth(
        new Date(
          selectedYear.value.getFullYear(),
          selectedMonth.value.getMonth()
        )
      )
    );
  });

  return {
    selectedMonth,
    selectedYear,
    datesInSelectedMonthYear,
    startDate,
    endDate
  };
};

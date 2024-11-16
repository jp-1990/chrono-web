import { ref } from 'vue';
import { add, differenceInDays, set, startOfDay, sub } from 'date-fns';
import {
  type FormattedItem,
  type FormattedItems,
  type GetItemsRes,
  type Item
} from '../types/item';
import { getDateId } from './date';
import { timeOfDayToPercentage } from './date';
import type { FormattedActivity } from '~/types/activity';

export const formatItems = (
  dates: Date[],
  items: GetItemsRes | null
): FormattedItems => {
  dates.unshift(sub(dates[0], { days: 1 }));
  dates.push(add(dates[dates.length - 1], { days: 1 }));

  const structure = {};
  for (const date of dates) {
    structure[getDateId(date)] = {
      ids: ref<Item['id'][]>([]),
      items: ref({}) as Ref<Record<Item['id'], FormattedItem>>
    };
  }

  if (!items) return structure;

  // loop items
  for (const item of items) {
    // split items that span multiple days and adjust start/end percentages
    const localStart = new Date(+item.start);
    const localEnd = new Date(+item.end);

    const dateRange = differenceInDays(
      startOfDay(localEnd),
      startOfDay(localStart)
    );

    if (dateRange === 0) {
      const dateId = getDateId(localStart);
      if (!structure[dateId]) continue;

      const startPercentage = timeOfDayToPercentage(localStart);
      const endPercentage = timeOfDayToPercentage(localEnd);
      const width = endPercentage - startPercentage;
      const style = `left: ${startPercentage}%; width: ${width}%;`;

      const formattedItem: FormattedItem = { ...item } as any;
      delete (formattedItem as any).percentageTimes;
      formattedItem.start = localStart;
      formattedItem.end = localEnd;
      formattedItem.startPercentage = startPercentage;
      formattedItem.endPercentage = endPercentage;
      formattedItem.width = width;
      formattedItem.style = style;
      formattedItem.isStart = true;
      formattedItem.isEnd = true;

      structure[dateId].ids.value.push(item.id);
      structure[dateId].items.value[item.id] = formattedItem;
    } else {
      for (let i = 0; i <= dateRange; i++) {
        if (i === 0) {
          const dateId = getDateId(localStart);
          if (!structure[dateId]) continue;

          // first day
          const endDate = set(localStart, {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999
          });

          const startPercentage = timeOfDayToPercentage(localStart);
          const endPercentage = timeOfDayToPercentage(endDate);
          const width = endPercentage - startPercentage;
          const style = `left: ${startPercentage}%; width: ${width}%;`;

          const formattedItem: FormattedItem = { ...item } as any;
          delete (formattedItem as any).percentageTimes;
          formattedItem.start = localStart;
          formattedItem.end = endDate;
          formattedItem.startPercentage = startPercentage;
          formattedItem.endPercentage = endPercentage;
          formattedItem.width = width;
          formattedItem.style = style;
          formattedItem.isStart = true;
          formattedItem.isEnd = false;

          structure[dateId].ids.value.push(item.id);
          structure[dateId].items.value[item.id] = formattedItem;
        } else if (i === dateRange) {
          // last day
          const startDate = set(localEnd, {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
          });

          const dateId = getDateId(startDate);
          if (!structure[dateId]) continue;

          const startPercentage = timeOfDayToPercentage(startDate);
          const endPercentage = timeOfDayToPercentage(localEnd);
          const width = endPercentage - startPercentage;
          const style = `left: ${startPercentage}%; width: ${width}%;`;

          const formattedItem: FormattedItem = { ...item } as any;
          delete (formattedItem as any).percentageTimes;
          formattedItem.start = startDate;
          formattedItem.end = localEnd;
          formattedItem.startPercentage = startPercentage;
          formattedItem.endPercentage = endPercentage;
          formattedItem.width = width;
          formattedItem.style = style;
          formattedItem.isStart = false;
          formattedItem.isEnd = true;

          structure[dateId].ids.value.push(item.id);
          structure[dateId].items.value[item.id] = formattedItem;
        } else {
          // any days in range
          const startDate = set(add(localStart, { days: i }), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
          });

          const dateId = getDateId(startDate);
          if (!structure[dateId]) continue;

          const endDate = set(add(localStart, { days: i }), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999
          });

          const startPercentage = timeOfDayToPercentage(startDate);
          const endPercentage = timeOfDayToPercentage(endDate);
          const width = endPercentage - startPercentage;
          const style = `left: ${startPercentage}%; width: ${width}%;`;

          const formattedItem: FormattedItem = { ...item } as any;
          delete (formattedItem as any).percentageTimes;
          formattedItem.end = endDate;
          formattedItem.start = startDate;
          formattedItem.startPercentage = startPercentage;
          formattedItem.endPercentage = endPercentage;
          formattedItem.width = width;
          formattedItem.style = style;
          formattedItem.isStart = false;
          formattedItem.isEnd = false;

          structure[dateId].ids.value.push(item.id);
          structure[dateId].items.value[item.id] = formattedItem;
        }
      }
    }
  }
  return structure;
};

type Container = {
  left: number;
  right: number;
  width: number;
};

enum Handles {
  START = 'start',
  END = 'end'
}

type GetItemDateParams = { difference: number; date: Date };
export const getItemDate = ({ difference, date }: GetItemDateParams) => {
  let percentage = timeOfDayToPercentage(date) + difference;
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;
  const time = percentageToTimeOfDay(percentage);

  const newDate = new Date(`${date?.toJSON().split('T')[0]}${time}`);

  return newDate;
};

export class Diff {
  #handle: Handles;
  #target: FormattedActivity;
  #breakpoint: number;
  #min: number;
  #max: number;
  value: number;
  constructor(
    pageX: number,
    startX: number,
    container: Container,
    handle: Handles,
    target: FormattedActivity,
    min: number,
    max: number,
    breakpoint?: number
  ) {
    this.#target = target;
    this.#handle = handle;
    this.#min = min;
    this.#max = max;
    this.#breakpoint = breakpoint || 0;
    this.value = ((pageX - startX) / (container.width || 1)) * 100;
  }

  applyBreakpoint() {
    const diffToBreakpoint =
      (timeOfDayToPercentage(new Date(this.#target[this.#handle])) +
        this.value) %
      this.#breakpoint;

    if (diffToBreakpoint > this.#breakpoint / 2)
      this.value -= diffToBreakpoint - this.#breakpoint;
    if (diffToBreakpoint < this.#breakpoint / 2) this.value -= diffToBreakpoint;

    return this;
  }

  restrictMinValue() {
    switch (this.#handle) {
      case Handles.START:
        if (this.#target.startPercentage + this.value < this.#min) {
          this.value = (this.#target.startPercentage - this.#min) * -1;
        }
        break;

      case Handles.END:
        if (this.#target.endPercentage + this.value < this.#min) {
          this.value = (this.#target.endPercentage - this.#min - 1) * -1;
        }
        break;
    }

    return this;
  }

  restrictMaxValue() {
    switch (this.#handle) {
      case Handles.START:
        if (this.#target.startPercentage + this.value > this.#max) {
          this.value = this.#max - this.#target.startPercentage - 1;
        }
        break;

      case Handles.END:
        if (this.#target.endPercentage + this.value > this.#max) {
          this.value = this.#max - this.#target.endPercentage;
        }
        break;
    }

    return this;
  }
}

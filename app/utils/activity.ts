import { add, differenceInDays, startOfDay } from 'date-fns';
import type {
  Activity,
  FormattedActivities,
  FormattedActivity,
  PatchActivityArgs,
  PostActivityArgs
} from '~/types/activity';
import { timeOfDayToPercentage, getDateId } from './date';
import type { DateId } from '~/types/date';
import { ref } from 'vue';

/**
  based on the timezone of the browser, split the activity at each instance of midnight

  do not modify the start and end
  add properties required by the client to display the activity
*/
export function formatActivity(activity: Activity, tzOffset: number = 0) {
  const output: FormattedActivity[] = [];

  const start = add(new Date(activity.start), { hours: tzOffset });
  const end = add(new Date(activity.end), { hours: tzOffset });

  const dateRange = differenceInDays(startOfDay(end), startOfDay(start));

  for (let i = 0; i <= dateRange; i++) {
    const newActivity: FormattedActivity = { ...activity } as any;
    const noRange = i === 0 && dateRange === 0;

    let startPercentage: number = 0;
    let endPercentage: number = 0;
    let isStart: boolean;
    let isEnd: boolean;

    switch (i) {
      // first day
      case 0: {
        startPercentage = timeOfDayToPercentage(start);
        endPercentage = noRange ? timeOfDayToPercentage(end) : 100;
        isStart = true;
        isEnd = noRange ? true : false;
        break;
      }
      // last day
      case dateRange: {
        startPercentage = 0;
        endPercentage = timeOfDayToPercentage(end);
        isStart = false;
        isEnd = true;
        break;
      }
      // other days
      default: {
        startPercentage = 0;
        endPercentage = 100;
        isStart = false;
        isEnd = false;
        break;
      }
    }

    newActivity.dateId = getDateId(add(start, { days: i }));
    newActivity.startPercentage = startPercentage;
    newActivity.endPercentage = endPercentage;
    newActivity.width = endPercentage - startPercentage;
    newActivity.style = `left: ${startPercentage}%; width: ${newActivity.width}%;`;
    newActivity.isStart = isStart;
    newActivity.isEnd = isEnd;

    output.push(newActivity);
  }

  return output;
}

export function formatActivities(dates: Date[], activities: Activity[] | null) {
  const structure: any = {};

  for (const date of dates) {
    structure[getDateId(date)] = {
      ids: ref([]),
      items: {}
    };
  }

  // loop items
  for (const activity of activities ?? []) {
    const formattedActivity = formatActivity(activity);

    for (const item of formattedActivity) {
      if (!structure[item.dateId]) continue;
      structure[item.dateId].ids.value.push(item.id);
      structure[item.dateId].items[item.id] = item;
    }
  }

  return structure;
}

export class DerivedActivities {
  activities: FormattedActivities = {};
  ids: Set<string> = new Set();
  #idToDateId: Record<FormattedActivity['id'], DateId[]> = {};
  constructor(dates: Date[], activities: Activity[] | undefined | null) {
    this.createActivity = this.createActivity.bind(this);
    this.replaceTempIdWithId = this.replaceTempIdWithId.bind(this);
    this.deleteActivity = this.deleteActivity.bind(this);
    this.updateActivity = this.updateActivity.bind(this);

    for (const date of dates) {
      this.activities[getDateId(date)] = {
        ids: ref([]) as any,
        items: {}
      };
    }

    for (const activity of activities ?? []) {
      this.ids.add(activity.id);
      this.#internal_create(activity);
    }
  }

  createActivity(activity: PostActivityArgs, tempId?: string) {
    if (!activity.id && tempId) activity.id = tempId;
    this.#internal_create(activity as Activity, tempId);
  }

  replaceTempIdWithId(id: string, tempId: string) {
    const dateIds = this.#idToDateId[tempId];
    if (!dateIds) return;

    for (const dateId of dateIds) {
      const hasTarget = this.activities[dateId].items[tempId] !== undefined;
      if (hasTarget) {
        (this as any).activities[dateId].ids.value = (this as any).activities[
          dateId
        ].ids.value.filter((id_: string) => id_ !== tempId);
        (this as any).activities[dateId].ids.value.push(id);

        this.activities[dateId].items[id] =
          this.activities[dateId].items[tempId];
        delete this.activities[dateId].items[tempId];
        this.activities[dateId].items[id].id = id;

        (this as any).activities[dateId].ids.value.sort(
          (a: string, b: string) => {
            const itemA = this.activities[dateId].items[a];
            const itemB = this.activities[dateId].items[b];

            return itemA.startPercentage - itemB.startPercentage;
          }
        );
      }
    }

    this.#idToDateId[id] = this.#idToDateId[tempId];
    delete this.#idToDateId[tempId];
  }

  deleteActivity(id: FormattedActivity['id']) {
    this.#internal_delete(id);
  }

  updateActivity(activity: PatchActivityArgs) {
    this.#internal_delete(activity.id);
    this.#internal_create(activity as Activity);
  }

  #internal_create(activity: Activity, tempId?: string) {
    if (!activity.id && tempId) activity.id = tempId;
    const formattedActivity = formatActivity(activity);

    for (const part of formattedActivity) {
      if (!this.activities[part.dateId]) continue;
      const newActivityIds = [
        ...(this as any).activities[part.dateId].ids.value
      ];
      newActivityIds.push(activity.id);

      (this as any).activities[part.dateId].ids.value = newActivityIds;
      this.activities[part.dateId].items[activity.id] = part;
      this.#idToDateId[activity.id] ??= [];
      this.#idToDateId[activity.id].push(part.dateId);

      (this as any).activities[part.dateId].ids.value.sort(
        (a: string, b: string) => {
          const itemA = this.activities[part.dateId].items[a];
          const itemB = this.activities[part.dateId].items[b];

          return itemA.startPercentage - itemB.startPercentage;
        }
      );
    }
  }

  #internal_delete(id: FormattedActivity['id']) {
    const dateIds = this.#idToDateId[id];
    if (!dateIds) return;

    for (const dateId of dateIds) {
      const hasTarget = this.activities[dateId].items[id] !== undefined;
      if (hasTarget) {
        (this as any).activities[dateId].ids.value = (this as any).activities[
          dateId
        ].ids.value.filter((id_: string) => id_ !== id);
        delete this.activities[dateId].items[id];
      }
    }

    delete this.#idToDateId[id];
  }
}

type Container = {
  left: number;
  right: number;
  width: number;
};

enum Handles {
  START = 'start',
  END = 'end'
}

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

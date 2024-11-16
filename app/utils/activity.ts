import { add, differenceInDays, startOfDay, sub } from 'date-fns';
import type {
  Activity,
  FormattedActivities,
  FormattedActivity
} from '~/types/activity';
import { timeOfDayToPercentage, getDateId } from './date';
import type { DateId } from '~/types/date';

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
  const structure: FormattedActivities = {};

  for (const date of dates) {
    structure[getDateId(date)] = {
      ids: [],
      items: {}
    };
  }

  // loop items
  for (const activity of activities ?? []) {
    const formattedActivity = formatActivity(activity);

    for (const item of formattedActivity) {
      if (!structure[item.dateId]) continue;
      structure[item.dateId].ids.push(item.id);
      structure[item.dateId].items[item.id] = item;
    }
  }

  return structure;
}

export class DerivedActivities {
  activities: FormattedActivities = {};
  #idToDateId: Record<FormattedActivity['id'], DateId[]> = {};
  constructor(dates: Date[], activities: Activity[] | null) {
    this.createActivity = this.createActivity.bind(this);
    this.replaceTempIdWithId = this.replaceTempIdWithId.bind(this);
    this.deleteActivity = this.deleteActivity.bind(this);
    this.updateActivity = this.updateActivity.bind(this);

    for (const date of dates) {
      this.activities[getDateId(date)] = {
        ids: [],
        items: {}
      };
    }

    for (const activity of activities ?? []) {
      this.#internal_create(activity);
    }
  }

  createActivity(activity: Activity, tempId: string) {
    this.#internal_create(activity, tempId);
  }

  replaceTempIdWithId(id: string, tempId: string) {
    const dateIds = this.#idToDateId[tempId];
    if (!dateIds) return;

    for (const dateId of dateIds) {
      const hasTarget = this.activities[dateId].items[tempId] !== undefined;
      if (hasTarget) {
        this.activities[dateId].ids = this.activities[dateId].ids.filter(
          (id_) => id_ !== tempId
        );
        this.activities[dateId].ids.push(id);

        this.activities[dateId].items[id] =
          this.activities[dateId].items[tempId];
        delete this.activities[dateId].items[tempId];
        this.activities[dateId].items[id].id = id;
      }
    }

    this.#idToDateId[id] = this.#idToDateId[tempId];
    delete this.#idToDateId[tempId];
  }

  deleteActivity(id: FormattedActivity['id']) {
    this.#internal_delete(id);
  }

  updateActivity(activity: Activity) {
    this.#internal_delete(activity.id);
    this.#internal_create(activity);
  }

  #internal_create(activity: Activity, tempId?: string) {
    if (!activity.id && tempId) activity.id = tempId;
    const formattedActivity = formatActivity(activity);

    for (const part of formattedActivity) {
      if (!this.activities[part.dateId]) continue;
      this.activities[part.dateId].ids.push(activity.id);
      this.activities[part.dateId].items[activity.id] = part;
      this.#idToDateId[activity.id] ??= [];
      this.#idToDateId[activity.id].push(part.dateId);
    }
  }

  #internal_delete(id: FormattedActivity['id']) {
    const dateIds = this.#idToDateId[id];
    if (!dateIds) return;

    for (const dateId of dateIds) {
      const hasTarget = this.activities[dateId].items[id] !== undefined;
      if (hasTarget) {
        this.activities[dateId].ids = this.activities[dateId].ids.filter(
          (id_) => id_ !== id
        );
        delete this.activities[dateId].items[id];
      }
    }

    delete this.#idToDateId[id];
  }
}

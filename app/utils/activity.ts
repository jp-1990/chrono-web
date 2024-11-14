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

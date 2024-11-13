import {
  type FormattedItem,
  type FormattedItems,
  type Item,
  type PostItemArgs
} from '../../types/item';
import { type Validation } from '../../types/form';
import { getDateId } from '../date';
import { add } from 'date-fns';

export function required(v: string) {
  return !!v;
}

export const validateTitle = (
  formState: Ref<{ data: PostItemArgs; valid: Validation }>
) => {
  const isValid = !!formState.value.data.title;
  formState.value.valid.title = isValid;
};

export const validateGroup = (
  formState: Ref<{ data: PostItemArgs; valid: Validation }>
) => {
  const isValid = !!formState.value.data.group;
  formState.value.valid.group = isValid;
};

// todo; something is broken in here - TypeError: (intermediate value) is not iterable
// todo; currently only works for create, not update
export const validateDate = (
  formState: Ref<{
    id: string | undefined;
    data: PostItemArgs;
    valid: Validation;
  }>,
  formattedItems: Ref<FormattedItems>
) => {
  const newStartDate = new Date(formState.value.data.startDate);
  const newStartDateId = getDateId(newStartDate);
  const newEndDate = new Date(formState.value.data.endDate);
  const newEndDateId = getDateId(newEndDate);

  // start cannot be after end
  if (newEndDate && newEndDate.getTime() - newStartDate.getTime() < 0) {
    formState.value.valid.startDate = false;
    formState.value.valid.endDate = false;
    return;
  }

  // get all items which fall either on the start or end date, or between them
  const affectedDateIds: string[] = [newStartDateId];
  let datePointer = newStartDate;
  let maxGuard = 0;
  while (getDateId(datePointer) !== newEndDateId && maxGuard < 1000) {
    datePointer = add(datePointer, { days: 1 });
    affectedDateIds.push(getDateId(datePointer));
    maxGuard++;
  }

  let ids: string[] = [];
  let items: Record<Item['id'], FormattedItem> = {};
  for (const dateId of affectedDateIds) {
    const idsForDate = formattedItems.value[dateId]?.ids.value;
    ids.push(...idsForDate);

    for (const id of idsForDate) {
      items[id] = formattedItems.value[dateId]?.items.value[id];
    }
  }
  ids = [...new Set(ids)];

  let isStartValid = true;
  let isEndValid = true;
  for (const id of ids) {
    // if we're updating an existing item, don't validate against that id
    if (id === formState.value.id) continue;

    const item = items[id];

    // start date must not be within an existing item
    if (
      newStartDate.getTime() >= item.start.getTime() &&
      newStartDate.getTime() < item.end.getTime()
    ) {
      isStartValid = false;
      if (!isEndValid) break;
    }

    // end date must not be within an existing item
    if (
      newEndDate.getTime() > item.start.getTime() &&
      newEndDate.getTime() <= item.end.getTime()
    ) {
      isEndValid = false;
    }

    // check if any existing items are between the new start and end dates
    if (
      newStartDate.getTime() <= item.start.getTime() &&
      newEndDate.getTime() >= item.end.getTime()
    ) {
      isEndValid = false;
    }
  }

  formState.value.valid.startDate = isStartValid;
  formState.value.valid.endDate = isEndValid;
};

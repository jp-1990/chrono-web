import { FormattedItems, PostItemArgs } from '~/types/item';
import { Validation } from '~/types/form';

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

export const validateStartDate = (
  formState: Ref<{
    id: string | undefined;
    data: PostItemArgs;
    valid: Validation;
  }>,
  formattedItems: Ref<FormattedItems>
) => {
  const newStartDate = new Date(formState.value.data.startDate);
  const newStartDateId = getDateId(newStartDate);
  const startPercentage = timeOfDayToPercentage(newStartDate);

  let isValid = true;
  for (const id of formattedItems.value[newStartDateId]?.ids.value) {
    if (id === formState.value.id) continue;
    const item = formattedItems.value[newStartDateId]?.items.value[id];
    if (
      startPercentage >= item.startPercentage &&
      startPercentage < item.endPercentage
    ) {
      isValid = false;
      break;
    }
  }
  formState.value.valid.startDate = isValid;

  if (formState.value.valid.endDate !== undefined) {
    validateEndDate(formState, formattedItems);
  }
};

const validateEndDate = (
  formState: Ref<{
    id: string | undefined;
    data: PostItemArgs;
    valid: Validation;
  }>,
  formattedItems: Ref<FormattedItems>
) => {
  const newEndDate = new Date(formState.value.data.endDate);
  const newEndDateId = getDateId(newEndDate);
  const endPercentage = timeOfDayToPercentage(newEndDate);
  const newStartDate = new Date(formState.value.data.startDate);
  const startPercentage = timeOfDayToPercentage(newStartDate);

  let isValid = true;
  for (const id of formattedItems.value[newEndDateId]?.ids.value) {
    if (id === formState.value.id) continue;
    if (startPercentage >= endPercentage) {
      isValid = false;
      break;
    }
    const item = formattedItems.value[newEndDateId]?.items.value[id];
    if (
      endPercentage > item.startPercentage &&
      endPercentage < item.endPercentage
    ) {
      isValid = false;
      break;
    }
  }
  formState.value.valid.endDate = isValid;
};

export const validateDateRange = (
  formState: Ref<{
    id: string | undefined;
    data: PostItemArgs;
    valid: Validation;
  }>,
  formattedItems: Ref<FormattedItems>
) => {
  const newStartDate = new Date(formState.value.data.startDate);
  const newStartDateId = getDateId(newStartDate);
  const startPercentage = timeOfDayToPercentage(newStartDate);
  const newEndDate = new Date(formState.value.data.endDate);
  const newEndDateId = getDateId(newEndDate);
  const endPercentage = timeOfDayToPercentage(newEndDate);

  if (newStartDateId === newEndDateId && startPercentage > endPercentage) {
    console.log('bullshit');

    formState.value.valid.endDate = false;
    return;
  }

  const ids = [
    ...new Set([
      ...formattedItems.value[newStartDateId]?.ids.value,
      ...formattedItems.value[newEndDateId]?.ids.value
    ])
  ];
  const items = {
    ...formattedItems.value[newStartDateId]?.items.value,
    ...formattedItems.value[newEndDateId]?.items.value
  };

  let isValid = false;
  for (let i = 1; i < ids.length; i++) {
    const id = ids[i];
    const item = items[id];

    const prevId = ids[i - 1];
    const prevItem = items[prevId];

    const nextId = ids[i + 1] as string | undefined;
    const nextItem = nextId && items[nextId];

    if (
      i === 1 &&
      startPercentage >= 0 &&
      endPercentage <= prevItem.startPercentage
    ) {
      isValid = true;
      break;
    }

    if (
      i === ids.length - 1 &&
      startPercentage >= item.endPercentage &&
      endPercentage <= 100
    ) {
      isValid = true;
      break;
    }

    if (
      startPercentage >= prevItem.endPercentage &&
      endPercentage >= item.startPercentage &&
      nextItem
        ? endPercentage <= nextItem.startPercentage
        : true
    ) {
      isValid = true;
      break;
    }
  }
  formState.value.valid.endDate = isValid;
};

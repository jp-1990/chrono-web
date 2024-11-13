import { describe, test, beforeEach, expect } from 'vitest';
import { ref, computed } from 'vue';
import { add, startOfDay, sub } from 'date-fns';

import { validateTitle, validateGroup, validateDate } from './validation';
import { type PostItemArgs } from '../../types/item';
import { type Validation } from '../../types/form';
import {
  applyTZOffset,
  timeOfDayToPercentage,
  getDatesInMonthYear
} from '../date';
import { formatItems } from '../item';

describe('utils/form/validation', () => {
  const data = [] as any;
  for (let i = 2; i < 6; i++) {
    const start = add(sub(startOfDay(new Date()), { days: 1 }), {
      hours: i * 3
    });
    const end = add(sub(startOfDay(new Date()), { days: 1 }), {
      hours: i * 3 + 1
    });

    data.push({
      id: `${i}a`,
      title: `task-${i}`,
      group: 'testing',
      description: '',
      colour: 'rgb(0, 255, 0)',
      start: start.getTime(),
      end: end.getTime(),
      createdAt: new Date().getTime(),
      percentageTimes: {
        startPercentage: timeOfDayToPercentage(start),
        endPercentage: timeOfDayToPercentage(end)
      },
      luminance: 0.5,
      user: {
        id: '0',
        name: 'testing'
      }
    });
  }
  for (let i = 2; i < 6; i++) {
    const start = add(startOfDay(new Date()), { hours: i * 3 });
    const end = add(startOfDay(new Date()), { hours: i * 3 + 1 });

    data.push({
      id: `${i}b`,
      title: `task-${i}`,
      group: 'testing',
      description: '',
      colour: 'rgb(0, 255, 0)',
      start: start.getTime(),
      end: end.getTime(),
      createdAt: new Date().getTime(),
      percentageTimes: {
        startPercentage: timeOfDayToPercentage(start),
        endPercentage: timeOfDayToPercentage(end)
      },
      luminance: 0.5,
      user: {
        id: '0',
        name: 'testing'
      }
    });
  }
  for (let i = 2; i < 6; i++) {
    const start = add(add(startOfDay(new Date()), { days: 1 }), {
      hours: i * 3
    });
    const end = add(add(startOfDay(new Date()), { days: 1 }), {
      hours: i * 3 + 1
    });

    data.push({
      id: `${i}c`,
      title: `task-${i}`,
      group: 'testing',
      description: '',
      colour: 'rgb(0, 255, 0)',
      start: start.getTime(),
      end: end.getTime(),
      createdAt: new Date().getTime(),
      percentageTimes: {
        startPercentage: timeOfDayToPercentage(start),
        endPercentage: timeOfDayToPercentage(end)
      },
      luminance: 0.5,
      user: {
        id: '0',
        name: 'testing'
      }
    });
  }

  const formattedItems = computed(() =>
    formatItems(
      getDatesInMonthYear(new Date().getMonth(), new Date().getFullYear()),
      data
    )
  );

  const formState = ref<{
    id: string;
    data: PostItemArgs;
    valid: Validation;
  }>({
    id: '',
    data: {
      title: '',
      group: '',
      notes: '',
      startDate: applyTZOffset(startOfDay(Date.now()))
        .toISOString()
        .slice(0, -8),
      endDate: applyTZOffset(add(startOfDay(Date.now()), { minutes: 5 }))
        .toISOString()
        .slice(0, -8),
      color: 'rgb(38, 203, 255)'
    },
    valid: {
      title: undefined as boolean | undefined,
      group: undefined as boolean | undefined,
      startDate: undefined as boolean | undefined,
      endDate: undefined as boolean | undefined
    }
  });

  const resetFormState = () => {
    formState.value.id = '';
    formState.value.data.title = '';
    formState.value.data.notes = '';
    formState.value.data.group = '';
    (formState.value.data.startDate = applyTZOffset(startOfDay(Date.now()))
      .toISOString()
      .slice(0, -8)),
      (formState.value.data.endDate = applyTZOffset(
        add(startOfDay(Date.now()), { minutes: 5 })
      )
        .toISOString()
        .slice(0, -8)),
      (formState.value.data.color = 'rgb(38, 203, 255)');

    formState.value.valid.title = undefined;
    formState.value.valid.group = undefined;
    formState.value.valid.startDate = undefined;
    formState.value.valid.endDate = undefined;
  };

  beforeEach(() => {
    resetFormState();
  });

  describe('validate title', () => {
    test('sets title as valid', () => {
      expect(formState.value.valid.title).toBe(undefined);
      formState.value.data.title = 'valid';
      validateTitle(formState);
      expect(formState.value.valid.title).toBe(true);
    });

    test('sets title as not valid', () => {
      expect(formState.value.valid.title).toBe(undefined);
      formState.value.data.title = '';
      validateTitle(formState);
      expect(formState.value.valid.title).toBe(false);
    });
  });

  describe('validate group', () => {
    test('sets group as valid', () => {
      expect(formState.value.valid.group).toBe(undefined);
      formState.value.data.group = 'valid';
      validateGroup(formState);
      expect(formState.value.valid.group).toBe(true);
    });

    test('sets group as not valid', () => {
      expect(formState.value.valid.group).toBe(undefined);
      formState.value.data.group = '';
      validateGroup(formState);
      expect(formState.value.valid.group).toBe(false);
    });
  });

  describe('validate startDate', () => {
    test('correctly sets start date as valid when start date is not within an existing item', () => {
      expect(formState.value.valid.startDate).toBe(undefined);
      expect(formState.value.valid.endDate).toBe(undefined);

      formState.value.data.startDate = startOfDay(new Date()).toISOString();
      validateDate(formState, formattedItems);

      expect(formState.value.valid.startDate).toBe(true);
    });

    test('correctly sets start date as invalid when start date is within an existing item', () => {
      expect(formState.value.valid.startDate).toBe(undefined);
      expect(formState.value.valid.endDate).toBe(undefined);

      const newStart = add(startOfDay(new Date()), {
        hours: 6,
        minutes: 1
      }).toISOString();

      formState.value.data.startDate = newStart;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.startDate).toBe(false);
    });
  });

  describe('validate endDate', () => {
    test('correctly sets end date as valid when end date is not within an existing item', () => {
      expect(formState.value.valid.endDate).toBe(undefined);
      const newEnd = add(startOfDay(new Date()), {
        hours: 2
      }).toISOString();

      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(true);
    });

    test('correctly sets end date as invalid when end date is within an existing item', () => {
      expect(formState.value.valid.endDate).toBe(undefined);
      const newEnd = add(startOfDay(new Date()), {
        hours: 6,
        minutes: 1
      }).toISOString();

      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(false);
    });

    test('correctly sets end date as invalid when end date is before start date', () => {
      expect(formState.value.valid.endDate).toBe(undefined);
      const newStart = add(startOfDay(new Date()), {
        hours: 5
      }).toISOString();
      const newEnd = add(startOfDay(new Date()), {
        hours: 4
      }).toISOString();

      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(false);
    });
  });

  describe('validate dateRange', () => {
    test('end date must not be before start date', () => {
      expect(formState.value.valid.endDate).toBe(undefined);
      const newStart = add(startOfDay(new Date()), {
        hours: 5
      }).toISOString();
      const newEnd = add(startOfDay(new Date()), {
        hours: 4
      }).toISOString();

      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(false);
    });

    test('existing items must not exist between start and end date (same day item - valid)', () => {
      expect(formState.value.valid.endDate).toBe(undefined);
      expect(formState.value.valid.startDate).toBe(undefined);
      const newStart = add(startOfDay(new Date()), {
        hours: 1
      }).toISOString();
      const newEnd = add(startOfDay(new Date()), {
        hours: 3
      }).toISOString();
      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(true);
    });

    test('existing items must not exist between start and end date (same day item - invalid)', () => {
      // single item in between
      expect(formState.value.valid.endDate).toBe(undefined);
      expect(formState.value.valid.startDate).toBe(undefined);
      let newStart = add(startOfDay(new Date()), {
        hours: 1
      }).toISOString();
      let newEnd = add(startOfDay(new Date()), {
        hours: 8
      }).toISOString();
      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(false);

      resetFormState();

      // many items in between
      expect(formState.value.valid.endDate).toBe(undefined);
      expect(formState.value.valid.startDate).toBe(undefined);
      newStart = add(startOfDay(new Date()), {
        hours: 1
      }).toISOString();
      newEnd = add(startOfDay(new Date()), {
        hours: 23
      }).toISOString();
      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(false);
    });

    test('existing items must not exist between start and end date (2 day item - valid)', () => {
      expect(formState.value.valid.endDate).toBe(undefined);
      expect(formState.value.valid.startDate).toBe(undefined);
      let newStart = add(startOfDay(new Date()), {
        hours: 16
      }).toISOString();
      let newEnd = add(startOfDay(new Date()), {
        hours: 30
      }).toISOString();

      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(true);
    });

    test('existing items must not exist between start and end date (2 day item - invalid)', () => {
      // single item in between on start day
      expect(formState.value.valid.endDate).toBe(undefined);
      expect(formState.value.valid.startDate).toBe(undefined);
      let newStart = sub(startOfDay(new Date()), {
        hours: 14
      }).toISOString();
      let newEnd = add(startOfDay(new Date()), {
        hours: 26
      }).toISOString();

      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(false);

      resetFormState();

      // single item in between on end day
      expect(formState.value.valid.endDate).toBe(undefined);
      expect(formState.value.valid.startDate).toBe(undefined);
      newStart = add(startOfDay(new Date()), {
        hours: 23
      }).toISOString();
      newEnd = add(startOfDay(new Date()), {
        hours: 32
      }).toISOString();

      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(false);

      resetFormState();

      // many items in between on start day
      expect(formState.value.valid.endDate).toBe(undefined);
      expect(formState.value.valid.startDate).toBe(undefined);
      newStart = add(startOfDay(new Date()), {
        hours: 2
      }).toISOString();
      newEnd = add(startOfDay(new Date()), {
        hours: 26
      }).toISOString();

      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(false);

      resetFormState();

      // many items in between on end day
      expect(formState.value.valid.endDate).toBe(undefined);
      expect(formState.value.valid.startDate).toBe(undefined);
      newStart = add(startOfDay(new Date()), {
        hours: 23
      }).toISOString();
      newEnd = add(startOfDay(new Date()), {
        hours: 46
      }).toISOString();

      formState.value.data.startDate = newStart;
      formState.value.data.endDate = newEnd;
      validateDate(formState, formattedItems);

      expect(formState.value.valid.endDate).toBe(false);
    });
  });
});

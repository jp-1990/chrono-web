import { describe, expect, test } from 'vitest';
import type { Activity } from '~/types/activity';
import { formatActivity } from './activity';

function buildActivity(id: number, start: string, end: string) {
  const activity: Activity = {
    id: id.toString(),
    variant: 'Default',
    title: 'Activity 1',
    group: 'Group 1',
    notes: 'Notes',
    start,
    end,
    timezone: 0,
    createdAt: '2020-01-01T00:00:00.000Z',
    user: '672604e416705b5f1e30cef1',
    v: 1
  };

  return activity;
}

describe('utils/activity', () => {
  describe('formatActivity', () => {
    test('correctly formats activity with no date span', () => {
      const activity = buildActivity(
        1,
        '2020-01-01T00:00:00.000Z',
        '2020-01-01T12:00:00.000Z'
      );

      const res = formatActivity(activity);

      expect(res.length).toEqual(1);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      const formattedActivity = res[0];

      for (const property of newProperties) {
        Object.hasOwn(formattedActivity, property);
      }

      expect(formattedActivity.dateId).toEqual('2020-0-1');
      expect(formattedActivity.startPercentage).toEqual(0);
      expect(formattedActivity.endPercentage).toEqual(50);
      expect(formattedActivity.width).toEqual(50);
      expect(formattedActivity.style).toEqual('left: 0%; width: 50%;');
      expect(formattedActivity.isStart).toBe(true);
      expect(formattedActivity.isEnd).toBe(true);
    });

    test('correctly formats activity with no date span - positive tz offset', () => {
      const activity = buildActivity(
        1,
        '2020-01-01T00:00:00.000Z',
        '2020-01-01T12:00:00.000Z'
      );

      const res = formatActivity(activity, 6);

      expect(res.length).toEqual(1);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      const formattedActivity = res[0];

      for (const property of newProperties) {
        Object.hasOwn(formattedActivity, property);
      }

      expect(formattedActivity.dateId).toEqual('2020-0-1');
      expect(formattedActivity.startPercentage).toEqual(25);
      expect(formattedActivity.endPercentage).toEqual(75);
      expect(formattedActivity.width).toEqual(50);
      expect(formattedActivity.style).toEqual('left: 25%; width: 50%;');
      expect(formattedActivity.isStart).toBe(true);
      expect(formattedActivity.isEnd).toBe(true);
    });

    test('correctly formats activity with no date span - negative tz offset', () => {
      const activity = buildActivity(
        1,
        '2020-01-01T06:00:00.000Z',
        '2020-01-01T18:00:00.000Z'
      );

      const res = formatActivity(activity, -6);

      expect(res.length).toEqual(1);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      const formattedActivity = res[0];

      for (const property of newProperties) {
        Object.hasOwn(formattedActivity, property);
      }

      expect(formattedActivity.dateId).toEqual('2020-0-1');
      expect(formattedActivity.startPercentage).toEqual(0);
      expect(formattedActivity.endPercentage).toEqual(50);
      expect(formattedActivity.width).toEqual(50);
      expect(formattedActivity.style).toEqual('left: 0%; width: 50%;');
      expect(formattedActivity.isStart).toBe(true);
      expect(formattedActivity.isEnd).toBe(true);
    });

    test('correctly formats activity with date span forced by positive tz offset', () => {
      const activity = buildActivity(
        1,
        '2020-01-01T09:00:00.000Z',
        '2020-01-01T21:00:00.000Z'
      );

      const res = formatActivity(activity, 6);

      expect(res.length).toEqual(2);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      for (const property of newProperties) {
        Object.hasOwn(res[0], property);
      }

      for (const property of newProperties) {
        Object.hasOwn(res[1], property);
      }

      expect(res[0].dateId).toEqual('2020-0-1');
      expect(res[0].startPercentage).toEqual(62.5);
      expect(res[0].endPercentage).toEqual(100);
      expect(res[0].width).toEqual(37.5);
      expect(res[0].style).toEqual('left: 62.5%; width: 37.5%;');
      expect(res[0].isStart).toBe(true);
      expect(res[0].isEnd).toBe(false);

      expect(res[1].dateId).toEqual('2020-0-2');
      expect(res[1].startPercentage).toEqual(0);
      expect(res[1].endPercentage).toEqual(12.5);
      expect(res[1].width).toEqual(12.5);
      expect(res[1].style).toEqual('left: 0%; width: 12.5%;');
      expect(res[1].isStart).toBe(false);
      expect(res[1].isEnd).toBe(true);
    });

    test('correctly formats activity with date span forced by negative tz offset', () => {
      const activity = buildActivity(
        1,
        '2020-01-01T03:00:00.000Z',
        '2020-01-01T15:00:00.000Z'
      );

      const res = formatActivity(activity, -6);

      expect(res.length).toEqual(2);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      for (const property of newProperties) {
        Object.hasOwn(res[0], property);
      }

      for (const property of newProperties) {
        Object.hasOwn(res[1], property);
      }

      expect(res[0].dateId).toEqual('2019-11-31');
      expect(res[0].startPercentage).toEqual(87.5);
      expect(res[0].endPercentage).toEqual(100);
      expect(res[0].width).toEqual(12.5);
      expect(res[0].style).toEqual('left: 87.5%; width: 12.5%;');
      expect(res[0].isStart).toBe(true);
      expect(res[0].isEnd).toBe(false);

      expect(res[1].dateId).toEqual('2020-0-1');
      expect(res[1].startPercentage).toEqual(0);
      expect(res[1].endPercentage).toEqual(37.5);
      expect(res[1].width).toEqual(37.5);
      expect(res[1].style).toEqual('left: 0%; width: 37.5%;');
      expect(res[1].isStart).toBe(false);
      expect(res[1].isEnd).toBe(true);
    });

    test('correctly formats activity which spans two days in a single month', () => {
      const activity = buildActivity(
        1,
        '2020-01-01T12:00:00.000Z',
        '2020-01-02T12:00:00.000Z'
      );

      const res = formatActivity(activity);

      expect(res.length).toEqual(2);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      for (const property of newProperties) {
        Object.hasOwn(res[0], property);
      }

      for (const property of newProperties) {
        Object.hasOwn(res[1], property);
      }

      expect(res[0].dateId).toEqual('2020-0-1');
      expect(res[0].startPercentage).toEqual(50);
      expect(res[0].endPercentage).toEqual(100);
      expect(res[0].width).toEqual(50);
      expect(res[0].style).toEqual('left: 50%; width: 50%;');
      expect(res[0].isStart).toBe(true);
      expect(res[0].isEnd).toBe(false);

      expect(res[1].dateId).toEqual('2020-0-2');
      expect(res[1].startPercentage).toEqual(0);
      expect(res[1].endPercentage).toEqual(50);
      expect(res[1].width).toEqual(50);
      expect(res[1].style).toEqual('left: 0%; width: 50%;');
      expect(res[1].isStart).toBe(false);
      expect(res[1].isEnd).toBe(true);
    });

    test('correctly formats activity which spans two days over two months', () => {
      const activity = buildActivity(
        1,
        '2020-01-31T12:00:00.000Z',
        '2020-02-01T12:00:00.000Z'
      );

      const res = formatActivity(activity);

      expect(res.length).toEqual(2);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      for (const property of newProperties) {
        Object.hasOwn(res[0], property);
      }

      for (const property of newProperties) {
        Object.hasOwn(res[1], property);
      }

      expect(res[0].dateId).toEqual('2020-0-31');
      expect(res[0].startPercentage).toEqual(50);
      expect(res[0].endPercentage).toEqual(100);
      expect(res[0].width).toEqual(50);
      expect(res[0].style).toEqual('left: 50%; width: 50%;');
      expect(res[0].isStart).toBe(true);
      expect(res[0].isEnd).toBe(false);

      expect(res[1].dateId).toEqual('2020-1-1');
      expect(res[1].startPercentage).toEqual(0);
      expect(res[1].endPercentage).toEqual(50);
      expect(res[1].width).toEqual(50);
      expect(res[1].style).toEqual('left: 0%; width: 50%;');
      expect(res[1].isStart).toBe(false);
      expect(res[1].isEnd).toBe(true);
    });

    test('correctly formats activity which spans two days over two years', () => {
      const activity = buildActivity(
        1,
        '2020-12-31T12:00:00.000Z',
        '2021-01-01T12:00:00.000Z'
      );

      const res = formatActivity(activity);

      expect(res.length).toEqual(2);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      for (const property of newProperties) {
        Object.hasOwn(res[0], property);
      }

      for (const property of newProperties) {
        Object.hasOwn(res[1], property);
      }

      expect(res[0].dateId).toEqual('2020-11-31');
      expect(res[0].startPercentage).toEqual(50);
      expect(res[0].endPercentage).toEqual(100);
      expect(res[0].width).toEqual(50);
      expect(res[0].style).toEqual('left: 50%; width: 50%;');
      expect(res[0].isStart).toBe(true);
      expect(res[0].isEnd).toBe(false);

      expect(res[1].dateId).toEqual('2021-0-1');
      expect(res[1].startPercentage).toEqual(0);
      expect(res[1].endPercentage).toEqual(50);
      expect(res[1].width).toEqual(50);
      expect(res[1].style).toEqual('left: 0%; width: 50%;');
      expect(res[1].isStart).toBe(false);
      expect(res[1].isEnd).toBe(true);
    });

    test('correctly formats activity which spans multiple days in a single month', () => {
      const activity = buildActivity(
        1,
        '2020-01-01T12:00:00.000Z',
        '2020-01-07T12:00:00.000Z'
      );

      const res = formatActivity(activity);

      expect(res.length).toEqual(7);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      for (let i = 0; i < 7; i++) {
        for (const property of newProperties) {
          Object.hasOwn(res[i], property);
        }
      }

      expect(res[0].dateId).toEqual('2020-0-1');
      expect(res[0].startPercentage).toEqual(50);
      expect(res[0].endPercentage).toEqual(100);
      expect(res[0].width).toEqual(50);
      expect(res[0].style).toEqual('left: 50%; width: 50%;');
      expect(res[0].isStart).toBe(true);
      expect(res[0].isEnd).toBe(false);

      for (let i = 1; i < 6; i++) {
        expect(res[i].dateId).toEqual(`2020-0-${i + 1}`);
        expect(res[i].startPercentage).toEqual(0);
        expect(res[i].endPercentage).toEqual(100);
        expect(res[i].width).toEqual(100);
        expect(res[i].style).toEqual('left: 0%; width: 100%;');
        expect(res[i].isStart).toBe(false);
        expect(res[i].isEnd).toBe(false);
      }

      expect(res[6].dateId).toEqual('2020-0-7');
      expect(res[6].startPercentage).toEqual(0);
      expect(res[6].endPercentage).toEqual(50);
      expect(res[6].width).toEqual(50);
      expect(res[6].style).toEqual('left: 0%; width: 50%;');
      expect(res[6].isStart).toBe(false);
      expect(res[6].isEnd).toBe(true);
    });

    test('correctly formats activity which spans multiple days over two months', () => {
      const activity = buildActivity(
        1,
        '2020-01-31T12:00:00.000Z',
        '2020-02-06T12:00:00.000Z'
      );

      const res = formatActivity(activity);

      expect(res.length).toEqual(7);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      for (let i = 0; i < 7; i++) {
        for (const property of newProperties) {
          Object.hasOwn(res[i], property);
        }
      }

      expect(res[0].dateId).toEqual('2020-0-31');
      expect(res[0].startPercentage).toEqual(50);
      expect(res[0].endPercentage).toEqual(100);
      expect(res[0].width).toEqual(50);
      expect(res[0].style).toEqual('left: 50%; width: 50%;');
      expect(res[0].isStart).toBe(true);
      expect(res[0].isEnd).toBe(false);

      for (let i = 1; i < 6; i++) {
        expect(res[i].dateId).toEqual(`2020-1-${i}`);
        expect(res[i].startPercentage).toEqual(0);
        expect(res[i].endPercentage).toEqual(100);
        expect(res[i].width).toEqual(100);
        expect(res[i].style).toEqual('left: 0%; width: 100%;');
        expect(res[i].isStart).toBe(false);
        expect(res[i].isEnd).toBe(false);
      }

      expect(res[6].dateId).toEqual('2020-1-6');
      expect(res[6].startPercentage).toEqual(0);
      expect(res[6].endPercentage).toEqual(50);
      expect(res[6].width).toEqual(50);
      expect(res[6].style).toEqual('left: 0%; width: 50%;');
      expect(res[6].isStart).toBe(false);
      expect(res[6].isEnd).toBe(true);
    });

    test('correctly formats activity which spans multiple days over two years', () => {
      const activity = buildActivity(
        1,
        '2019-12-31T12:00:00.000Z',
        '2020-01-06T12:00:00.000Z'
      );

      const res = formatActivity(activity);

      expect(res.length).toEqual(7);

      const newProperties = [
        'dateId',
        'startPercentage',
        'endPercentage',
        'width',
        'style',
        'isStart',
        'isEnd'
      ];

      for (let i = 0; i < 7; i++) {
        for (const property of newProperties) {
          Object.hasOwn(res[i], property);
        }
      }

      expect(res[0].dateId).toEqual('2019-11-31');
      expect(res[0].startPercentage).toEqual(50);
      expect(res[0].endPercentage).toEqual(100);
      expect(res[0].width).toEqual(50);
      expect(res[0].style).toEqual('left: 50%; width: 50%;');
      expect(res[0].isStart).toBe(true);
      expect(res[0].isEnd).toBe(false);

      for (let i = 1; i < 6; i++) {
        expect(res[i].dateId).toEqual(`2020-0-${i}`);
        expect(res[i].startPercentage).toEqual(0);
        expect(res[i].endPercentage).toEqual(100);
        expect(res[i].width).toEqual(100);
        expect(res[i].style).toEqual('left: 0%; width: 100%;');
        expect(res[i].isStart).toBe(false);
        expect(res[i].isEnd).toBe(false);
      }

      expect(res[6].dateId).toEqual('2020-0-6');
      expect(res[6].startPercentage).toEqual(0);
      expect(res[6].endPercentage).toEqual(50);
      expect(res[6].width).toEqual(50);
      expect(res[6].style).toEqual('left: 0%; width: 50%;');
      expect(res[6].isStart).toBe(false);
      expect(res[6].isEnd).toBe(true);
    });
  });
});

export type Item = {
  id: string;
  title: string;
  group: string;
  description: string;
  color: string;
  start: Date;
  end: Date;
  createdAt: Date;
  user: {
    id: number;
    name: string;
  };
  percentageTimes: {
    startPercentage: number;
    endPercentage: number;
  };
  luminance: number;
};

export type FormattedItem = Omit<Item, 'percentageTimes'> & {
  style: string;
  endPercentage: number;
  startPercentage: number;
  width: number;
  dateId: string;
  isStart: boolean;
  isEnd: boolean;
};

export type GetItemsRes = Item[];

export type Container = {
  left: number;
  right: number;
  width: number;
};

export enum Handles {
  START = 'start',
  END = 'end'
}

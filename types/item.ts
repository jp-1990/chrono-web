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

export type FormattedItems = {
  [key: string]: {
    ids: Ref<string[]>;
    items: Ref<Record<Item['id'], FormattedItem>>;
  };
};

export type GetItemArgs = { startDate: Date; endDate: Date };
export type GetItemsRes = Item[];

export type PostItemArgs = {
  title: string;
  group: string;
  notes: string;
  startDate: string;
  endDate: string;
  color: string;
};
export type PostItemsRes = Item;

export type Container = {
  left: number;
  right: number;
  width: number;
};

export enum Handles {
  START = 'start',
  END = 'end'
}

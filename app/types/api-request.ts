export type TypedResponse<T = any> = Omit<Response, 'json'> & {
  json: {
    (): Promise<T>;
    (): Promise<T>;
  };
  fromCache?: boolean;
  data?: T;
};

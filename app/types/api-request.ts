export type TypedResponse<T = any> = Omit<Response, 'json'> & {
  json: { (): Promise<T> };
  fromCache?: boolean;
  // data?: T;
};

/**
 *
 * The server-side id of the target resource for the request. This could be the true
 * id or it could be a temporary frontend-generated id in the case where the request
 * is a post request, or any subsequent request against a a post-ed resource during
 * offline mode.
 */
export type ResourceId = string;

export type FunctionId = string;

export type DBReadHandlerPath = readonly [string, string];
export type DBWriteHandlerPath = readonly [string, string];

export type APIFunctionWithResourceId<
  Res = any,
  Args extends any[] = any[]
> = ((resourceId: ResourceId, ...args: Args) => Promise<TypedResponse<Res>>) & {
  id: FunctionId;
  dbReadHandlerPath?: DBReadHandlerPath;
  dbWriteHandlerPath?: DBWriteHandlerPath;
};

export type APIFunctionWithoutResourceId<
  Res = any,
  Args extends any[] = any[]
> = ((...args: Args) => Promise<TypedResponse<Res>>) & {
  id: FunctionId;
  dbReadHandlerPath?: DBReadHandlerPath;
  dbWriteHandlerPath?: DBWriteHandlerPath;
};

export type APIRequest = <
  T extends APIFunctionWithResourceId | APIFunctionWithoutResourceId
>(
  fn: T,
  ...args: Parameters<T>
) => Promise<{
  data: Awaited<ReturnType<Awaited<ReturnType<T>>['json']>> | undefined;
  status: number | undefined;
  error: unknown;
}>;

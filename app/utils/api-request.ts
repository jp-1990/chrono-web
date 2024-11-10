import type { TypedResponse } from '~/types/api-request';

export const apiRequest = async <
  T extends (...args: Parameters<T>) => Promise<TypedResponse>
>(
  fn: T,
  ...args: Parameters<T>
) => {
  const output: {
    data: Awaited<ReturnType<Awaited<ReturnType<T>>['json']>> | undefined;
    status: number | undefined;
    error: unknown;
  } = {
    data: undefined,
    status: undefined,
    error: undefined
  };

  try {
    const response = await fn(...args);
    output.status = response.status;

    if (!response.ok) {
      throw new Error(`${fn.name} [status:${response.status}]`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = await response.json();
      output.data = json;
    }

    return output;
  } catch (err) {
    console.log('err', err);

    output.data = undefined;
    output.error = err;
    return output;
  }
};

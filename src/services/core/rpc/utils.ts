import { JsonRpcException, JsonRpcExceptionCodes } from "./dto";

export const safeJsonParse = <T>(data: string) => {
  try {
    const parsed = JSON.parse(data) as T;
    return [null, parsed] as const;
  } catch (e) {
    return [
      new JsonRpcException(
        (e as Error).message ?? "Parse error",
        JsonRpcExceptionCodes.PARSE_ERROR,
        data,
      ),
      null,
    ] as const;
  }
};

export const promisify = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
};

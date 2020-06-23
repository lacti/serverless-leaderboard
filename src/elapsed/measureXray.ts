import { captureAsyncFunc, captureFunc } from "aws-xray-sdk-core";

export function measureXrayAsync<Args extends unknown[], ReturnType>(
  functionName: string,
  fn: (...args: Args) => Promise<ReturnType>
): (...args: Args) => Promise<ReturnType> {
  return async (...args: Args): Promise<ReturnType> =>
    process.env.IS_OFFLINE
      ? await fn(...args)
      : await new Promise<ReturnType>((resolve, reject) =>
          captureAsyncFunc(functionName, async (segment) => {
            try {
              const result = await fn(...args);
              segment?.close();
              resolve(result);
            } catch (error) {
              segment?.close(error);
              reject(error);
            }
          })
        );
}

export function measureXraySync<Args extends unknown[], ReturnType>(
  functionName: string,
  fn: (...args: Args) => ReturnType
): (...args: Args) => ReturnType {
  return (...args: Args): ReturnType =>
    process.env.IS_OFFLINE
      ? fn(...args)
      : captureFunc(functionName, (segment) => {
          try {
            const result = fn(...args);
            segment?.close();
            return result;
          } catch (error) {
            segment?.close(error);
            throw error;
          }
        });
}

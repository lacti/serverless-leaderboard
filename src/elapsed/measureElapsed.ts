import measureTimeSpan from "./measureTimeSpan";

export function measureElapsedAsync<Args extends unknown[], ReturnType>(
  functionName: string,
  fn: (...args: Args) => Promise<ReturnType>
): (...args: Args) => Promise<ReturnType> {
  return async (...args: Args): Promise<ReturnType> => {
    const m = measureTimeSpan(functionName);
    try {
      const result = await fn(...args);
      m.success();
      return result;
    } catch (error) {
      m.failed();
      throw error;
    }
  };
}

export function measureElapsedSync<Args extends unknown[], ReturnType>(
  functionName: string,
  fn: (...args: Args) => ReturnType
): (...args: Args) => ReturnType {
  return (...args: Args): ReturnType => {
    const m = measureTimeSpan(functionName);
    try {
      const result = fn(...args);
      m.success();
      return result;
    } catch (error) {
      m.failed();
      throw error;
    }
  };
}

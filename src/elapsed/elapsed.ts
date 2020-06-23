import { measureElapsedAsync, measureElapsedSync } from "./measureElapsed";
import { measureXrayAsync, measureXraySync } from "./measureXray";

export function elapsedAsync<Args extends unknown[], ReturnType>(
  fn: (...args: Args) => Promise<ReturnType>
): (...args: Args) => Promise<ReturnType> {
  return process.env.ELAPSED
    ? measureXrayAsync(fn.name, measureElapsedAsync(fn.name, fn))
    : fn;
}

export function elapsedSync<Args extends unknown[], ReturnType>(
  fn: (...args: Args) => ReturnType
): (...args: Args) => ReturnType {
  return process.env.ELAPSED
    ? measureXraySync(fn.name, measureElapsedSync(fn.name, fn))
    : fn;
}

export default elapsedAsync;

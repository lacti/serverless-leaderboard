import { measureElapsedAsync, measureElapsedSync } from "./measureElapsed";
import { measureXrayAsync, measureXraySync } from "./measureXray";

export function elapsedAsync<Args extends unknown[], ReturnType>(
  fn: (...args: Args) => Promise<ReturnType>
): (...args: Args) => Promise<ReturnType> {
  return measureXrayAsync(fn.name, measureElapsedAsync(fn.name, fn));
}

export function elapsedSync<Args extends unknown[], ReturnType>(
  fn: (...args: Args) => ReturnType
): (...args: Args) => ReturnType {
  return measureXraySync(fn.name, measureElapsedSync(fn.name, fn));
}

export default elapsedAsync;

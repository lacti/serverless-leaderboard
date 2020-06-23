export function elapsedAsync<Args extends unknown[], ReturnType>(
  fn: (...args: Args) => Promise<ReturnType>
): (...args: Args) => Promise<ReturnType> {
  return fn;
}

export function elapsedSync<Args extends unknown[], ReturnType>(
  fn: (...args: Args) => ReturnType
): (...args: Args) => ReturnType {
  return fn;
}

export default elapsedAsync;

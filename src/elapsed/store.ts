interface Measured {
  functionName: string;
  elapsedMillis: number;
  success: boolean;
}

const store: Measured[] = [];

export function addMeasured(measured: Measured): void {
  store.push(measured);
}

export function flushMeasured(): Measured[] {
  return store.splice(0);
}

import sleep from "./sleep";

export default class DeadlineTimer {
  private readonly start: number = Date.now();

  constructor(private readonly deadlineMillis: number) {}

  public alive(): boolean {
    return Date.now() - this.start < this.deadlineMillis;
  }

  public remaining(): number {
    return this.start + this.deadlineMillis - Date.now();
  }

  public async aliveDo<R>({
    sleepMillis = 0,
    doIn,
  }: {
    sleepMillis?: number;
    doIn: () => Promise<R | null>;
  }): Promise<R | null> {
    while (this.alive()) {
      const result = await doIn();
      if (result !== null) {
        return result;
      }
      await sleep(sleepMillis);
    }
    return null;
  }
}

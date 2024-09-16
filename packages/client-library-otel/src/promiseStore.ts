const noop = () => {};

export class PromiseStore {
  private promises: Array<Promise<unknown>> = [];

  add(promise: Promise<unknown>) {
    this.promises.push(promise);
    promise.finally(() => {
      this.promises = this.promises.filter((p) => p === promise);
    });
  }

  allSettled(): Promise<void> {
    return Promise.allSettled(this.promises).then(noop);
  }
}

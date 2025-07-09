export class FakeBroadcastChannel<T> {
  static channels: Record<string, FakeBroadcastChannel<any>[]> = {};

  public onmessage: ((data: T) => void) | null = null;

  constructor(public name: string) {
    if (!FakeBroadcastChannel.channels[name]) {
      FakeBroadcastChannel.channels[name] = [];
    }
    FakeBroadcastChannel.channels[name].push(this);
  }

  postMessage(data: T) {
    for (const channel of FakeBroadcastChannel.channels[this.name]) {
      if (channel !== this) {
        channel.onmessage?.(data);
      }
    }
  }

  close() {
    FakeBroadcastChannel.channels[this.name] = FakeBroadcastChannel.channels[
      this.name
    ].filter((ch) => ch !== this);
  }
}

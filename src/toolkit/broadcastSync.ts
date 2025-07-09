/**
 * 广播同步工具，非 hooks 场景下使用
 */
import { BroadcastChannel } from "broadcast-channel";
import { debounce, throttle } from "./func";

export type BroadcastCallback<T> = (data: T, fromRemote: boolean) => void;

interface BroadcastSyncOptions {
  debounceMs?: number;
  throttleMs?: number;
}

/**
 * 广播同步工具（单例模式）
 * 用于跨标签页同步状态，支持监听远程/本地更新
 */
export class BroadcastSync<T> {
  private static instances = new Map<string, BroadcastSync<any>>();
  private channel: BroadcastChannel<T>;
  private callbacks = new Set<BroadcastCallback<T>>();

  // 包装后的发送函数
  private postMessageFn: (data: T) => void;

  private constructor(
    private channelName: string,
    private options?: BroadcastSyncOptions
  ) {
    this.channel = new BroadcastChannel<T>(channelName);
    this.channel.onmessage = (msg: T) => {
      this.callbacks.forEach((cb) => cb(msg, true)); // fromRemote = true
    };

    const rawPost = (data: T) => {
      this.callbacks.forEach((cb) => cb(data, false));
      this.channel.postMessage(data);
    };

    if (options?.debounceMs) {
      this.postMessageFn = debounce(rawPost, options.debounceMs);
    } else if (options?.throttleMs) {
      this.postMessageFn = throttle(rawPost, options.throttleMs);
    } else {
      this.postMessageFn = rawPost;
    }
  }

  /**
   * 获取指定频道的单例
   */
  static query<T>(
    channelName: string,
    options?: BroadcastSyncOptions
  ): BroadcastSync<T> {
    if (!this.instances.has(channelName)) {
      this.instances.set(
        channelName,
        new BroadcastSync<T>(channelName, options)
      );
    }
    return this.instances.get(channelName)!;
  }

  /**
   * 添加监听器
   */
  addEventListener(callback: BroadcastCallback<T>) {
    this.callbacks.add(callback);
    return this;
  }

  /**
   * 移除监听器
   */
  removeEventListener(callback: BroadcastCallback<T>) {
    this.callbacks.delete(callback);
    return this;
  }

  /**
   * 发送数据，并触发本地回调（fromRemote: false）
   */
  post(data: T) {
    this.postMessageFn(data);
    return this;
  }

  /**
   * 关闭通道（手动销毁该频道）
   */
  close() {
    this.channel.close();
    BroadcastSync.instances.delete(this.channelName);
    return this;
  }
}

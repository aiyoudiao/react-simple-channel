/**
 * useBroadcastSync Hook，跨浏览器 tab 通信
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { BroadcastChannel } from 'broadcast-channel';
import {debounce, throttle} from './func'; // 引入防抖和节流函数

export interface UseBroadcastSyncOptions<T> {
  debounceMs?: number;                    // 防抖时间（毫秒）
  throttleMs?: number;                   // 节流时间（毫秒）
  onChange?: (value: T, fromRemote: boolean) => void; // 状态变化回调
}

/**
 * 多标签页之间状态同步 Hook，支持泛型、节流/防抖、onChange 回调。
 * @param channelName 通信频道名（多个页面一致即可同步）
 * @param defaultValue 默认值
 * @param options 可选配置项
 */
export function useBroadcastSync<T>(
  channelName: string,
  defaultValue: T,
  options: UseBroadcastSyncOptions<T> = {}
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue);
  const channelRef = useRef<BroadcastChannel<T> | null>(null);
  const onChangeRef = useRef(options.onChange);

  // 保持 onChange 引用不变（避免闭包陷阱）
  useEffect(() => {
    onChangeRef.current = options.onChange;
  }, [options.onChange]);

  // 初始化频道
  useEffect(() => {
    const channel = new BroadcastChannel<T>(channelName);
    channelRef.current = channel;

    const handleMessage = (msg: T) => {
      setState(msg);
      onChangeRef.current?.(msg, true); // 来自远程广播
    };

    channel.onmessage = handleMessage;

    return () => {
      channel.close();
    };
  }, [channelName]);

  // 创建 postMessage 函数（加防抖/节流）
  const postMessage = useMemo(() => {
    const rawPost = (value: T) => {
      onChangeRef.current?.(value, false); // 本地触发
      channelRef.current?.postMessage(value);
    };

    if (options.debounceMs) {
      return debounce(rawPost, options.debounceMs);
    }

    if (options.throttleMs) {
      return throttle(rawPost, options.throttleMs);
    }

    return rawPost;
  }, [options.debounceMs, options.throttleMs]);

  // 提供给组件更新状态的方法
  const updateState = (value: T) => {
    setState(value); // 更新本地状态
    postMessage(value);
  };

  return [state, updateState];
}

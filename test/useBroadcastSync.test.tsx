import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBroadcastSync } from '../src/toolkit';

// 👇 使用模拟版本的 BroadcastChannel
vi.mock('broadcast-channel', async () => {
  return {
    BroadcastChannel: (await import('./__mocks__/broadcast-channel')).FakeBroadcastChannel
  };
});

describe('useBroadcastSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // 用于测试 debounce/throttle 时间控制
  });

  it('初始化时返回默认值', () => {
    const { result } = renderHook(() =>
      useBroadcastSync('test-channel', 'light')
    );
    expect(result.current[0]).toBe('light');
  });

  it('更新状态后 state 改变，onChange(fromRemote=false)', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useBroadcastSync('test-change', 'light', { onChange })
    );

    act(() => {
      result.current[1]('dark');
    });

    expect(result.current[0]).toBe('dark');
    expect(onChange).toHaveBeenCalledWith('dark', false);
  });

  it('跨 hook 同频道通信，onChange(fromRemote=true)', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const hook1 = renderHook(() =>
      useBroadcastSync('theme', 'light', { onChange: cb1 })
    );
    const hook2 = renderHook(() =>
      useBroadcastSync('theme', 'light', { onChange: cb2 })
    );

    act(() => {
      hook1.result.current[1]('dark');
    });

    // hook1 是本地，hook2 是远程
    expect(cb1).toHaveBeenCalledWith('dark', false);
    expect(cb2).toHaveBeenCalledWith('dark', true);
    expect(hook2.result.current[0]).toBe('dark');
  });

  it('防抖 debounceMs 生效', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useBroadcastSync('debounced', 'init', {
        debounceMs: 500,
        onChange
      })
    );

    act(() => {
      // 触发多次更新
      result.current[1]('value1');
      result.current[1]('value2');
      result.current[1]('value3');
    });

    // 还未执行
    vi.advanceTimersByTime(499);
    expect(onChange).toHaveBeenCalledTimes(0); // post 还未触发

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledWith('value3', false); // 最终只触发最后一个值
  });

  it('节流 throttleMs 生效', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useBroadcastSync('throttled', 'init', {
        throttleMs: 1000,
        onChange
      })
    );

    act(() => {
      result.current[1]('v1');
    });

    vi.advanceTimersByTime(300);
    act(() => {
      result.current[1]('v2'); // 被 throttle 忽略
    });

    vi.advanceTimersByTime(700); // 共 1000ms，节流窗口结束
    act(() => {
      result.current[1]('v3'); // 应该触发
    });

    expect(onChange).toHaveBeenCalledWith('v1', false);
    expect(onChange).toHaveBeenCalledWith('v3', false);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });
});

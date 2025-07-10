import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBroadcastSync } from '../src/toolkit';

// 👇 Use a mock version of BroadcastChannel
vi.mock('broadcast-channel', async () => {
  return {
    BroadcastChannel: (await import('./__mocks__/broadcast-channel')).FakeBroadcastChannel
  };
});

describe('useBroadcastSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Used to control debounce/throttle timing in tests
  });

  it('should return default value on initialization', () => {
    const { result } = renderHook(() =>
      useBroadcastSync('test-channel', 'light')
    );
    expect(result.current[0]).toBe('light');
  });

  it('should update state and trigger onChange(fromRemote=false)', () => {
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

  it('should sync across hooks with same channel, onChange(fromRemote=true)', () => {
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

    // hook1 is local, hook2 is remote
    expect(cb1).toHaveBeenCalledWith('dark', false);
    expect(cb2).toHaveBeenCalledWith('dark', true);
    expect(hook2.result.current[0]).toBe('dark');
  });

  it('should apply debounceMs correctly', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useBroadcastSync('debounced', 'init', {
        debounceMs: 500,
        onChange
      })
    );

    act(() => {
      // Trigger multiple updates
      result.current[1]('value1');
      result.current[1]('value2');
      result.current[1]('value3');
    });

    // Not triggered yet
    vi.advanceTimersByTime(499);
    expect(onChange).toHaveBeenCalledTimes(0); // post not triggered yet

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledWith('value3', false); // Only the last value is triggered
  });

  it('should apply throttleMs correctly', () => {
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
      result.current[1]('v2'); // Ignored due to throttle
    });

    vi.advanceTimersByTime(700); // Total 1000ms, throttle window ends
    act(() => {
      result.current[1]('v3'); // Should be triggered
    });

    expect(onChange).toHaveBeenCalledWith('v1', false);
    expect(onChange).toHaveBeenCalledWith('v3', false);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });
});

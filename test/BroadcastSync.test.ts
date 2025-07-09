import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BroadcastSync } from "../src/toolkit";

vi.mock("broadcast-channel", async () => {
  return {
    BroadcastChannel: (await import("./__mocks__/broadcast-channel"))
      .FakeBroadcastChannel,
  };
});

describe("BroadcastSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("should create singleton per channel name", () => {
    const a = BroadcastSync.query<string>("channel-1");
    const b = BroadcastSync.query<string>("channel-1");
    const c = BroadcastSync.query<string>("channel-2");

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("should call onChange with fromRemote=false when post is called", () => {
    const callback = vi.fn();
    const sync = BroadcastSync.query<string>("test-post");
    sync.addEventListener(callback);

    sync.post("hello");

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("hello", false);
  });

  // NOTE in BroadcastSync.e2e-test.ts
  it("should trigger fromRemote=true when another tab broadcasts", () => {
    // const a = BroadcastSync.query<string>("remote-channel");
    // const b = BroadcastSync.query<string>("remote-channel");
    // const cbA = vi.fn();
    // const cbB = vi.fn();
    // a.addEventListener(cbA);
    // b.addEventListener(cbB);
    // a.post("abc");
    // expect(cbA).toHaveBeenCalledWith("abc", false); // 本地
    // expect(cbB).toHaveBeenCalledWith("abc", true); // 来自广播
  });

  it("should remove listener correctly", () => {
    const cb = vi.fn();
    const sync = BroadcastSync.query<string>("remove-test");
    sync.addEventListener(cb);
    sync.removeEventListener(cb);

    sync.post("hi");
    expect(cb).not.toHaveBeenCalled();
  });

  it("should close channel and clear instance", () => {
    const sync = BroadcastSync.query<string>("to-close");
    const instanceMap = (BroadcastSync as any).instances;

    expect(instanceMap.has("to-close")).toBe(true);

    sync.close();
    expect(instanceMap.has("to-close")).toBe(false);
  });

  it("should support multiple listeners", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const sync = BroadcastSync.query<string>("multi");

    sync.addEventListener(cb1);
    sync.addEventListener(cb2);

    sync.post("data");

    expect(cb1).toHaveBeenCalledWith("data", false);
    expect(cb2).toHaveBeenCalledWith("data", false);
  });
  it("debounce should delay post calls", () => {
    const sync = BroadcastSync.query<string>("debounce-test", {
      debounceMs: 100,
    });
    const callback = vi.fn();
    sync.addEventListener(callback);

    sync.post("a");
    sync.post("b");
    sync.post("c");

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("c", false);
  });

  it("throttle should limit post calls", () => {
    const sync = BroadcastSync.query<string>("throttle-test", {
      throttleMs: 100,
    });
    const callback = vi.fn();
    sync.addEventListener(callback);

    sync.post("a"); // immediately
    sync.post("b"); // ignored
    sync.post("c"); // ignored

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("a", false);

    vi.advanceTimersByTime(100);

    sync.post("d");
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith("d", false);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });
});

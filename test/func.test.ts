import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce, throttle } from "../src/toolkit/func";

describe("utils/func", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("debounce", () => {
    it("should call function only once after delay", () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn("first");
      debouncedFn("second");
      debouncedFn("third");

      // Timer hasn’t advanced yet, so nothing should be called
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("third");
    });

    it("should reset timer if called within delay", () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 500);

      debouncedFn("a");
      vi.advanceTimersByTime(400);
      debouncedFn("b");
      vi.advanceTimersByTime(400);
      debouncedFn("c");
      vi.advanceTimersByTime(500);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("c");
    });
  });

  describe("throttle", () => {
    it("should call function immediately and then throttle", () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 1000);

      throttledFn("first"); // should call
      throttledFn("second"); // should be ignored
      throttledFn("third"); // should be ignored

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("first");

      vi.advanceTimersByTime(1000);
      throttledFn("fourth"); // should call again
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith("fourth");
    });

    it("should not call again if called within throttle interval", () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 300);

      throttledFn();
      vi.advanceTimersByTime(100);
      throttledFn();
      vi.advanceTimersByTime(100);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

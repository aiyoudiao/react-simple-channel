import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test", // 测试目录
  testMatch: "**/*.e2e-test.ts", // ✅ 只匹配这个文件
  use: {
    headless: false, // 可视化调试
    viewport: { width: 1280, height: 720 },
    baseURL: "http://localhost:5173", // 你的 dev server 地址
    trace: "on-first-retry",
  },
});

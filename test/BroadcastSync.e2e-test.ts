import { test, expect } from "@playwright/test";

test("🔁 BroadcastSync cross-tab: fromRemote=true on other tab", async ({
  browser,
}) => {
  const context = await browser.newContext();

  // Tab A
  const pageA = await context.newPage();
  await pageA.goto("/?tab=A");

  // Tab B
  const pageB = await context.newPage();
  await pageB.goto("/?tab=B");

  // Tab A: 发送消息
  await pageA.evaluate(() => {
    window.sendMessage?.("hello-from-A");
  });

  // B 页等待接收到消息，确保是来自远程
  await expect
    .poll(
      async () => {
        return await pageB.evaluate(() => JSON.stringify(window.lastReceived));
      },
      {
        timeout: 3000,
      }
    )
    .toEqual(
      JSON.stringify({
        data: "hello-from-A",
        fromRemote: true,
      })
    );

  // A 页也会本地收到消息
  await expect
    .poll(async () => {
      return await pageA.evaluate(() => JSON.stringify(window.lastReceived));
    })
    .toEqual(
      JSON.stringify({
        data: "hello-from-A",
        fromRemote: false,
      })
    );
});

/* eslint-disable no-console */
import {
  test,
  chromium,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { getExtensionId } from "./setup";
import path from "path";

async function launch() {
  const extPath = path.resolve(process.cwd(), "build/chrome-mv3-prod");
  return chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      "--no-sandbox",
    ],
  });
}

function attachCapture(ctx: BrowserContext) {
  const errors: string[] = [];
  const logs: string[] = [];
  ctx.on("weberror", (err) => {
    errors.push(
      `[WEBERROR ${err.page().url()}] ${err.error().stack ?? err.error().message}`,
    );
  });
  const wirePage = (p: Page) => {
    p.on("console", (m) => {
      const t = m.type();
      if (t === "error" || t === "warning")
        logs.push(`[${t} ${p.url()}] ${m.text()}`);
    });
    p.on("pageerror", (e) => {
      errors.push(`[PAGEERROR ${p.url()}] ${e.stack ?? e.message}`);
    });
  };
  ctx.on("page", wirePage);
  ctx.pages().forEach(wirePage);
  return { errors, logs };
}

test("full surface scan: popup, setup, overlay injection", async () => {
  const context = await launch();
  const capture = attachCapture(context);

  await new Promise((r) => setTimeout(r, 2500));
  const extId = await getExtensionId(context);
  console.log("EXT_ID:", extId);

  // 1. Popup
  console.log("\n--- POPUP ---");
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await new Promise((r) => setTimeout(r, 1500));
  const popupHTML = await popup.locator("body").innerHTML();
  console.log(
    "POPUP renders:",
    popupHTML.includes("Prompt Tuner") ? "OK" : "BROKEN",
  );
  console.log(
    "POPUP has error-state text:",
    popupHTML.includes("Something went wrong") ? "YES (bad)" : "no",
  );

  // 2. Setup wizard
  console.log("\n--- SETUP ---");
  const setup = await context.newPage();
  await setup.goto(`chrome-extension://${extId}/tabs/setup.html`);
  await new Promise((r) => setTimeout(r, 1500));
  const setupHTML = await setup.locator("body").innerHTML();
  console.log(
    "SETUP renders welcome:",
    setupHTML.includes("Welcome to Prompt Tuner") ? "OK" : "BROKEN",
  );
  // Click Continue through all steps
  for (let i = 0; i < 6; i++) {
    const btn = setup.getByRole("button", { name: /Continue|Finish/ });
    if ((await btn.count()) > 0) {
      try {
        await btn.first().click({ timeout: 1000 });
      } catch {
        /* may close tab on Finish */
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // 3. Content script injection - content script only matches the 3 LLM
  // host patterns, none of which are testable from an offline harness
  // without Cloudflare noise. Skipping host-page test here; covered by
  // platform-compat.spec.ts when run manually.

  // Final dump
  console.log("\n=== ERRORS (" + String(capture.errors.length) + ") ===");
  capture.errors.forEach((e) => {
    console.log(e);
  });
  console.log("\n=== WARN/ERR LOGS (" + String(capture.logs.length) + ") ===");
  capture.logs.forEach((l) => {
    console.log(l);
  });

  await context.close();
});

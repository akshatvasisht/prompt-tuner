/* eslint-disable no-console */
import { test, chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("debug persistent context", async () => {
    const pathToExtension = path.resolve(__dirname, "../../build/chrome-mv3-prod");
    console.log("Extension path:", pathToExtension);

    const context = await chromium.launchPersistentContext("", {
        headless: true, // Try headless first
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
        ],
    });

    console.log("Waiting for service worker...");
    // Wait for service worker to appear
    let sw = context.serviceWorkers()[0];
    sw ??= await context.waitForEvent("serviceworker", { timeout: 15000 });

    console.log("Service worker found:", sw.url());
    const regex = /chrome-extension:\/\/([a-z]+)\//;
    const match = regex.exec(sw.url());
    if (match) {
        console.log("Extension ID:", match[1]);
    }

    await context.close();
});

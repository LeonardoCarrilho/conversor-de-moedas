import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./e2e", use: { baseURL: "http://127.0.0.1:4177/", headless: true, screenshot: "only-on-failure", trace: "retain-on-failure" }, webServer: { command: "npm run preview -- --host 127.0.0.1 --port 4177 --strictPort", url: "http://127.0.0.1:4177/", reuseExistingServer: false }, reporter: "list" });

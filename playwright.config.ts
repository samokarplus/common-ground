import { defineConfig } from "@playwright/test";

// Set E2E_BASE_URL (with trailing slash) to test a deployed site instead of the local preview.
const remote = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  use: { baseURL: remote ?? "http://127.0.0.1:3021/" },
  webServer: remote ? undefined : {
    command: "npm run preview",
    url: "http://127.0.0.1:3021/",
    reuseExistingServer: true,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1360, height: 900 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});

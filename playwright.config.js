// Browser tests run against dist/ (what would be published), served locally.
// They use the Google Chrome already installed on this computer (channel "chrome"),
// so no extra browser download is needed.
import { defineConfig } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests",
  outputDir: "test-results",
  fullyParallel: true,
  // The local python server drops connections under full parallel load (seen 2026-11-26 once the lens tests
  // grew), so the run is capped at 3 workers.
  workers: 3,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, channel: "chrome" },
  webServer: {
    command: `python3 -m http.server ${PORT} --directory dist`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: false,
  },
  projects: [
    { name: "desktop-light", use: { viewport: { width: 1440, height: 900 }, colorScheme: "light" } },
    { name: "desktop-dark", use: { viewport: { width: 1440, height: 900 }, colorScheme: "dark" } },
    { name: "phone-light", use: { viewport: { width: 390, height: 844 }, colorScheme: "light", isMobile: true } },
    { name: "phone-dark", use: { viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true } },
  ],
});

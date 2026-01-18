import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_STATE = path.join(__dirname, '.playwright/.auth/state.json');

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'on-first-retry',
    },

    /* Fail the build on any console error */
    webServer: {
        command: 'npm run build && npm run preview -- --port 4173',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
    },

    projects: [
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                headless: false,
            },
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: STORAGE_STATE,
            },
            dependencies: ['setup'],
        },
        {
            name: 'Mobile Safari',
            use: {
                ...devices['iPhone 12'],
                storageState: STORAGE_STATE,
            },
            dependencies: ['setup'],
        },
        {
            name: 'Mobile Chrome',
            use: {
                ...devices['Pixel 5'],
                storageState: STORAGE_STATE,
            },
            dependencies: ['setup'],
        },
    ],
});

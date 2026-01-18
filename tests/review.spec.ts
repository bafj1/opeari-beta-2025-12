import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('review authenticated state', async ({ page }) => {
    // 1. Verify Auth State Exists
    const authFile = path.join(__dirname, '../.playwright/.auth/state.json');
    if (!fs.existsSync(authFile)) {
        throw new Error('Auth state not found. Please run "npm run pw:setup" first.');
    }

    console.log('Auth state found. Navigating to /village...');

    // 2. Navigate to Dashboard/Village
    await page.goto('/village');

    // 3. Confirm we are NOT redirected (Basic Smoke Test)
    await expect(page).not.toHaveURL(/login|signin/);

    // Optional: Log success
    console.log('Successfully loaded /village. Pausing for manual review...');
    console.log('Use the Playwright Inspector to resume or just close the window when done.');

    // 4. Pause for Manual Inspection
    await page.pause();
});

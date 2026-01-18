import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../.playwright/.auth/state.json');

setup('authenticate', async ({ page, browser }) => {
    // 5 minutes for manual login/validation
    setup.setTimeout(300000);

    // 1. Validation of existing state
    if (fs.existsSync(authFile)) {
        console.log('Auth state exists, validating...');
        try {
            const context = await browser.newContext({
                storageState: authFile,
                baseURL: 'http://localhost:4173' // Ensure baseURL is set for validation navigation
            });
            const checkPage = await context.newPage();

            // Go to a protected route to check if we stay there
            await checkPage.goto('/village');
            await checkPage.waitForLoadState('networkidle');

            const url = checkPage.url();

            // Check for signs of being logged out
            const isProtectedUrl = /.*\/(village|dashboard|settings|profile|onboarding|verify).*/.test(url);
            // Safe count checks - do not throw
            const loginHeadingCount = await checkPage.getByRole('heading', { name: 'Sign in' }).count();
            const loginEmailCount = await checkPage.getByLabel('Email').count();

            const isLoginPage = url.includes('login') || url.includes('signin') || loginHeadingCount > 0 || loginEmailCount > 0;

            await context.close();

            if (isProtectedUrl && !isLoginPage) {
                console.log('Auth state is valid. Skipping manual login.');
                return;
            } else {
                console.log('Auth state invalid. Deleting...');
                fs.unlinkSync(authFile);
            }
        } catch (e) {
            console.error('Error validating state:', e);
            if (fs.existsSync(authFile)) fs.unlinkSync(authFile);
        }
    }

    // 2. Manual Login Flow
    console.log('Starting manual login flow...');
    console.log('Please log in manually in the browser window...');
    await page.goto('/login');

    try {
        // Wait for URL to match any of the protected routes
        // This confirms the user successfuly logged in
        await page.waitForURL(/.*\/(village|dashboard|settings|profile|onboarding|verify).*/, { timeout: 300000 });

        // Save
        await page.context().storageState({ path: authFile });
        console.log('New auth state saved successfully.');
    } catch (e) {
        console.error('Login timed out or failed.');
        try {
            const failurePath = path.join(__dirname, '../.playwright/auth-failure.png');
            await page.screenshot({ path: failurePath, fullPage: true });
            console.log(`Screenshot saved to ${failurePath}`);
            console.log(`Current URL: ${page.url()}`);
        } catch (screenshotError) {
            console.error('Failed to take failure screenshot:', screenshotError);
        }
        throw e;
    }
});

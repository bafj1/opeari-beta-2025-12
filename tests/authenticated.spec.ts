import { test, expect } from '@playwright/test';

test.describe('Authenticated Routes', () => {
    test('Loads /village after auth', async ({ page }) => {
        await page.goto('/village');
        // Expect NOT to be redirected to login
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page).toHaveURL(/\/village/);

        // Basic element check - assuming "Village" or similar header exists based on previous file names
        // Ideally we check for something stable. "Village" is likely present.
        await expect(page.locator('body')).toContainText(/Village/i);
    });

    test('Loads /settings', async ({ page }) => {
        await page.goto('/settings');
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page).toHaveURL(/\/settings/);
        await expect(page.locator('body')).toContainText(/Settings/i);
    });

    test('Loads /profile', async ({ page }) => {
        await page.goto('/profile');
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page).toHaveURL(/\/profile/);
        await expect(page.locator('body')).toContainText(/Profile/i);
    });
});

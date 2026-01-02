import { test, expect } from '@playwright/test';

// Fail on console errors (excluding harmless warnings if needed)
test.beforeEach(({ page }) => {
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`Console Error detected in ${page.url()}: ${msg.text()}`);
            // We can choose to fail hard:
            // expect(msg.type()).not.toBe('error'); 
            // BUT for now, let's log. If user wants strict failure, we uncomment.
            // User requested: "Fail the build if Any console error occurs"
            // So we MUST fail.
            expect(msg.type(), `Console error detected: ${msg.text()}`).not.toBe('error');
        }
    });
});

test.describe('Smoke Tests', () => {

    test('Waitlist Page loads and is interactive', async ({ page }) => {
        await page.goto('/waitlist');
        await expect(page).toHaveTitle(/Opeari/);

        // simple interactivity check
        const emailInput = page.getByPlaceholder('you@email.com');
        await expect(emailInput).toBeVisible();
        await emailInput.fill('smoke-test@test.com');

        // We aren't submitting to avoid spamming DB, just checking button exists
        await expect(page.getByRole('button', { name: 'Secure My Spot' })).toBeVisible();
    });

    test('Login Page loads without errors', async ({ page }) => {
        await page.goto('/login');
        // Check for specific text that confirms we are on login form (Visible on Mobile too)
        await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
        await expect(page.getByLabel(/^Email/)).toBeVisible(); // Regex for loose match
    });

    test('Invite Link redirects to Login if unauthenticated', async ({ page }) => {
        await page.goto('/onboarding?source=invite');
        // Protection: Should redirect to signin (which has "Welcome back" header)
        await expect(page).toHaveURL(/.*signin.*/);
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    });

    test('Dashboard Redirects cleanly (Unauth)', async ({ page }) => {
        // We expect a redirect to Login or Home if unauthenticated
        await page.goto('/dashboard');

        // Should eventually land on Login or Home
        // Checking if URL contains login or if we see login text
        await expect(page).toHaveURL(/.*login.*/);
        await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    });

});

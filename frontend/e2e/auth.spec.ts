import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should register a new user', async ({ page }) => {
        await page.goto('/register');

        // Fill registration form
        await page.fill('#username', 'testuser' + Date.now());
        await page.fill('#email', `test${Date.now()}@example.com`);
        await page.fill('#password', 'password123');
        await page.fill('#confirmPassword', 'password123');

        // Submit form
        await page.click('button[type="submit"]');

        // Should redirect to home page
        await expect(page).toHaveURL('/home');

        // Should show user's bank balance
        await expect(page.locator('text=Your Fortune')).toBeVisible();
        await expect(page.locator('text=$1,000,000')).toBeVisible();
    });

    test('should login with existing credentials', async ({ page }) => {
        // First register a user
        await page.goto('/register');
        const email = `test${Date.now()}@example.com`;
        await page.fill('#username', 'testuser' + Date.now());
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#confirmPassword', 'password123');
        await page.click('button[type="submit"]');

        // Logout
        await page.click('text=Exit Lair');

        // Login again
        await page.goto('/login');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');

        // Should be on home page
        await expect(page).toHaveURL('/home');
    });

    test('should show error for invalid login', async ({ page }) => {
        await page.goto('/login');

        await page.fill('#email', 'invalid@example.com');
        await page.fill('#password', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.locator('.error')).toBeVisible();
    });

    test('should protect game route when not logged in', async ({ page }) => {
        await page.goto('/game/snake');

        // Should redirect to login
        await expect(page).toHaveURL('/login');
    });
});

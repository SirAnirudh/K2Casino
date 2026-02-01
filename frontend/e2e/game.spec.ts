import { test, expect } from '@playwright/test';

test.describe('Snake Game', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login
        await page.goto('/register');
        const timestamp = Date.now();
        await page.fill('#username', 'gamer' + timestamp);
        await page.fill('#email', `gamer${timestamp}@example.com`);
        await page.fill('#password', 'password123');
        await page.fill('#confirmPassword', 'password123');
        await page.click('button[type="submit"]');

        // Wait for redirect to home
        await expect(page).toHaveURL('/home');
    });

    test('should navigate to snake game from home', async ({ page }) => {
        // Click on snake game card
        await page.click('text=Viper\'s Vengeance');

        // Should be on game page
        await expect(page).toHaveURL('/game/snake');
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('should display game controls and stats', async ({ page }) => {
        await page.goto('/game/snake');

        // Check for score display
        await expect(page.locator('text=SCORE')).toBeVisible();
        await expect(page.locator('text=LENGTH')).toBeVisible();

        // Check for controls section
        await expect(page.locator('text=Controls')).toBeVisible();
        await expect(page.locator('text=Arrow Keys / WASD')).toBeVisible();
    });

    test('should start game and respond to controls', async ({ page }) => {
        await page.goto('/game/snake');

        // Wait for canvas to be visible
        await expect(page.locator('canvas')).toBeVisible();

        // Press arrow key
        await page.keyboard.press('ArrowUp');

        // Wait a bit for game to update
        await page.waitForTimeout(500);

        // Game should still be running (not game over immediately)
        await expect(page.locator('text=GAME OVER')).not.toBeVisible();
    });

    test('should pause game with spacebar', async ({ page }) => {
        await page.goto('/game/snake');

        // Press space to pause
        await page.keyboard.press('Space');

        // Should show pause overlay
        await expect(page.locator('text=PAUSED')).toBeVisible();

        // Press space again to resume
        await page.keyboard.press('Space');

        // Pause overlay should be gone
        await expect(page.locator('text=PAUSED')).not.toBeVisible();
    });

    test('should return to home page', async ({ page }) => {
        await page.goto('/game/snake');

        // Click back button
        await page.click('text=Return to Lair');

        // Should be back on home page
        await expect(page).toHaveURL('/home');
    });
});

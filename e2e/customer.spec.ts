import { test, expect } from '@playwright/test';

test.describe('Customer App', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Digital Order')).toBeVisible();
    await expect(page.getByText('Order food from your favorite restaurants')).toBeVisible();
  });

  test('should navigate to menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'View Menu' }).click();
    await expect(page).toHaveURL(/\/testera\/menu/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByText('Digital Order')).toBeVisible();
  });
});

test.describe('Order Flow', () => {
  test('complete order workflow', async ({ page }) => {
    await page.goto('/');
    
    // Browse menu
    await page.getByRole('link', { name: 'View Menu' }).click();
    
    // Add item to cart (when implemented)
    // await page.getByText('Add to Cart').first().click();
    
    // Checkout
    // await page.getByRole('button', { name: 'Checkout' }).click();
    
    // Verify order created
    // await expect(page.getByText('Order confirmed')).toBeVisible();
  });
});

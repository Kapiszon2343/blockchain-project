import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Create Wagmi/);
});

test('doubles value when connected and button clicked', async ({ page }) => {
  await page.goto('http://localhost:5173') // Adjust if needed

  // Connect to wallet (assumes 'Injected' is available)
  const connectButton = page.getByRole('button', { name: 'Injected' })
  await expect(connectButton).toBeVisible()
  await connectButton.click()

  // Wait for disconnect button to appear (as confirmation of connection)
  await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible()

  // Read the current value
  const currentValueText = await page.locator('h2:has-text("Current Value")').textContent()
  const match = currentValueText?.match(/Current Value:\s*(\d+)/)
  const oldValue = match ? parseInt(match[1], 10) : 0

  // Click the "Double Value" button
  const doubleButton = page.getByRole('button', { name: 'Double Value' })
  await doubleButton.click()

  // Wait for confirmation text
  await page.getByText('Transaction confirmed.').waitFor({ timeout: 10_000 })

  // Check if value doubled
  const newValueText = await page.locator('h2:has-text("Current Value")').textContent()
  const newMatch = newValueText?.match(/Current Value:\s*(\d+)/)
  const newValue = newMatch ? parseInt(newMatch[1], 10) : 0

  expect(newValue).toBe(oldValue * 2)
})

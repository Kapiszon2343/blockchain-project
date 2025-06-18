// Import necessary Synpress modules and setup
import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright'
import basicSetup from '../test/wallet-setup/metamask.setup'

// Create a test instance with Synpress and MetaMask fixtures
const test = testWithSynpress(metaMaskFixtures(basicSetup))

// Extract expect function from test
const { expect } = test

test.describe('Wallet connection', () => {
  test('has title localhost', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Create Wagmi/);
  });
  // Define a basic test case
  test('should connect wallet to the MetaMask Test Dapp', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    test.setTimeout(120_000)
    // Create a new MetaMask instance
    const metamask = new MetaMask(
      context,
      metamaskPage,
      basicSetup.walletPassword,
      extensionId
    )

    // Navigate to the homepage
    await page.goto('/')

    // Click the connect button
    const connectButton = page.getByRole('button', { name: 'Injected' })
    await expect(connectButton).toBeVisible({ timeout: 15000 })
    await connectButton.click()

    // Connect MetaMask to the dapp
    await metamask.connectToDapp()

    await expect(page.locator('text=status: connected')).toBeVisible();

    // Click link to publish
    await page.getByRole('link', { name: 'Publish new story' }).click()
    await expect(page).toHaveURL(/.*\/Publish/)

    // Fill in the title field
    await page.getByPlaceholder('title').fill('Test')

    // Click the Publish button
    await page.getByRole('button', { name: 'Publish' }).click()

    // Wait for confirmation (assumes blockchain & backend work in dev)
    await expect(page.getByText(/please wait/i)).toBeVisible()

    // Confirm operation in blockchain
    await page.waitForTimeout(3000)
    await metamask.confirmTransaction()

    // Eventually expect the token ID to appear
    await expect(page.locator('text=/Publishing succesfull!/')).toBeVisible({ timeout: 100000 })
  })
})
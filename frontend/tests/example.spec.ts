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
    await expect(connectButton).toBeVisible()
    await connectButton.click()

    // Connect MetaMask to the dapp
    await metamask.connectToDapp()

    await expect(page.locator('text=status: connected')).toBeVisible();

    // Additional test steps can be added here, such as:
    // - Sending transactions
    // - Interacting with smart contracts
    // - Testing dapp-specific functionality

    const fixButton = page.getByRole('button', { name: 'Fix Value' });
    await fixButton.click();
    await metamask.confirmTransaction()

    await page.getByText('Transaction confirmed.').waitFor({ timeout: 40_000 })

    const fixed = await page.locator('h2:has-text("Current Value: 27")').textContent()

    const doubleButton = page.getByRole('button', { name: 'Double Value' });
    await doubleButton.click();
    await metamask.confirmTransaction()

    await page.getByText('Transaction confirmed.').waitFor({ timeout: 40_000 })

    const doubled = await page.locator('h2:has-text("Current Value: 54")').textContent()
  })
})
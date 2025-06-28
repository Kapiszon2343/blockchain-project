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
    await expect(page).toHaveTitle(/Decentralized Copyright Control/);
  });
  // Define a basic test case
  test('Whole interaction', async ({
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
    await page.waitForTimeout(10000);

    // Click the connect button
    const connectButton = page.getByRole('button', { name: 'Injected' })
    await expect(connectButton).toBeVisible({ timeout: 150000 })
    await connectButton.click()

    // Connect MetaMask to the dapp
    await metamask.connectToDapp()

    await expect(page.locator('text=status: connected')).toBeVisible();

    // Click link to publish
    await page.getByRole('link', { name: 'Publish new works' }).click()
    await expect(page).toHaveURL(/.*\/Publish/)

    // Fill in the title field
    const title = 'Test'
    await page.getByPlaceholder('title').fill(title)

    // Click the Publish button
    await page.getByRole('button', { name: 'Publish' }).click()

    // Wait for confirmation (assumes blockchain & backend work in dev)
    await expect(page.getByText(/please wait/i)).toBeVisible()

    // Confirm operation in blockchain
    await page.waitForTimeout(3000)
    await metamask.confirmTransaction()

    // Wait for the confirmation message to appear
    const confirmation = await page.locator('text=/Publishing succesfull! Your token id is: \\d+/')
    await expect(confirmation).toBeVisible({ timeout: 10000 })

    // Extract the number from the message
    const text = await confirmation.textContent()
    const tokenId = text?.match(/Publishing succesfull! Your token id is: (\d+)/)?.[1]

    expect(tokenId).toBeDefined()

    await page.goto('/')

    // Click link to update
    await page.getByRole('link', { name: 'Add new chapters' }).click()
    await expect(page).toHaveURL(/.*\/Update/)

    // Fill in chapter details
    await page.getByPlaceholder('token Id').fill(tokenId as string)
    await page.getByPlaceholder('chapter number').fill('0')
    const content = 'prologue'
    await page.getByPlaceholder('chapter content').fill(content)

    await page.getByRole('button', { name: 'Publish' }).click()

    // Wait for confirmation (assumes blockchain & backend work in dev)
    await expect(page.getByText(/please wait/i)).toBeVisible()

    // Confirm operation in blockchain
    await page.waitForTimeout(3000)
    await metamask.confirmTransaction()

    const chapterConfirmation = page.getByText('Chapter published succesfully')
    await expect(chapterConfirmation).toBeVisible({ timeout: 10000 })

    await page.goto('/')

    // Click link to check
    await page.getByRole('link', { name: 'Check for duplicates' }).click()
    await expect(page).toHaveURL(/.*\/Check/)

    // Fill in chapter details
    await page.getByPlaceholder('content to check').fill(content)

    await page.getByRole('button', { name: 'Check for plagiarism' }).click()

    // Wait for the result section to appear
    await expect(page.getByText('Similar Chapters Found:')).toBeVisible({ timeout: 10_000 })

    // Check that the title appears in the results
    const titleRegex = new RegExp(`${title}\\s+—\\s+Chapter\\s+\\d+\\s+\\(Token ID: \\d+\\)`)
    await expect(page.getByText(titleRegex).first()).toBeVisible({ timeout: 10000 })
  })

  test('No plagiarism', async ({
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
    await page.waitForTimeout(10000);

    await page.getByRole('link', { name: 'Check for duplicates' }).click()
    await expect(page).toHaveURL(/.*\/Check/)

    await page.getByPlaceholder('content to check').fill('nothing')

    await page.getByRole('button', { name: 'Check for plagiarism' }).click()

    await expect(page.getByText('No significant similarities found.')).toBeVisible({ timeout: 10_000 })
  })
})
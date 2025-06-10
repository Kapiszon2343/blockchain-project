// Import necessary Synpress modules
import { defineWalletSetup } from '@synthetixio/synpress'
import { MetaMask } from '@synthetixio/synpress/playwright'

// Define a test seed phrase and password
const SEED_PHRASE = 'test test test test test test test test test test test junk'
const PASSWORD = '#Kapi909'

// Define the basic wallet setup
export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  // Create a new MetaMask instance
  const metamask = new MetaMask(context, walletPage, PASSWORD)

  // Import the wallet using the seed phrase
  await metamask.importWallet(SEED_PHRASE)

  // Add Hardhat network
  await metamask.addNetwork({
    chainId: 31337, // 31337 in hex
    name: 'Hardhat',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorerUrl: '',
    symbol: 'HHT'
  })

  // Switch to Hardhat network
  await metamask.switchNetwork('Hardhat')
})
import { defineWalletSetup } from '@synthetixio/synpress';

// This function might need to be passed as a string or in a format that the library expects
export default defineWalletSetup({
  secretWordsOrPrivateKey: 'test test test test test test test test test test test junk',
  password: 'pass#word',
  network: 'http://127.0.0.1:8545'
});

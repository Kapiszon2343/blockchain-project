import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, Chain } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

const hardhatCustom: Chain = {
  id: 31337,
  name: 'Hardhat Localhost',
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://etherscan.io',
    },
  },
}

export const config = createConfig({
  chains: [mainnet, sepolia, hardhatCustom],
  connectors: [
    injected(),
    coinbaseWallet(),
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL!),
    [hardhatCustom.id]: http('http://127.0.0.1:8545'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

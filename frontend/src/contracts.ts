import artifact from '../../blockchain/artifacts/contracts/Publishing.sol/Publishing.json'

export const wagmiContractConfig = {
  31337: {
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    abi: artifact.abi,
    chainId: 31337,
  },
  11155111: {
    address: '0x60dB739D14403c929440F324dC189649Dd7051d6',
    abi: artifact.abi,
    chainId: 11155111,
  },
} as const


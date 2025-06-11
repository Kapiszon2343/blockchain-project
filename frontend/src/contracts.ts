import artifact from '../../blockchain/artifacts/contracts/Publishing.sol/Publishing.json'

export const wagmiContractConfig = {
  address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  abi: artifact.abi,
  chainId: 31337,
} as const
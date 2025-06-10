import { useEffect, useState } from 'react'
import { type BaseError, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useBlockNumber,
  useAccount,
  usePublicClient,
  } from 'wagmi'
import { config } from './wagmi'
import { getWalletClient } from '@wagmi/core'
import { wagmiContractConfig } from './contracts'
import { parseAbiItem } from 'viem'

export function Publish() {
  const { data: hash, error: errorWrite, isPending: isPendingWrite, writeContract } = useWriteContract()
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const publicClient = usePublicClient()
  const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null)
  useEffect(() => {
    async function getLogs() {
      if (!receipt) return

      if (publicClient === undefined) {
        console.log("Public client is undefined")
        return
      }
      try {
        const logs = await publicClient.getLogs({
          address: wagmiContractConfig.address,
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
          event: parseAbiItem(
            'event Publish(address owner, uint256 tokenId, string title, bytes authorPublicKey)'
          ),
        })

        if (logs.length > 0) {
          const tokenId = logs[0].args.tokenId
          if (tokenId !== undefined)
            setMintedTokenId(tokenId)
          console.log('Minted tokenId:', tokenId)
        }
      } catch (err) {
        console.error('Failed to parse logs:', err)
      }
    }

    getLogs()
  }, [receipt])

  async function callPublish(e: React.FormEvent<HTMLFormElement>) { 
    e.preventDefault() 
    const formData = new FormData(e.target as HTMLFormElement) 
    const title = formData.get('title') as string 
    const authorPublicKey = formData.get('authorPublicKey') as string 
    const authorPublicKeyHex = authorPublicKey.startsWith('0x') 
      ? authorPublicKey 
      : '0x' + authorPublicKey;

    const isValidHex = /^0x[0-9a-fA-F]+$/.test(authorPublicKey);
    if (!isValidHex) {
      alert('Invalid public key format. Must be a hex string.');
      return;
    }

    writeContract({
      ...wagmiContractConfig,
      functionName: 'publish',
      args: [title, authorPublicKeyHex],
    })
  }

  return (
    <div>

      <form onSubmit={callPublish}>
        <input 
          type="text"
          name="title" 
          placeholder="title" 
          required 
        />
        <input
          type="text"
          name="authorPublicKey"
          placeholder="0x04c5919f1f5f7a3b... (public key)"
          required
        />
        <button 
          type="submit"
          disabled={isPendingWrite}
        >
          Publish
        </button>
        
      </form>
        
      {isPendingWrite && <p>Creating new publishing, please wait for it's token</p>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {(isConfirmed && mintedTokenId === null) && <div>Publishing succesfull! Please wait for token id</div>}
      {(isConfirmed && mintedTokenId !== null) && <div>Publishing succesfull! Your token id is: {mintedTokenId.toString()}</div>}
      {errorWrite && (<div>Error: {(errorWrite as BaseError).shortMessage}</div>)}
    </div>
  )
}
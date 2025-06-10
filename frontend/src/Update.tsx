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
import { keccak256, toUtf8Bytes } from 'ethers'
import { sign } from '@noble/secp256k1'

function hashContent(content: string): string {
  const contentBytes = toUtf8Bytes(content)
  const contentHash = keccak256(contentBytes)
  return contentHash // returns a 0x-prefixed hex string
}

async function signHash(privateKey: string, hash: string): Promise<string> {
  // Remove '0x' and convert hash to Uint8Array
  const hashBytes = Uint8Array.from(Buffer.from(hash.slice(2), 'hex'))

  const signature = await sign(hashBytes, privateKey)
  return '0x' + Buffer.from(signature.toCompactRawBytes()).toString('hex')
}

export function Update() {
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

  async function callNewChapter(e: React.FormEvent<HTMLFormElement>) { 
    e.preventDefault() 
    const formData = new FormData(e.target as HTMLFormElement) 
    const tokenId = formData.get('tokenId') as string 
    const chapterId = Number(formData.get('chapterId') as string)
    const content = formData.get('content') as string 
    const authorPrivateKey = formData.get('tokenId') as string 
    const authorPrivateKeyHex = authorPrivateKey.startsWith('0x') 
      ? authorPrivateKey 
      : '0x' + authorPrivateKey;

    if (isNaN(chapterId)) {
        alert('Invalid number')
        return
    }

    const isValidHex = /^0x[0-9a-fA-F]+$/.test(authorPrivateKeyHex);
    if (!isValidHex) {
      alert('Invalid public key format. Must be a hex string.');
      return;
    }

    const hash = hashContent(content)
    const signature = signHash(authorPrivateKeyHex, hash)

    writeContract({
      ...wagmiContractConfig,
      functionName: 'publish',
      args: [tokenId, BigInt(chapterId), hash, signature],
    })
  }

  return (
    <div>

      <form onSubmit={callNewChapter}>
        <input 
          type="text"
          name="tokenId" 
          placeholder="token Id" 
          required 
        />
        <input
          type="number"
          name="chapterId"
          placeholder="chapter number"
          required
        />
        <input
          type="text"
          name="content"
          placeholder="chapter content"
          required
        />
        <input
          type="text"
          name="private key"
          placeholder="0x04c5919f1f5f7a3b... (private key)"
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
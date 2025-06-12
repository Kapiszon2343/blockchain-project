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

import * as secp from '@noble/secp256k1';
import { hexlify } from "ethers";

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
  const authorPrivateKey1 = secp.utils.randomPrivateKey();
  const authorPublicKey1 = secp.getPublicKey(authorPrivateKey1);
  console.log('authorPrivateKey1: ', hexlify(authorPrivateKey1))
  console.log('authorPublicKey1: ', hexlify(authorPublicKey1))


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
            'event NewChapter(uint256 tokenId, uint64 chapterId, bytes hash, bytes signature)'
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
    const authorPrivateKey = formData.get('privateKey') as string 
    const authorPrivateKeyHex = authorPrivateKey.startsWith('0x') 
      ? authorPrivateKey 
      : '0x' + authorPrivateKey;

    if (isNaN(chapterId)) {
        alert('Invalid number')
        return
    }

    const isValidHex = /^0x[0-9a-fA-F]+$/.test(authorPrivateKeyHex);
    if (!isValidHex) {
      alert('Invalid private key format. Must be a hex string.');
      return;
    }

    const hash = hashContent(content)
    console.log("priavte key: ", authorPrivateKeyHex)
    const signature = await signHash(authorPrivateKeyHex, hash)

    writeContract({
      ...wagmiContractConfig,
      functionName: 'update',
      args: [tokenId, BigInt(chapterId), hash, signature],
    })

    const payload = {
      tokenId: tokenId.toString(), 
      chapterId, 
      content, 
      signature
    }
    try {
      const res = await fetch('http://localhost:3001/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok) {
        console.log("Submitted chapter")
      } else {
        console.error(data.error)
      }
    } catch (err) {
      console.error(err)
    }
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
          name="privateKey"
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
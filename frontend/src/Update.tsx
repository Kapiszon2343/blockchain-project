import { type BaseError, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useAccount,
  } from 'wagmi'
import { wagmiContractConfig } from './contracts'
import { type WriteContractParameters } from 'wagmi/actions'

import { hexlify } from "ethers";

async function getTextHash(message: string): Promise<Uint8Array> {
  const { sha256 } = await import('@noble/hashes/sha256')

  const encoded = new TextEncoder().encode(message); // UTF-8 encode text
  return sha256(encoded); // SHA-256 hash
}

async function hashContent(content: string): Promise<string> {
  const hashBytes = await getTextHash(content);
  const hashString = hexlify(hashBytes);
  return hashString
}

export function Update() {
  const { data: hash, error: errorWrite, isPending: isPendingWrite, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const { chain } = useAccount ()
  const chainId = chain?.id ?? 11155111

  if (!(chainId in wagmiContractConfig)) {
    throw new Error(`No contract config for chainId ${chainId}`);
  }
  const contractConfig = wagmiContractConfig[chainId as keyof typeof wagmiContractConfig];
  if (!contractConfig) {
    throw new Error(`No contract config found for chainId ${chainId}`)
  }

  async function callNewChapter(e: React.FormEvent<HTMLFormElement>) { 
    e.preventDefault() 
    const formData = new FormData(e.target as HTMLFormElement) 
    const tokenId = formData.get('tokenId') as string 
    const chapterId = Number(formData.get('chapterId') as string)
    const content = formData.get('content') as string 

    if (isNaN(chapterId)) {
        alert('Invalid number')
        return
    }

    const hashString = await hashContent(content)

    writeContract({
      ...contractConfig,
      functionName: 'publishChapter',
      args: [tokenId, BigInt(chapterId), hashString],
    } as WriteContractParameters)

    const payload = {
      tokenId: tokenId.toString(), 
      chapterId, 
      content
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
        <button 
          type="submit"
          disabled={isPendingWrite}
        >
          Publish
        </button>
      </form>
        
      {isPendingWrite && <p>Creating new publishing, please wait for it's token</p>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {(isConfirmed) && <div>Chapter published succesfully!</div>}
      {errorWrite && (<div>Error: {(errorWrite as BaseError).shortMessage}</div>)}
    </div>
  )
}
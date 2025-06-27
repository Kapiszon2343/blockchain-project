import { useEffect, useState } from 'react'
import { type BaseError, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  usePublicClient,
  useAccount ,
  } from 'wagmi'
import { wagmiContractConfig } from './contracts'
import { parseAbiItem } from 'viem'
import { type WriteContractParameters } from 'wagmi/actions'

export function Publish() {
  const publicClient = usePublicClient()
  const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null)
  const { chain } = useAccount ()
  const chainId = chain?.id ?? 11155111

  if (!(chainId in wagmiContractConfig)) {
    throw new Error(`No contract config for chainId ${chainId}`);
  }
  const contractConfig = wagmiContractConfig[chainId as keyof typeof wagmiContractConfig];
  if (!contractConfig) {
    throw new Error(`No contract config found for chainId ${chainId}`)
  }
  const { data: hash, error: errorWrite, isPending: isPendingWrite, writeContract } = useWriteContract()
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  
  useEffect(() => {
    async function getLogs() {
      if (!receipt) return
      console.log("Got receipt")

      if (publicClient === undefined) {
        console.log("Public client is undefined")
        return
      }
      try {
        console.log("Getting logs from block:", receipt.blockNumber)
        const logs = await publicClient.getLogs({
          address: contractConfig.address,
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
          event: parseAbiItem(
            'event Publish(address owner, uint256 tokenId, string title)'
          ),
        })
        console.log("Fetched logs: ", logs);
        
        if (logs.length > 0) {
          console.log(`For logs: ${logs[0].args}`)
          const tokenId = logs[0].args.tokenId
          const title = logs[0].args.title
          if (tokenId !== undefined) {
            const payload = {
              tokenId: tokenId.toString(), 
              title, 
            }

            try {
              const res = await fetch('http://localhost:3001/publish', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              })

              const data = await res.json()
              if (res.ok) {
                setMintedTokenId(tokenId)
              } else {
                console.error(data.error)
              }
            } catch (err) {
              console.error(err)
            }

            setMintedTokenId(tokenId)
          }
          console.log('Minted tokenId:', tokenId)
        }
        else {
          console.log("Log lenght 0")
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

    console.log(contractConfig)
    writeContract({
      ...contractConfig,
      functionName: 'publish',
      args: [title],
    } as WriteContractParameters)
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
      {errorWrite && (<>
        <div>Error: {(errorWrite as BaseError).shortMessage || (errorWrite as Error).message || 'Unknown error'}</div>
        <pre>{JSON.stringify(errorWrite, null, 2)}</pre>
      </>)}
    </div>
  )
}
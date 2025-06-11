import { useEffect } from 'react'
import { type BaseError, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useBlockNumber,
  useAccount,
  } from 'wagmi'
import { config } from './wagmi'
import { getWalletClient } from '@wagmi/core'
import { wagmiContractConfig } from './contracts'

export function Calc() {
  const { data: hash, error: errorWrite, isPending: isPendingWrite, writeContract } = useWriteContract()

  const { data: currentValue, error, isPending, refetch } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'getValue',
    args: [],
  })
  const { data: blockNumber } = useBlockNumber({ watch: true })

  useEffect(() => {
    // want to refetch every `n` block instead? use the modulo operator!
    // if (blockNumber % 5 === 0) refetch() // refetch every 5 blocks
    refetch()
  }, [blockNumber])

  async function doubleValue() { 
    writeContract({
      ...wagmiContractConfig,
      functionName: 'doubleValue',
      args: [],
    })
  }

  async function fixValue() { 
    writeContract({
      ...wagmiContractConfig,
      functionName: 'fixValue',
      args: [],
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  if (isPending) return <div>Loading...</div>

  if (error)
    return (
      <div>
        Error: {('shortMessage' in error) ? error.shortMessage : 'wrong error'}
      </div>
    )

  return (
    <div>
      <h2>Current Value: <span id="currentValue">{currentValue?.toString()}</span></h2>

      <div>
        <button 
          type="button"
          onClick={() => doubleValue?.()}
          disabled={isPendingWrite}
        >
          Double Value
        </button>
        
      </div>
      <div>
        <button 
          type="button"
          onClick={() => fixValue?.()}
          disabled={isPendingWrite}
        >
          Fix Value
        </button>
        
      </div>
      {isPendingWrite && <p>Changing val...</p>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <div>Transaction confirmed.</div>}
      {errorWrite && (<div>Error: {(errorWrite as BaseError).shortMessage}</div>)}
    </div>
  )
}
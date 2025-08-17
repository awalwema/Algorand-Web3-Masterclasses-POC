// src/components/Tokenmint.tsx
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import React, { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TokenmintProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Tokenmint: React.FC<TokenmintProps> = ({ openModal, setModalState }) => {
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const [assetName, setAssetName] = useState<string>('MasterPass Token')
  const [unitName, setUnitName] = useState<string>('MPT')
  const [totalSupply, setTotalSupply] = useState<string>('1000000') // human whole tokens
  const [decimals, setDecimals] = useState<string>('0') // 0 for whole tokens
  const [loading, setLoading] = useState<boolean>(false)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig }), [algodConfig])

  const isNonEmpty = (s: string) => s.trim().length > 0
  const isNonNegInt = (s: string) => /^[0-9]+$/.test(s)

  // ASA constraints: decimals 0..19, total fits uint64 (after scaling by 10^decimals)
  const decimalsValid = isNonNegInt(decimals) && Number(decimals) <= 19
  const totalValid = isNonNegInt(totalSupply)
  const namesValid = isNonEmpty(assetName) && isNonEmpty(unitName)

  let onChainTotal: bigint | null = null
  let decimalsBig: bigint | null = null
  let rangeError = ''

  try {
    if (totalValid && decimalsValid) {
      const totalBig = BigInt(totalSupply) // human units before decimals
      decimalsBig = BigInt(decimals)
      const scale = 10n ** decimalsBig
      onChainTotal = totalBig * scale

      // uint64 max
      const UINT64_MAX = (1n << 64n) - 1n
      if (onChainTotal > UINT64_MAX) {
        rangeError = 'Total supply is too large for the selected decimals.'
      }
    }
  } catch {
    rangeError = 'Invalid numbers provided.'
  }

  const formValid = namesValid && totalValid && decimalsValid && !rangeError && !!transactionSigner && !!activeAddress

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet first.', { variant: 'warning' })
      return
    }
    if (!formValid || !onChainTotal || decimalsBig === null) {
      enqueueSnackbar('Please fix the form errors before minting.', { variant: 'warning' })
      return
    }

    try {
      setLoading(true)
      enqueueSnackbar('Preparing token creation…', { variant: 'info' })

      const createResult = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: onChainTotal,
        decimals: Number(decimalsBig),
        assetName,
        unitName,
        defaultFrozen: false,
      })

      const txId = createResult.txIds?.[0]
      enqueueSnackbar(txId ? `Token creation submitted! TxID: ${txId}` : 'Token creation submitted!', {
        variant: 'success',
      })

      // optional: reset and close
      setModalState(false)
    } catch (err) {
      console.error(err)
      enqueueSnackbar('Failed to create token. Please try again.', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="token_mint_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box" onSubmit={handleCreate}>
        <h3 className="font-bold text-lg">Create a Fungible Token (ASA)</h3>
        <p className="text-sm text-slate-600 mt-1">Define your token details and mint on Algorand TestNet.</p>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="asset-name" className="text-sm font-medium">
              Asset Name
            </label>
            <input
              id="asset-name"
              type="text"
              className="input input-bordered w-full mt-1"
              placeholder="MasterPass Token"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
            />
            {!isNonEmpty(assetName) && <span className="text-xs text-red-600">Please enter an asset name.</span>}
          </div>

          <div>
            <label htmlFor="unit-name" className="text-sm font-medium">
              Unit Name (Ticker)
            </label>
            <input
              id="unit-name"
              type="text"
              className="input input-bordered w-full mt-1"
              placeholder="MPT"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
            />
            {!isNonEmpty(unitName) && <span className="text-xs text-red-600">Please enter a unit/ticker name.</span>}
          </div>

          <div>
            <label htmlFor="total-supply" className="text-sm font-medium">
              Total Supply (whole number)
            </label>
            <input
              id="total-supply"
              type="text"
              inputMode="numeric"
              className="input input-bordered w-full mt-1"
              placeholder="1000000"
              value={totalSupply}
              onChange={(e) => setTotalSupply(e.target.value.trim())}
            />
            {!totalValid ? (
              <span className="text-xs text-red-600">Enter a non-negative whole number.</span>
            ) : (
              <span className="text-xs text-emerald-600">OK</span>
            )}
          </div>

          <div>
            <label htmlFor="decimals" className="text-sm font-medium">
              Decimals (0 for whole tokens)
            </label>
            <input
              id="decimals"
              type="text"
              inputMode="numeric"
              className="input input-bordered w-full mt-1"
              placeholder="0"
              value={decimals}
              onChange={(e) => setDecimals(e.target.value.trim())}
            />
            {!decimalsValid ? (
              <span className="text-xs text-red-600">Enter a number from 0 to 19.</span>
            ) : (
              <span className="text-xs text-emerald-600">OK</span>
            )}
          </div>

          {rangeError && <div className="text-xs text-red-600">{rangeError}</div>}

          <div className="text-xs text-slate-500">
            Tip: On-chain total = Total Supply × 10<sup>decimals</sup>
          </div>
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={() => setModalState(false)}>
            Close
          </button>
          <button
            data-test-id="mint-token"
            type="submit"
            className={`btn btn-primary ${formValid && !loading ? '' : 'btn-disabled'}`}
            title={!activeAddress ? 'Connect your wallet first' : undefined}
          >
            {loading ? <span className="loading loading-spinner" /> : 'Create Token'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default Tokenmint

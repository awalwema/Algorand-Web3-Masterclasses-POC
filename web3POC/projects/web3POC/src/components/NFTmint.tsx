// src/components/NFTmint.tsx
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { sha512_256 } from 'js-sha512'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface NFTmintProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const NFTmint: React.FC<NFTmintProps> = ({ openModal, setModalState }) => {
  const [metadataUrl, setMetadataUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  const isValidUrl = (u: string) => {
    if (!u) return false
    // Accept ipfs://… or https://… (Pinata / gateway links)
    return u.startsWith('ipfs://') || u.startsWith('https://')
  }

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet first.', { variant: 'warning' })
      return
    }

    if (!isValidUrl(metadataUrl)) {
      enqueueSnackbar('Please enter a valid metadata URL (ipfs://… or https://…).', { variant: 'warning' })
      return
    }

    try {
      setLoading(true)
      enqueueSnackbar('Preparing NFT mint transaction…', { variant: 'info' })

      // Compute 32-byte hash of the metadata URL using sha512/256
      const metadataHash = Uint8Array.from(sha512_256.array(metadataUrl))

      const createNFTResult = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: 1n,
        decimals: 0,
        assetName: 'MasterPass Ticket',
        unitName: 'MTK',
        url: metadataUrl,
        metadataHash,
        defaultFrozen: false,
      })

      // The SDK returns tx ids; many explorers accept the first one to look it up.
      const txId = createNFTResult.txIds?.[0]
      enqueueSnackbar(txId ? `NFT mint submitted! TxID: ${txId}` : 'NFT mint submitted!', { variant: 'success' })

      // Optional: clear form and close modal
      setMetadataUrl('')
      setModalState(false)
    } catch (err: unknown) {
      console.error(err)
      enqueueSnackbar('Failed to mint NFT. Please try again.', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="nft_mint_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box" onSubmit={handleMint}>
        <h3 className="font-bold text-lg">Mint your MasterPass NFT</h3>
        <p className="text-sm text-slate-600 mt-1">Paste the metadata URL you uploaded to Pinata (IPFS).</p>

        <div className="mt-4 space-y-2">
          <label htmlFor="metadata-url" className="text-sm font-medium">
            Metadata URL
          </label>
          <input
            id="metadata-url"
            data-test-id="metadata-url"
            type="url"
            inputMode="url"
            placeholder="ipfs://Qm... or https://gateway.pinata.cloud/ipfs/..."
            className="input input-bordered w-full"
            value={metadataUrl}
            onChange={(e) => setMetadataUrl(e.target.value.trim())}
          />
          {!metadataUrl ? (
            <span className="text-xs text-slate-500">
              Example: <code>ipfs://bafybeigdyr…</code>
            </span>
          ) : !isValidUrl(metadataUrl) ? (
            <span className="text-xs text-red-600">Enter a valid IPFS or HTTPS URL.</span>
          ) : (
            <span className="text-xs text-emerald-600">Looks good. Ready to mint.</span>
          )}
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={() => setModalState(false)}>
            Close
          </button>
          <button data-test-id="mint-nft" type="submit" className={`btn ${isValidUrl(metadataUrl) && !loading ? '' : 'btn-disabled'}`}>
            {loading ? <span className="loading loading-spinner" /> : 'Mint NFT'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default NFTmint

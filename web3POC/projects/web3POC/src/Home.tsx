// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'

// Modals (already implemented in your project)
import ConnectWallet from './components/ConnectWallet'
import NFTmint from './components/NFTmint'
import Tokenmint from './components/Tokenmint' // ✅ NEW
import Transact from './components/Transact'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  // Modal state
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openTransactModal, setOpenTransactModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false) // ✅ NEW

  // Wallet
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => setOpenWalletModal((v) => !v)
  const toggleTransactModal = () => setOpenTransactModal((v) => !v)
  const toggleMintModal = () => setOpenMintModal((v) => !v)
  const toggleTokenModal = () => setOpenTokenModal((v) => !v) // ✅ NEW

  const shortAddr = (addr?: string) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-400 via-indigo-400 to-teal-300 flex items-center justify-center p-6">
      <main className="w-full max-w-3xl">
        <section className="rounded-3xl bg-white/90 backdrop-blur shadow-xl ring-1 ring-black/5 px-6 py-8 md:px-10 md:py-12 text-center">
          {/* Badge */}
          <div className="mx-auto mb-6 h-14 w-14 rounded-full bg-indigo-100 grid place-items-center text-2xl">🎟️</div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Welcome to MasterPass <span className="align-middle">🎟️</span>
          </h1>

          {/* Subheading */}
          <p className="mt-4 text-slate-700">Your ticket to join the next-gen Web3 event. Connect, explore, and get inspired!</p>

          {/* Connected hint */}
          <div className="mt-3 text-sm text-slate-500">
            {activeAddress ? (
              <span className="inline-flex items-center gap-2">
                <span className="badge badge-success badge-sm" aria-hidden />
                Wallet connected: <span className="font-mono">{shortAddr(activeAddress)}</span>
              </span>
            ) : (
              <span>Tip: connect your wallet to enable payments and minting.</span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Connect Wallet */}
            <button onClick={toggleWalletModal} className="btn btn-primary w-full" data-test-id="connect-wallet">
              Connect Wallet
            </button>

            {/* Only show these after wallet connection */}
            {activeAddress && (
              <>
                {/* Send Payment (opens Transact modal) */}
                <button onClick={toggleTransactModal} className="btn w-full" data-test-id="open-transaction-modal">
                  Send Payment (1 ALGO)
                </button>

                {/* Mint NFT (opens NFTmint modal) */}
                <button onClick={toggleMintModal} className="btn btn-accent w-full" data-test-id="open-mint-modal">
                  Mint MasterPass NFT
                </button>

                {/* ✅ Create Token (ASA) (opens Tokenmint modal) */}
                <button onClick={toggleTokenModal} className="btn btn-outline w-full" data-test-id="open-token-modal">
                  Create Token (ASA)
                </button>
              </>
            )}
          </div>
        </section>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/90">Made with ❤️ for the MasterPass event</p>
      </main>
      {/* Modals */}
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <Transact openModal={openTransactModal} setModalState={setOpenTransactModal} />
      <NFTmint openModal={openMintModal} setModalState={setOpenMintModal} />
      <Tokenmint openModal={openTokenModal} setModalState={setOpenTokenModal} /> {/* ✅ NEW */}
    </div>
  )
}

export default Home

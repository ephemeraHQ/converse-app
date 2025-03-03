import { memo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { WalletChooseName } from "@/features/wallets/connect-wallet/components/wallet-choose-name.component"
import { IWallet } from "@/features/wallets/connect-wallet/connect-wallet.types"
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { ConnectWalletLoadingContent } from "../connect-wallet.ui"
import { WalletLinkInbox } from "./wallet-link-inbox.component"
import { WalletRotateInbox } from "./wallet-rotate-inbox.component"

type IWalletConnectedProps = {
  activeWallet: IWallet
}

export const WalletConnected = memo(function WalletConnected(
  props: IWalletConnectedProps,
) {
  const { activeWallet } = props

  // Get the wallet address
  const walletAddress = activeWallet.getAccount()?.address!

  const currentSender = useSafeCurrentSender()

  // Check if the wallet is already linked to an inbox
  const { data: activeWalletInboxId, isLoading: isLoadingInboxId } =
    useXmtpInboxIdFromEthAddressQuery({
      clientEthAddress: currentSender.ethereumAddress,
      targetEthAddress: walletAddress,
    })

  const currentSenderInboxId = currentSender.inboxId

  if (isLoadingInboxId) {
    return <ConnectWalletLoadingContent />
  }

  // If the wallet is not linked to an inbox, link it to the current inbox
  if (!activeWalletInboxId) {
    return <WalletLinkInbox activeWallet={activeWallet} />
  }

  // If the wallet is already linked to the current inbox, show names
  if (activeWalletInboxId === currentSenderInboxId) {
    return <WalletChooseName ethAddress={walletAddress} />
  }

  // If the wallet is already linked to an inbox, rotate it to the current inbox
  return <WalletRotateInbox activeWallet={activeWallet} />
})

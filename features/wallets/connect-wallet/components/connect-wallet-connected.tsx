import { memo, useEffect } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ConnectWalletChooseName } from "@/features/wallets/connect-wallet/components/connect-wallet-choose-name"
import { useConnectWalletContext } from "@/features/wallets/connect-wallet/connect-wallet.context"
import { useConnectWalletStore } from "@/features/wallets/connect-wallet/connect-wallet.store"
import { IWallet } from "@/features/wallets/connect-wallet/connect-wallet.types"
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { useRouter } from "@/navigation/use-navigation"
import { IEthereumAddress } from "@/utils/evm/address"
import { ConnectWalletErrorContent, ConnectWalletLoadingContent } from "../connect-wallet.ui"
import { ConnectWalletLinkToInbox } from "./connect-wallet-link-to-inbox"
import { ConnectWalletRotateInbox } from "./connect-wallet-rotate-inbox"

type IWalletConnectedProps = {
  activeWallet: IWallet
}

export const WalletConnected = memo(function WalletConnected(props: IWalletConnectedProps) {
  const { activeWallet } = props

  const router = useRouter()

  const walletAddress = activeWallet.getAccount()?.address as IEthereumAddress

  const selectedInfo = useConnectWalletStore((state) => state.selectedInfo)

  const { onSelectInfo } = useConnectWalletContext()

  const currentSender = useSafeCurrentSender()

  // Check if the wallet is already linked to an inbox
  const { data: activeWalletInboxId, isLoading: isLoadingInboxId } =
    useXmtpInboxIdFromEthAddressQuery({
      clientInboxId: currentSender.inboxId,
      targetEthAddress: walletAddress,
    })

  useEffect(() => {
    // When the wallet has been linked to the current inbox and we have a selected name, we can exit!
    if (activeWalletInboxId === currentSender.inboxId && selectedInfo) {
      onSelectInfo(selectedInfo)
      router.goBack()
    }
  }, [activeWalletInboxId, currentSender.inboxId, onSelectInfo, router, selectedInfo])

  if (!walletAddress) {
    return <ConnectWalletErrorContent onPressCancel={router.goBack} />
  }

  if (!selectedInfo) {
    return <ConnectWalletChooseName ethAddress={walletAddress} />
  }

  if (isLoadingInboxId) {
    return <ConnectWalletLoadingContent />
  }

  // If the wallet is not linked to an inbox, link it to the current inbox
  if (!activeWalletInboxId) {
    return <ConnectWalletLinkToInbox activeWallet={activeWallet} />
  }

  // If the wallet is already linked to the current inbox
  if (activeWalletInboxId === currentSender.inboxId) {
    return null
    // return <ConnectWalletChooseName ethAddress={walletAddress} />
  }

  // If the wallet is already linked to an inbox, rotate it to the current inbox
  return <ConnectWalletRotateInbox activeWallet={activeWallet} />
})

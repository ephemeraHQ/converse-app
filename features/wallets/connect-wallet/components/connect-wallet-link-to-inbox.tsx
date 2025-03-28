import { memo, useCallback } from "react"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IWallet } from "@/features/wallets/connect-wallet/connect-wallet.types"
import { supportedWallets } from "@/features/wallets/supported-wallets"
import { addWalletToInboxId } from "@/features/xmtp/xmtp-inbox-id/add-wallet-to-inbox-id"
import { invalidateXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { getXmtpSigner } from "@/features/xmtp/xmtp-signer/get-xmtp-signer"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureError, captureErrorWithToast } from "@/utils/capture-error"
import { ConnectWalletError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"
import { shortAddress } from "@/utils/strings/shortAddress"
import {
  ConnectWalletErrorContent,
  ConnectWalletHeader,
  ConnectWalletItem,
  ConnectWalletLayout,
  ConnectWalletLinkButton,
  ConnectWalletPrimaryButton,
  ConnectWalletTextSection,
} from "../connect-wallet.ui"

type IConnectWalletLinkToInboxProps = {
  activeWallet: IWallet
}

export const ConnectWalletLinkToInbox = memo(function ConnectWalletLinkToInbox(
  props: IConnectWalletLinkToInboxProps,
) {
  const { activeWallet } = props
  const { theme } = useAppTheme()
  const router = useRouter()

  const walletEthAddress = activeWallet?.getAccount()?.address

  const handleLinkToCurrentInbox = useCallback(async () => {
    try {
      const walletAccount = activeWallet.getAccount()

      if (!walletAccount) {
        throw new Error("Wallet account not found")
      }

      const chainId = activeWallet.getChain()?.id

      if (!chainId) {
        throw new Error("Chain ID not found")
      }

      const xmtpSigner = getXmtpSigner({
        ethAddress: walletAccount.address,
        type: "EOA",
        chainId,
        signMessage: async (message: string) => walletAccount?.signMessage({ message }),
      })

      const currentSender = getSafeCurrentSender()

      await addWalletToInboxId({
        inboxId: currentSender.inboxId,
        wallet: xmtpSigner,
      })

      invalidateXmtpInboxIdFromEthAddressQuery({
        clientInboxId: currentSender.inboxId,
        targetEthAddress: walletAccount.address as IEthereumAddress,
      }).catch(captureError)
    } catch (error) {
      captureErrorWithToast(
        new ConnectWalletError({ error, additionalMessage: "Error linking wallet to inbox" }),
      )
    }
  }, [activeWallet])

  const supportedWallet = supportedWallets.find((wallet) => wallet.thirdwebId === activeWallet?.id)

  if (!walletEthAddress) {
    return <ConnectWalletErrorContent onPressCancel={router.goBack} />
  }

  return (
    <ConnectWalletLayout
      header={<ConnectWalletHeader title="Sign to confirm" />}
      text={
        <ConnectWalletTextSection secondaryText="By signing in your wallet app, you’re proving that you own this wallet." />
      }
      content={
        <ConnectWalletItem
          imageSource={supportedWallet?.imageLocalUri}
          helperText="Connected"
          name={shortAddress(walletEthAddress)}
        />
      }
      buttons={
        <>
          <ConnectWalletPrimaryButton
            text={`Sign in ${supportedWallet?.name}`}
            onPress={handleLinkToCurrentInbox}
          />
          <ConnectWalletLinkButton text="Cancel" onPress={router.goBack} />
        </>
      }
    />
  )
})

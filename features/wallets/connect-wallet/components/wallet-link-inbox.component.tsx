import { memo, useCallback } from "react"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query"
import { IWallet } from "@/features/wallets/connect-wallet/connect-wallet.types"
import { supportedWallets } from "@/features/wallets/supported-wallets"
import { createXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { addWalletToInboxId } from "@/features/xmtp/xmtp-inbox-id/add-wallet-to-inbox-id"
import { getXmtpSigner } from "@/features/xmtp/xmtp-signer/get-xmtp-signer"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
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

type IWalletLinkInboxProps = {
  activeWallet: IWallet
}

export const WalletLinkInbox = memo(function WalletLinkInbox(
  props: IWalletLinkInboxProps,
) {
  const { activeWallet } = props
  const { theme } = useAppTheme()
  const router = useRouter()

  const walletEthAddress = activeWallet.getAccount()?.address

  // Handle linking the wallet to the current inbox
  const handleLinkToCurrentInbox = useCallback(async () => {
    try {
      const walletAccount = activeWallet.getAccount()!

      // Get the XMTP signer from the wallet
      const xmtpSigner = await getXmtpSigner({
        ethAddress: walletAccount.address,
        type: "EOA",
        chainId: activeWallet.getChain()?.id!,
        signMessage: (message: string) =>
          walletAccount.signMessage({ message }),
      })

      // Get the current sender
      const currentSender = getSafeCurrentSender()

      // Add the wallet to the inbox ID
      await addWalletToInboxId({
        inboxId: currentSender.inboxId,
        wallet: xmtpSigner,
      })
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error linking wallet to inbox",
      })
    }
  }, [activeWallet])

  const supportedWallet = supportedWallets.find(
    (wallet) => wallet.thirdwebId === activeWallet.id,
  )

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

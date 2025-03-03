import { useSmartWallets } from "@privy-io/expo/smart-wallets"
import { memo, useCallback } from "react"
import { Avatar } from "@/components/avatar"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { createXmtpSignerFromPrivySwc } from "@/features/onboarding/utils/create-xmtp-signer-from-privy-swc"
import { IWallet } from "@/features/wallets/connect-wallet/connect-wallet.types"
import { createXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { addWalletToInboxId } from "@/features/xmtp/xmtp-inbox-id/add-wallet-to-inbox-id"
import { invalidateXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import {
  ConnectWalletHeader,
  ConnectWalletLayout,
  ConnectWalletOutlineButton,
  ConnectWalletPrimaryButton,
  ConnectWalletTextSection,
} from "../connect-wallet.ui"

type IWalletRotateInboxProps = {
  activeWallet: IWallet
}

export const WalletRotateInbox = memo(function WalletRotateInbox(
  props: IWalletRotateInboxProps,
) {
  const { activeWallet } = props
  const { theme } = useAppTheme()
  const router = useRouter()
  const { createSmartWallet } = useSmartWallets()

  // Get the current sender from the multi-inbox store
  const currentSender = useSafeCurrentSender()

  // Handle creating a new inbox ID
  const handleCreateNewInboxId = useCallback(async () => {
    try {
      if (!activeWallet || !currentSender) {
        return
      }

      const walletAddress = activeWallet.getAccount()?.address

      if (!walletAddress) {
        throw new GenericError({
          error: new Error("No wallet address found"),
          additionalMessage: "No wallet address found",
        })
      }

      // Create a smart wallet
      const smartWallet = await createSmartWallet({
        name: "Convos",
      })

      // Get the XMTP signer from the smart wallet
      const xmtpSigner = await createXmtpSignerFromPrivySwc({
        smartWallet,
      })

      // Create an XMTP client with the signer
      const xmtpClient = await createXmtpClient({
        inboxSigner: xmtpSigner,
      })

      // Add the wallet to the inbox ID
      await addWalletToInboxId({
        inboxId: currentSender.inboxId,
        wallet: xmtpSigner,
        xmtpClient,
      })

      // Invalidate the inbox ID query to refresh the data
      invalidateXmtpInboxIdFromEthAddressQuery({
        clientEthAddress: walletAddress,
        targetEthAddress: walletAddress,
      })

      // Close the bottom sheet
      router.goBack()
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error creating new inbox ID",
      })
    }
  }, [activeWallet, createSmartWallet, currentSender, router])

  return (
    <ConnectWalletLayout
      header={
        <ConnectWalletHeader title="Wallet connected" onClose={router.goBack} />
      }
      text={
        <ConnectWalletTextSection
          text="Create a new inbox ID with this wallet"
          secondaryText="This will create a new inbox ID that you can use to send and receive messages."
        />
      }
      content={
        <VStack
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Avatar
            address={activeWallet.getAccount()?.address || ""}
            size="xl"
          />
        </VStack>
      }
      buttons={
        <>
          <ConnectWalletPrimaryButton
            text="Create new inbox ID"
            onPress={handleCreateNewInboxId}
          />
          <ConnectWalletOutlineButton onPress={router.goBack} />
        </>
      }
    />
  )
})

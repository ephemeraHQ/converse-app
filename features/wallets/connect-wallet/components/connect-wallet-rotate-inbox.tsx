import { useSmartWallets } from "@privy-io/expo/smart-wallets"
import { memo, useCallback } from "react"
import { Text } from "@/design-system/Text"
import {
  getSafeCurrentSender,
  useMultiInboxStore,
} from "@/features/authentication/multi-inbox.store"
import { createXmtpSignerFromPrivySwc } from "@/features/onboarding/utils/create-xmtp-signer-from-privy-swc"
import { IWallet } from "@/features/wallets/connect-wallet/connect-wallet.types"
import { createXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { getXmtpSigner } from "@/features/xmtp/xmtp-signer/get-xmtp-signer"
import { usePersistState } from "@/hooks/use-persist-state"
import { useRouter } from "@/navigation/use-navigation"
import { captureErrorWithToast } from "@/utils/capture-error"
import { shortAddress } from "@/utils/strings/shortAddress"
import {
  ConnectWalletHeader,
  ConnectWalletLayout,
  ConnectWalletLinkButton,
  ConnectWalletLoadingContent,
  ConnectWalletOutlineButton,
  ConnectWalletPrimaryButton,
  ConnectWalletTextSection,
} from "../connect-wallet.ui"

type IConnectWalletRotateInboxProps = {
  activeWallet: IWallet
}

export const ConnectWalletRotateInbox = memo(function ConnectWalletRotateInbox(
  props: IConnectWalletRotateInboxProps,
) {
  const { activeWallet } = props

  const router = useRouter()
  const { client: smartWalletClient } = useSmartWallets()

  const smartWalletClientEthAddress = smartWalletClient?.account.address

  // Track if this smart wallet has already been rotated to a different inbox
  // We only allow rotating a smart wallet's inbox once to prevent address hopping
  // between multiple EOA inboxes which could cause confusion and security issues
  const {
    value: hasRotatedWalletAddress,
    setValue: setHasRotatedWalletAddress,
    isLoaded: isHasRotatedWalletAddressLoaded,
  } = usePersistState(`has-rotated-wallet-${smartWalletClientEthAddress}`)

  // Handle creating a new inbox ID
  const handleCreateNewInboxId = useCallback(async () => {
    try {
      if (!smartWalletClient) {
        throw new Error("No smart wallet client found")
      }

      const currentSender = getSafeCurrentSender()

      const activeWalletAccount = activeWallet.getAccount()!
      const activeWalletEthAddress = activeWalletAccount.address

      // Create a new XMTP client with the EOA
      const newXmtpClient = await createXmtpClient({
        inboxSigner: getXmtpSigner({
          ethAddress: activeWalletEthAddress,
          type: "EOA",
          chainId: activeWallet.getChain()?.id!,
          signMessage: (message: string) => activeWalletAccount.signMessage({ message }),
        }),
      })

      // Add the privy SWC to the new client inbox
      await newXmtpClient.addAccount(createXmtpSignerFromPrivySwc(smartWalletClient), true)

      // Set the new inbox ID as the current sender
      useMultiInboxStore.getState().actions.setCurrentSender({
        inboxId: newXmtpClient.inboxId,
        ethereumAddress: activeWalletEthAddress,
      })

      // Remove the previous sender since it's no longer valid
      useMultiInboxStore.getState().actions.removeSender(currentSender)

      setHasRotatedWalletAddress("true")
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error creating new inbox ID",
      })
    }
  }, [activeWallet, smartWalletClient, setHasRotatedWalletAddress])

  if (!isHasRotatedWalletAddressLoaded) {
    return <ConnectWalletLoadingContent />
  }

  if (hasRotatedWalletAddress === "true") {
    return (
      <ConnectWalletLayout
        header={<ConnectWalletHeader title="Inbox already rotated" />}
        text={
          <ConnectWalletTextSection
            text="Each wallet can only be rotated to a new inbox once. This wallet has already been rotated."
            secondaryText="Contact support if you believe this is incorrect."
          />
        }
        content={
          <Text preset="small" color="secondary">
            {shortAddress(activeWallet.getAccount()?.address ?? "")}
          </Text>
        }
        buttons={<ConnectWalletOutlineButton text="Cancel" onPress={router.goBack} />}
      />
    )
  }

  return (
    <ConnectWalletLayout
      header={<ConnectWalletHeader title="Address in use" />}
      text={
        <ConnectWalletTextSection text="This wallet address is already delivering messages to a different inbox." />
      }
      content={
        <Text preset="small" color="secondary">
          {shortAddress(activeWallet.getAccount()?.address ?? "")}
        </Text>
      }
      buttons={
        <>
          <ConnectWalletPrimaryButton text="Use this address" onPress={handleCreateNewInboxId} />
          <ConnectWalletLinkButton text="Cancel" onPress={router.goBack} />
        </>
      }
    />
  )
})

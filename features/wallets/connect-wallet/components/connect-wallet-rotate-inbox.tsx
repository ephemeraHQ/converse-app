import { memo, useCallback } from "react"
import { Text } from "@/design-system/Text"
import {
  getSafeCurrentSender,
  useMultiInboxStore,
} from "@/features/authentication/multi-inbox.store"
import { IWallet } from "@/features/wallets/connect-wallet/connect-wallet.types"
import { useSmartWalletClient } from "@/features/wallets/smart-wallet"
import { createXmtpSignerFromSwc } from "@/features/wallets/utils/create-xmtp-signer-from-swc"
import { createXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client"
import { getXmtpSigner } from "@/features/xmtp/xmtp-signer/get-xmtp-signer"
import { usePersistState } from "@/hooks/use-persist-state"
import { getCurrentRoute } from "@/navigation/navigation.utils"
import { useRouter } from "@/navigation/use-navigation"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"
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
  const { smartWalletClient } = useSmartWalletClient()
  const currentRoute = getCurrentRoute()

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

      const previousCurrentSender = getSafeCurrentSender()

      const activeWalletAccount = activeWallet.getAccount()!
      const activeWalletEthAddress = activeWalletAccount.address as IEthereumAddress

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
      await newXmtpClient.addAccount(createXmtpSignerFromSwc(smartWalletClient), true)

      // Set the new inbox ID as the current sender
      useMultiInboxStore.getState().actions.setCurrentSender({
        inboxId: newXmtpClient.inboxId,
        ethereumAddress: activeWalletEthAddress,
      })

      // Remove the previous sender since it's no longer valid
      useMultiInboxStore.getState().actions.removeSender(previousCurrentSender)

      setHasRotatedWalletAddress("true")
    } catch (error) {
      captureErrorWithToast(
        new GenericError({ error, additionalMessage: "Error creating new inbox ID" }),
      )
    }
  }, [activeWallet, smartWalletClient, setHasRotatedWalletAddress])

  if (!isHasRotatedWalletAddressLoaded) {
    return <ConnectWalletLoadingContent />
  }

  // Only show rotate inbox error in the onboarding flow
  if (
    hasRotatedWalletAddress === "true" &&
    currentRoute?.name === "OnboardingCreateContactCardImportName"
  ) {
    return (
      <ConnectWalletLayout
        header={<ConnectWalletHeader title="Cannot rotate inbox again" />}
        text={
          <ConnectWalletTextSection
            text="This smart contract wallet has already been rotated once to connect with an existing inbox. For security reasons, each wallet can only be rotated once."
            secondaryText="Please use a different wallet. Later we'll support adding multiple inboxes to the same account."
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

  // Temporary until we have multi-inbox support
  if (currentRoute?.name === "ProfileImportInfo") {
    return (
      <ConnectWalletLayout
        header={<ConnectWalletHeader title="Address in use" />}
        text={
          <ConnectWalletTextSection
            text="This wallet address is already delivering messages to a different inbox."
            secondaryText="Coming soon, you'll be able to add it as an additional inbox."
          />
        }
        content={
          <Text preset="small" color="secondary">
            {shortAddress(activeWallet.getAccount()?.address ?? "")}
          </Text>
        }
        buttons={
          <>
            <ConnectWalletOutlineButton text="Cancel" onPress={router.goBack} />
          </>
        }
      />
    )
  }

  return (
    <ConnectWalletLayout
      header={<ConnectWalletHeader title="Existing XMTP inbox detected" />}
      text={
        <ConnectWalletTextSection
          text="This wallet address is already linked to an existing XMTP inbox."
          secondaryText="Would you like to use this existing inbox instead of creating a new one?"
        />
      }
      content={
        <Text preset="small" color="secondary">
          {shortAddress(activeWallet.getAccount()?.address ?? "")}
        </Text>
      }
      buttons={
        <>
          <ConnectWalletPrimaryButton text="Use existing inbox" onPress={handleCreateNewInboxId} />
          <ConnectWalletLinkButton text="Cancel" onPress={router.goBack} />
        </>
      }
    />
  )
})

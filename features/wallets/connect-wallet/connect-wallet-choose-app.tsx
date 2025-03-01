import { useSmartWallets } from "@privy-io/expo/smart-wallets"
import React, { memo, useCallback } from "react"
import { useActiveWallet, useConnect, useDisconnect } from "thirdweb/react"
import { createWallet as createWalletThirdweb } from "thirdweb/wallets"
import { Avatar } from "@/components/avatar"
import { Loader } from "@/design-system/loader"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import {
  getSafeCurrentSender,
  useSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store"
import { useOnboardingContactCardStore } from "@/features/onboarding/screens/onboarding-contact-card-screen"
import { createXmtpSignerFromPrivySwc } from "@/features/onboarding/utils/create-xmtp-signer-from-privy-swc"
import { useSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query"
import { supportedSocialProfiles } from "@/features/social-profiles/supported-social-profiles"
import { IWallet } from "@/features/wallets/connect-wallet/connect-wallet.types"
import { useInstalledWalletsQuery } from "@/features/wallets/installed-wallets.query"
import {
  ISupportedWallet,
  supportedWallets,
} from "@/features/wallets/supported-wallets"
import { createXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { addWalletToInboxId } from "@/features/xmtp/xmtp-inbox-id/add-wallet-to-inbox-id"
import {
  invalidateXmtpInboxIdFromEthAddressQuery,
  useXmtpInboxIdFromEthAddressQuery,
} from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { getXmtpSigner } from "@/features/xmtp/xmtp-signer/get-xmtp-signer"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { openLink } from "@/utils/linking"
import logger from "@/utils/logger"
import { shortAddress } from "@/utils/strings/shortAddress"
import { thirdwebClient } from "@/utils/thirdweb"
import { connectWallet } from "./connect-wallet.service"
import { useConnectWalletStore } from "./connect-wallet.store"
import {
  ConnectWalletButtonContainer,
  ConnectWalletCancelLinkButton,
  ConnectWalletCancelOutlineButton,
  ConnectWalletContentContainer,
  ConnectWalletHeader,
  ConnectWalletItem,
  ConnectWalletLayout,
  ConnectWalletLoadingContent,
  ConnectWalletPrimaryButton,
  ConnectWalletTextSection,
} from "./connect-wallet.ui"

function useConnectWallet() {
  const {
    connect: thirdwebConnect,
    error: thirdwebConnectError,
    isConnecting: thirdwebConnectIsConnecting,
  } = useConnect()

  const connectWallet = async (wallet: ISupportedWallet) => {
    logger.debug(
      `[ConnectWalletBottomSheet] Handling connect wallet tapped for ${wallet.thirdwebId}`,
    )

    try {
      return thirdwebConnect(async () => {
        try {
          // Create the wallet first - this is what thirdweb expects to be returned
          const thirdwebWallet = createWalletThirdweb(wallet.thirdwebId, {
            mobileConfig: wallet.mobileConfig,
          })

          // Connect wallet to thirdweb client
          logger.debug(
            `[ConnectWalletBottomSheet] Connecting wallet to thirdweb client`,
          )

          await thirdwebWallet.connect({
            client: thirdwebClient,
          })

          return thirdwebWallet
        } catch (error) {
          throw new GenericError({
            error,
            additionalMessage: `Failed to connect wallet: ${wallet.thirdwebId}`,
          })
        }
      })
    } catch (error) {
      captureErrorWithToast(error, {
        message: `Error connecting ${wallet.name} wallet`,
      })
    }
  }

  return {
    connectWallet,
    isConnecting: thirdwebConnectIsConnecting,
    error: thirdwebConnectError,
  }
}

const InstalledWalletItem = memo(function InstalledWalletItem(props: {
  wallet: ISupportedWallet
}) {
  const { wallet } = props
  const { theme } = useAppTheme()

  // Handle wallet connection
  const handleConnectWallet = useCallback(async () => {
    await connectWallet(wallet)
  }, [wallet])

  return (
    <ConnectWalletItem
      name={wallet.name}
      imageSource={wallet.imageLocalUri}
      onPress={handleConnectWallet}
    />
  )
})

/**
 * Main component for choosing and connecting a wallet
 *
 * This component handles the wallet selection and connection flow.
 */
export const ConnectWalletChooseApp = memo(function ConnectWalletChooseApp() {
  const { theme } = useAppTheme()
  const router = useRouter()

  // Get wallet data from queries and store
  const { data: installedWallets = [] } = useInstalledWalletsQuery()
  const activeWallet = useActiveWallet()
  const isConnecting = useConnectWalletStore((state) => state.isConnecting)

  // Determine what to render based on connection state
  if (isConnecting) {
    return <ConnectWalletLoadingContent />
  }

  if (activeWallet) {
    return <ConnectWalletConnected activeWallet={activeWallet} />
  }

  // Render the wallet selection UI
  const renderHeader = () => (
    <ConnectWalletHeader title="Connect a wallet" onClose={router.goBack} />
  )

  const renderText = () => (
    <ConnectWalletTextSection
      text="Connect a wallet to import your onchain identity."
      secondaryText="This will let you use your ENS name, Base name, or other onchain identity in the app."
    />
  )

  const renderContent = () => (
    <VStack>
      {installedWallets.length > 0 && (
        <VStack>
          {installedWallets.map((wallet) => (
            <InstalledWalletItem key={wallet.thirdwebId} wallet={wallet} />
          ))}
        </VStack>
      )}

      <VStack>
        {supportedWallets
          .filter(
            (wallet) =>
              !installedWallets.some((w) => w.thirdwebId === wallet.thirdwebId),
          )
          .map((wallet) => (
            <ConnectWalletItem
              key={wallet.thirdwebId}
              name={wallet.name}
              imageSource={wallet.imageLocalUri}
              helperText="Not installed"
              endElement={
                <ConnectWalletPrimaryButton
                  text="Install"
                  onPress={() => openLink({ url: wallet.storeUrl })}
                />
              }
            />
          ))}
      </VStack>
    </VStack>
  )

  const renderButtons = () => (
    <ConnectWalletCancelOutlineButton onPress={router.goBack} />
  )

  return (
    <ConnectWalletLayout
      header={renderHeader()}
      text={renderText()}
      content={renderContent()}
      buttons={renderButtons()}
    />
  )
})

/**
 * Component displayed when a wallet is connected
 *
 * This component handles the UI and logic for a connected wallet,
 * including options to link to an inbox or rotate the inbox ID.
 */
const ConnectWalletConnected = memo(function ConnectWalletConnected(props: {
  activeWallet: IWallet
}) {
  const { activeWallet } = props
  const { theme } = useAppTheme()
  const router = useRouter()

  // Get the wallet address
  const walletAddress = activeWallet.getAccount()?.address

  // Check if the wallet is already linked to an inbox
  const { data: inboxIdData, isLoading: isLoadingInboxId } =
    useXmtpInboxIdFromEthAddressQuery({
      clientEthAddress: walletAddress,
      targetEthAddress: walletAddress,
    })

  // Determine what to render based on the inbox ID status
  if (isLoadingInboxId) {
    return <ConnectWalletLoadingContent />
  }

  if (inboxIdData?.inboxId) {
    return <ConnectWalletLinkToCurrentInbox activeWallet={activeWallet} />
  }

  return <ConnectWalletRotateInboxId activeWallet={activeWallet} />
})

/**
 * Component for rotating the inbox ID
 *
 * This component handles the UI and logic for creating a new inbox ID
 * with the connected wallet.
 */
function ConnectWalletRotateInboxId(props: { activeWallet: IWallet }) {
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
        signer: xmtpSigner,
      })

      // Add the wallet to the inbox ID
      await addWalletToInboxId({
        inboxId: currentSender.inboxId,
        ethAddress: walletAddress,
        xmtpClient,
      })

      // Invalidate the inbox ID query to refresh the data
      invalidateXmtpInboxIdFromEthAddressQuery({
        ethAddress: walletAddress,
      })

      // Close the bottom sheet
      router.goBack()
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error creating new inbox ID",
      })
    }
  }, [activeWallet, createSmartWallet, currentSender, router])

  // Render the UI
  const renderHeader = () => (
    <ConnectWalletHeader title="Wallet connected" onClose={router.goBack} />
  )

  const renderText = () => (
    <ConnectWalletTextSection
      text="Create a new inbox ID with this wallet"
      secondaryText="This will create a new inbox ID that you can use to send and receive messages."
    />
  )

  const renderContent = () => (
    <VStack
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Avatar size="xl" address={activeWallet.getAccount()?.address || ""} />
    </VStack>
  )

  const renderButtons = () => (
    <>
      <ConnectWalletPrimaryButton
        text="Create new inbox ID"
        onPress={handleCreateNewInboxId}
      />
      <ConnectWalletCancelOutlineButton onPress={router.goBack} />
    </>
  )

  return (
    <ConnectWalletLayout
      header={renderHeader()}
      text={renderText()}
      content={renderContent()}
      buttons={renderButtons()}
    />
  )
}

/**
 * Component for linking a wallet to the current inbox
 *
 * This component handles the UI and logic for linking a connected wallet
 * to the current inbox.
 */
function ConnectWalletLinkToCurrentInbox(props: { activeWallet: IWallet }) {
  const { activeWallet } = props
  const { theme } = useAppTheme()
  const router = useRouter()

  // Get the wallet address
  const walletAddress = activeWallet.getAccount()?.address

  // Get social profiles for the wallet address
  const { data: socialProfiles } = useSocialProfilesForAddressQuery({
    ethAddress: walletAddress || "",
  })

  // Handle linking the wallet to the current inbox
  const handleLinkToCurrentInbox = useCallback(async () => {
    try {
      if (!activeWallet) {
        return
      }

      const walletAddress = activeWallet.getAccount()?.address

      if (!walletAddress) {
        throw new GenericError({
          additionalMessage: "No wallet address found",
        })
      }

      // Get the XMTP signer from the wallet
      const xmtpSigner = await getXmtpSigner({
        wallet: activeWallet,
      })

      // Create an XMTP client with the signer
      const xmtpClient = await createXmtpClient({
        signer: xmtpSigner,
      })

      // Get the current sender
      const currentSender = getSafeCurrentSender()

      // Add the wallet to the inbox ID
      await addWalletToInboxId({
        inboxId: currentSender.inboxId,
        ethAddress: walletAddress,
        xmtpClient,
      })

      // Close the bottom sheet
      router.goBack()
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error linking wallet to inbox",
      })
    }
  }, [activeWallet, router])

  // Render the UI
  const renderHeader = () => (
    <ConnectWalletHeader title="Wallet connected" onClose={router.goBack} />
  )

  const renderText = () => (
    <ConnectWalletTextSection
      text="Link this wallet to your current inbox"
      secondaryText="This will allow you to use your onchain identity in the app."
    />
  )

  const renderContent = () => (
    <VStack
      style={{
        alignItems: "center",
        justifyContent: "center",
        rowGap: theme.spacing.sm,
      }}
    >
      <Avatar size="xl" address={walletAddress || ""} />

      {socialProfiles && socialProfiles.length > 0 && (
        <VStack
          style={{
            alignItems: "center",
            rowGap: theme.spacing.xxs,
          }}
        >
          {socialProfiles.map((profile) => (
            <Text key={profile.id}>
              {profile.username || shortAddress(profile.address)}
            </Text>
          ))}
        </VStack>
      )}
    </VStack>
  )

  const renderButtons = () => (
    <>
      <ConnectWalletPrimaryButton
        text="Link to current inbox"
        onPress={handleLinkToCurrentInbox}
      />
      <ConnectWalletCancelOutlineButton onPress={router.goBack} />
    </>
  )

  return (
    <ConnectWalletLayout
      header={renderHeader()}
      text={renderText()}
      content={renderContent()}
      buttons={renderButtons()}
    />
  )
}

export const ConnectWalletChooseName = memo(
  function ConnectWalletChooseName(props: { ethAddress: string }) {
    const router = useRouter()
    const { theme } = useAppTheme()
    const { ethAddress } = props
    const { disconnect } = useDisconnect()
    const activeWallet = useActiveWallet()

    const { data: socialProfiles, isLoading: isLoadingSocialProfiles } =
      useSocialProfilesForAddressQuery({
        ethAddress,
      })

    // const handleDisconnectWallet = useCallback(() => {
    //   multiInboxActions.setCurrentSender({
    //     ethereumAddress: ethAddress,
    //     inboxId: undefined,
    //   })
    // }, [ethAddress, multiInboxActions])

    if (isLoadingSocialProfiles) {
      return (
        <>
          <ConnectWalletHeader title="Loading..." />
          <ConnectWalletContentContainer>
            <Loader />
          </ConnectWalletContentContainer>
        </>
      )
    }

    const names = socialProfiles?.map((profile) => profile.name)

    // If no names, show the supported social profiles
    if (!names || names.length === 0) {
      return (
        <>
          <ConnectWalletHeader title="No names" />
          <ConnectWalletContentContainer>
            <ConnectWalletTextSection
              style={{
                paddingBottom: theme.spacing.xs,
              }}
              text="No supported names appear in your wallet."
              secondaryText="Convos supports names from these services."
            />

            {supportedSocialProfiles.map((profile) => (
              <ConnectWalletItem
                key={profile.type}
                name={profile.type}
                imageSource={profile.imageLocalUri}
              />
            ))}

            <ConnectWalletButtonContainer
              style={{
                marginTop: theme.spacing.xs,
              }}
            >
              <ConnectWalletPrimaryButton
                text={`Close`}
                onPress={router.goBack}
              />
              <ConnectWalletCancelLinkButton
                text={`Disconnect wallet ${shortAddress(ethAddress)}`}
                onPress={async () => {
                  if (activeWallet) {
                    disconnect(activeWallet)
                  }

                  useConnectWalletStore
                    .getState()
                    .actions.setThirdwebWalletIdThatIsConnecting(undefined)
                }}
              />
            </ConnectWalletButtonContainer>
          </ConnectWalletContentContainer>
        </>
      )
    }

    return (
      <>
        <ConnectWalletHeader title="Choose a name" />
        <ConnectWalletContentContainer>
          <ConnectWalletTextSection
            style={{
              paddingBottom: theme.spacing.xs,
            }}
            text="Select an onchain identity to use as your name on Convos. You can change this later."
            secondaryText="Remember, using an onchain name may reveal other assets held in the same wallet."
          />

          {socialProfiles?.map((socialProfile) => (
            <ConnectWalletItem
              key={socialProfile.name}
              name={socialProfile.name}
              image={
                <Avatar uri={socialProfile.avatar} name={socialProfile.name} />
              }
              onPress={() => {
                useOnboardingContactCardStore
                  .getState()
                  .actions.setName(socialProfile.name)
                router.goBack()
              }}
            />
          ))}

          <ConnectWalletCancelOutlineButton
            style={{
              marginTop: theme.spacing.xs,
            }}
            onPress={router.goBack}
          />
        </ConnectWalletContentContainer>
      </>
    )
  },
)

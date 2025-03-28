import { memo, useCallback } from "react"
import { Alert } from "react-native"
import { Loader } from "@/design-system/loader"
import { VStack } from "@/design-system/VStack"
import { connectWallet } from "@/features/wallets/connect-wallet/connect-wallet.service"
import { useConnectWalletStore } from "@/features/wallets/connect-wallet/connect-wallet.store"
import { useInstalledWalletsQuery } from "@/features/wallets/installed-wallets.query"
import { ISupportedWallet, supportedWallets } from "@/features/wallets/supported-wallets"
import { useRouter } from "@/navigation/use-navigation"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { openLink } from "@/utils/linking"
import {
  ConnectWalletHeader,
  ConnectWalletItem,
  ConnectWalletLayout,
  ConnectWalletLinkButton,
  ConnectWalletOutlineButton,
  ConnectWalletPrimaryButton,
  ConnectWalletTextSection,
} from "../connect-wallet.ui"
import { WalletConnected } from "./connect-wallet-connected"

export const ConnectWalletChooseApp = memo(function ConnectWalletChooseApp() {
  const router = useRouter()

  const { data: installedWallets = [] } = useInstalledWalletsQuery()

  const activeWallet = useConnectWalletStore((state) => state.activeWallet)

  if (activeWallet) {
    return <WalletConnected activeWallet={activeWallet} />
  }

  if (installedWallets.length > 0) {
    return (
      <ConnectWalletLayout
        header={<ConnectWalletHeader title="Choose an app" />}
        text={
          <ConnectWalletTextSection text="You'll be asked to allow your wallet app to share your public address with Convos" />
        }
        content={
          <VStack>
            {installedWallets.map((wallet) => (
              <InstalledWalletItem key={wallet.thirdwebId} wallet={wallet} />
            ))}
          </VStack>
        }
        buttons={<ConnectWalletOutlineButton onPress={router.goBack} />}
      />
    )
  }

  return (
    <ConnectWalletLayout
      header={<ConnectWalletHeader title="No wallets" />}
      text={
        <ConnectWalletTextSection
          text="No supported wallet apps appear to be installed on this device."
          secondaryText="Tap to install one of these supported apps."
        />
      }
      content={
        <VStack>
          {supportedWallets.map((wallet) => (
            <ConnectWalletItem
              key={wallet.thirdwebId}
              name={wallet.name}
              imageSource={wallet.imageLocalUri}
              onPress={() => openLink({ url: wallet.storeUrl })}
            />
          ))}
        </VStack>
      }
      buttons={
        <>
          <ConnectWalletPrimaryButton text="Close" onPress={router.goBack} />
          <ConnectWalletLinkButton
            text="Request another wallet app"
            onPress={() => {
              Alert.alert(
                "Request another wallet app",
                "Contact us to request support for additional wallet apps",
              )
            }}
          />
        </>
      }
    />
  )
})

type IInstalledWalletItemProps = {
  wallet: ISupportedWallet
}

const InstalledWalletItem = memo(function InstalledWalletItem(props: IInstalledWalletItemProps) {
  const { wallet } = props

  const walletIdThatIsConnecting = useConnectWalletStore(
    (state) => state.thirdwebWalletIdThatIsConnecting,
  )

  // Handle wallet connection
  const handleConnectWallet = useCallback(async () => {
    const store = useConnectWalletStore.getState()
    try {
      store.actions.setWalletIdThatIsConnecting(wallet.thirdwebId)
      const connectedWallet = await connectWallet(wallet)
      store.actions.setActiveWallet(connectedWallet)
    } catch (error) {
      captureErrorWithToast(
        new GenericError({ error, additionalMessage: `Error connecting ${wallet.name} wallet` }),
      )
    } finally {
      store.actions.setWalletIdThatIsConnecting(undefined)
    }
  }, [wallet])

  const anotherWalletIsConnecting =
    walletIdThatIsConnecting && walletIdThatIsConnecting !== wallet.thirdwebId

  return (
    <ConnectWalletItem
      name={wallet.name}
      imageSource={wallet.imageLocalUri}
      onPress={handleConnectWallet}
      isDisabled={anotherWalletIsConnecting}
      {...(walletIdThatIsConnecting === wallet.thirdwebId && {
        endElement: <Loader size="sm" />,
        helperText: "Connecting...",
      })}
    />
  )
})

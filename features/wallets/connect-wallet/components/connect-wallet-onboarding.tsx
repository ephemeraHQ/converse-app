import React, { memo } from "react"
import { useDynamicPagesStoreContext } from "@/components/dynamic-pages/dynamic-pages.store-context"
import { Chip, ChipAvatar, ChipText } from "@/design-system/chip"
import { HStack } from "@/design-system/HStack"
import { VStack } from "@/design-system/VStack"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import {
  ConnectWalletHeader,
  ConnectWalletLayout,
  ConnectWalletLinkButton,
  ConnectWalletPrimaryButton,
  ConnectWalletTextSection,
} from "../connect-wallet.ui"

export const ConnectWalletOnboarding = memo(function ConnectWalletOnboarding() {
  const { theme } = useAppTheme()
  const actions = useDynamicPagesStoreContext((state) => state.actions)
  const router = useRouter()

  const renderHeader = () => <ConnectWalletHeader title="Import an onchain identity" />

  const renderText = () => (
    <ConnectWalletTextSection
      text="Use your name and pic from an onchain identity like ENS, Base or others."
      secondaryText="Remember, using an onchain name may reveal other assets held in the same wallet."
    />
  )

  const renderContent = () => (
    <VStack
      style={{
        paddingVertical: theme.spacing.sm,
      }}
    >
      <VStack
        style={{
          justifyContent: "center",
          alignItems: "center",
          rowGap: theme.spacing.xxs,
        }}
      >
        <Chip size="lg">
          <ChipAvatar uri={require("@assets/images/web3/base.png")} name="Base" />
          <ChipText>name.base.eth</ChipText>
        </Chip>
        <HStack
          style={{
            columnGap: theme.spacing.xxs,
          }}
        >
          <Chip size="lg">
            <ChipAvatar uri={require("@assets/images/web3/ens.png")} name="ENS" />
            <ChipText>hello.eth</ChipText>
          </Chip>
          <Chip size="lg">
            <ChipAvatar uri={require("@assets/images/web3/farcaster.png")} name="Farcaster" />
            <ChipText>farcaster</ChipText>
          </Chip>
        </HStack>
      </VStack>
    </VStack>
  )

  const renderButtons = () => (
    <>
      <ConnectWalletPrimaryButton text="Connect Wallet" onPress={actions.goToNextPage} />
      <ConnectWalletLinkButton onPress={router.goBack} />
    </>
  )

  return (
    <VStack style={{ flex: 1 }}>
      <ConnectWalletLayout
        header={renderHeader()}
        text={renderText()}
        content={renderContent()}
        buttons={renderButtons()}
      />
    </VStack>
  )
})

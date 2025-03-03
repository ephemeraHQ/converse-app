import { memo } from "react"
import { Avatar } from "@/components/avatar"
import { useOnboardingContactCardStore } from "@/features/onboarding/screens/onboarding-contact-card-screen"
import { useSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query"
import { supportedSocialProfiles } from "@/features/social-profiles/supported-social-profiles"
import { disconnectActiveWallet } from "@/features/wallets/connect-wallet/connect-wallet.service"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import { shortAddress } from "@/utils/strings/shortAddress"
import {
  ConnectWalletButtonContainer,
  ConnectWalletHeader,
  ConnectWalletItem,
  ConnectWalletLayout,
  ConnectWalletLinkButton,
  ConnectWalletLoadingContent,
  ConnectWalletOutlineButton,
  ConnectWalletPrimaryButton,
  ConnectWalletTextSection,
} from "../connect-wallet.ui"

type IWalletChooseNameProps = {
  ethAddress: string
}

export const WalletChooseName = memo(function WalletChooseName(
  props: IWalletChooseNameProps,
) {
  const router = useRouter()
  const { theme } = useAppTheme()
  const { ethAddress } = props

  const { data: socialProfiles, isLoading: isLoadingSocialProfiles } =
    useSocialProfilesForAddressQuery({
      ethAddress,
    })

  if (isLoadingSocialProfiles) {
    return <ConnectWalletLoadingContent />
  }

  const names = socialProfiles?.map((profile) => profile.name)

  // If no names, show the supported social profiles
  if (!names || names.length === 0) {
    return (
      <ConnectWalletLayout
        header={<ConnectWalletHeader title="No names" />}
        text={
          <ConnectWalletTextSection
            text="No supported names appear in your wallet."
            secondaryText="Convos supports names from these services."
          />
        }
        content={supportedSocialProfiles.map((profile) => (
          <ConnectWalletItem
            key={profile.type}
            name={profile.type}
            imageSource={profile.imageLocalUri}
          />
        ))}
        buttons={
          <ConnectWalletButtonContainer>
            <ConnectWalletPrimaryButton
              text={`Close`}
              onPress={router.goBack}
            />
            <ConnectWalletLinkButton
              text={`Disconnect wallet ${shortAddress(ethAddress)}`}
              onPress={async () => {
                try {
                  await disconnectActiveWallet()
                } catch (error) {
                  router.goBack()
                  captureError(error)
                }
              }}
            />
          </ConnectWalletButtonContainer>
        }
      />
    )
  }

  return (
    <ConnectWalletLayout
      header={<ConnectWalletHeader title="Choose a name" />}
      text={
        <ConnectWalletTextSection
          text="Select an onchain identity to use as your name on Convos. You can change this later."
          secondaryText="Remember, using an onchain name may reveal other assets held in the same wallet."
        />
      }
      content={socialProfiles?.map((socialProfile) => (
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
      buttons={
        <>
          <ConnectWalletOutlineButton text="Cancel" onPress={router.goBack} />
          <ConnectWalletLinkButton
            text={`Disconnect wallet ${shortAddress(ethAddress)}`}
            onPress={async () => {
              try {
                await disconnectActiveWallet()
              } catch (error) {
                router.goBack()
                captureError(error)
              }
            }}
          />
        </>
      }
    />
  )
})

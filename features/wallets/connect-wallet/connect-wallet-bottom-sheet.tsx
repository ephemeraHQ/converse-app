import React, { useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { base } from "thirdweb/chains";
import { useConnect } from "thirdweb/react";
import { createWallet, WalletId } from "thirdweb/wallets";
import { config } from "@/config";
import { useBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetHeader } from "@/design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api";
import { ensureSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query";
import { getXmtpClientByEthAddress } from "@/features/xmtp/xmtp-client/xmtp-client.service";
import { useAppTheme } from "@/theme/use-app-theme";
import { logger } from "@/utils/logger";
import { thirdwebClient } from "@/utils/thirdweb";
import { useCurrentSender as useSafeCurrentSender } from "../../authentication/multi-inbox.store";
import { IXmtpSigner } from "../../xmtp/xmtp.types";
import { InstalledWalletsList } from "./connect-wallet-installed-wallets-list";
import { SocialIdentityList } from "./connect-wallet-social-identity-list";
import {
  connectWallet,
  connectWalletBottomSheetRef,
} from "./connect-wallet.service";
import { useConnectWalletStore } from "./connect-wallet.store";
import { IConnectWalletBottomSheetProps } from "./connect-wallet.types";

// URL for Coinbase callback
const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

/**
 * Bottom sheet for connecting wallets and importing identities
 */
export function ConnectWalletBottomSheet({
  onClose,
  onWalletImported,
}: IConnectWalletBottomSheetProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentSender = useSafeCurrentSender();
  const { connect } = useConnect();

  // Get state from store
  const {
    isShowingWalletList,
    setConnectingWallet,
    setConnectingEthereumAddress,
    setSocialData,
  } = useConnectWalletStore();

  // Handle wallet connection
  const handleConnectWalletTapped = async (
    walletType: WalletId,
    options?: Record<string, unknown>,
  ) => {
    setConnectingWallet(walletType);

    logger.debug(
      `[ConnectWalletBottomSheet] Handling connect wallet tapped for ${walletType}`,
    );

    connect(async () => {
      // Create the wallet first - this is what thirdweb expects to be returned
      const wallet = createWallet(walletType, options);

      try {
        // Connect wallet to thirdweb client
        logger.debug(
          `[ConnectWalletBottomSheet] Connecting wallet to thirdweb client`,
        );
        const walletAccount = await wallet.connect({
          client: thirdwebClient,
        });

        const addressToLink = walletAccount.address;

        // Update store with discovered address
        setConnectingEthereumAddress(addressToLink);
        logger.debug(
          `[ConnectWalletBottomSheet] Got wallet address: ${addressToLink}`,
        );

        // Get social profiles for the address
        const socialProfiles = await ensureSocialProfilesForAddressQuery({
          ethAddress: addressToLink,
        });

        logger.debug(
          `[ConnectWalletBottomSheet] Social profiles: ${JSON.stringify(
            socialProfiles,
            null,
            2,
          )}`,
        );

        // Update store with social data
        setSocialData(socialProfiles);

        // Get inbox client for current sender
        logger.debug(
          `[ConnectWalletBottomSheet] Getting inbox client for current sender: ${currentSender!.ethereumAddress}`,
        );

        const currentInboxClient = await getXmtpClientByEthAddress({
          ethAddress: currentSender!.ethereumAddress,
        })!;

        // Check if address can be messaged
        logger.debug(
          `[ConnectWalletBottomSheet] Checking if address ${addressToLink} can be messaged`,
        );

        const resultsMap = await currentInboxClient.canMessage([addressToLink]);

        logger.debug(
          `[ConnectWalletBottomSheet] Results map: ${JSON.stringify(resultsMap, null, 2)}`,
        );

        const isOnXmtp = resultsMap[addressToLink];

        logger.debug(
          `[ConnectWalletBottomSheet] Is on XMTP? ${isOnXmtp} for address ${addressToLink}`,
        );

        if (isOnXmtp) {
          logger.debug(
            `[ConnectWalletBottomSheet] Address ${addressToLink} is already on XMTP`,
          );

          alert(
            `You are already on XMTP with address ${addressToLink}. We're going to handle this carefully according to https://xmtp-labs.slack.com/archives/C07NSHXK693/p1739215446331469?thread_ts=1739212558.484059&cid=C07NSHXK693.`,
          );

          onWalletImported(socialProfiles);
        } else {
          logger.debug(
            `[ConnectWalletBottomSheet] Creating signer for address ${addressToLink}`,
          );

          // Create signer for the wallet
          const signer: IXmtpSigner = {
            getAddress: async () => addressToLink,
            getChainId: () => base.id,
            getBlockNumber: () => undefined,
            walletType: () => "EOA",
            signMessage: async (message: string) => {
              logger.debug(
                `[ConnectWalletBottomSheet] Signing message for address ${addressToLink}`,
              );
              const signature = await walletAccount.signMessage({ message });
              return signature;
            },
          };

          logger.debug(
            `[ConnectWalletBottomSheet] Adding account to inbox client`,
          );

          // Add account to inbox client
          await currentInboxClient.addAccount(signer);

          alert(
            `You've successfully connected ${addressToLink} to your inbox. You won't see anything in the UI yet, but we're working on that now.`,
          );

          onWalletImported(socialProfiles);
        }
      } catch (error) {
        logger.error(
          `[ConnectWalletBottomSheet] Error connecting wallet: ${error}`,
        );
        alert(`Failed to connect wallet: ${error}`);
      }

      // Return the wallet for thirdweb
      return wallet;
    });
  };

  // Handle social identity selection
  const handleSocialIdentityTapped = (socialIdentity: ISocialProfile) => {
    alert(`You tapped on ${socialIdentity.name}`);
  };

  const handleClose = useCallback(() => {
    useConnectWalletStore.getState().reset();
  }, []);

  return (
    <BottomSheetModal
      ref={connectWalletBottomSheetRef}
      snapPoints={["70%"]}
      onClose={handleClose}
    >
      <BottomSheetHeader title="Import an identity" />
      <BottomSheetContentContainer
        style={{
          flex: 1,
        }}
      >
        <VStack
          style={{
            paddingHorizontal: theme.spacing.md,
            rowGap: theme.spacing.xs,
            paddingBottom: insets.bottom,
          }}
        >
          <VStack
            style={{
              rowGap: theme.spacing.sm,
            }}
          >
            <Text>
              Connect a wallet to use a name and pic from one of your onchain
              identities.
            </Text>
            <Text preset="small" color="secondary">
              Remember, using an onchain name may reveal other assets held in
              the same wallet.
            </Text>
          </VStack>

          {isShowingWalletList && (
            <InstalledWalletsList
              onWalletTapped={handleConnectWalletTapped}
              coinbaseCallbackUrl={coinbaseUrl.toString()}
            />
          )}

          <SocialIdentityList
            onSocialIdentityTapped={handleSocialIdentityTapped}
          />
        </VStack>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
}

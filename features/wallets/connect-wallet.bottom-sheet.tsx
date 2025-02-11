import React, { useEffect } from "react";
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
import { BottomSheetHeader } from "@/design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { useBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Linking } from "react-native";
import { base } from "viem/chains";
import { Account, createWallet, WalletId } from "thirdweb/wallets";
import { thirdwebClient } from "@/utils/thirdweb";
import { InboxSigner } from "@/features/multi-inbox/multi-inbox-client.types";
import { config } from "@/config";
import {
  getSafeCurrentSender,
  useAccountsStore,
} from "../multi-inbox/multi-inbox.store";
import { MultiInboxClient } from "../multi-inbox/multi-inbox.client";
import logger from "@/utils/logger";
import { Text } from "@/design-system/Text";
import { ensureProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { useInstalledWallets } from "./use-installed-wallets.hook";
import { resolveCoinbaseId } from "@/utils/evm/address";
import { Button } from "@/design-system/Button/Button";
import { ConnectButton } from "thirdweb/react";
const wallets = [
  createWallet("app.phantom"), // Add your wallet in wallet list
  // add other wallets...
];
type ConnectWalletBottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  onWalletConnect: (something: string) => void;
  // onWalletConnect: (
  //   connectHandler: () => Promise<Account>,
  //   callback: (error?: Error) => void
  // ) => void;
};

const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);
export function ConnectWalletBottomSheet({
  isVisible,
  onClose,
  onWalletConnect,
}: ConnectWalletBottomSheetProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { installedWallets, isLoading: areInstalledWalletsLoading } =
    useInstalledWallets();
  const bottomSheetRef = useBottomSheetModalRef();
  const currentSender = useAccountsStore((state) => state.currentSender);
  const isInboxClientInitiated = currentSender?.inboxId;

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, bottomSheetRef]);

  const handleConnectWalletTapped =
    (
      walletType: WalletId,
      // eslint-disable-next-line typescript-eslint/no-explicit-any
      options?: /** only used for coinbase wallet - will add better typing if this needs to be more dynamic */ any
    ) =>
    async () => {
      logger.debug(
        `[ConnectWalletBottomSheet] Handling connect wallet tapped for ${walletType}`
      );
      // onWalletConnect("todo - callback after complete or error??");
      // onWalletConnect(async () => {
      // if (!isInboxClientInitiated) {
      //   throw new Error(
      //     `[ConnectWalletBottomSheet] Inbox client not initiated for address ${
      //       currentSender!.ethereumAddress
      //     } when attempting to connect wallet ${walletType}`
      //   );
      // }
      // const currentInboxClient =
      //   MultiInboxClient.instance.getInboxClientForAddress({
      //     ethereumAddress: currentSender!.ethereumAddress,
      //   })!;
      const w = createWallet(walletType, options);
      const account = await w.connect({ client: thirdwebClient });
      const addressToLink = account.address;

      if (!isInboxClientInitiated) {
        logger.debug("[ConnectWalletBottomSheet] Inbox client not initiated");
        return account;
      }

      const currentInboxClient =
        MultiInboxClient.instance.getInboxClientForAddress({
          ethereumAddress: currentSender!.ethereumAddress,
        });

      if (!currentInboxClient) {
        logger.debug(
          "[ConnectWalletBottomSheet] No inbox client found for address"
        );
        return account;
      }

      const resultsMap = await currentInboxClient.canMessage([addressToLink]);
      logger.debug(
        `[ConnectWalletBottomSheet] Results map: ${JSON.stringify(
          resultsMap,
          null,
          2
        )}`
      );
      // const isOnXmtp = resultsMap[addressToLink];
      const isOnXmtp = false;
      logger.debug(
        `[ConnectWalletBottomSheet] Is on XMTP? ${isOnXmtp} for address ${addressToLink}`
      );

      if (isOnXmtp) {
        alert(
          `You are already on XMTP with address ${account.address}. We're going to handle this carefully according to https://xmtp-labs.slack.com/archives/C07NSHXK693/p1739215446331469?thread_ts=1739212558.484059&cid=C07NSHXK693.`
        );

        // Linking.openURL(
        //   "https://xmtp-labs.slack.com/archives/C07NSHXK693/p1739215446331469?thread_ts=1739212558.484059&cid=C07NSHXK693"
        // );
      } else {
        // todo load the profile stuff for this address and see the names
        // return;
        // const signer: InboxSigner = {
        //   getAddress: async () => account.address,
        //   getChainId: () => base.id,
        //   getBlockNumber: () => undefined,
        //   walletType: () => "EOA",
        //   signMessage: async (message: string) => {
        //     const signature = await account.signMessage({ message });
        //     return signature;
        //   },
        // };

        const mycbidaddress = "0x0aF849d2778f6ccE4A2641438B6207DC4750a82B";
        // await currentInboxClient?.addAccount(signer);
        const cbId = await resolveCoinbaseId(account.address);
        logger.debug(
          `[ConnectWalletBottomSheet] Coinbase ID for address ${account.address}: ${cbId}`
        );

        const socialData = await ensureProfileSocialsQueryData(account.address);
        logger.debug(
          `[ConnectWalletBottomSheet] Social data for address ${account.address}:`,
          JSON.stringify(socialData, null, 2)
        );
      }

      return account;
      // });
    };

  const isReadyToShowWalletList =
    !areInstalledWalletsLoading &&
    installedWallets !== undefined &&
    // isInboxClientInitiated;
    true;

  const hasInstalledWallets =
    // !areInstalledWalletsLoading &&
    installedWallets !== undefined && installedWallets.length > 0;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["50%"]}
      onDismiss={onClose}
    >
      <BottomSheetHeader title="Import an identity" />
      {/* <ConnectButton wallets={wallets} client={thirdwebClient} /> */}
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
          {isReadyToShowWalletList && (
            <>
              {installedWallets.map((wallet) => (
                <Button
                  key={wallet.thirdwebId}
                  text={`Add ${wallet.name} to inbox`}
                  onPress={handleConnectWalletTapped(wallet.thirdwebId, {
                    mobileConfig: { callbackURL: coinbaseUrl.toString() },
                  })}
                />
              ))}
            </>
          )}

          {areInstalledWalletsLoading && <Text>Loading wallets</Text>}

          {!hasInstalledWallets && (
            <Text>
              No wallets found. Please install a wallet and try again.
            </Text>
          )}
        </VStack>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
}

import React from "react";
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
import { BottomSheetHeader } from "@/design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { useBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "react-native";
import { base } from "viem/chains";
import { Account, createWallet, WalletId } from "thirdweb/wallets";
import { thirdwebClient } from "@/utils/thirdweb";
import { InboxSigner } from "@/features/multi-inbox/multi-inbox-client.types";
import { config } from "@/config";
import { useAccountsStore } from "../multi-inbox/multi-inbox.store";
import { MultiInboxClient } from "../multi-inbox/multi-inbox.client";
import logger from "@/utils/logger";
import { Text } from "@/design-system/Text";
import { ensureProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { useInstalledWallets } from "./use-installed-wallets.hook";

type ConnectWalletBottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  onWalletConnect: (connectHandler: () => Promise<Account>) => void;
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
      onWalletConnect(async () => {
        if (!isInboxClientInitiated) {
          throw new Error(
            `[ConnectWalletBottomSheet] Inbox client not initiated for address ${
              currentSender!.ethereumAddress
            } when attempting to connect wallet ${walletType}`
          );
        }
        const inboxClient = MultiInboxClient.instance.getInboxClientForAddress({
          ethereumAddress: currentSender!.ethereumAddress,
        })!;
        const w = createWallet(walletType, options);
        const account = await w.connect({ client: thirdwebClient });

        const signer: InboxSigner = {
          getAddress: async () => account.address,
          getChainId: () => base.id,
          getBlockNumber: () => undefined,
          walletType: () => "EOA",
          signMessage: async (message: string) => {
            const signature = await account.signMessage({ message });
            return signature;
          },
        };

        await inboxClient?.addAccount(signer);

        const socialData = ensureProfileSocialsQueryData(account.address);
        logger.debug(
          `[ConnectWalletBottomSheet] Social data for address ${account.address}:`,
          JSON.stringify(socialData, null, 2)
        );

        return account;
      });
    };

  const isReadyToShowWalletList =
    !areInstalledWalletsLoading &&
    installedWallets !== undefined &&
    isInboxClientInitiated;

  const hasInstalledWallets =
    !areInstalledWalletsLoading &&
    installedWallets !== undefined &&
    installedWallets.length > 0;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["50%"]}
      onDismiss={onClose}
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
          {isReadyToShowWalletList && (
            <>
              {installedWallets.map((wallet) => (
                <Button
                  key={wallet.thirdwebId}
                  title={`Add ${wallet.name} to inbox`}
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

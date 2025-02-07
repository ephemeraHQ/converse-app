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
  const bottomSheetRef = useBottomSheetModalRef();
  const currentSender = useAccountsStore((state) => state.currentSender);
  const isInboxClientInitiated = currentSender?.xmtpInboxId;

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
          {isInboxClientInitiated ? (
            <>
              <Button
                title={"Add Rainbow to inbox"}
                onPress={handleConnectWalletTapped("me.rainbow")}
              />
              <Button
                title={"Add Metamask to inbox"}
                onPress={handleConnectWalletTapped("io.metamask")}
              />
              <Button
                title={"Add Coinbase to inbox"}
                onPress={handleConnectWalletTapped("com.coinbase.wallet", {
                  mobileConfig: { callbackURL: coinbaseUrl.toString() },
                })}
              />
            </>
          ) : (
            <Text>Loading wallets</Text>
          )}
        </VStack>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
}

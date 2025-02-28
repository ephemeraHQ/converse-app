import React, { memo, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DynamicPages } from "@/components/dynamic-pages/dynamic-pages";
import { useDynamicPagesStoreContext } from "@/components/dynamic-pages/dynamic-pages.store-context";
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetHeader } from "@/design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
import { Button } from "@/design-system/Button/Button";
import { Chip, ChipAvatar, ChipText } from "@/design-system/chip";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/use-app-theme";
import { ConnectWalletBottomSheetChooseWallet } from "./connect-wallet-bottom-sheet-choose-wallet";
import {
  closeConnectWalletBottomSheet,
  connectWalletBottomSheetRef,
} from "./connect-wallet-bottom-sheet.service";
import { useConnectWalletStore } from "./connect-wallet.store";
import { IConnectWalletBottomSheetProps } from "./connect-wallet.types";

// URL for Coinbase callback

/**
 * Bottom sheet for connecting wallets and importing identities
 */
export function ConnectWalletBottomSheet(
  {
    // onClose,
    // onWalletImported,
  }: IConnectWalletBottomSheetProps,
) {
  const handleClose = useCallback(() => {
    useConnectWalletStore.getState().reset();
  }, []);

  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal
      ref={connectWalletBottomSheetRef}
      enableDynamicSizing
      onClose={handleClose}
    >
      <BottomSheetContentContainer
        style={{
          paddingBottom: insets.bottom,
        }}
      >
        <DynamicPages>
          <ConnectWalletBottomSheetInitPage />
          <ConnectWalletBottomSheetChooseWallet />
        </DynamicPages>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
}

const ConnectWalletBottomSheetInitPage = memo(
  function ConnectWalletBottomSheetInitPage() {
    const { theme } = useAppTheme();

    const actions = useDynamicPagesStoreContext((state) => state.actions);

    return (
      <>
        <BottomSheetHeader title="Import an onchain identity" />
        <VStack
          style={{
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          <VStack
            style={{
              paddingVertical: theme.spacing.sm,
            }}
          >
            {/* <Button
              variant="outline"
              size="sm"
              LeftAccessory={() => (
                <Image
                  source={{
                    uri: "https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb",
                  }}
                  style={{
                    width: 24,
                    height: 24,
                  }}
                />
              )}
            /> */}
            <VStack
              style={{
                justifyContent: "center",
                alignItems: "center",
                rowGap: theme.spacing.xxs,
              }}
            >
              <Chip size="md">
                <ChipAvatar
                  uri="https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb"
                  name="Coinbase"
                />
                <ChipText>name.base.eth</ChipText>
              </Chip>
              <HStack
                style={{
                  columnGap: theme.spacing.xxs,
                }}
              >
                <Chip size="md">
                  <ChipAvatar
                    uri="https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb"
                    name="Coinbase"
                  />
                  <ChipText>name.base.eth</ChipText>
                </Chip>
                <Chip size="md">
                  <ChipAvatar
                    uri="https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb"
                    name="Coinbase"
                  />
                  <ChipText>name.base.eth</ChipText>
                </Chip>
              </HStack>
            </VStack>
          </VStack>

          <VStack
            style={{
              paddingVertical: theme.spacing.lg,
              rowGap: theme.spacing.sm,
            }}
          >
            <Text>
              Use your name and pic from an onchain identity like ENS, Base or
              others.
            </Text>
            <Text preset="small" color="secondary">
              Remember, using an onchain name may reveal other assets held in
              the same wallet.
            </Text>
          </VStack>
          <VStack
            style={{
              rowGap: theme.spacing.xxs,
            }}
          >
            <Button text="Connect Wallet" onPress={actions.goToNextPage} />
            <Button
              variant="link"
              text="Cancel"
              onPress={closeConnectWalletBottomSheet}
            />
          </VStack>
        </VStack>
      </>
    );
  },
);

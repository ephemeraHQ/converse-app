import React, { memo } from "react";
import { useDynamicPagesStoreContext } from "@/components/dynamic-pages/dynamic-pages.store-context";
import { BottomSheetHeaderBase } from "@/design-system/BottomSheet/BottomSheetHeader";
import { Button } from "@/design-system/Button/Button";
import { Chip, ChipAvatar, ChipText } from "@/design-system/chip";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { useRouter } from "@/navigation/use-navigation";
import { useAppTheme } from "@/theme/use-app-theme";
import { debugBorder } from "@/utils/debug-style";
import { closeConnectWalletBottomSheet } from "./connect-wallet-bottom-sheet.service";

export const ConnectWalletBottomSheetOnboarding = memo(
  function ConnectWalletBottomSheetOnboarding() {
    const { theme } = useAppTheme();

    const actions = useDynamicPagesStoreContext((state) => state.actions);

    const router = useRouter();

    return (
      <VStack style={{ flex: 1 }}>
        <BottomSheetHeaderBase
          title="Import an onchain identity"
          hasClose={false}
        />
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
              <Chip size="lg">
                <ChipAvatar
                  uri={require("@assets/icons/web3/base.png")}
                  name="Base"
                />
                <ChipText>name.base.eth</ChipText>
              </Chip>
              <HStack
                style={{
                  columnGap: theme.spacing.xxs,
                }}
              >
                <Chip size="lg">
                  <ChipAvatar
                    uri={require("@assets/icons/web3/ens.png")}
                    name="ENS"
                  />
                  <ChipText>hello.eth</ChipText>
                </Chip>
                <Chip size="lg">
                  <ChipAvatar
                    uri={require("@assets/icons/web3/farcaster.png")}
                    name="Farcaster"
                  />
                  <ChipText>farcaster</ChipText>
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
            <Button variant="link" text="Cancel" onPress={router.goBack} />
          </VStack>
        </VStack>
      </VStack>
    );
  },
);

import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal";
import { Button } from "@design-system/Button/Button";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { VStack } from "@design-system/VStack";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { translate } from "@i18n";
import { $globalStyles } from "@theme/styles";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { waitUntilAppActive } from "@utils/appState/waitUntilAppActive";
import { ensureError } from "@utils/error";
import { thirdwebClient } from "@utils/thirdweb";
import { Image } from "expo-image";
import { useCallback } from "react";
import { Alert, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Account, createWallet, Wallet } from "thirdweb/wallets";

import { useExternalWalletPickerContext } from "./ExternalWalletPicker.context";
import {
  InstalledWallet,
  useInstalledWallets,
} from "../../components/Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import config from "../../config";

type IExternalWalletPickerProps = {
  title?: string;
  subtitle?: string;
};

export function ExternalWalletPicker(props: IExternalWalletPickerProps) {
  const { title, subtitle } = props;

  const { bottomSheetRef, handleDismiss, onWalletPicked, close } =
    useExternalWalletPickerContext();

  const installedWallets = useInstalledWallets();

  const insets = useSafeAreaInsets();

  const { themed, theme } = useAppTheme();

  const renderItem = useCallback(
    ({ item: installedWallet }: { item: InstalledWallet }) => {
      const pickExternalWallet = async () => {
        try {
          if (!installedWallet) {
            throw new Error("No installed wallet could be found");
          }

          let wallet: Wallet | undefined;
          let account: Account | undefined;

          if (installedWallet.name === "Coinbase Wallet") {
            wallet = createWallet("com.coinbase.wallet", {
              appMetadata: config.walletConnectConfig.appMetadata,
              mobileConfig: {
                callbackURL: `https://${config.websiteDomain}/coinbase`,
              },
            });
          } else if (installedWallet.thirdwebId) {
            wallet = createWallet(installedWallet.thirdwebId);
          }

          if (!wallet) {
            throw new Error("Wallet could not be created");
          }

          try {
            account = await wallet.autoConnect({ client: thirdwebClient });
          } catch {
            account = await wallet.connect({
              client: thirdwebClient,
              walletConnect: config.walletConnectConfig,
            });
          }

          onWalletPicked({
            wallet,
            account,
          });

          // Not sure why
          await waitUntilAppActive(500);

          close();
        } catch (error) {
          // TODO: Replace with snack bar error once it's ready
          Alert.alert(ensureError(error).message);
        }
      };

      return (
        <TouchableOpacity
          style={themed($InstalledWalletContainer)}
          onPress={pickExternalWallet}
        >
          <Image
            source={{ uri: installedWallet.iconURL }}
            style={{
              width: theme.avatarSize.md,
              height: theme.avatarSize.md,
              borderRadius: theme.borderRadius.xs,
            }}
          />
          <Text preset="smaller" style={$globalStyles.flex1}>
            {installedWallet.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [onWalletPicked, themed, theme, close]
  );

  const keyExtractor = useCallback((item: InstalledWallet) => {
    return item.name;
  }, []);

  const renderListHeader = useCallback(() => {
    return (
      <VStack>
        <BottomSheetHeader {...(!!title && { title })} hasClose />
        {!!subtitle && (
          <HStack
            style={{
              paddingHorizontal: theme.spacing.md,
              paddingBottom: theme.spacing.xs,
            }}
          >
            <Text>{subtitle}</Text>
          </HStack>
        )}
      </VStack>
    );
  }, [title, subtitle, theme]);

  const renderListFooter = useCallback(() => {
    return (
      <Button
        action="primary"
        variant="outline"
        text={translate("back")}
        style={{
          marginHorizontal: theme.spacing.md,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.xs,
        }}
        onPress={close}
      />
    );
  }, [theme, close]);

  const renderListEmpty = useCallback(() => {
    return (
      <HStack
        style={{
          paddingHorizontal: theme.spacing.md,
        }}
      >
        <Text>{translate("no_wallet_detected")}</Text>
      </HStack>
    );
  }, [theme]);

  return (
    <BottomSheetModal
      onClose={handleDismiss}
      ref={bottomSheetRef}
      enableDynamicSizing
      absoluteHandleBar
    >
      <BottomSheetFlatList
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        data={installedWallets}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        renderItem={renderItem}
      />
    </BottomSheetModal>
  );
}

const $InstalledWalletContainer: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
  borderRadius,
  borderWidth,
}) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.background.surface,
  marginHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  columnGap: spacing.xs,
});

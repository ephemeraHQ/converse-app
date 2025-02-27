import React from "react";
import { WalletId } from "thirdweb/wallets";
import { Button } from "@/design-system/Button/Button";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { useInstalledWallets } from "@/features/wallets/use-installed-wallets";
import { useAppTheme } from "@/theme/use-app-theme";
import { useConnectWalletStore } from "./connect-wallet.store";
import { ISupportedWallet } from "./connect-wallet.types";

type IInstalledWalletsListProps = {
  onWalletTapped: (
    walletId: WalletId,
    options?: Record<string, unknown>,
  ) => void;
  coinbaseCallbackUrl: string;
};

/**
 * Displays a list of installed wallets that can be connected
 */
export function InstalledWalletsList({
  onWalletTapped,
  coinbaseCallbackUrl,
}: IInstalledWalletsListProps) {
  const { theme } = useAppTheme();

  // Get wallet connection state from the store
  const { thirdwebWalletIdThatIsConnecting, isWalletListDisabled } =
    useConnectWalletStore();

  // Get installed wallets data
  const { installedWallets, isLoading: areInstalledWalletsLoading } =
    useInstalledWallets();

  const hasInstalledWallets = Boolean(
    installedWallets && installedWallets.length > 0,
  );

  if (areInstalledWalletsLoading) {
    return <Text>Loading wallets</Text>;
  }

  if (!hasInstalledWallets) {
    return (
      <Text>No wallets found. Please install a wallet and try again.</Text>
    );
  }

  return (
    <VStack style={{ gap: theme.spacing.xs }}>
      {installedWallets?.map((wallet: ISupportedWallet) => {
        return (
          <Button
            loading={thirdwebWalletIdThatIsConnecting === wallet.thirdwebId}
            disabled={isWalletListDisabled}
            key={wallet.thirdwebId}
            text={`Add ${wallet.name} to inbox`}
            onPress={() =>
              onWalletTapped(wallet.thirdwebId, {
                mobileConfig: { callbackURL: coinbaseCallbackUrl },
              })
            }
          />
        );
      })}
    </VStack>
  );
}

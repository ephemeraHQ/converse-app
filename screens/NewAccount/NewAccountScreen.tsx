import { ConnectViaWalletPopularWalletsTableView } from "@components/Onboarding/ConnectViaWallet/ConnectViaWalletPopularWalletsTableView";
import { memo } from "react";
import { Alert } from "react-native";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { NewAccountPictoTitleSubtitle } from "../../components/NewAccount/NewAccountTitleSubtitlePicto";
import { useInstalledWallets } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import {
  InstalledWalletsTableView,
  getConnectViaWalletTableViewEphemeralItem,
  getConnectViaWalletTableViewPhoneItem,
  getConnectViaWalletTableViewPrivateKeyItem,
} from "../../components/Onboarding/ConnectViaWallet/ConnectViaWalletTableViewItems";
import TableView from "../../components/TableView/TableView";
import { useAccountsStore } from "../../data/store/accountsStore";
import { translate } from "../../i18n";
import { useRouter } from "../../navigation/useNavigation";
import { spacing } from "../../theme";

export const NewAccountScreen = memo(function NewAccountScreen() {
  const router = useRouter();

  const walletsInstalled = useInstalledWallets();

  const hasInstalledWallets = walletsInstalled.length > 0;

  return (
    <NewAccountScreenComp
      safeAreaEdges={["bottom"]}
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
      }}
    >
      <NewAccountPictoTitleSubtitle.Container>
        <NewAccountPictoTitleSubtitle.Picto picto="message.circle.fill" />
        <NewAccountPictoTitleSubtitle.Title>
          {translate("walletSelector.title")}
        </NewAccountPictoTitleSubtitle.Title>
      </NewAccountPictoTitleSubtitle.Container>

      <TableView
        title={translate("walletSelector.converseAccount.title")}
        items={[
          getConnectViaWalletTableViewPhoneItem({
            action: () => {
              router.navigate("NewAccountPrivy");
            },
          }),
          getConnectViaWalletTableViewEphemeralItem({
            action: () => {
              router.navigate("NewAccountEphemera");
            },
          }),
        ]}
      />

      {hasInstalledWallets && (
        <InstalledWalletsTableView
          onAccountExists={(arg) => {
            useAccountsStore.getState().setCurrentAccount(arg.address, false);
            router.popToTop();
            // TODO: Add a better message
            Alert.alert("Account already connected");
          }}
          onAccountDoesNotExist={({ address, isSCW }) => {
            router.navigate("NewAccountConnectWallet", { address, isSCW });
          }}
        />
      )}

      <TableView
        title={
          hasInstalledWallets
            ? translate("walletSelector.connectionOptions.otherOptions")
            : translate("walletSelector.connectionOptions.connectForDevs")
        }
        items={[
          getConnectViaWalletTableViewPrivateKeyItem({
            action: () => {
              router.navigate("NewAccountPrivateKey");
            },
          }),
        ]}
      />

      {!hasInstalledWallets && <ConnectViaWalletPopularWalletsTableView />}
    </NewAccountScreenComp>
  );
});

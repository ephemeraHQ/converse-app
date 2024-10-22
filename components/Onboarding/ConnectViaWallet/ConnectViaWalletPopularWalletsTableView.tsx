import { POPULAR_WALLETS } from "@components/Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import TableView from "@components/TableView/TableView";
import { TableViewImage } from "@components/TableView/TableViewImage";
import { RightViewChevron } from "@components/TableView/TableViewRightChevron";
import { translate } from "@i18n";
import * as Linking from "expo-linking";
import React from "react";

export function ConnectViaWalletPopularWalletsTableView() {
  return (
    <TableView
      title={translate("walletSelector.popularMobileApps.title")}
      items={POPULAR_WALLETS.map((w) => ({
        id: w.name,
        title: w.name,
        leftView: <TableViewImage imageURI={w.iconURL} />,
        rightView: RightViewChevron(),
        action: () => Linking.openURL(w.url),
      }))}
    />
  );
}

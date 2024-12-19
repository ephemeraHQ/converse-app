// TODO: move out of ConnectViaWallet
import { memo, useState } from "react";
import { ActivityIndicator } from "react-native";
import {
  useDisconnect as useThirdwebDisconnect,
  useSetActiveWallet as useSetThirdwebActiveWallet,
  useConnect as useThirdwebConnect,
  useActiveWallet as useThirdwebActiveWallet,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

import {
  InstalledWallet,
  useInstalledWallets,
} from "./ConnectViaWalletSupportedWallets";
import config from "../../../config";
import { getAccountsList } from "../../../data/store/accountsStore";
import { useAppStateHandlers } from "../../../hooks/useAppStateHandlers";
import { translate } from "../../../i18n";
import { getEthOSSigner } from "../../../utils/ethos";
import logger from "../../../utils/logger";
import { thirdwebClient } from "../../../utils/thirdweb";
import TableView, { TableViewItemType } from "../../TableView/TableView";
import { TableViewEmoji, TableViewImage } from "../../TableView/TableViewImage";
import { RightViewChevron } from "../../TableView/TableViewRightChevron";

export function getConnectViaWalletTableViewPasskeyItem(
  args: Partial<TableViewItemType>
): TableViewItemType {
  return {
    id: "passkey",
    leftView: <TableViewEmoji emoji="🔑" />,
    title: translate("walletSelector.converseAccount.connectViaPasskey"),
    rightView: <RightViewChevron />,
    ...args,
  };
}

export function getConnectViaWalletTableViewPrivateKeyItem(
  args: Partial<TableViewItemType>
): TableViewItemType {
  return {
    id: "privateKey",
    leftView: <TableViewEmoji emoji="🔑" />,
    title: translate("walletSelector.connectionOptions.connectViaKey"),
    rightView: <RightViewChevron />,
    ...args,
  };
}

export function getConnectViaWalletTableViewPhoneItem(
  args: Partial<TableViewItemType>
): TableViewItemType {
  return {
    id: "phone",
    leftView: <TableViewEmoji emoji="📞" />,
    title: translate("walletSelector.converseAccount.connectViaPhone"),
    rightView: <RightViewChevron />,
    ...args,
  };
}

export function getConnectViaWalletTableViewEphemeralItem(
  args: Partial<TableViewItemType>
): TableViewItemType {
  return {
    id: "ephemeral",
    leftView: <TableViewEmoji emoji="☁️" />,
    title: translate("walletSelector.converseAccount.createEphemeral"),
    rightView: <RightViewChevron />,
    ...args,
  };
}

export function getConnectViaWalletInstalledWalletTableViewItem(args: {
  wallet: InstalledWallet;
  tableViewItemArgs: Partial<TableViewItemType>;
}): TableViewItemType {
  const { wallet, tableViewItemArgs } = args;
  return {
    id: wallet.name,
    leftView: <TableViewImage imageURI={wallet.iconURL} />,
    title: translate("walletSelector.installedApps.connectWallet", {
      walletName: wallet.name,
    }),
    rightView: <RightViewChevron />,
    ...tableViewItemArgs,
  };
}

export const InstalledWalletsTableView = memo(
  function InstalledWalletsTableView(props: {
    onAccountExists: (arg: { address: string }) => void;
    onAccountDoesNotExist: (arg: { address: string }) => void;
  }) {
    const { onAccountExists, onAccountDoesNotExist } = props;

    const walletsInstalled = useInstalledWallets();

    const { connect: thirdwebConnect } = useThirdwebConnect();
    const { disconnect: disconnectThirdweb } = useThirdwebDisconnect();
    const thirdwebActiveWallet = useThirdwebActiveWallet();
    const setThirdwebActiveWallet = useSetThirdwebActiveWallet();

    const [isProcessingWalletId, setIsProcessingWalletId] = useState<
      string | null
    >(null);

    // In case the user came back to the app themselves
    useAppStateHandlers({
      onForeground: () => {
        setIsProcessingWalletId(null);
      },
    });

    return (
      <TableView
        title={translate("walletSelector.installedApps.title")}
        items={walletsInstalled.map((wallet) => ({
          id: wallet.name,
          leftView: <TableViewImage imageURI={wallet.iconURL} />,
          rightView:
            isProcessingWalletId === wallet.name ? (
              <ActivityIndicator />
            ) : (
              <RightViewChevron />
            ),
          title: translate("walletSelector.installedApps.connectWallet", {
            walletName: wallet.name,
          }),
          action: async () => {
            logger.debug(
              `[Onboarding] Clicked on wallet ${wallet.name} - opening external app`
            );

            setIsProcessingWalletId(wallet.name);

            if (thirdwebActiveWallet) {
              disconnectThirdweb(thirdwebActiveWallet);
            }

            try {
              let walletAddress: string = "";

              // Specific flow for Coinbase Wallet
              if (wallet.name === "Coinbase Wallet") {
                const wallet = await thirdwebConnect(async () => {
                  const coinbaseWallet = createWallet("com.coinbase.wallet", {
                    appMetadata: config.walletConnectConfig.appMetadata,
                    mobileConfig: {
                      callbackURL: `https://${config.websiteDomain}/coinbase`,
                    },
                  });
                  await coinbaseWallet.connect({ client: thirdwebClient });
                  setThirdwebActiveWallet(coinbaseWallet);
                  return coinbaseWallet;
                });

                if (!wallet) {
                  throw new Error("No coinbase wallet");
                }

                const account = wallet.getAccount();

                if (!account) {
                  throw new Error("No coinbase account found");
                }

                walletAddress = account.address;
              }
              // EthOS Wallet
              else if (wallet.name === "EthOS Wallet") {
                const signer = getEthOSSigner();
                if (!signer) {
                  throw new Error("No EthOS signer found");
                }
                walletAddress = await signer.getAddress();
              }
              // Generic flow for all other wallets
              else if (wallet.thirdwebId) {
                const walletConnectWallet = createWallet(wallet.thirdwebId);
                const account = await walletConnectWallet.connect({
                  client: thirdwebClient,
                  walletConnect: config.walletConnectConfig,
                });
                walletConnectWallet.getAccount();
                setThirdwebActiveWallet(walletConnectWallet);
                walletAddress = account.address;
              }

              if (getAccountsList().includes(walletAddress)) {
                onAccountExists({ address: walletAddress });
              } else {
                onAccountDoesNotExist({ address: walletAddress });
              }
            } catch (e: any) {
              logger.error("Error connecting to wallet:", e);
            } finally {
              setIsProcessingWalletId(null);
            }
          },
        }))}
      />
    );
  }
);

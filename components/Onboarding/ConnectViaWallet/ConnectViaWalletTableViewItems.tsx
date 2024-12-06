import AsyncStorage from "@react-native-async-storage/async-storage";
// TODO: move out of ConnectViaWallet
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native";
import {
  useDisconnect as useThirdwebDisconnect,
  useSetActiveWallet as useSetThirdwebActiveWallet,
  useConnect as useThirdwebConnect,
  useActiveWallet as useThirdwebActiveWallet,
} from "thirdweb/react";

import { useInstalledWallets } from "./ConnectViaWalletSupportedWallets";
import config from "../../../config";
import { getAccountsList } from "../../../data/store/accountsStore";
import { useAppStateHandlers } from "../../../hooks/useAppStateHandlers";
import { translate } from "../../../i18n";
import { getEthOSSigner } from "../../../utils/ethos";
import logger from "../../../utils/logger";
import { thirdwebClient, thirdwebWallets } from "../../../utils/thirdweb";
import TableView, { TableViewItemType } from "../../TableView/TableView";
import { TableViewEmoji, TableViewImage } from "../../TableView/TableViewImage";
import { RightViewChevron } from "../../TableView/TableViewRightChevron";
import { InstalledWallet, ISupportedWalletName } from "@utils/evm/wallets";

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
    onAccountDoesNotExist: (arg: { address: string; isSCW: boolean }) => void;
  }) {
    const { onAccountExists, onAccountDoesNotExist } = props;

    const walletsInstalled = useInstalledWallets();

    const { connect: thirdwebConnect } = useThirdwebConnect();
    const { disconnect: disconnectThirdweb } = useThirdwebDisconnect();

    const thirdwebActiveWallet = useThirdwebActiveWallet();
    const thirdwebActiveWalletRef = useRef(thirdwebActiveWallet);
    useEffect(() => {
      thirdwebActiveWalletRef.current = thirdwebActiveWallet;
    }, [thirdwebActiveWallet]);

    const setThirdwebActiveWallet = useSetThirdwebActiveWallet();

    const disconnectActiveThirdweb = useCallback(async () => {
      if (!thirdwebActiveWalletRef.current) return;
      disconnectThirdweb(thirdwebActiveWalletRef.current);
      // Wait for the disconnect to complete
      while (!!thirdwebActiveWalletRef.current) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }, [disconnectThirdweb]);

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
            const isSCW = !!wallet?.isSmartContractWallet;
            logger.debug(
              `[Onboarding] Clicked on wallet ${wallet.name} - ${
                isSCW ? "Opening web page" : "opening external app"
              }`
            );

            setIsProcessingWalletId(wallet.name);

            await disconnectActiveThirdweb();

            try {
              let walletAddress: string = "";

              // Specific flow for Coinbase Wallet
              if (wallet.thirdwebId === "com.coinbase.wallet") {
                const thirdwebWallet = await thirdwebConnect(async () => {
                  const coinbaseWallet =
                    thirdwebWallets[wallet.name as ISupportedWalletName];
                  await coinbaseWallet.connect({ client: thirdwebClient });
                  setThirdwebActiveWallet(coinbaseWallet);
                  return coinbaseWallet;
                });

                if (!thirdwebWallet) {
                  throw new Error("No coinbase wallet");
                }

                const account = thirdwebWallet.getAccount();

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
                const walletConnectWallet =
                  thirdwebWallets[wallet.name as ISupportedWalletName];
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
                onAccountDoesNotExist({
                  address: walletAddress,
                  isSCW,
                });
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

// TODO: move out of ConnectViaWallet
import { Signer } from "ethers";
import { memo } from "react";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { ethereum } from "thirdweb/chains";
import {
  useSetActiveWallet as useSetThirdwebActiveWallet,
  useConnect as useThirdwebConnect,
} from "thirdweb/react";
import { WalletId, createWallet } from "thirdweb/wallets";

import {
  InstalledWallet,
  useInstalledWallets,
} from "./ConnectViaWalletSupportedWallets";
import config from "../../../config";
import { getAccountsList } from "../../../data/store/accountsStore";
import { translate } from "../../../i18n";
import { getEthOSSigner } from "../../../utils/ethos";
import logger from "../../../utils/logger";
import { thirdwebClient } from "../../../utils/thirdweb";
import TableView, { TableViewItemType } from "../../TableView/TableView";
import { TableViewEmoji, TableViewImage } from "../../TableView/TableViewImage";
import { RightViewChevron } from "../../TableView/TableViewRightChevron";

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
    const setThirdwebActiveWallet = useSetThirdwebActiveWallet();

    return (
      <TableView
        title={translate("walletSelector.installedApps.title")}
        items={walletsInstalled.map((wallet) => ({
          id: wallet.name,
          leftView: <TableViewImage imageURI={wallet.iconURL} />,
          rightView: <RightViewChevron />,
          title: translate("walletSelector.installedApps.connectWallet", {
            walletName: wallet.name,
          }),
          action: async () => {
            const isSCW = wallet?.isSmartContractWallet;
            logger.debug(
              `[Onboarding] Clicked on wallet ${wallet.name} - ${
                isSCW ? "Opening web page" : "opening external app"
              }`
            );

            try {
              let walletAddress: string = "";

              // Specific flow for Coinbase Wallet
              if (wallet.thirdwebId === "com.coinbase.wallet") {
                const wallet = await thirdwebConnect(async () => {
                  const coinbaseWallet = createWallet("com.coinbase.wallet", {
                    appMetadata: config.walletConnectConfig.appMetadata,
                    mobileConfig: {
                      callbackURL: isSCW
                        ? `converse-dev://mobile-wallet-protocol`
                        : `https://${config.websiteDomain}/coinbase`,
                    },
                    walletConfig: {
                      options: isSCW ? "smartWalletOnly" : "eoaOnly",
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
            }
          },
        }))}
      />
    );
  }
);

export type InstalledWalletSignerAndAddress = {
  signer: Signer;
  address: string;
};

// TODO: find a way to use thirdwebConnect without having to pass it as a arg...
export const getCoinbaseSignerAndAddress = async (thirdwebConnect: any) => {
  const res = await thirdwebConnect(async () => {
    const coinbaseWallet = createWallet("com.coinbase.wallet", {
      appMetadata: config.walletConnectConfig.appMetadata,
      mobileConfig: {
        callbackURL: `https://dev.converse.xyz/coinbase`,
      },
    });
    await coinbaseWallet.connect({ client: thirdwebClient });
    return coinbaseWallet;
  });

  if (!res) {
    throw new Error("Failed to connect to Coinbase Wallet");
  }

  const account = res.getAccount();
  if (!account) {
    throw new Error("No coinbase account found");
  }

  const signer = await ethers5Adapter.signer.toEthers({
    client: thirdwebClient,
    chain: ethereum,
    account,
  });

  return {
    signer,
    address: account.address,
  } as InstalledWalletSignerAndAddress;
};

export const getEthOSWalletSignerAndAddress = async () => {
  const signer = getEthOSSigner();
  if (!signer) {
    throw new Error("No EthOS signer found");
  }
  const address = await signer.getAddress();
  return { signer, address } as InstalledWalletSignerAndAddress;
};

export const getThirdwebSignerAndAddress = async (thirdwebId: WalletId) => {
  const walletConnectWallet = createWallet(thirdwebId);
  const account = await walletConnectWallet.connect({
    client: thirdwebClient,
    walletConnect: config.walletConnectConfig,
  });
  const signer = await ethers5Adapter.signer.toEthers({
    client: thirdwebClient,
    chain: ethereum,
    account,
  });
  return {
    signer,
    address: account.address,
  } as InstalledWalletSignerAndAddress;
};

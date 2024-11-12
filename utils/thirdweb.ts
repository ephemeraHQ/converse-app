import { createThirdwebClient } from "thirdweb";

import config from "../config";
import { createWallet, Wallet, WalletId } from "thirdweb/wallets";
import { ISupportedWalletName, SUPPORTED_WALLETS } from "./evm/wallets";

const thirdwebGateway = `https://${config.thirdwebClientId}.ipfscdn.io`;

export const getIPFSAssetURI = (ipfsURI?: string) => {
  if (!ipfsURI) return ipfsURI;
  if (ipfsURI.startsWith("ipfs://")) {
    return `${thirdwebGateway}/ipfs/${ipfsURI.slice(7)}`;
  } else if (ipfsURI.startsWith("https://ipfs.infura.io/")) {
    // The public infura gateway is now deprecated, using thirdweb's instead
    return ipfsURI.replace("https://ipfs.infura.io/", `${thirdwebGateway}/`);
  }
  return ipfsURI;
};

export const thirdwebClient = createThirdwebClient({
  clientId: config.thirdwebClientId,
});

export const thirdwebWallets: Record<ISupportedWalletName, Wallet> =
  Object.fromEntries(
    Object.entries(SUPPORTED_WALLETS).map(([walletName, walletConfig]) => {
      if (!walletConfig.thirdwebId) {
        return [walletName, undefined];
      }

      let wallet: Wallet;

      if (walletName === "Coinbase Smart Wallet") {
        wallet = createWallet("com.coinbase.wallet", {
          appMetadata: config.walletConnectConfig.appMetadata,
          mobileConfig: {
            callbackURL: `https://${config.websiteDomain}/mobile-wallet-protocol`,
          },
          walletConfig: {
            options: "smartWalletOnly",
          },
        });
      } else if (walletName === "Coinbase Wallet") {
        wallet = createWallet("com.coinbase.wallet", {
          appMetadata: config.walletConnectConfig.appMetadata,
          mobileConfig: {
            callbackURL: `https://${config.websiteDomain}/coinbase`,
          },
          walletConfig: {
            options: "eoaOnly",
          },
        });
      } else {
        wallet = createWallet(walletConfig.thirdwebId);
      }

      return [walletName, wallet];
    })
  ) as Record<ISupportedWalletName, Wallet>;

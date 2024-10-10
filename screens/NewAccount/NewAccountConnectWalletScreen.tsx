import { memo } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import { ConnectViaWalletStoreProvider } from "../../components/Onboarding/ConnectViaWallet/connectViaWalletStore";

export const NewAccountConnectWalletScreen = memo(function () {
  return (
    <ConnectViaWalletStoreProvider>
      <NewAccountScreenComp>
        <ConnectViaWallet />
      </NewAccountScreenComp>
    </ConnectViaWalletStoreProvider>
  );
});

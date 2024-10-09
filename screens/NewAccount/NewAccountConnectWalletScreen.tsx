import { memo } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";

export const NewAccountConnectWalletScreen = memo(function () {
  return (
    <NewAccountScreenComp>
      <ConnectViaWallet />
    </NewAccountScreenComp>
  );
});

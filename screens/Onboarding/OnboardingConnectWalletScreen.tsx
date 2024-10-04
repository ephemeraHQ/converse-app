import ConnectViaWallet from "@components/Onboarding/ConnectViaWallet";

import { Screen } from "../../components/Screen/ScreenComp/Screen";

export function ConnectWalletScreen() {
  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]}>
      <ConnectViaWallet />
    </Screen>
  );
}

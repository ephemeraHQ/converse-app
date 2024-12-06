import logger from "@utils/logger";
import { useEffect } from "react";
// import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { getAccountsList } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { getXmtpClient } from "../../utils/xmtpRN/sync";
import { getInstalledWallets } from "../Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import { useAfterHydration } from "@/utils/useAfterHydration";
import {
  navigateToTopic,
  setTopicToNavigateTo,
  topicToNavigateTo,
} from "@/utils/navigation";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export default function HydrationStateHandler() {
  // Initial hydration
  useEffect(() => {
    const hydrate = async () => {
      const startTime = new Date().getTime();
      const accounts = getAccountsList();
      if (accounts.length === 0) {
        // Awaiting before showing onboarding
        await getInstalledWallets(false);
      } else {
        // note(lustig) I don't think this does anything?
        getInstalledWallets(false);
      }
      accounts.map((a) => getXmtpClient(a));

      // accounts.map((address) => {
      //   refreshProfileForAddress(address, address);
      // });

      useAppStore.getState().setHydrationDone(true);
      logger.debug(
        `[Hydration] Took ${
          (new Date().getTime() - startTime) / 1000
        } seconds total`
      );
    };
    hydrate();
  }, []);

  // useAfterHydration(() => {
  //   console.log("hydration is done");
  //   logger.debug("topic to navigate to: ", topicToNavigateTo);
  //   if (topicToNavigateTo) {
  //     navigateToTopic(topicToNavigateTo as ConversationTopic);
  //     setTopicToNavigateTo(undefined);
  //   }
  // });

  return null;
}

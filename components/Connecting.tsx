import { sentryTrackMessage } from "@utils/sentry";
import { useEffect, useRef } from "react";

import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";
import { currentAccount, useChatStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useSelect } from "../data/store/storeHelpers";

export const useShouldShowConnecting = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  const { localClientConnected, reconnecting } = useChatStore(
    useSelect(["localClientConnected", "reconnecting"])
  );

  const conditionTrueTime = useRef(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;

    if (!isInternetReachable || !localClientConnected || reconnecting) {
      if (conditionTrueTime.current === 0) {
        conditionTrueTime.current = Date.now();
      }

      interval = setInterval(() => {
        if (Date.now() - conditionTrueTime.current >= 15000) {
          sentryTrackMessage("Connecting has been show for 15 seconds", {
            isInternetReachable,
            localClientConnected,
            reconnecting,
            account: currentAccount(),
          });

          conditionTrueTime.current = 0;
          clearInterval(interval); // Clear interval after logging
        }
      }, 1000);
    } else {
      conditionTrueTime.current = 0;
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => clearInterval(interval);
  }, [isInternetReachable, localClientConnected, reconnecting]);

  return !isInternetReachable || !localClientConnected || reconnecting;
};

export const useShouldShowConnectingOrSyncing = () => {
  const { initialLoadDoneOnce, conversations } = useChatStore(
    useSelect(["initialLoadDoneOnce", "conversations"])
  );
  const shouldShowConnecting = useShouldShowConnecting();

  const conditionTrueTime = useRef(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;

    if (!initialLoadDoneOnce && Object.keys(conversations).length > 0) {
      if (conditionTrueTime.current === 0) {
        conditionTrueTime.current = Date.now();
      }

      interval = setInterval(() => {
        if (Date.now() - conditionTrueTime.current >= 15000) {
          sentryTrackMessage("Initial load has been running for 15 seconds", {
            account: currentAccount(),
          });

          conditionTrueTime.current = 0;
          clearInterval(interval); // Clear interval after logging
        }
      }, 1000);
    } else {
      conditionTrueTime.current = 0;
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => clearInterval(interval);
  }, [conversations, initialLoadDoneOnce]);

  return (
    shouldShowConnecting ||
    (!initialLoadDoneOnce && Object.keys(conversations).length > 0)
  );
};

export default function Connecting() {
  return <ActivityIndicator />;
}

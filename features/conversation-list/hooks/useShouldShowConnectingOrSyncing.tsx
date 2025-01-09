import { sentryTrackMessage } from "@utils/sentry";
import { useEffect, useRef } from "react";
import { useCurrentAccount } from "../../../data/store/accountsStore";
import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { useShouldShowConnecting } from "./useShouldShowConnecting";

export const useShouldShowConnectingOrSyncing = () => {
  const currentAccount = useCurrentAccount();
  const { isLoading } = useConversationListQuery({ account: currentAccount! });
  const initialLoadDoneOnce = !isLoading;
  const shouldShowConnecting = useShouldShowConnecting();

  const conditionTrueTime = useRef(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;

    if (!initialLoadDoneOnce) {
      if (conditionTrueTime.current === 0) {
        conditionTrueTime.current = Date.now();
      }

      interval = setInterval(() => {
        if (Date.now() - conditionTrueTime.current >= 15000) {
          sentryTrackMessage("Initial load has been running for 15 seconds");

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
  }, [initialLoadDoneOnce]);

  return shouldShowConnecting.shouldShow || !initialLoadDoneOnce;
};

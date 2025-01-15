import { sentryTrackMessage } from "@/utils/sentry";
import { useEffect, useRef, useState } from "react";
import { useDebugEnabled } from "@/components/DebugButton";
import { useChatStore } from "@/data/store/accountsStore";
import { useAppStore } from "@/data/store/appStore";
import { useSelect } from "@/data/store/storeHelpers";

export const useShouldShowConnecting = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  const { reconnecting } = useChatStore(useSelect(["reconnecting"]));
  const debugEnabled = useDebugEnabled();

  const conditionTrueTime = useRef(0);
  const [warnMessage, setWarnMessage] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;

    if (!isInternetReachable || reconnecting) {
      if (conditionTrueTime.current === 0) {
        conditionTrueTime.current = Date.now();
      }

      interval = setInterval(() => {
        if (Date.now() - conditionTrueTime.current >= 15000) {
          sentryTrackMessage("Connecting has been show for 15 seconds", {
            isInternetReachable,
            reconnecting,
          });

          // Display warn messages for debug addresses only
          if (debugEnabled) {
            if (!isInternetReachable) {
              setWarnMessage("Waiting for network");
            } else if (reconnecting) {
              setWarnMessage("Reconnecting");
            }
          }

          conditionTrueTime.current = 0;
          clearInterval(interval); // Clear interval after logging
        }
      }, 1000);
    } else {
      conditionTrueTime.current = 0;
      setWarnMessage(null);
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => clearInterval(interval);
  }, [isInternetReachable, reconnecting, debugEnabled]);

  const shouldShow = !isInternetReachable || reconnecting;

  return { shouldShow, warnMessage };
};

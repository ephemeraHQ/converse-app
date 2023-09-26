import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef } from "react";

import { useAppStore } from "../../data/store/appStore";
import { pick } from "../../utils/objects";

NetInfo.configure({
  reachabilityUrl: "https://production.xmtp.network/message/v1/query",
  reachabilityMethod: "GET",
  reachabilityTest: async (response) => {
    return response.status === 501;
  },
});

export default function NetworkStateHandler() {
  const { isInternetReachable, setIsInternetReachable } = useAppStore((s) =>
    pick(s, ["isInternetReachable", "setIsInternetReachable"])
  );

  const reachableRef = useRef(isInternetReachable);
  useEffect(() => {
    reachableRef.current = isInternetReachable;
  }, [isInternetReachable]);

  useEffect(() => {
    const unsubscribeNetworkInfo = NetInfo.addEventListener((netState) => {
      const reachable = !!netState.isInternetReachable;
      if (reachable !== reachableRef.current) {
        setIsInternetReachable(reachable);
      }
    });

    return () => {
      unsubscribeNetworkInfo();
    };
  }, [setIsInternetReachable]);
  return null;
}

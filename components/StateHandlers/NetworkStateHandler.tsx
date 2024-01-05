import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef } from "react";

import { useAppStore } from "../../data/store/appStore";
import { useSelect } from "../../data/store/storeHelpers";

NetInfo.configure({
  reachabilityUrl: "https://production.xmtp.network",
  reachabilityMethod: "HEAD",
  reachabilityTest: async (response) => {
    return response.status === 200;
  },
});

export default function NetworkStateHandler() {
  const { isInternetReachable, setIsInternetReachable } = useAppStore(
    useSelect(["isInternetReachable", "setIsInternetReachable"])
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

import NetInfo from "@react-native-community/netinfo";
import { useContext, useEffect } from "react";

import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";

export default function NetworkStateHandler() {
  const { state, dispatch } = useContext(AppContext);
  useEffect(() => {
    const unsubscribeNetworkInfo = NetInfo.addEventListener((netState) => {
      const reachable = !!netState.isInternetReachable;
      if (reachable !== state.app.isInternetReachable) {
        console.log({ reachable });
        dispatch({
          type: AppDispatchTypes.AppSetInternetReachable,
          payload: { reachable: !!netState.isInternetReachable },
        });
      }
    });

    return () => {
      unsubscribeNetworkInfo();
    };
  }, [dispatch, state.app.isInternetReachable]);
  return null;
}

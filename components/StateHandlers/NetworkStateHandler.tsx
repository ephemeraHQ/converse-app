import NetInfo from "@react-native-community/netinfo";
import { useContext, useEffect, useRef } from "react";

import { AppDispatchTypes } from "../../data/deprecatedStore/appReducer";
import { AppContext } from "../../data/deprecatedStore/context";

export const refreshNetworkState = NetInfo.refresh;

export default function NetworkStateHandler() {
  const { state, dispatch } = useContext(AppContext);

  const reachableRef = useRef(state.app.isInternetReachable);
  useEffect(() => {
    reachableRef.current = state.app.isInternetReachable;
  }, [state.app.isInternetReachable]);

  useEffect(() => {
    const unsubscribeNetworkInfo = NetInfo.addEventListener((netState) => {
      const reachable = !!netState.isInternetReachable;
      if (reachable !== reachableRef.current) {
        dispatch({
          type: AppDispatchTypes.AppSetInternetReachable,
          payload: { reachable },
        });
      }
    });

    return () => {
      unsubscribeNetworkInfo();
    };
  }, [dispatch]);
  return null;
}

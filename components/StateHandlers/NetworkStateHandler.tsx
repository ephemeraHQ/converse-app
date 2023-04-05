import NetInfo from "@react-native-community/netinfo";
import { useContext, useEffect, useRef } from "react";

import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";

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
  }, [dispatch]);
  return null;
}

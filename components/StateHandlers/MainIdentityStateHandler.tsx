import { useContext, useEffect } from "react";

import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";
import { getProfileForAddress, saveUser } from "../../utils/api";

export default function MainIdentityStateHandler() {
  const { state, dispatch } = useContext(AppContext);

  useEffect(() => {
    if (state.xmtp.address) {
      saveUser(state.xmtp.address);
      getProfileForAddress(state.xmtp.address)
        .then((result) => {
          if (result.primaryEns) {
            dispatch({
              type: AppDispatchTypes.AppSetMainIdentity,
              payload: { identity: result.primaryEns },
            });
          } else {
            dispatch({
              type: AppDispatchTypes.AppSetMainIdentity,
              payload: { identity: "" },
            });
          }
        })
        .catch((e) => {
          console.log(e);
          dispatch({
            type: AppDispatchTypes.AppSetMainIdentity,
            payload: { identity: "" },
          });
        });
    } else {
      dispatch({
        type: AppDispatchTypes.AppSetMainIdentity,
        payload: { identity: "" },
      });
    }
  }, [state.xmtp.address, dispatch]);

  return null;
}

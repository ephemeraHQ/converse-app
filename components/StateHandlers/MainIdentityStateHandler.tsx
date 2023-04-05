import { useContext, useEffect } from "react";

import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";
import { saveUser } from "../../utils/api";
import { ethProvider } from "../../utils/eth";

export default function MainIdentityStateHandler() {
  const { state, dispatch } = useContext(AppContext);

  useEffect(() => {
    if (state.xmtp.address) {
      saveUser(state.xmtp.address);
      ethProvider
        .lookupAddress(state.xmtp.address)
        .then((result) => {
          if (result) {
            dispatch({
              type: AppDispatchTypes.AppSetMainIdentity,
              payload: { identity: result },
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

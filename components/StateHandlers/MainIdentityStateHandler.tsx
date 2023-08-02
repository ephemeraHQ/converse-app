import { useContext, useEffect } from "react";

import { refreshProfileForAddress } from "../../data";
import { AppContext } from "../../data/deprecatedStore/context";
import { saveUser } from "../../utils/api";

export default function MainIdentityStateHandler() {
  const { state, dispatch } = useContext(AppContext);

  useEffect(() => {
    if (state.xmtp.address) {
      saveUser(state.xmtp.address);
      refreshProfileForAddress(state.xmtp.address);
    }
  }, [state.xmtp.address, dispatch]);

  return null;
}

import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { usePrivyAccessToken, usePrivySigner } from "@utils/evm/privy";
import { useEffect, useRef } from "react";

import { usePrivyConnectStore } from "./privyAuthStore";
import { initXmtpClient } from "../../../components/Onboarding/init-xmtp-client";
import { sentryTrackError } from "../../../utils/sentry";

export function usePrivyConnection() {
  const { isReady: privyReady, user: privyUser, logout } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const privyAccountId = usePrivyConnectStore((state) => state.privyAccountId);
  const privySigner = usePrivySigner(true);
  const privyAccessToken = usePrivyAccessToken();
  const creatingEmbeddedWallet = useRef(false);

  useEffect(() => {
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const createWallet = async () => {
      if (
        privyUser &&
        embeddedWallet.status === "not-created" &&
        privyReady &&
        !creatingEmbeddedWallet.current
      ) {
        creatingEmbeddedWallet.current = true;
        await embeddedWallet.create();
      }
    };
    createWallet();
  }, [embeddedWallet, privyReady, privyUser]);

  useEffect(() => {
    const initializeXmtp = async () => {
      try {
        if (privySigner && privyAccessToken && privyAccountId) {
          await initXmtpClient({
            signer: privySigner,
            address: await privySigner.getAddress(),
            connectionMethod: "phone",
            privyAccountId,
            isEphemeral: false,
            pkPath: "",
          });
        }
      } catch (error) {
        sentryTrackError(error);
      }
    };

    initializeXmtp();
  }, [privyAccessToken, privyAccountId, privySigner]);

  return {
    privyReady,
    privyUser,
    privySigner,
    privyAccessToken,
    privyAccountId,
  };
}

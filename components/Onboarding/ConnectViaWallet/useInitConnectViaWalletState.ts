import { getDatabaseFilesForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { Signer } from "ethers";
import { useEffect, useRef, useState } from "react";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { ethereum } from "thirdweb/chains";
import {
  useActiveAccount as useThirdwebActiveAccount,
  useActiveWallet as useThirdwebActiveWallet,
} from "thirdweb/react";

import { useConnectViaWalletContext } from "./ConnectViaWallet.context";
import { ensureError } from "../../../utils/error";
import { thirdwebClient } from "../../../utils/thirdweb";
import { isOnXmtp } from "../../../utils/xmtpRN/client";
import { getInboxId } from "../../../utils/xmtpRN/signIn";

/**
 * For now let's keep Thirdweb and the hooks because I haven't found a better way to do it.
 * But ideally a lot of this it outside React.
 * This function is for initializing the state of the wallet. V3? XMTP? etc...
 */
export function useInitConnectViaWalletState(args: { address: string }) {
  const { address } = args;

  const { onErrorConnecting } = useConnectViaWalletContext();

  const [isInitializing, setIsInitializing] = useState(true);
  const [onXmtp, setOnXmtp] = useState(false);
  const [alreadyV3Db, setAlreadyV3Db] = useState(false);
  const [signer, setSigner] = useState<Signer | undefined>();

  const thirdwebWallet = useThirdwebActiveWallet();
  const thirdwebAccount = useThirdwebActiveAccount();

  const [thirdwebSigner, setThirdwebSigner] = useState<Signer | undefined>();

  const isInitializingRef = useRef(false);
  const hasInitizalizedRef = useRef(false);

  useEffect(() => {
    if (!thirdwebAccount) {
      logger.debug(
        "[Connect Wallet] No thirdweb account available yet to get signer"
      );
      return;
    }

    logger.debug("[Connect Wallet] Getting thirdweb signer");

    ethers5Adapter.signer
      .toEthers({
        client: thirdwebClient,
        chain: ethereum,
        account: thirdwebAccount,
      })
      .then(setThirdwebSigner)
      .catch((error) => {
        onErrorConnecting({ error: ensureError(error) });
      });
  }, [onErrorConnecting, thirdwebAccount]);

  useEffect(() => {
    if (!thirdwebSigner) {
      logger.debug("[Connect Wallet] No thirdweb signer available yet");
      return;
    }

    if (isInitializingRef.current) {
      logger.debug("[Connect Wallet] Already initializing wallet");
      return;
    }

    if (hasInitizalizedRef.current) {
      logger.debug("[Connect Wallet] Already initialized wallet");
      return;
    }

    const initializeWallet = async () => {
      try {
        logger.debug("[Connect Wallet] Initializing wallet");

        isInitializingRef.current = true;

        setIsInitializing(true);

        const [isOnNetwork, inboxId] = await Promise.all([
          isOnXmtp(address),
          getInboxId(address),
        ]);

        const v3Dbs = await getDatabaseFilesForInboxId(inboxId);
        const hasV3 = v3Dbs.filter((n) => n.name.endsWith(".db3")).length > 0;

        setOnXmtp(isOnNetwork);
        setAlreadyV3Db(hasV3);
        setSigner(thirdwebSigner);

        logger.debug(
          `[Connect Wallet] User connected wallet ${thirdwebWallet?.id} (${address}). ${
            isOnNetwork ? "Already" : "Not yet"
          } on XMTP. V3 database ${hasV3 ? "already" : "not"} present`
        );
      } catch (error) {
        logger.error("[Connect Wallet] Error initializing wallet:", error);
        onErrorConnecting({ error: ensureError(error) });
      } finally {
        hasInitizalizedRef.current = true;
        isInitializingRef.current = false;
        setIsInitializing(false);
      }
    };

    initializeWallet();
  }, [
    address,
    setIsInitializing,
    thirdwebWallet,
    thirdwebSigner,
    onErrorConnecting,
  ]);

  return { isInitializing, onXmtp, alreadyV3Db, signer };
}

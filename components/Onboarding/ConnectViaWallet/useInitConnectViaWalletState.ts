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
import { thirdwebClient } from "../../../utils/thirdweb";
import { isOnXmtp } from "../../../utils/xmtpRN/client";
import { getInboxId } from "../../../utils/xmtpRN/signIn";

// For now let's keep Thirdweb and the hooks because I haven't found a better way to do it.
// But ideally a lot of this it outside React.
export function useInitConnectViaWalletState(args: {
  address: string;
  isSCW: boolean;
}) {
  const { address, isSCW } = args;

  const { onErrorConnecting } = useConnectViaWalletContext();

  const [isInitializing, setIsInitializing] = useState(true);
  const [onXmtp, setOnXmtp] = useState(false);
  const [alreadyV3Db, setAlreadyV3Db] = useState(false);
  const [signer, setSigner] = useState<Signer | undefined>();

  const thirdwebWallet = useThirdwebActiveWallet();
  const thirdwebAccount = useThirdwebActiveAccount();

  const [thirdwebSigner, setThirdwebSigner] = useState<Signer | undefined>();

  const handlingThirdwebSigner = useRef(false);

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
      .catch(onErrorConnecting);
  }, [onErrorConnecting, thirdwebAccount]);

  useEffect(() => {
    if (!thirdwebSigner) {
      logger.debug("[Connect Wallet] No thirdweb signer available yet");
      return;
    }

    if (handlingThirdwebSigner.current) {
      logger.debug("[Connect Wallet] Already handling thirdweb signer");
      return;
    }

    const initializeWallet = async () => {
      try {
        logger.debug("[Connect Wallet] Initializing wallet");

        handlingThirdwebSigner.current = true;

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
          `[Connect Wallet] User connected ${
            isSCW ? "SCW" : "EOA"
          } wallet ${thirdwebWallet?.id} (${address}). ${
            isOnNetwork ? "Already" : "Not yet"
          } on XMTP. V3 database ${hasV3 ? "already" : "not"} present`
        );
      } catch (error) {
        logger.error("Error initializing wallet:", error);
      } finally {
        handlingThirdwebSigner.current = false;
        setIsInitializing(false);
      }
    };

    initializeWallet();
  }, [address, setIsInitializing, thirdwebWallet, thirdwebSigner, isSCW]);

  return { isInitializing, onXmtp, alreadyV3Db, signer };
}

import logger from "@utils/logger";
import { useEffect, useState } from "react";

import {
  ConverseXmtpClientType,
  xmtpClientByAccount,
} from "../utils/xmtpRN/client";
import { getXmtpClient } from "../utils/xmtpRN/sync";

// Stateful way to access the client
export const useClient = (account: string) => {
  const [client, setClient] = useState<ConverseXmtpClientType | null>(
    xmtpClientByAccount[account] ?? null
  );

  useEffect(() => {
    if (account && !client) {
      getXmtpClient(account)
        .then((newClient) => {
          setClient(newClient as ConverseXmtpClientType);
        })
        .catch((e) => {
          logger.error(e);
          setClient(null);
        });
      setClient(xmtpClientByAccount[account]);
    }
  }, [account, client]);

  return client;
};

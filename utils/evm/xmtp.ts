import { useCurrentAccount } from "@features/accounts/accounts.store";
import { translate } from "@i18n";
import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { useCallback } from "react";
import { Alert } from "react-native";

import { useExternalSigner } from "./external";
import { usePrivySigner } from "./privy";

/**
 * XMTP Signer for XMTP operations like
 * revoking installations
 */
export const useXmtpSigner = () => {
  const account = useCurrentAccount() as string;
  const privySigner = usePrivySigner();
  const { getExternalSigner, resetExternalSigner } = useExternalSigner();
  const getXmtpSigner = useCallback(
    async (title?: string, subtitle?: string) => {
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

      if (privySigner) {
        const privyAddress = await privySigner.getAddress();
        if (privyAddress.toLowerCase() === client.address.toLowerCase()) {
          return privySigner;
        }
      }

      const externalSigner = await getExternalSigner(title, subtitle);
      if (!externalSigner) return;
      const externalAddress = await externalSigner.getAddress();
      if (externalAddress.toLowerCase() !== client.address.toLowerCase()) {
        Alert.alert(
          translate("xmtp_wrong_signer"),
          translate("xmtp_wrong_signer_description")
        );
        resetExternalSigner();
        return;
      }
      return externalSigner;
    },
    [account, getExternalSigner, privySigner, resetExternalSigner]
  );
  return { getXmtpSigner };
};

import { translate } from "@i18n";
import { useCallback } from "react";
import { Alert } from "react-native";

import { useExternalSigner } from "./external";
import { getXmtpClient } from "../xmtpRN/conversations";
import { ConverseXmtpClientType } from "../xmtpRN/client.types";

/**
 * XMTP Signer for XMTP operations like
 * revoking installations
 */
export const useXmtpSigner = () => {
  const { getExternalSigner, resetExternalSigner } = useExternalSigner();

  const getXmtpSigner = useCallback(async () => {
    const client = (await getXmtpClient({
      caller: "getXmtpSigner",
      ifNotFoundStrategy: "throw",
    })) as ConverseXmtpClientType;

    const externalSigner = await getExternalSigner();
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
  }, [getExternalSigner, resetExternalSigner]);
  return { getXmtpSigner };
};

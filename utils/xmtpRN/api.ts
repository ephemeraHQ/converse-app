import * as secp from "@noble/secp256k1";
import { privateKey, signature } from "@xmtp/proto";

import { loadXmtpKey } from "../keychain/helpers";

export const xmtpSignatureByAccount: { [account: string]: string } = {};

const getXmtpApiSignature = async (account: string, message: string) => {
  const messageToSign = Buffer.from(message);
  const base64Key = await loadXmtpKey(account);
  if (!base64Key)
    throw new Error(`Cannot create signature for ${account}: no key found`);

  const privateKeyBundle = privateKey.PrivateKeyBundle.decode(
    Buffer.from(base64Key, "base64")
  );
  const privateKeySecp256k1 =
    privateKeyBundle.v1?.identityKey?.secp256k1 ||
    privateKeyBundle.v2?.identityKey?.secp256k1;
  if (!privateKeySecp256k1)
    throw new Error("Could not extract private key from private key bundle");

  const [signedBytes, recovery] = await secp.sign(
    messageToSign,
    privateKeySecp256k1.bytes,
    {
      recovered: true,
      der: false,
    }
  );
  const signatureProto = signature.Signature.fromPartial({
    ecdsaCompact: { bytes: signedBytes, recovery },
  });
  const encodedSignature = Buffer.from(
    signature.Signature.encode(signatureProto).finish()
  ).toString("base64");
  return encodedSignature;
};

export const getXmtpApiHeaders = async (account: string) => {
  if (account in xmtpSignatureByAccount)
    return {
      "xmtp-api-signature": xmtpSignatureByAccount[account],
      "xmtp-api-address": account,
    };
  const xmtpApiSignature = await getXmtpApiSignature(account, "XMTP_IDENTITY");
  xmtpSignatureByAccount[account] = xmtpApiSignature;
  return {
    "xmtp-api-signature": xmtpApiSignature,
    "xmtp-api-address": account,
  };
};

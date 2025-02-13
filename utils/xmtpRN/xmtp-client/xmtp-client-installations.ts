import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { toHex } from "viem";

export type InstallationSignature = {
  installationPublicKey: string;
  appCheckTokenSignature: string;
};

export async function getInstallationKeySignature(
  account: string,
  message: string
): Promise<InstallationSignature> {
  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: account,
  });

  if (!client) throw new Error("Client not found");

  const rawAppCheckTokenSignatureByteArray =
    await client.signWithInstallationKey(appCheckToken);

  return {
    installationPublicKey: account,
    appCheckTokenSignature: toHex(rawAppCheckTokenSignatureByteArray),
  };
}

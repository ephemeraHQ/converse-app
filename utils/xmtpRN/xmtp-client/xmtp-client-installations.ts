import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";

export type InstallationSignature = {
  installationPublicKey: string;
  appCheckTokenSignature: string;
};

export async function getInstallationKeySignature(
  account: string,
  appCheckToken: string
): Promise<InstallationSignature> {
  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: account,
  });

  if (!client) throw new Error("Client not found");

  const raw = await client.signWithInstallationKey(appCheckToken);

  return {
    installationPublicKey: account,
    appCheckTokenSignature: Buffer.from(raw).toString("hex"),
  };
}

import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";

export type InstallationSignature = {
  installationPublicKey: string;
  installationKeySignature: string;
};

export async function getInstallationKeySignature(
  account: string,
  message: string
): Promise<InstallationSignature> {
  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: account,
  });

  if (!client) throw new Error("Client not found");

  const raw = await client.signWithInstallationKey(message);

  return {
    installationPublicKey: client.installationId,
    installationKeySignature: Buffer.from(raw).toString("hex"),
  };
}

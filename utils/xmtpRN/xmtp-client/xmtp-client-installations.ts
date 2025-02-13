import {
  getSafeCurrentSender,
  useAccountStore,
} from "@/features/authentication/account.store";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";

export type InstallationSignature = {
  installationPublicKey: string;
  appCheckTokenSignature: string;
};

export async function getInstallationKeySignature(
  appCheckToken: string
): Promise<InstallationSignature> {
  const currentSender = getSafeCurrentSender();

  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: currentSender.ethereumAddress,
  });

  if (!client) throw new Error("Client not found");

  const raw = await client.signWithInstallationKey(appCheckToken);

  return {
    installationPublicKey: currentSender.ethereumAddress,
    appCheckTokenSignature: Buffer.from(raw).toString("hex"),
  };
}

import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { InboxSigner } from "@/features/multi-inbox/multi-inbox-client.types";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { RELYING_PARTY } from "@/features/onboarding/passkey.constants";

export function createSmartWalletSigner(
  smartWalletClient: NonNullable<ReturnType<typeof useSmartWallets>["client"]>
): InboxSigner {
  return {
    getAddress: async () => smartWalletClient.account.address,
    getChainId: () => smartWalletClient.chain?.id,
    getBlockNumber: () => undefined,
    walletType: () => "SCW",
    signMessage: async (message: string) =>
      smartWalletClient.signMessage({ message }),
  };
}

export async function createInboxWithSigner(signer: InboxSigner) {
  return MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet({
    inboxSigner: signer,
  });
}

export { RELYING_PARTY };

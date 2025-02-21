import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store";
import { createXmtpClientInstance } from "@/features/xmtp/xmtp-client/xmtp-client";
import { validateClientInstallation } from "@/features/xmtp/xmtp-installations/xmtp-installations";
import { IXmtpSigner } from "@/features/xmtp/xmtp.types";
import { queryClient } from "@/queries/queryClient";
import { enhanceError } from "@/utils/error";
import {
  getXmtpClientQueryOptions,
  setXmtpClientQueryData,
} from "./xmtp-client.query";

export async function getXmtpClient(args: { ethAddress: string }) {
  return queryClient.ensureQueryData(getXmtpClientQueryOptions(args));
}

export async function createXmtpClient(args: { inboxSigner: IXmtpSigner }) {
  const { inboxSigner } = args;

  const ethAddress = await inboxSigner.getAddress();

  const client = await createXmtpClientInstance({
    inboxSigner: args.inboxSigner,
  });

  const isValid = await validateClientInstallation({
    client,
  });

  setXmtpClientQueryData({
    ethAddress,
    client,
  });

  if (!isValid) {
    throw new Error("Invalid client installation");
  }

  return client;
}

// Helper function while in lots of places we get the Xmtp client using the ethereum address
export async function getXmtpClientByEthAddress(args: {
  ethereumAddress: string;
}) {
  const { ethereumAddress } = args;

  const sender = useMultiInboxStore
    .getState()
    .senders.find((s) => s.ethereumAddress === ethereumAddress);

  if (!sender) {
    throw new Error(`No sender found for address: ${ethereumAddress}`);
  }

  try {
    return getXmtpClient({
      ethAddress: sender.ethereumAddress,
    });
  } catch (error) {
    throw enhanceError(
      error,
      `Failed to get or create XMTP client for address: ${ethereumAddress}`,
    );
  }
}

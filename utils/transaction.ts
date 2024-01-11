import { Transaction } from "../data/store/transactionsStore";
import { isContentType } from "./xmtpRN/contentTypes";
import { TransactionReference } from "./xmtpRN/contentTypes/transactionReference";

export const isTransactionMessage = (contentType?: string) =>
  contentType
    ? isContentType("transactionReference", contentType) ||
      isContentType("coinbasePayment", contentType)
    : false;

export const mergeTransactionRefData = (
  txRef: TransactionReference,
  details: any
): Transaction => {
  return {
    id: `${txRef.networkId}-${txRef.reference}`,
    contentType: "transactionReference",
    createdAt: details.createdAt || Date.now(),
    updatedAt: details.updatedAt || Date.now(),
    namespace: txRef.namespace,
    networkId: txRef.networkId,
    reference: txRef.reference,
    metadata: txRef.metadata as any,
    status: details.status,
    sponsored: details.sponsored || false,
    blockExplorerURL: details.blockExplorerURL,
    events: details.events || [],
  };
};

export const isTransactionRefValid = (messageContent: string): boolean => {
  let txRef;

  // Try to parse the JSON content
  try {
    txRef = JSON.parse(messageContent);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return false;
  }

  // Check if the mandatory fields 'networkId' and 'reference' are present and of correct types
  if (
    typeof txRef.networkId !== "string" &&
    typeof txRef.networkId !== "number"
  ) {
    return false;
  }

  if (typeof txRef.reference !== "string") {
    return false;
  }

  return true;
};

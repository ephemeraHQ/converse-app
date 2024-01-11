import { Transaction } from "../data/store/transactionsStore";
import { isContentType } from "./xmtpRN/contentTypes";
import { TransactionReference } from "./xmtpRN/contentTypes/transactionReference";

export const isTransactionMessage = (contentType?: string) =>
  contentType
    ? isContentType("transactionReference", contentType) ||
      isContentType("coinbasePayment", contentType)
    : false;

export const mergeTransactionRefData = (
  transactionRef: TransactionReference,
  details: any
): Transaction => {
  return {
    id: `${transactionRef.networkId}-${transactionRef.reference}`,
    contentType: "transactionReference",
    createdAt: details.createdAt || Date.now(),
    updatedAt: details.updatedAt || Date.now(),
    namespace: transactionRef.namespace,
    networkId: transactionRef.networkId,
    reference: transactionRef.reference,
    metadata: transactionRef.metadata as any,
    status: details.status,
    sponsored: details.sponsored || false,
    blockExplorerURL: details.blockExplorerURL,
    events: details.events || [],
  };
};

export const isTransactionRefValid = (messageContent: string): boolean => {
  let parsedContent;

  // Try to parse the JSON content
  try {
    parsedContent = JSON.parse(messageContent);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return false;
  }

  // Check if the mandatory fields 'networkId' and 'reference' are present and of correct types
  if (
    typeof parsedContent.networkId !== "string" &&
    typeof parsedContent.networkId !== "number"
  ) {
    return false;
  }

  if (typeof parsedContent.reference !== "string") {
    return false;
  }

  return true;
};

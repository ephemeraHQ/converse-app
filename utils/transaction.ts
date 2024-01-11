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

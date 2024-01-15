import { Transaction } from "../data/store/transactionsStore";
import { isContentType } from "./xmtpRN/contentTypes";
import { TransactionReference } from "./xmtpRN/contentTypes/transactionReference";

export interface TransactionEvent {
  amount: string;
  contractAddress: string;
  currency: string;
  decimals: number;
  from: string;
  to: string;
  type: string;
}

export interface TransactionDetails {
  blockExplorerURL: string;
  chainName: string;
  events: TransactionEvent[];
  sponsored: boolean;
  status: "PENDING" | "FAILURE" | "SUCCESS";
}

export const isTransactionMessage = (contentType?: string) =>
  contentType
    ? isContentType("transactionReference", contentType) ||
      isContentType("coinbasePayment", contentType)
    : false;

export const mergeTransactionRefData = (
  txRef: TransactionReference,
  txDetails: TransactionDetails
): Transaction => {
  return {
    id: `${txRef.networkId}-${txRef.reference}`,
    contentType: "transactionReference",
    namespace: txRef.namespace,
    networkId: txRef.networkId,
    reference: txRef.reference,
    metadata: txRef.metadata,
    status: txDetails.status,
    sponsored: txDetails.sponsored || false,
    blockExplorerURL: txDetails.blockExplorerURL,
    events: txDetails.events || [],
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

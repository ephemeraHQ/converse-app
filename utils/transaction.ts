import { ethers } from "ethers";

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
  transactionHash: string;
}

export const isTransactionMessage = (contentType?: string) =>
  contentType
    ? isContentType("transactionReference", contentType) ||
      isContentType("coinbasePayment", contentType)
    : false;

export const mergeTransactionRefData = (
  contentType: "transactionReference" | "coinbaseRegular" | "coinbaseSponsored",
  txRef: TransactionReference,
  txRefId: string,
  txDetails: TransactionDetails
): Transaction => {
  return {
    id: txRefId,
    contentType,
    namespace: txRef.namespace,
    networkId: txRef.networkId,
    reference: txRef.reference,
    metadata: txRef.metadata || {},
    status: txDetails.status,
    sponsored: txDetails.sponsored || false,
    blockExplorerURL: txDetails.blockExplorerURL,
    events: txDetails.events || [],
    chainName: txDetails.chainName,
  };
};

export const extractChainIdToHex = (networkRawValue: string): string => {
  const match = networkRawValue.match(/ETHEREUM_CHAIN:(\d+)/);
  const extractedChainId = match ? match[1] : "";
  const chainId = ethers.BigNumber.from(extractedChainId);
  return chainId._hex;
};

export const getTxContentType = (
  input: TransactionReference | any
):
  | "transactionReference"
  | "coinbaseRegular"
  | "coinbaseSponsored"
  | undefined => {
  if ("networkId" in input && "reference" in input) {
    // Has keys specific to TransactionReference
    return "transactionReference";
  } else if ("transactionHash" in input) {
    // Has key specific to coinbaseRegular
    return "coinbaseRegular";
  } else if ("sponsoredTxId" in input) {
    // Has key specific to coinbaseSponsored
    return "coinbaseSponsored";
  }
  return undefined;
};

export const getTxRefId = (
  txRef: TransactionReference | any,
  txContentType:
    | "transactionReference"
    | "coinbaseRegular"
    | "coinbaseSponsored"
): string => {
  let networkId;

  if (
    txContentType === "coinbaseRegular" ||
    txContentType === "coinbaseSponsored"
  ) {
    networkId = extractChainIdToHex(txRef.network.rawValue);
  }

  switch (txContentType) {
    case "transactionReference":
      return `${txRef.networkId}-${txRef.reference}`;
    case "coinbaseRegular":
      return `${networkId}-${txRef.transactionHash}`;
    case "coinbaseSponsored":
      return `${networkId}-${txRef.sponsoredTxId}`;
  }
};

export function createUniformTransaction(
  input: TransactionReference | any,
  txDetails: TransactionDetails
): Transaction {
  const contentType = getTxContentType(input);
  let transaction: Transaction;

  if (contentType) {
    const txRefId = getTxRefId(input, contentType);

    switch (contentType) {
      case "transactionReference":
        transaction = mergeTransactionRefData(
          contentType,
          input,
          txRefId,
          txDetails
        );
        break;
      case "coinbaseRegular":
        transaction = mergeTransactionRefData(
          contentType,
          {
            networkId: extractChainIdToHex(input.network.rawValue),
            reference: input.transactionHash,
          } as TransactionReference,
          txRefId,
          txDetails
        );
        break;
      case "coinbaseSponsored":
        transaction = mergeTransactionRefData(
          contentType,
          {
            networkId: extractChainIdToHex(input.network.rawValue),
            reference: txDetails.transactionHash,
          } as TransactionReference,
          txRefId,
          txDetails
        );
        break;
      default:
        throw new Error("Invalid content type");
    }

    return transaction;
  } else {
    throw new Error("Content type could not be determined");
  }
}

export const formatAmount = (
  event: TransactionEvent,
  useCurrencySymbol: boolean = true
): string => {
  const { amount, currency, decimals } = event;
  const actualAmount = Number(amount) / Math.pow(10, decimals);

  // Format as dollars, showing decimals only if necessary
  const formattedAmount =
    actualAmount % 1 === 0 ? actualAmount.toFixed(0) : actualAmount.toFixed(2);

  if (useCurrencySymbol && currency.toLowerCase().includes("usdc")) {
    return `$${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.toUpperCase()}`;
  }
};

import { TransactionReference } from "@xmtp/content-type-transaction-reference";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MessageToDisplay } from "../components/Chat/ChatMessage";
import { useTransactionsStore } from "../data/store/accountsStore";
import { Transaction } from "../data/store/transactionsStore";
import { isContentType } from "./xmtpRN/contentTypes";

export type TransactionContentType =
  | "transactionReference"
  | "coinbaseRegular"
  | "coinbaseSponsored";
export interface TransactionEvent {
  amount: number;
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
  transactionType: TransactionContentType,
  txRef: TransactionReference,
  txRefId: string,
  txDetails?: TransactionDetails
): Transaction => {
  return {
    id: txRefId,
    transactionType,
    namespace: txRef.namespace,
    networkId: txRef.networkId,
    reference: txRef.reference,
    metadata: txRef.metadata || {},
    status: txDetails?.status || "PENDING",
    sponsored:
      txDetails?.sponsored !== undefined
        ? txDetails.sponsored
        : transactionType === "transactionReference",
    blockExplorerURL: txDetails?.blockExplorerURL || undefined,
    events: txDetails?.events || [],
    chainName: txDetails?.chainName || undefined,
  };
};

export const extractChainIdToHex = (networkRawValue: string): string => {
  const match = networkRawValue.match(/ETHEREUM_CHAIN:(\d+)/);
  const extractedChainId = match ? match[1] : "";
  const chainId = ethers.BigNumber.from(extractedChainId);
  return chainId._hex;
};

export const getTransactionType = (
  input: TransactionReference | any
): TransactionContentType | undefined => {
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
  txType: "transactionReference" | "coinbaseRegular" | "coinbaseSponsored"
): string => {
  let networkId;

  if (txType === "coinbaseRegular" || txType === "coinbaseSponsored") {
    networkId = extractChainIdToHex(txRef.network.rawValue);
  }

  switch (txType) {
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
  txDetails?: TransactionDetails
): Transaction {
  const txType = getTransactionType(input);

  if (txType) {
    const txRefId = getTxRefId(input, txType);
    let transaction: Transaction;

    switch (txType) {
      case "transactionReference":
        transaction = mergeTransactionRefData(
          txType,
          input,
          txRefId,
          txDetails
        );
        break;
      case "coinbaseRegular":
        transaction = mergeTransactionRefData(
          txType,
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
          txType,
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
  amount: number,
  currency: string,
  decimals: number,
  useCurrencySymbol: boolean = true
): string => {
  const actualAmount = Number(amount) / Math.pow(10, decimals);

  // Convert the number to a fixed-point notation, then remove trailing zeros and decimal point if not needed
  let formattedAmount = actualAmount.toFixed(decimals);
  formattedAmount = parseFloat(formattedAmount).toString();

  // Apply currency formatting
  if (useCurrencySymbol && currency.toLowerCase().includes("usdc")) {
    return `$${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.toUpperCase()}`;
  }
};

export const useTransactionForMessage = (
  message: MessageToDisplay,
  currentAccount: string
) => {
  const getTransaction = useTransactionsStore((s) => s.getTransaction);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const txRef = useRef<TransactionReference | null>(null);

  useEffect(() => {
    try {
      const parsedTxRef = JSON.parse(message.content);

      const txType = getTransactionType(parsedTxRef);
      txRef.current = parsedTxRef;

      if (txType !== undefined) {
        const txLookup = getTransaction(getTxRefId(parsedTxRef, txType));

        if (txLookup) {
          setTransaction(txLookup);
        }
      }
    } catch (error) {
      console.error("Error parsing transaction reference:", error);
      txRef.current = null;
    }
  }, [message.content, currentAccount, getTransaction]);

  const getTransactionInfo = useCallback(() => {
    if (!transaction) {
      return {
        transactionDisplay: "–",
        amountToDisplay: "–",
      };
    }

    let amount, currency, decimals;

    if (transaction.events && transaction.events.length > 0) {
      ({ amount, currency, decimals } = transaction.events[0]);
    }

    const isUSDC = currency?.toLowerCase() === "usdc";

    const formattedAmountWithCurrencySymbol =
      amount && currency && decimals !== undefined
        ? formatAmount(amount, currency, decimals)
        : "–";
    const formattedAmount =
      amount && currency && decimals !== undefined
        ? formatAmount(amount, currency, decimals, false)
        : "–";

    const transactionDisplay = isUSDC
      ? `${formattedAmount} –`
      : `${transaction.chainName || "–"} –`;

    if (!transaction) {
      return {
        transactionDisplay: "",
        amountToDisplay: "",
      };
    }

    return {
      transactionDisplay,
      amountToDisplay: formattedAmountWithCurrencySymbol,
    };
  }, [transaction]);

  return useMemo(() => getTransactionInfo(), [getTransactionInfo]);
};

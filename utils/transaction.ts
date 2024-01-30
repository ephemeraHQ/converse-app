import { TransactionReference } from "@xmtp/content-type-transaction-reference";
import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";

import { MessageToDisplay } from "../components/Chat/ChatMessage";
import {
  useCurrentAccount,
  useTransactionsStore,
} from "../data/store/accountsStore";
import { Transaction } from "../data/store/transactionsStore";
import { getCoinbaseTransactionDetails, getTransactionDetails } from "./api";
import { evmHelpers } from "./evm/helpers";
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
            reference: txDetails?.transactionHash || input.sponsoredTxId,
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
  // Use evmHelpers for conversion
  const formattedAmount = evmHelpers.fromDecimal(amount.toString(), decimals);

  // Apply currency formatting
  const isUSDC = currency?.toLowerCase() === "usdc";
  if (useCurrencySymbol && isUSDC) {
    return `$${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.toUpperCase()}`;
  }
};

export const useTransactionForMessage = (message: MessageToDisplay) => {
  const currentAccount = useCurrentAccount() as string;
  const getTransaction = useTransactionsStore((s) => s.getTransaction);
  const saveTransactions = useTransactionsStore((s) => s.saveTransactions);
  const fetchingTransaction = useRef(false);

  const txRef = JSON.parse(message.content);
  const txRefCurrent = useRef(txRef);
  txRefCurrent.current = txRef;

  const txType = getTransactionType(txRef);
  const txRefId = getTxRefId(txRef, txType!); // TODO check for undefined txType?
  const txLookup = getTransaction(txRefId);

  const [transaction, setTransaction] = useState({
    loading: false,
    error: false,
    ...(txLookup || {}),
  });

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    const txRef = txRefCurrent.current;

    const go = async () => {
      if (fetchingTransaction.current) return;
      fetchingTransaction.current = true;
      setTransaction((t) => ({ ...t, loading: true }));

      let txDetails: TransactionDetails | undefined;

      try {
        switch (txType) {
          case "transactionReference": {
            txDetails = await getTransactionDetails(
              currentAccount,
              txRef.networkId,
              txRef.reference
            );
            break;
          }
          case "coinbaseRegular": {
            txDetails = await getTransactionDetails(
              currentAccount,
              extractChainIdToHex(txRef.network.rawValue),
              txRef.transactionHash
            );
            break;
          }
          case "coinbaseSponsored": {
            txDetails = await getCoinbaseTransactionDetails(
              currentAccount,
              extractChainIdToHex(txRef.network.rawValue),
              txRef.sponsoredTxId
            );
            break;
          }
          default: {
            console.error("Invalid transaction content type");
            break;
          }
        }

        if (txDetails && txDetails.status === "PENDING") {
          const uniformTx = createUniformTransaction(txRef, txDetails);

          setTransaction((t) => ({
            error: false,
            loading: false,
            ...uniformTx,
          }));

          retryTimeout = setTimeout(go, 5000);
        } else if (txDetails) {
          const uniformTx = createUniformTransaction(txRef, txDetails);

          // Update zustand transaction store
          saveTransactions({
            [uniformTx.id]: uniformTx,
          });

          // Update component state
          setTransaction((t) => ({
            error: false,
            loading: false,
            ...uniformTx,
          }));
        } else {
          console.error("Transaction details could not be fetched");
        }
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        // Let's retry in case of network error
        retryTimeout = setTimeout(go, 5000);
      } finally {
        fetchingTransaction.current = false;
      }
    };

    // Fetch tx details
    if (
      (!txLookup || txLookup.status === "PENDING") &&
      !fetchingTransaction.current
    ) {
      go();
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [txType, currentAccount, txLookup, saveTransactions]);

  const getTransactionInfo = useCallback(() => {
    let amount, currency, decimals;

    if (transaction.events && transaction.events.length > 0) {
      // Find the first event with type 'transfer'
      const transferEvent = transaction.events.find(
        (event) => event.type.toLowerCase() === "transfer"
      );

      if (transferEvent) {
        ({ amount, currency, decimals } = transferEvent);
      } else {
        return {};
      }
    } else {
      return {};
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

    return {
      transactionDisplay,
      amountToDisplay: formattedAmountWithCurrencySymbol,
    };
  }, [transaction]);

  const { transactionDisplay, amountToDisplay } = getTransactionInfo();

  return { transaction, transactionDisplay, amountToDisplay };
};

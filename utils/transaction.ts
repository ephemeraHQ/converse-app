import { TransactionReference } from "@xmtp/content-type-transaction-reference";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getCoinbaseTransactionDetails, getTransactionDetails } from "./api";
import { evmHelpers } from "./evm/helpers";
import logger from "./logger";
import { sentryTrackError } from "./sentry";
import { isContentType } from "./xmtpRN/contentTypes";
import { MessageToDisplay } from "../components/Chat/Message/Message";
import {
  useCurrentAccount,
  useTransactionsStore,
} from "../data/store/accountsStore";
import { Transaction } from "../data/store/transactionsStore";

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
  txDetails?: Partial<TransactionDetails>
): Transaction => {
  return {
    id: txRefId,
    transactionType,
    namespace: txRef.namespace,
    networkId: txRef.networkId,
    reference: txRef.reference,
    metadata: txRef.metadata || {},
    status: txDetails?.status || "PENDING",
    sponsored: txDetails?.sponsored || false,
    blockExplorerURL: txDetails?.blockExplorerURL || undefined,
    events: txDetails?.events || [],
    chainName: txDetails?.chainName || undefined,
  };
};

export const extractChainIdToHex = (
  _networkRawValue: string | number
): string => {
  let chainId;

  let networkRawValue = _networkRawValue;

  // Check if networkRawValue is already in hexadecimal format
  if (
    typeof networkRawValue === "string" &&
    /^0x[a-fA-F0-9]+$/.test(networkRawValue)
  ) {
    return networkRawValue;
  }

  let numericValue: number;

  if (typeof networkRawValue === "string") {
    // Check if coinbase reference
    const coinbaseExtractedNetwork =
      networkRawValue.match(/ETHEREUM_CHAIN:(\d+)/);
    if (coinbaseExtractedNetwork) {
      networkRawValue = coinbaseExtractedNetwork[1];
    }
    numericValue = parseInt(networkRawValue, 10);
  } else {
    numericValue = networkRawValue;
  }

  // Ensure numericValue is a valid number
  if (!isNaN(numericValue)) {
    chainId = ethers.BigNumber.from(numericValue);
  } else {
    logger.error("Invalid networkRawValue:", networkRawValue);
    return "";
  }

  return chainId._hex;
};

export const getTransactionType = (
  input: TransactionReference | any
): TransactionContentType | undefined => {
  if (input?.error) return undefined;
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
  txType?: "transactionReference" | "coinbaseRegular" | "coinbaseSponsored"
): string => {
  let networkId;

  if (txRef?.error) return "";

  if (txType === "coinbaseRegular" || txType === "coinbaseSponsored") {
    networkId = extractChainIdToHex(txRef.network.rawValue);
  } else {
    networkId = extractChainIdToHex(txRef.networkId);
  }

  switch (txType) {
    case "transactionReference":
      return `${networkId}-${txRef.reference}`;
    case "coinbaseRegular":
      return `${networkId}-${txRef.transactionHash}`;
    case "coinbaseSponsored":
      return `${networkId}-${txRef.sponsoredTxId}`;
    default:
      return "";
  }
};

export function createUniformTransaction(
  input: TransactionReference | any,
  txDetails?: Partial<TransactionDetails>
): Transaction {
  const txType = getTransactionType(input);

  if (txType) {
    const txRefId = getTxRefId(input, txType);
    let transaction: Transaction;

    switch (txType) {
      case "transactionReference": {
        const inputWithHexNetworkId = {
          ...input,
          networkId: extractChainIdToHex(input.networkId.toString()),
        };
        transaction = mergeTransactionRefData(
          txType,
          inputWithHexNetworkId,
          txRefId,
          txDetails
        );
        break;
      }
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

export const useTransactionForMessage = (
  message: MessageToDisplay,
  peerAddress?: string
) => {
  const currentAccount = useCurrentAccount() as string;
  const saveTransactions = useTransactionsStore((s) => s.saveTransactions);
  const fetchingTransaction = useRef(false);

  // Avoid too many JSON.parse but make sure to
  // rerender if message.content changes

  const txRef = useMemo(() => {
    try {
      const parsed = JSON.parse(message.content);
      return parsed;
    } catch (e) {
      sentryTrackError(e, {
        error: "Could not parse tx",
        content: message.content,
      });
      return { error: "Could not parse transaction" };
    }
  }, [message.content]);

  const txType = getTransactionType(txRef);
  const txRefId = getTxRefId(txRef, txType);
  const txLookup = useTransactionsStore((s) => s.transactions[txRefId]);

  // Init transaction with values
  const [transaction, setTransaction] = useState({
    loading: false,
    error: txRef.error,
    ...txLookup,
  });

  // Components are recycled, let's fix when stuff changes
  const messageId = useRef(message.id);
  if (message.id !== messageId.current) {
    messageId.current = message.id;
    setTransaction({ loading: false, error: "", ...txLookup });
  }

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;

    const go = async () => {
      if (fetchingTransaction.current) return;
      fetchingTransaction.current = true;
      if (txRef.error) {
        setTransaction((t) => ({ ...t, loading: false, error: txRef.error }));
        return;
      }
      setTransaction((t) => ({ ...t, loading: true }));

      let txDetails: TransactionDetails | undefined;

      try {
        switch (txType) {
          case "transactionReference": {
            txDetails = await getTransactionDetails(
              currentAccount,
              extractChainIdToHex(txRef.networkId),
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
            logger.error("Invalid transaction content type");
            break;
          }
        }

        if (txDetails && txDetails.status === "PENDING") {
          const uniformTx = createUniformTransaction(txRef, txDetails);
          setTransaction((t) => ({
            ...t,
            error: "",
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
            ...t,
            error: "",
            loading: false,
            ...uniformTx,
          }));
        } else {
          logger.error("Transaction details could not be fetched");
        }
      } catch (error) {
        logger.error(error, { context: "Error fetching transaction details" });
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
  }, [
    currentAccount,
    saveTransactions,
    txLookup,
    txRef,
    txType,
    message.content,
  ]);

  useEffect(() => {
    setTransaction((t) => ({
      loading: false,
      error: t.error,
      ...txLookup,
    }));
  }, [txLookup]);

  const getTransactionInfo = useCallback(
    (transaction: Transaction) => {
      let amount, currency, decimals;

      const sender = message.senderAddress.toLowerCase();
      const receiver = message.fromMe
        ? peerAddress?.toLowerCase()
        : currentAccount.toLowerCase();

      // Determine source of transaction details (either from transfer event or metadata)
      // And verify that tx is between the two peers
      const transferEvent = transaction.events?.find(
        (event) =>
          event.type.toLowerCase() === "transfer" &&
          event.from.toLowerCase() === sender &&
          event.to.toLowerCase() === receiver
      );
      if (transferEvent) {
        ({ amount, currency, decimals } = transferEvent);
      } else if (
        transaction.sponsored &&
        transaction.metadata &&
        transaction.status === "PENDING" &&
        "amount" in transaction.metadata &&
        "currency" in transaction.metadata &&
        "decimals" in transaction.metadata
      ) {
        // Display tx details to the sender, while it is creating it on chain
        ({ amount, currency, decimals } = transaction.metadata);
      } else {
        return {};
      }

      const isUSDC = (currency as string).toLowerCase() === "usdc";
      const formattedAmountWithCurrencySymbol = formatAmount(
        amount as number,
        currency as string,
        decimals as number
      );
      const formattedAmount = formatAmount(
        amount as number,
        currency as string,
        decimals as number,
        false
      );

      const transactionDisplay = isUSDC
        ? `${formattedAmount} –`
        : `${transaction.chainName || "–"} –`;

      return {
        transactionDisplay,
        amountToDisplay: formattedAmountWithCurrencySymbol,
      };
    },
    [currentAccount, message.fromMe, message.senderAddress, peerAddress]
  );

  const { transactionDisplay, amountToDisplay } =
    getTransactionInfo(transaction);

  return { transaction, transactionDisplay, amountToDisplay };
};

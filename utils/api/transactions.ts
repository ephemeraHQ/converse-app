import { TransactionData } from "@/components/TransactionPreview/TransactionPreview";
import { getXmtpApiHeaders } from "@/utils/api/auth";
import { api } from "@/utils/api/api";
import type { TransferAuthorizationMessage } from "@/utils/evm/erc20";
import type { TransactionDetails } from "@/utils/transaction";
import type { SimulateAssetChangesResponse } from "alchemy-sdk";

export const getTransactionDetails = async (
  account: string,
  networkId: string,
  reference: string
): Promise<TransactionDetails> => {
  const { data } = await api.get("/api/evm/transactionDetails", {
    headers: await getXmtpApiHeaders(account),
    params: { networkId, reference },
  });
  return data;
};

export const getCoinbaseTransactionDetails = async (
  account: string,
  networkId: string,
  sponsoredTxId: string
): Promise<TransactionDetails> => {
  const { data } = await api.get("/api/evm/coinbaseTransactionDetails", {
    headers: await getXmtpApiHeaders(account),
    params: { networkId, sponsoredTxId },
  });
  return data;
};

export const postUSDCTransferAuthorization = async (
  account: string,
  message: TransferAuthorizationMessage,
  signature: string
): Promise<string> => {
  const { data } = await api.post(
    "/api/evm/transferWithAuthorization",
    { message, signature },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data.txHash;
};

export const simulateTransaction = async (
  account: string,
  from: string,
  chainId: number,
  transaction: TransactionData
) => {
  const { data } = await api.post(
    "/api/transactions/simulate",
    {
      address: from,
      network: `eip155:${chainId}`,
      value: transaction.value
        ? `0x${BigInt(transaction.value).toString(16)}`
        : undefined,
      to: transaction.to,
      data: transaction.data,
    },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data as SimulateAssetChangesResponse;
};

import { converseEventEmitter } from "@utils/events";
import { useExternalSigner } from "@utils/evm/external";
import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

import Button from "./Button/Button";
import { Drawer } from "./Drawer";

export type TransactionData = {
  to: string;
  data?: string;
  value?: string;
};

export default function TransactionPreview() {
  const { address, walletAppId, resetExternalSigner, getExternalSigner } =
    useExternalSigner();
  const [transactionToPreview, setTransactionToPreview] = useState<
    TransactionData | undefined
  >(undefined);

  const previewTransaction = useCallback((transactionData: TransactionData) => {
    setTransactionToPreview(transactionData);
  }, []);

  const close = useCallback(() => {
    setTransactionToPreview(undefined);
  }, []);

  const switchWallet = useCallback(async () => {
    await resetExternalSigner();
    close();
  }, [close, resetExternalSigner]);

  useEffect(() => {
    converseEventEmitter.on("previewTransaction", previewTransaction);
    return () => {
      converseEventEmitter.off("previewTransaction", previewTransaction);
    };
  }, [previewTransaction]);

  return (
    <Drawer visible={!!transactionToPreview} onClose={close}>
      <Text>Welcome to Converse!</Text>
      <Text>To: {transactionToPreview?.to}</Text>
      <Text>Value: {transactionToPreview?.value}</Text>
      <Text>Data: {transactionToPreview?.data}</Text>
      <Text>Wallet app: {walletAppId}</Text>
      <Text>From: {address}</Text>
      <Button title="Change" variant="primary" onPress={switchWallet} />
    </Drawer>
  );
}

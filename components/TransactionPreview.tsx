import { useCurrentAccount } from "@data/store/accountsStore";
import { translate } from "@i18n";
import { converseEventEmitter } from "@utils/events";
import { useExternalSigner } from "@utils/evm/external";
import logger from "@utils/logger";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Text } from "react-native";
import { waitForReceipt } from "thirdweb";

import Button from "./Button/Button";
import { Drawer } from "./Drawer";
import { installedWallets } from "./Onboarding/supportedWallets";

export type TransactionData = {
  to: string;
  data?: string;
  value?: string;
};

export type TransactionToTrigger = TransactionData & {
  id: string;
  chainId: number;
};

export default function TransactionPreview() {
  const account = useCurrentAccount() as string;
  const {
    address,
    walletAppId,
    resetExternalSigner,
    getExternalSigner,
    switchChain,
    sendTransaction,
  } = useExternalSigner();
  const walletApp = walletAppId
    ? installedWallets.find((w) => w.thirdwebId === walletAppId)
    : undefined;
  const [transactionToPreview, setTransactionToPreview] = useState<
    TransactionToTrigger | undefined
  >(undefined);

  const previewTransaction = useCallback(
    (transactionData: TransactionToTrigger) => {
      setTransactionToPreview(transactionData);
    },
    []
  );

  const close = useCallback(() => {
    setTransactionToPreview(undefined);
  }, []);

  const switchWallet = useCallback(async () => {
    await resetExternalSigner();
    const newSigner = await getExternalSigner(
      translate("transactionalFrameConnectWallet")
    );
    if (!newSigner) {
      close();
    }
  }, [resetExternalSigner, getExternalSigner, close]);

  useEffect(() => {
    converseEventEmitter.on("previewTransaction", previewTransaction);
    return () => {
      converseEventEmitter.off("previewTransaction", previewTransaction);
    };
  }, [previewTransaction]);

  const [simulating, setSimulating] = useState(false);
  useEffect(() => {
    const simulate = async () => {
      if (transactionToPreview && address) {
        setSimulating(true);
        try {
          // const simulation = await simulateTransaction(
          //   account,
          //   address,
          //   transactionToPreview.chainId,
          //   transactionToPreview
          // );
        } catch (e) {
          console.log(e);
        }
        setSimulating(false);
      }
    };
    simulate();
  }, [account, address, transactionToPreview]);

  const [txStatus, setTxStatus] = useState<
    "pending" | "triggering" | "triggered" | "success" | "failure"
  >("pending");
  const trigger = useCallback(async () => {
    console.log("clicked trigger");
    if (!transactionToPreview) return;
    // converseEventEmitter.emit("triggerTransaction", transactionToPreview.id);
    setTxStatus("triggering");
    try {
      logger.debug(
        `[TxFrame] Switching to chain id ${transactionToPreview.chainId}`
      );

      await switchChain(transactionToPreview.chainId);

      const submittedTx = await sendTransaction(transactionToPreview);
      setTxStatus("triggered");
      logger.debug(
        `[TxFrame] Triggered transaction with hash ${submittedTx.transactionHash}`
      );
      const transactionReceipt = await waitForReceipt(submittedTx);
      converseEventEmitter.emit(
        "transactionResult",
        transactionToPreview.id,
        transactionReceipt
      );
      setTxStatus(
        transactionReceipt.status === "success" ? "success" : "failure"
      );
    } catch (e) {
      if (`${e}`.includes("User rejected the request")) {
        setTxStatus("pending");
      } else {
        setTxStatus("failure");
      }
    }
  }, [sendTransaction, switchChain, transactionToPreview]);

  const buttonTitle = useMemo(() => {
    switch (txStatus) {
      case "failure":
        return translate("transaction_failure");
      case "pending":
        return translate("transaction_pending", { wallet: walletApp?.name });
      case "triggering":
        return translate("transaction_triggering", { wallet: walletApp?.name });
      case "triggered":
        return translate("transaction_triggered");
      case "success":
        return translate("transaction_success");

      default:
        return translate("transaction_pending");
    }
  }, [txStatus, walletApp?.name]);

  return (
    <Drawer
      visible={!!transactionToPreview}
      onClose={() => {
        if (transactionToPreview) {
          converseEventEmitter.emit(
            "transactionResult",
            transactionToPreview.id,
            undefined
          );
        }
        close();
      }}
    >
      <Text>To: {transactionToPreview?.to}</Text>
      <Text>Value: {transactionToPreview?.value}</Text>
      <Text>Data: {transactionToPreview?.data}</Text>
      <Text>Wallet app: {walletAppId}</Text>
      <Text onPress={switchWallet}>From: {address}</Text>
      {simulating ? (
        <Text>Simulating...</Text>
      ) : (
        <Button
          title={buttonTitle}
          variant="primary"
          onPress={txStatus === "pending" ? trigger : undefined}
        />
      )}
    </Drawer>
  );
}

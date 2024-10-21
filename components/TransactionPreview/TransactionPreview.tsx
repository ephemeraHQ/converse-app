import { useCurrentAccount } from "@data/store/accountsStore";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { simulateTransaction } from "@utils/api";
import { converseEventEmitter } from "@utils/events";
import { useExternalSigner } from "@utils/evm/external";
import logger from "@utils/logger";
import { type SimulateAssetChangesResponse } from "alchemy-sdk";
import { useCallback, useEffect, useState } from "react";
import { waitForReceipt } from "thirdweb";
import { TransactionReceipt } from "thirdweb/dist/types/transaction/types";

import { Drawer } from "../Drawer";
import { TransactionActions } from "./TransactionActions";
import { TransactionContent } from "./TransactionContent";
import { TransactionHeader } from "./TransactionHeader";
import { installedWallets } from "../Onboarding/supportedWallets";

export type TransactionData = {
  to: string;
  data?: string;
  value?: string;
};

export type TransactionToTrigger = TransactionData & {
  id: string;
  chainId: number;
};

type TransactionState = {
  status: "pending" | "triggering" | "triggered" | "success" | "failure";
  error?: string;
};

type SimulationState = {
  status: "pending" | "success" | "failure";
  result?: SimulateAssetChangesResponse;
  error?: string;
};

export function TransactionPreview() {
  const account = useCurrentAccount() as string;
  const {
    address,
    walletAppId,
    resetExternalSigner,
    getExternalSigner,
    switchChain,
    sendTransaction,
    chainId,
  } = useExternalSigner();
  const walletApp = walletAppId
    ? installedWallets.find((w) => w.thirdwebId === walletAppId)
    : undefined;
  const [transactionToPreview, setTransactionToPreview] = useState<
    TransactionToTrigger | undefined
  >(undefined);

  const [txState, setTxState] = useState<TransactionState>({
    status: "pending",
  });

  const [simulation, setSimulation] = useState<SimulationState>({
    status: "pending",
  });

  const previewTransaction = useCallback(
    (transactionData: TransactionToTrigger) => {
      setTransactionToPreview(transactionData);
    },
    []
  );
  useEffect(() => {
    converseEventEmitter.on("previewTransaction", previewTransaction);
    return () => {
      converseEventEmitter.off("previewTransaction", previewTransaction);
    };
  }, [previewTransaction]);

  const simulateTx = useCallback(async () => {
    if (transactionToPreview && address && simulation.status === "pending") {
      try {
        const simulationResult = await simulateTransaction(
          account,
          address,
          transactionToPreview.chainId,
          transactionToPreview
        );
        console.log("gas used:", simulationResult.gasUsed);
        console.log("Simulation changes:");
        simulationResult.changes.forEach((change) => {
          console.log(`Asset: ${change.name}`);
          console.log(`Logo: ${change.logo}`);
          console.log(`Amount: ${change.amount}`);
          console.log(`Type: ${change.changeType}`);
          console.log("---");
        });
        setSimulation({ status: "success", result: simulationResult });
      } catch (e: any) {
        setSimulation({ status: "failure", error: e });
      }
    }
  }, [account, address, simulation.status, transactionToPreview]);

  useEffect(() => {
    simulateTx();
  }, [simulateTx]);

  const close = useCallback(
    (receipt?: TransactionReceipt | undefined) => {
      if (transactionToPreview) {
        converseEventEmitter.emit(
          "transactionResult",
          transactionToPreview.id,
          receipt
        );
        setTransactionToPreview(undefined);
      }
      setSimulation({ status: "pending" });
      setTxState({ status: "pending" });
    },
    [transactionToPreview]
  );

  const switchWallet = useCallback(async () => {
    resetExternalSigner();
    const newSigner = await getExternalSigner(
      translate("transactionalFrameConnectWallet")
    );
    if (!newSigner) {
      close();
    }
  }, [resetExternalSigner, getExternalSigner, close]);

  const trigger = useCallback(async () => {
    console.log("clicked trigger");
    if (!transactionToPreview) return;
    setTxState({ status: "triggering" });
    try {
      logger.debug(
        `[TxFrame] Switching to chain id ${transactionToPreview.chainId}`
      );

      const submittedTx = await sendTransaction(transactionToPreview);
      setTxState({ status: "triggered" });
      logger.debug(
        `[TxFrame] Triggered transaction with hash ${submittedTx.transactionHash}`
      );
      const transactionReceipt = await waitForReceipt(submittedTx);
      converseEventEmitter.emit(
        "transactionResult",
        transactionToPreview.id,
        transactionReceipt
      );
      setTxState({
        status: transactionReceipt.status === "success" ? "success" : "failure",
      });

      if (transactionReceipt.status === "success") {
        setTimeout(() => {
          close(transactionReceipt);
        }, 1000);
      }
    } catch (e: any) {
      if (`${e}`.includes("User rejected the request")) {
        setTxState({ status: "pending" });
      } else {
        logger.error(e);
        let txError = e?.message;
        if (!txError) {
          try {
            txError = JSON.stringify(e);
          } catch {}
        }
        if (!txError) txError = e;
        setTxState({ status: "failure", error: `${txError}` });
      }
    }
  }, [close, sendTransaction, transactionToPreview]);

  const txStatus = txState.status;
  const shouldSwitchChain =
    simulation.status !== "pending" &&
    transactionToPreview &&
    transactionToPreview.chainId !== chainId &&
    txStatus === "pending";

  const showTriggerButton =
    simulation.status !== "pending" &&
    walletApp &&
    !shouldSwitchChain &&
    txStatus === "pending";

  return (
    <Drawer visible={!!transactionToPreview} onClose={close}>
      <VStack>
        <TransactionHeader onClose={close} />
        <TransactionContent
          simulation={simulation}
          txState={txState}
          walletApp={walletApp}
          address={address}
          switchWallet={switchWallet}
        />
        <TransactionActions
          shouldSwitchChain={shouldSwitchChain}
          showTriggerButton={showTriggerButton}
          transactionToPreview={transactionToPreview}
          switchChain={switchChain}
          trigger={trigger}
          walletApp={walletApp}
        />
      </VStack>
    </Drawer>
  );
}

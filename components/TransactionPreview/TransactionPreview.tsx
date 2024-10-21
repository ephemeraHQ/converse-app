import { useCurrentAccount, useProfilesStore } from "@data/store/accountsStore";
import { HStack } from "@design-system/Hstack";
import { Pressable } from "@design-system/Pressable";
import { Text } from "@design-system/Text";
import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { borderRadius } from "@theme/border-radius";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { simulateTransaction } from "@utils/api";
import { converseEventEmitter } from "@utils/events";
import { useExternalSigner } from "@utils/evm/external";
import logger from "@utils/logger";
import { getPreferredName } from "@utils/profile";
import { shortAddress } from "@utils/str";
import {
  SimulateChangeType,
  type SimulateAssetChangesResponse,
} from "alchemy-sdk";
import { Image } from "expo-image";
import { memo, useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { waitForReceipt } from "thirdweb";
import { TransactionReceipt } from "thirdweb/dist/types/transaction/types";

import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import Button from "../Button/Button";
import { CurrentAccount } from "../CurrentAccount";
import { Drawer } from "../Drawer";
import { installedWallets } from "../Onboarding/supportedWallets";
import Picto from "../Picto/Picto";

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

  const previewTransaction = useCallback(
    (transactionData: TransactionToTrigger) => {
      setTransactionToPreview(transactionData);
    },
    []
  );

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

  const [simulation, setSimulation] = useState<SimulationState>({
    status: "pending",
  });
  useEffect(() => {
    const simulate = async () => {
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
    };
    simulate();
  }, [account, address, simulation, transactionToPreview]);

  const trigger = useCallback(async () => {
    console.log("clicked trigger");
    if (!transactionToPreview) return;
    // converseEventEmitter.emit("triggerTransaction", transactionToPreview.id);
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

  const showWalletSwitcher =
    simulation.status !== "pending" && walletApp && txStatus === "pending";

  const showTriggerButton =
    simulation.status !== "pending" &&
    walletApp &&
    !shouldSwitchChain &&
    txStatus === "pending";

  const showTxLoader =
    simulation.status !== "pending" &&
    (txStatus === "triggering" || txStatus === "triggered");

  const showTxResult =
    simulation.status !== "pending" &&
    (txStatus === "failure" || txStatus === "success");

  return (
    <Drawer visible={!!transactionToPreview} onClose={close}>
      <VStack>
        <HStack style={styles.top}>
          <CurrentAccount style={styles.account} />
          <Pressable onPress={() => close()}>
            <Text>Close</Text>
          </Pressable>
        </HStack>
        {simulation.status === "pending" && (
          <VStack style={styles.center}>
            <ActivityIndicator />
            <Text>{translate("simulation_pending")}</Text>
          </VStack>
        )}
        {showTxLoader && (
          <VStack style={styles.center}>
            <ActivityIndicator />
            <Text>
              {translate(
                txStatus === "triggered"
                  ? "transaction_triggered"
                  : "transaction_triggering",
                { wallet: walletApp?.name }
              )}
            </Text>
          </VStack>
        )}

        {simulation.status === "success" &&
          simulation.result?.changes?.map((change) => (
            <>
              <TransactionPreviewRow
                title={
                  change.changeType === SimulateChangeType.APPROVE
                    ? translate("transaction_asset_change_type_approve")
                    : translate("transaction_asset_change_type_transfer")
                }
                subtitle={`${change.amount} ${change.symbol}`}
                key={change.contractAddress}
              />
              <TransactionPreviewRow
                title={translate("transaction_asset_change_to")}
                subtitle={getPreferredName(
                  useProfilesStore.getState().profiles[change.to]?.socials,
                  change.to
                )}
                key={`${change.contractAddress}-to`}
              />
            </>
          ))}
        {showWalletSwitcher && (
          <TransactionPreviewRow
            imageURI={walletApp.iconURL}
            title={translate("transaction_wallet")}
            subtitle={`${walletApp.name} • ${shortAddress(address || "")}`}
            onPress={switchWallet}
          />
        )}
        {showTxResult && (
          <VStack style={styles.center}>
            <Text>
              {translate(
                txStatus === "failure"
                  ? "transaction_failure"
                  : "transaction_success",
                { error: txState.error }
              )}
            </Text>
          </VStack>
        )}
        {simulation.status === "failure" && (
          <VStack style={[styles.center, styles.failure]}>
            <Text>{translate("simulation_failure")}</Text>
          </VStack>
        )}
        {shouldSwitchChain && (
          <Button
            variant="primary"
            title={translate("transaction_switch_chain", {
              chainName: transactionToPreview?.chainId,
            })}
            onPress={
              transactionToPreview?.chainId
                ? () => switchChain(transactionToPreview.chainId)
                : undefined
            }
          />
        )}
        {showTriggerButton && (
          <Button
            title={translate("transaction_pending", {
              wallet: walletApp?.name,
            })}
            variant="primary"
            onPress={trigger}
          />
        )}
      </VStack>
    </Drawer>
  );
}

type ITransactionPreviewRowProps = {
  title: string;
  subtitle: string;
  imageURI?: string | undefined;
  onPress?: () => void;
};

const TransactionPreviewRow = memo((props: ITransactionPreviewRowProps) => (
  <TouchableOpacity
    activeOpacity={props.onPress ? 0.5 : 1}
    onPress={props.onPress}
  >
    <HStack style={styles.row}>
      <Image source={{ uri: props.imageURI }} style={styles.leftImage} />
      <VStack>
        <Text>{props.title}</Text>
        <Text>{props.subtitle}</Text>
      </VStack>
      {props.onPress && <Picto picto="chevron.right" style={styles.picto} />}
    </HStack>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  top: { alignItems: "center", marginVertical: spacing.md },
  account: { marginRight: "auto" },
  center: { alignItems: "center" },
  failure: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.errorBackground,
    borderRadius: borderRadius.lg,
  },
  row: { alignItems: "center", paddingBottom: spacing.sm },
  leftImage: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  picto: {
    marginLeft: "auto",
    marginRight: spacing.xs,
  },
});

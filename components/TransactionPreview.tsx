import { useCurrentAccount } from "@data/store/accountsStore";
import { HStack } from "@design-system/Hstack";
import { Pressable } from "@design-system/Pressable";
import { Text } from "@design-system/Text";
import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { spacing } from "@theme/spacing";
import { converseEventEmitter } from "@utils/events";
import { useExternalSigner } from "@utils/evm/external";
import logger from "@utils/logger";
import { shortAddress } from "@utils/str";
import { Image } from "expo-image";
import { memo, useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { waitForReceipt } from "thirdweb";
import { TransactionReceipt } from "thirdweb/dist/types/transaction/types";

import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";
import Button from "./Button/Button";
import { CurrentAccount } from "./CurrentAccount";
import { Drawer } from "./Drawer";
import { installedWallets } from "./Onboarding/supportedWallets";
import Picto from "./Picto/Picto";

export type TransactionData = {
  to: string;
  data?: string;
  value?: string;
};

export type TransactionToTrigger = TransactionData & {
  id: string;
  chainId: number;
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
      setSimulating(true);
      setTxStatus("pending");
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

  const [simulating, setSimulating] = useState(true);
  useEffect(() => {
    const simulate = async () => {
      if (transactionToPreview && address) {
        setSimulating(true);
        try {
          await new Promise((r) => setTimeout(r, 1500));
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

      // await switchChain(transactionToPreview.chainId);

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
      if (transactionReceipt.status === "success") {
        setTimeout(() => {
          close(transactionReceipt);
        }, 1000);
      }
    } catch (e) {
      if (`${e}`.includes("User rejected the request")) {
        setTxStatus("pending");
      } else {
        logger.error(e);
        setTxStatus("failure");
      }
    }
  }, [close, sendTransaction, transactionToPreview]);

  // const shouldSwitchChain =
  //   !simulating &&
  //   transactionToPreview &&
  //   transactionToPreview.chainId !== chainId;
  const shouldSwitchChain = false;

  const showWalletSwitcher = !simulating && walletApp && txStatus === "pending";

  const showTriggerButton =
    !simulating && walletApp && !shouldSwitchChain && txStatus === "pending";

  const showTxLoader =
    !simulating && (txStatus === "triggering" || txStatus === "triggered");

  const showTxResult =
    !simulating && (txStatus === "failure" || txStatus === "success");

  return (
    <Drawer visible={!!transactionToPreview} onClose={close}>
      <VStack>
        <HStack style={styles.top}>
          <CurrentAccount style={styles.account} />
          <Pressable onPress={() => close()}>
            <Text>Close</Text>
          </Pressable>
        </HStack>
        {simulating && (
          <VStack style={styles.center}>
            <ActivityIndicator />
            <Text>{translate("transaction_simulating")}</Text>
          </VStack>
        )}
        {showWalletSwitcher && (
          <TransactionPreviewRow
            imageURI={walletApp.iconURL}
            title={translate("transaction_pay_with")}
            subtitle={`${walletApp.name} • ${shortAddress(address || "")}`}
            onPress={switchWallet}
          />
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
        {showTxResult && (
          <VStack style={styles.center}>
            <Text>
              {translate(
                txStatus === "failure"
                  ? "transaction_failure"
                  : "transaction_success"
              )}
            </Text>
          </VStack>
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

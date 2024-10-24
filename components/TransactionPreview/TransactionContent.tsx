import { useProfilesStore } from "@data/store/accountsStore";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { spacing } from "@theme/spacing";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { getPreferredName } from "@utils/profile";
import { shortAddress } from "@utils/str";
import { SimulateChangeType, SimulateAssetChangesResponse } from "alchemy-sdk";
import { Image, ImageSource } from "expo-image";
import { memo } from "react";
import { StyleSheet, TextStyle, View, ViewStyle } from "react-native";

import TransactionSend from "../../assets/transaction-send.png";
import TransactionTo from "../../assets/transaction-to.png";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import { InstalledWallet } from "../Onboarding/supportedWallets";
import Picto from "../Picto/Picto";

type TransactionState = {
  status: "pending" | "triggering" | "triggered" | "success" | "failure";
  error?: string;
};

type SimulationState = {
  status: "pending" | "success" | "failure";
  result?: SimulateAssetChangesResponse;
  error?: string;
};

type TransactionLoaderProps = {
  status: "triggering" | "triggered";
  walletName: string | undefined;
};

type TransactionResultProps = {
  status: "failure" | "success";
  error: string | undefined;
};

type SimulationResultProps = {
  changes: SimulateAssetChangesResponse["changes"] | undefined;
};

type ITransactionContentProps = {
  simulation: SimulationState;
  txState: TransactionState;
  walletApp: InstalledWallet | undefined;
  address: string | undefined;
  switchWallet: () => Promise<void>;
};

export const TransactionContent = ({
  simulation,
  txState,
  walletApp,
  address,
  switchWallet,
}: ITransactionContentProps) => {
  if (simulation.status === "pending") {
    return <SimulationPending />;
  }

  if (txState.status === "triggering" || txState.status === "triggered") {
    return (
      <TransactionLoader status={txState.status} walletName={walletApp?.name} />
    );
  }

  if (txState.status === "failure" || txState.status === "success") {
    return <TransactionResult status={txState.status} error={txState.error} />;
  }

  return (
    <>
      {simulation.status === "success" ? (
        <SimulationResult changes={simulation.result?.changes} />
      ) : (
        <SimulationFailure />
      )}
      {walletApp && (
        <TransactionPreviewRow
          imageSrc={{ uri: walletApp.iconURL }}
          title={translate("transaction_wallet")}
          subtitle={`${walletApp.name} • ${shortAddress(address || "")}`}
          onPress={switchWallet}
        />
      )}
    </>
  );
};

const SimulationPending = () => (
  <VStack style={styles.center}>
    <ActivityIndicator />
    <Text>{translate("simulation_pending")}</Text>
  </VStack>
);

const TransactionLoader = ({ status, walletName }: TransactionLoaderProps) => (
  <VStack style={styles.center}>
    <ActivityIndicator />
    <Text>
      {translate(
        status === "triggered"
          ? "transaction_triggered"
          : "transaction_triggering",
        { wallet: walletName }
      )}
    </Text>
  </VStack>
);

const TransactionResult = ({ status, error }: TransactionResultProps) => (
  <VStack style={styles.center}>
    <Text>
      {translate(
        status === "failure" ? "transaction_failure" : "transaction_success",
        { error }
      )}
    </Text>
  </VStack>
);

const SimulationResult = ({ changes }: SimulationResultProps) => (
  <>
    {changes?.map((change) => (
      <View key={change.contractAddress}>
        <TransactionPreviewRow
          title={
            change.changeType === SimulateChangeType.APPROVE
              ? translate("transaction_asset_change_type_approve")
              : translate("transaction_asset_change_type_transfer")
          }
          subtitle={`${change.amount} ${change.symbol}`}
          imageSrc={change.logo ? { uri: change.logo } : TransactionSend}
          imagePlaceholder={TransactionSend}
        />
        <TransactionPreviewRow
          title={translate("transaction_asset_change_to")}
          subtitle={getPreferredName(
            useProfilesStore.getState().profiles[change.to]?.socials,
            change.to
          )}
          imageSrc={TransactionTo}
          imagePlaceholder={TransactionTo}
        />
      </View>
    ))}
  </>
);

const SimulationFailure = () => {
  const { themed } = useAppTheme();
  return (
    <VStack style={themed($failure)}>
      <Text color="danger">Caution</Text>
      <Text>{translate("simulation_failure")}</Text>
    </VStack>
  );
};

type ITransactionPreviewRowProps = {
  title: string;
  subtitle: string;
  imageSrc?: ImageSource | undefined;
  imagePlaceholder?: ImageSource | undefined;
  onPress?: () => void;
};

const TransactionPreviewRow = memo((props: ITransactionPreviewRowProps) => {
  const { themed } = useAppTheme();
  return (
    <TouchableOpacity
      activeOpacity={props.onPress ? 0.5 : 1}
      onPress={props.onPress}
    >
      <HStack style={styles.row}>
        <Image
          source={props.imageSrc}
          placeholder={props.imagePlaceholder}
          style={styles.leftImage}
        />
        <VStack>
          <Text size="sm" style={themed($title)}>
            {props.title}
          </Text>
          <Text>{props.subtitle}</Text>
        </VStack>
        {props.onPress && <Picto picto="chevron.right" style={styles.picto} />}
      </HStack>
    </TouchableOpacity>
  );
});

const $failure: ThemedStyle<ViewStyle> = ({ spacing, borderRadius }) => ({
  marginBottom: spacing.md,
  padding: spacing.sm,
  backgroundColor: "#FFF5F5",
  borderRadius: borderRadius.xs,
});

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
});

const styles = StyleSheet.create({
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

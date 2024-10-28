import { InstalledWallet } from "@components/Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import { useCurrentAccount, useProfilesStore } from "@data/store/accountsStore";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { spacing } from "@theme/spacing";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "@utils/profile";
import { shortAddress } from "@utils/str";
import { SimulateChangeType, SimulateAssetChangesResponse } from "alchemy-sdk";
import { Image, ImageSource } from "expo-image";
import { memo, useMemo } from "react";
import { StyleSheet, TextStyle, View, ViewStyle } from "react-native";

import TransactionSend from "../../assets/transaction-send.png";
import TransactionTo from "../../assets/transaction-to.png";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
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
  walletAddress: string | undefined;
};

type ITransactionContentProps = {
  simulation: SimulationState;
  txState: TransactionState;
  walletApp: InstalledWallet | undefined;
  walletAddress: string | undefined;
  address: string | undefined;
  switchWallet: () => Promise<void>;
};

export const TransactionContent = ({
  simulation,
  txState,
  walletApp,
  walletAddress,
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

  if (txState.status !== "pending") {
    return <TransactionResult status={txState.status} error={txState.error} />;
  }

  return (
    <>
      {simulation.status === "success" ? (
        <SimulationResult
          changes={simulation.result?.changes}
          walletAddress={walletAddress}
        />
      ) : (
        <SimulationFailure error={simulation.error} />
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
    <Text style={{ marginTop: spacing.xs }}>
      {translate("simulation_pending")}
    </Text>
  </VStack>
);

const TransactionLoader = ({ status, walletName }: TransactionLoaderProps) => (
  <VStack style={styles.center}>
    <ActivityIndicator />
    <Text style={{ marginTop: spacing.xs }}>
      {translate(
        status === "triggered"
          ? "transaction_triggered"
          : "transaction_triggering",
        { wallet: walletName }
      )}
    </Text>
  </VStack>
);

const TransactionResult = ({ status, error }: TransactionResultProps) => {
  const { themed } = useAppTheme();
  return (
    <VStack style={status === "failure" ? themed($failure) : styles.center}>
      {status === "failure" && (
        <Text color="caution">{translate("transaction_failure")}</Text>
      )}
      <Text>
        {status === "failure" ? error : translate("transaction_success")}
      </Text>
    </VStack>
  );
};

const SimulationResult = ({
  changes,
  walletAddress,
}: SimulationResultProps) => {
  const profiles = useProfilesStore((s) => s.profiles);
  const accountAddress = useCurrentAccount() as string;
  const myChanges = useMemo(() => {
    const myAddresses = [accountAddress.toLowerCase()];
    if (walletAddress) {
      myAddresses.push(walletAddress.toLowerCase());
    }
    return changes?.filter((change) =>
      myAddresses.some(
        (a) => a === change.to.toLowerCase() || a === change.from.toLowerCase()
      )
    );
  }, [accountAddress, changes, walletAddress]);

  return (
    <>
      {myChanges?.map((change, index) => (
        <View key={`${change.contractAddress}-${index}`}>
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
              getProfile(change.to, profiles)?.socials,
              change.to
            )}
            imageSrc={
              getPreferredAvatar(getProfile(change.to, profiles)?.socials) ||
              TransactionTo
            }
            imagePlaceholder={TransactionTo}
          />
        </View>
      ))}
    </>
  );
};

const SimulationFailure = ({ error }: { error?: string | undefined }) => {
  const { themed } = useAppTheme();
  return (
    <VStack style={themed($failure)}>
      <Text color="caution">{translate("simulation_caution")}</Text>
      <Text>
        {error
          ? translate("simulation_will_revert")
          : translate("simulation_failure")}
      </Text>
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

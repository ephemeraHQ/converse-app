import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { spacing } from "@theme/spacing";

import { StyleSheet } from "react-native";

import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";

type TransactionLoaderProps = {
  status: "triggering" | "triggered";
  walletName: string | undefined;
};

export const TransactionLoader = ({
  status,
  walletName,
}: TransactionLoaderProps) => (
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

const styles = StyleSheet.create({
  center: { alignItems: "center" },
});

import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";

import { StyleSheet, ViewStyle } from "react-native";

type TransactionResultProps = {
  status: "failure" | "success";
  error: string | undefined;
};

export const TransactionResult = ({
  status,
  error,
}: TransactionResultProps) => {
  const { themed } = useAppTheme();
  return (
    <VStack style={status === "failure" ? themed($failure) : styles.center}>
      {status === "failure" && (
        <>
          <Text color="caution">{translate("transaction_failure")}</Text>
          <Text>{error}</Text>
        </>
      )}
      {status === "success" && <Text>{translate("transaction_success")}</Text>}
    </VStack>
  );
};

const $failure: ThemedStyle<ViewStyle> = ({ spacing, borderRadius }) => ({
  marginBottom: spacing.md,
  padding: spacing.sm,
  backgroundColor: "#FFF5F5",
  borderRadius: borderRadius.xs,
});

const styles = StyleSheet.create({
  center: { alignItems: "center" },
});

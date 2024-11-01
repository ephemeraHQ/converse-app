import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";

import { ViewStyle } from "react-native";

export const SimulationFailure = ({
  error,
}: {
  error?: string | undefined;
}) => {
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

const $failure: ThemedStyle<ViewStyle> = ({ spacing, borderRadius }) => ({
  marginBottom: spacing.md,
  padding: spacing.sm,
  backgroundColor: "#FFF5F5",
  borderRadius: borderRadius.xs,
});

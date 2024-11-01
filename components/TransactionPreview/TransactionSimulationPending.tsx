import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { spacing } from "@theme/spacing";

import { StyleSheet } from "react-native";

import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";

export const SimulationPending = () => (
  <VStack style={styles.center}>
    <ActivityIndicator />
    <Text style={{ marginTop: spacing.xs }}>
      {translate("simulation_pending")}
    </Text>
  </VStack>
);

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

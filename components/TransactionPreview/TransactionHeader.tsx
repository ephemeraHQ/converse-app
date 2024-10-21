import { HStack } from "@design-system/HStack";
import { Pressable } from "@design-system/Pressable";
import { Text } from "@design-system/Text";
import { spacing } from "@theme/spacing";
import { StyleSheet } from "react-native";

import { CurrentAccount } from "../CurrentAccount";

type ITransactionHeaderProps = {
  onClose: () => void;
};

export const TransactionHeader = ({ onClose }: ITransactionHeaderProps) => (
  <HStack style={styles.top}>
    <CurrentAccount style={styles.account} />
    <Pressable onPress={onClose}>
      <Text>Close</Text>
    </Pressable>
  </HStack>
);

const styles = StyleSheet.create({
  top: { alignItems: "center", marginVertical: spacing.md },
  account: { marginRight: "auto" },
});

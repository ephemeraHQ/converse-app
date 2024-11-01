import { HStack } from "@design-system/HStack";
import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { spacing } from "@theme/spacing";
import { StyleSheet } from "react-native";

import TransactionClose from "../../assets/transaction-close.svg";
import { CurrentAccount } from "../CurrentAccount";

type ITransactionHeaderProps = {
  onClose: () => void;
};

export const TransactionHeader = ({ onClose }: ITransactionHeaderProps) => (
  <HStack style={styles.top}>
    <CurrentAccount style={styles.account} />
    <TouchableOpacity onPress={onClose}>
      <TransactionClose />
    </TouchableOpacity>
  </HStack>
);

const styles = StyleSheet.create({
  top: { alignItems: "center", marginVertical: spacing.md },
  account: { marginRight: "auto" },
});

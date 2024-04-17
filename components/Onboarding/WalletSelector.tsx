import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHasOnePrivyAccount } from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { textSecondaryColor } from "../../utils/colors";
import { isDesktop } from "../../utils/device";
import Button from "../Button/Button";
import TableView from "../TableView/TableView";
import { TableViewEmoji, TableViewPicto } from "../TableView/TableViewImage";
import OnboardingComponent from "./OnboardingComponent";

export default function WalletSelector() {
  const { setConnectionMethod, addingNewAccount, setAddingNewAccount } =
    useOnboardingStore(
      useSelect([
        "setConnectionMethod",
        "addingNewAccount",
        "setAddingNewAccount",
      ])
    );
  const colorScheme = useColorScheme();
  const rightView = (
    <TableViewPicto
      symbol="chevron.right"
      color={textSecondaryColor(colorScheme)}
    />
  );

  const insets = useSafeAreaInsets();
  const alreadyConnectedToPrivy = useHasOnePrivyAccount();
  return (
    <OnboardingComponent
      title="GM"
      picto="message.circle.fill"
      subtitle="Converse lets you communicate and transact freely and safely."
    >
      <View
        style={[
          styles.walletSelectorContainer,
          {
            marginBottom:
              Platform.OS === "android" ? insets.bottom + 30 : insets.bottom,
          },
        ]}
      >
        {!alreadyConnectedToPrivy && (
          <TableView
            title="CONVERSE ACCOUNT"
            items={[
              {
                id: "phone",
                leftView: <TableViewEmoji emoji="📞" />,
                title: "Connect via Phone",
                rightView,
                action: () => {
                  setConnectionMethod("phone");
                },
              },
            ]}
          />
        )}
      </View>
      {addingNewAccount && (
        <Button
          title="Cancel"
          variant="text"
          style={[styles.cancelButton, { top: insets.top + 9 }]}
          onPress={() => setAddingNewAccount(false)}
        />
      )}
    </OnboardingComponent>
  );
}

const styles = StyleSheet.create({
  walletSelectorContainer: {
    width: "100%",
    flexGrow: 1,
    marginTop: isDesktop ? 80 : 30,
    justifyContent: "flex-start",
    paddingHorizontal: Platform.OS === "android" ? 0 : 24,
  },
  cancelButton: {
    position: "absolute",
    top: 0,
    left: Platform.OS === "android" ? 10 : 30,
  },
});

import { StyleSheet, useColorScheme } from "react-native";
import { Drawer } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AccountSettingsButton from "../../components/AccountSettingsButton";
import Picto from "../../components/Picto/Picto";
import {
  useAccountsList,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { clickedItemBackgroundColor } from "../../utils/colors";
import { converseEventEmitter } from "../../utils/events";
import useDisconnect from "../../utils/onboarding/disconnect";
import { shortAddress, useAccountsProfiles } from "../../utils/str";

export default function AccountsAndroid() {
  const styles = useStyles();
  const accounts = useAccountsList();
  const accountsProfiles = useAccountsProfiles();

  const disconnectWallet = useDisconnect();
  const { currentAccount, setCurrentAccount } = useAccountsStore(
    useSelect(["currentAccount", "setCurrentAccount"])
  );
  const setAddingNewAccount = useOnboardingStore((s) => s.setAddingNewAccount);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  return (
    <Drawer.Section
      title="Accounts"
      style={{ marginTop: insets.top }}
      showDivider={false}
    >
      {accounts.map((a) => (
        <Drawer.Item
          style={styles.item}
          key={a}
          label={accountsProfiles[a] || shortAddress(a)}
          active={currentAccount === a}
          onPress={() => {
            setCurrentAccount(a, false);
            converseEventEmitter.emit("toggle-navigation-drawer", false);
          }}
          icon={({ color }) => (
            <Picto picto="account_circle" size={24} color={color} />
          )}
          right={({ color }) => <AccountSettingsButton account={a} />}
          rippleColor={
            currentAccount === a
              ? undefined
              : clickedItemBackgroundColor(colorScheme)
          }
        />
      ))}
      <Drawer.Item
        label="Add an account"
        icon={({ color }) => <Picto picto="plus" size={24} color={color} />}
        onPress={async () => {
          try {
            await disconnectWallet();
          } catch (e) {
            console.error(e);
          }
          setAddingNewAccount(true);
        }}
        rippleColor={clickedItemBackgroundColor(colorScheme)}
      />
    </Drawer.Section>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    item: {
      marginBottom: 10,
    },
  });
};

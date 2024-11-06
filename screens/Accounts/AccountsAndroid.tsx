import { NavigationProp } from "@react-navigation/native";
import { backgroundColor, clickedItemBackgroundColor } from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { Dimensions, Platform, StyleSheet, useColorScheme } from "react-native";
import { Drawer } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AccountSettingsButton from "../../components/AccountSettingsButton";
import Picto from "../../components/Picto/Picto";
import {
  useAccountsList,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { useRouter } from "../../navigation/useNavigation";
import { useAccountsProfiles } from "../../utils/str";
import { shortAddress } from "@utils/strings/shortAddress";
type Props = {
  navigation?: NavigationProp<any> | undefined;
};

export default function AccountsAndroid({ navigation }: Props) {
  const styles = useStyles();
  const accounts = useAccountsList();
  const accountsProfiles = useAccountsProfiles();

  const { currentAccount, setCurrentAccount } = useAccountsStore(
    useSelect(["currentAccount", "setCurrentAccount"])
  );

  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const router = useRouter();

  return (
    <Drawer.Section
      title="Accounts"
      style={{
        marginTop: insets.top,
        ...Platform.select({
          default: {},
          web: {
            height: Dimensions.get("window").height,
            backgroundColor: backgroundColor(colorScheme),
          },
        }),
      }}
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
            navigation?.navigate("Chats");
          }}
          icon={({ color }) => (
            <Picto
              picto="account_circle"
              size={PictoSizes.accoutSettings}
              color={color}
            />
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
        icon={({ color }) => (
          <Picto picto="plus" size={PictoSizes.navItem} color={color} />
        )}
        onPress={() => {
          router.navigate("NewAccountNavigator");
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

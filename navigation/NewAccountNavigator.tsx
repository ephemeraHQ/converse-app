import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { memo } from "react";

import { NativeStack } from "./Navigation";
import { useRouter } from "./useNavigation";
import { ScreenHeaderModalCloseButton } from "../components/Screen/ScreenHeaderModalCloseButton";
import { NewAccountConnectWalletScreen } from "../screens/NewAccount/NewAccountConnectWalletScreen";
import { NewAccountEphemeraScreen } from "../screens/NewAccount/NewAccountEphemeraScreen";
import { NewAccountPrivateKeyScreen } from "../screens/NewAccount/NewAccountPrivateKeyScreen";
import { NewAccountPrivyScreen } from "../screens/NewAccount/NewAccountPrivyScreen";
import { NewAccountScreen } from "../screens/NewAccount/NewAccountScreen";
import { NewAccountUserProfileScreen } from "../screens/NewAccount/NewAccountUserProfileScreen";

type NewAccountNavigatorParamList = {
  NewAccount: undefined;
  NewAccountPrivy: undefined;
  NewAccountConnectWallet: undefined;
  NewAccountPrivateKey: undefined;
  NewAccountUserProfile: undefined;
  NewAccountEphemera: undefined;
};

const NewAccountStack =
  createNativeStackNavigator<NewAccountNavigatorParamList>();

export const NewAccountNavigator = memo(function NewAccountNavigator() {
  const router = useRouter();

  return (
    <NewAccountStack.Navigator>
      <NativeStack.Screen
        name="NewAccount"
        component={NewAccountScreen}
        options={{
          headerTitle: "New account",
          headerLeft: () => (
            <ScreenHeaderModalCloseButton
              title="Cancel"
              onPress={router.goBack}
            />
          ),
        }}
      />
      <NewAccountStack.Screen
        name="NewAccountPrivy"
        component={NewAccountPrivyScreen}
      />
      <NewAccountStack.Screen
        name="NewAccountConnectWallet"
        component={NewAccountConnectWalletScreen}
      />
      <NewAccountStack.Screen
        name="NewAccountPrivateKey"
        component={NewAccountPrivateKeyScreen}
      />
      <NewAccountStack.Screen
        name="NewAccountUserProfile"
        component={NewAccountUserProfileScreen}
      />
      <NewAccountStack.Screen
        name="NewAccountEphemera"
        component={NewAccountEphemeraScreen}
      />
    </NewAccountStack.Navigator>
  );
});

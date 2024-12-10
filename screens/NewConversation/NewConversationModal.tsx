import {
  NativeStackScreenProps,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import {
  headerTitleStyle,
  navigationSecondaryBackgroundColor,
  textPrimaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

import NewConversation from "./NewConversation";
import NewGroupSummary from "./NewGroupSummary";
import Button from "../../components/Button/Button";
import { ProfileSocials } from "../../data/store/profilesStore";
import {
  NavigationParamList,
  navigationAnimation,
} from "../Navigation/Navigation";
import { NewConversationNavParams } from "../Navigation/NewConversationNav";
import { translate } from "@/i18n";

export type NewConversationModalParams = {
  NewConversationScreen: NewConversationNavParams;
  NewGroupSummary: {
    members: (ProfileSocials & { address: string })[];
  };
};

const ModalStack = createNativeStackNavigator<NewConversationModalParams>();

const NewConversationModal = ({
  route,
}: NativeStackScreenProps<NavigationParamList, "NewConversation">) => {
  const colorScheme = useColorScheme();
  return (
    <ModalStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: navigationSecondaryBackgroundColor(colorScheme),
        } as any,
        headerTitleStyle: Platform.select({
          default: headerTitleStyle(colorScheme),
          web: { left: -20, color: textPrimaryColor(colorScheme) } as any,
        }),
        animation: navigationAnimation,
      }}
    >
      <ModalStack.Screen
        name="NewConversationScreen"
        options={{
          headerTitle: route.params?.addingToGroupTopic
            ? translate("new_group.add_members")
            : translate("new_conversation.new_conversation"),
          presentation: "modal",
        }}
      >
        {(props) => {
          const newRoute = { ...props.route };
          if (route.params) {
            newRoute.params = route.params;
          }
          return (
            <NewConversation route={newRoute} navigation={props.navigation} />
          );
        }}
      </ModalStack.Screen>
      <ModalStack.Screen
        name="NewGroupSummary"
        component={NewGroupSummary}
        options={{
          headerBackTitle: translate("new_conversation.back"),
          headerTitle: translate("new_conversation.create_group"),
          headerRight: () => (
            <Button
              variant="text"
              title={translate("new_conversation.create")}
            />
          ), // Dummy button for style
        }}
      />
    </ModalStack.Navigator>
  );
};

export default NewConversationModal;

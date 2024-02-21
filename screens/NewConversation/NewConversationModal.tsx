import {
  NativeStackScreenProps,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { Platform, useColorScheme } from "react-native";

import Button from "../../components/Button/Button";
import { ProfileSocials } from "../../data/store/profilesStore";
import {
  navigationSecondaryBackgroundColor,
  listItemSeparatorColor,
  textPrimaryColor,
  headerTitleStyle,
} from "../../utils/colors";
import {
  NavigationParamList,
  navigationAnimation,
} from "../Navigation/Navigation";
import { NewConversationNavParams } from "../Navigation/NewConversationNav";
import NewConversation from "./NewConversation";
import NewGroupSummary from "./NewGroupSummary";

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
          borderBottomColor:
            Platform.OS === "web"
              ? listItemSeparatorColor(colorScheme)
              : undefined,
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
            ? "Add members"
            : "New conversation",
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
          headerBackTitle: "Back",
          headerTitle: "New group",
          headerRight: () => <Button variant="text" title="Create" />, // Dummy button for style
        }}
      />
    </ModalStack.Navigator>
  );
};

export default NewConversationModal;

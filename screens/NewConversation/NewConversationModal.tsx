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
import { IProfileSocials } from "@/features/profiles/profile-types";
import {
  NavigationParamList,
  navigationAnimation,
} from "../Navigation/Navigation";
import { NewChatNavParams } from "../Navigation/NewConversationNav";
import { translate } from "@/i18n";
import logger from "@/utils/logger";
import { Button } from "@/design-system/Button/Button";

export type NewConversationModalParams = {
  NewChatComposerScreen: NewChatNavParams;
  NewGroupSummary: {
    members: (IProfileSocials & { address: string })[];
  };
};

const ModalStack = createNativeStackNavigator<NewConversationModalParams>();

const NewConversationModal = ({
  route,
}: NativeStackScreenProps<NavigationParamList, "NewConversation">) => {
  const colorScheme = useColorScheme();

  logger.debug("[NewConversationModal] Rendering with params:", {
    addingToGroupTopic: route.params?.addingToGroupTopic,
    peer: route.params?.peer
  });

  return (
    <ModalStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: navigationSecondaryBackgroundColor(colorScheme),
        } as any,
        headerTitleStyle: Platform.select({
          default: headerTitleStyle(colorScheme),
        }),
        animation: navigationAnimation,
      }}
    >
      <ModalStack.Screen
        name="NewChatComposerScreen"
      >
        {(props) => {
          const newRoute = { ...props.route };
          if (route.params) {
            newRoute.params = route.params;
            logger.debug("[NewConversationModal] Passing params to NewChatComposerScreen:", {
              params: route.params
            });
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
          headerBackTitle: translate("new_chat.back"),
          headerTitle: translate("new_chat.create_group"),
          headerRight: () => {
            logger.debug("[NewConversationModal] Rendering NewGroupSummary header right button");
            return (
              <Button
                variant="text"
                text={translate("new_chat.create")}
              />
            );
          },
        }}
      />
    </ModalStack.Navigator>
  );
};

export default NewConversationModal;

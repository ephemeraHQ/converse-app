import { RouteProp, useRoute } from "@react-navigation/native";
import { NavigationParamList } from "@screens/Navigation/Navigation";

export const useIsSharingMode = () => {
  const route =
    useRoute<
      RouteProp<NavigationParamList, "Chats" | "ShareFrame" | "Blocked">
    >();
  const sharingMode = route?.params?.frameURL;

  return sharingMode;
};

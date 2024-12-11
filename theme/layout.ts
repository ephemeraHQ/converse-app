import { avatarSize } from "@theme/avatar";
import { spacing } from "./spacing";
import { Dimensions } from "react-native";

// TODO: Remove and put in spacing?
export const layout = {
  onboardingScreenPadding: spacing.lg,
  chat: {
    messageSenderAvatar: {
      width: avatarSize.sm,
      height: avatarSize.sm,
    },
  },
  screen: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
};

export type ILayout = typeof layout;

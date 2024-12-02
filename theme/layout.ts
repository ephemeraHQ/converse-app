import { avatarSize } from "@theme/avatar";
import { spacing } from "./spacing";

// TODO: Remove and put in spacing?
export const layout = {
  onboardingScreenPadding: spacing.lg,
  chat: {
    messageSenderAvatar: {
      width: avatarSize.sm,
      height: avatarSize.sm,
    },
  },
};

export type ILayout = typeof layout;

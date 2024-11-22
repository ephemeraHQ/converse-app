import { useCallback } from "react";
import { useRouter } from "@navigation/useNavigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import { usePreferredName } from "@hooks/usePreferredName";
import Avatar from "@components/Avatar";
import { usePreferredAvatarUri } from "@hooks/usePreferredAvatarUri";
import { AvatarSizes } from "@styles/sizes";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { ImageStyle, Platform } from "react-native";
import { useProfileSocials } from "@hooks/useProfileSocials";
import { ConversationTitleDumb } from "@components/Conversation/ConversationTitleDumb";

type NewConversationTitleProps = {
  peerAddress: string;
};

type UseUserInteractionProps = {
  peerAddress?: string;
  navigation: NativeStackNavigationProp<NavigationParamList>;
};

const useUserInteraction = ({
  navigation,
  peerAddress,
}: UseUserInteractionProps) => {
  const onPress = useCallback(() => {
    if (peerAddress) {
      navigation.push("Profile", { address: peerAddress });
    }
  }, [navigation, peerAddress]);

  return { onPress };
};

export const NewConversationTitle = ({
  peerAddress,
}: NewConversationTitleProps) => {
  const navigation = useRouter();

  const { themed } = useAppTheme();

  const { onPress } = useUserInteraction({
    peerAddress,
    navigation,
  });

  const { isLoading } = useProfileSocials(peerAddress ?? "");

  const preferredName = usePreferredName(peerAddress ?? "");

  const preferredAvatarUri = usePreferredAvatarUri(peerAddress ?? "");

  const displayAvatar = !isLoading;

  if (!displayAvatar) return null;

  return (
    <ConversationTitleDumb
      title={preferredName}
      onPress={onPress}
      avatarComponent={
        displayAvatar && (
          <Avatar
            uri={preferredAvatarUri ?? undefined}
            size={AvatarSizes.conversationTitle}
            style={themed($avatar)}
          />
        )
      }
    />
  );
};

const $avatar: ThemedStyle<ImageStyle> = (theme) => ({
  marginRight: Platform.OS === "android" ? theme.spacing.lg : theme.spacing.xxs,
  marginLeft: Platform.OS === "ios" ? theme.spacing.zero : -theme.spacing.xxs,
});

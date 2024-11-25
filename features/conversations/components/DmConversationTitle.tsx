import { useCallback } from "react";
import { useConversationTitleLongPress } from "../hooks/useConversationTitleLongPress";
import { useRouter } from "@navigation/useNavigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import { useDmPeerAddressQuery } from "@queries/useDmPeerAddressQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { usePreferredName } from "@hooks/usePreferredName";
import Avatar from "@components/Avatar";
import { usePreferredAvatarUri } from "@hooks/usePreferredAvatarUri";
import { AvatarSizes } from "@styles/sizes";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { ImageStyle, Platform } from "react-native";
import { useProfileSocials } from "@hooks/useProfileSocials";
import { ConversationTitleDumb } from "@components/Conversation/ConversationTitleDumb";

type DmConversationTitleProps = {
  topic: ConversationTopic;
};

type UseUserInteractionProps = {
  peerAddress?: string;
  navigation: NativeStackNavigationProp<NavigationParamList>;
  topic: ConversationTopic;
};

const useUserInteraction = ({
  navigation,
  peerAddress,
  topic,
}: UseUserInteractionProps) => {
  const onPress = useCallback(() => {
    if (peerAddress) {
      navigation.push("Profile", { address: peerAddress });
    }
  }, [navigation, peerAddress]);

  const onLongPress = useConversationTitleLongPress(topic);

  return { onPress, onLongPress };
};

export const DmConversationTitle = ({ topic }: DmConversationTitleProps) => {
  const account = useCurrentAccount()!;

  const navigation = useRouter();

  const { themed } = useAppTheme();

  const { data: peerAddress, isLoading: peerAddressLoading } =
    useDmPeerAddressQuery(account, topic);

  const { onPress, onLongPress } = useUserInteraction({
    peerAddress,
    navigation,
    topic,
  });

  const { isLoading } = useProfileSocials(peerAddress ?? "");

  const preferredName = usePreferredName(peerAddress ?? "");

  const preferredAvatarUri = usePreferredAvatarUri(peerAddress ?? "");

  const displayAvatar = !peerAddressLoading && !isLoading;

  if (!displayAvatar) return null;

  return (
    <ConversationTitleDumb
      title={preferredName}
      onLongPress={onLongPress}
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

import Avatar from "@components/Avatar";
import {
  inversePrimaryColor,
  textPrimaryColor,
  tertiaryBackgroundColor,
  primaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { memo, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { MessageToDisplay } from "./Message";
import {
  useCurrentAccount,
  useProfilesStore,
} from "../../../data/store/accountsStore";
import { useConversationContext } from "../../../utils/conversation";
import { getPreferredAvatar, getPreferredName } from "../../../utils/profile";
import {
  MessageReaction,
  addReactionToMessage,
  removeReactionFromMessage,
} from "../../../utils/reactions";

const MAX_REACTORS_TO_SHOW = 3;
const REACTOR_OFFSET = 10;

type Props = {
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
};

type ReactionCount = {
  content: string;
  count: number;
  userReacted: boolean;
  reactors: string[];
  firstReactionTime: number;
};

function ChatMessageReactions({ message, reactions }: Props) {
  const { conversation } = useConversationContext(["conversation"]);
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const userAddress = useCurrentAccount();
  const profiles = useProfilesStore((state) => state.profiles);

  const reactionsList = useMemo(() => {
    return Object.entries(reactions)
      .flatMap(([senderAddress, reactions]) =>
        reactions.map((reaction) => ({ ...reaction, senderAddress }))
      )
      .sort((r1, r2) => r1.sent - r2.sent);
  }, [reactions]);

  const reactionCounts = useMemo(() => {
    const counts: { [content: string]: ReactionCount } = {};

    Object.values(reactions).forEach((reactionArray) => {
      reactionArray.forEach((reaction) => {
        if (!counts[reaction.content]) {
          counts[reaction.content] = {
            content: reaction.content,
            count: 0,
            userReacted: false,
            reactors: [],
            firstReactionTime: reaction.sent,
          };
        }
        counts[reaction.content].count++;
        counts[reaction.content].reactors.push(reaction.senderAddress);
        if (
          reaction.senderAddress.toLowerCase() === userAddress?.toLowerCase()
        ) {
          counts[reaction.content].userReacted = true;
        }
        // Keep track of the earliest reaction time for this emoji
        counts[reaction.content].firstReactionTime = Math.min(
          counts[reaction.content].firstReactionTime,
          reaction.sent
        );
      });
    });

    // Convert to array and sort
    return Object.values(counts).sort((a, b) => {
      // Sort by the time of the first reaction (ascending)
      return a.firstReactionTime - b.firstReactionTime;
    });
  }, [reactions, userAddress]);

  const handleReactionPress = useCallback(
    (reaction: ReactionCount) => {
      if (!conversation || !userAddress) return;

      if (reaction.userReacted) {
        removeReactionFromMessage(conversation, message, reaction.content);
      } else {
        addReactionToMessage(conversation, message, reaction.content);
      }
    },
    [conversation, message, userAddress]
  );

  if (reactionsList.length === 0) return null;

  return (
    <View
      style={[
        styles.reactionsWrapper,
        message.fromMe && { justifyContent: "flex-end" },
      ]}
    >
      {reactionCounts.map((reaction) => {
        const reactorCount = reaction.reactors.length;
        return (
          <TouchableOpacity
            key={reaction.content}
            onPress={() => handleReactionPress(reaction)}
            style={[
              styles.reactionButton,
              reaction.userReacted
                ? message.fromMe
                  ? styles.myReactionToMyMessageButton
                  : styles.myReactionToOtherMessageButton
                : styles.otherReactionButton,
            ]}
          >
            <Text style={styles.emoji}>{reaction.content}</Text>
            {reactorCount <= MAX_REACTORS_TO_SHOW ? (
              <View
                style={[
                  styles.reactorContainer,
                  { marginRight: (reactorCount - 1) * -REACTOR_OFFSET },
                ]}
              >
                {reaction.reactors
                  .slice(0, MAX_REACTORS_TO_SHOW)
                  .map((reactor, index) => (
                    <Avatar
                      key={reactor}
                      uri={getPreferredAvatar(profiles[reactor]?.socials)}
                      name={getPreferredName(
                        profiles[reactor]?.socials,
                        reactor
                      )}
                      size={AvatarSizes.messageReactor}
                      invertColor={message.fromMe}
                      style={[
                        styles.profileImage,
                        {
                          left: index * -REACTOR_OFFSET,
                          zIndex: MAX_REACTORS_TO_SHOW - (index + 1),
                        },
                        reaction.userReacted
                          ? message.fromMe
                            ? styles.myReactionToMyMessageProfileImage
                            : styles.myReactionToOtherMessageProfileImage
                          : styles.otherProfileImage,
                      ]}
                    />
                  ))}
              </View>
            ) : (
              <View style={styles.reactorContainer}>
                <Text
                  style={[
                    styles.reactorCount,
                    reaction.userReacted
                      ? { color: inversePrimaryColor(colorScheme) }
                      : {},
                  ]}
                >
                  {reactorCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default memo(ChatMessageReactions);

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    reactionsWrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 4,
      columnGap: 5,
    },
    reactionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 16,
      borderWidth: 0.25,
    },
    profileImage: {
      width: 22,
      height: 22,
      borderRadius: 22,
      borderWidth: 1,
    },
    otherReactionButton: {
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      borderColor: tertiaryBackgroundColor(colorScheme),
    },
    otherProfileImage: {
      borderColor: tertiaryBackgroundColor(colorScheme),
    },
    myReactionToOtherMessageButton: {
      backgroundColor: primaryColor(colorScheme),
      borderColor: primaryColor(colorScheme),
    },
    myReactionToOtherMessageProfileImage: {
      borderColor: primaryColor(colorScheme),
    },
    myReactionToMyMessageButton: {
      backgroundColor: primaryColor(colorScheme),
      borderColor: tertiaryBackgroundColor(colorScheme),
    },
    myReactionToMyMessageProfileImage: {
      borderColor: primaryColor(colorScheme),
    },
    emoji: {
      fontSize: 14,
      marginHorizontal: 2,
    },
    reactorContainer: {
      flexDirection: "row",
      alignItems: "center",
      height: 22,
    },
    reactorCount: {
      fontSize: 12,
      marginHorizontal: 2,
      color: textPrimaryColor(colorScheme),
    },
  });
};

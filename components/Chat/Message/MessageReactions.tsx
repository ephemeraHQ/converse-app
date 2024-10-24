import { useCurrentAccount } from "@data/store/accountsStore";
import { createBottomSheetModalRef } from "@design-system/BottomSheet/BottomSheet.utils";
import { BottomSheetContentContainer } from "@design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import { useAppTheme } from "@theme/useAppTheme";
import { MessageReaction } from "@utils/reactions";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableHighlight } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MessageToDisplay } from "./Message";

const MAX_REACTION_EMOJIS_SHOWN = 3;

type Props = {
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
};

type ReactionDetails = {
  content: string;
  count: number;
  userReacted: boolean;
  reactors: string[];
  firstReactionTime: number;
};

type RolledUpReactions = {
  emojis: string[];
  totalReactions: number;
  userReacted: boolean;
  details: { [content: string]: ReactionDetails };
};

export const ChatMessageReactions = memo(
  ({ message, reactions }: Props) => {
    const styles = useStyles();
    const { top } = useSafeAreaInsets();
    const { theme } = useAppTheme();
    const userAddress = useCurrentAccount();
    const bottomSheetModalRef = createBottomSheetModalRef();
    const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);

    const openReactionsDrawer = () => {
      setBottomSheetVisible(true);
    };

    const onDismissReactionsDrawer = () => {
      setBottomSheetVisible(false);
    };

    useEffect(() => {
      if (isBottomSheetVisible) {
        bottomSheetModalRef.current?.present();
      }
    }, [isBottomSheetVisible, bottomSheetModalRef]);

    const renderBackdrop = useCallback(
      (props: BottomSheetDefaultBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          style={[
            props.style,
            { backgroundColor: theme.colors.background.scrim },
          ]}
        />
      ),
      [theme]
    );

    const rolledUpReactions: RolledUpReactions = useMemo(() => {
      const details: { [content: string]: ReactionDetails } = {};
      let totalReactions = 0;
      let userReacted = false;

      Object.values(reactions).forEach((reactionArray) => {
        reactionArray.forEach((reaction) => {
          if (!details[reaction.content]) {
            details[reaction.content] = {
              content: reaction.content,
              count: 0,
              userReacted: false,
              reactors: [],
              firstReactionTime: reaction.sent,
            };
          }
          details[reaction.content].count++;
          details[reaction.content].reactors.push(reaction.senderAddress);
          if (
            reaction.senderAddress.toLowerCase() === userAddress?.toLowerCase()
          ) {
            details[reaction.content].userReacted = true;
            userReacted = true;
          }
          // Keep track of the earliest reaction time for this emoji
          details[reaction.content].firstReactionTime = Math.min(
            details[reaction.content].firstReactionTime,
            reaction.sent
          );
          totalReactions++;
        });
      });

      // Sort by the number of reactors in descending order
      const sortedReactions = Object.values(details)
        .sort((a, b) => b.reactors.length - a.reactors.length)
        .slice(0, MAX_REACTION_EMOJIS_SHOWN)
        .map((reaction) => reaction.content);

      return { emojis: sortedReactions, totalReactions, userReacted, details };
    }, [reactions, userAddress]);

    if (rolledUpReactions.totalReactions === 0) return null;

    return (
      <HStack
        style={[
          styles.reactionsWrapper,
          message.fromMe && { justifyContent: "flex-end" },
        ]}
      >
        <TouchableHighlight
          onPress={openReactionsDrawer}
          underlayColor="transparent"
        >
          <VStack
            style={[
              styles.reactionButton,
              rolledUpReactions.userReacted && {
                borderColor: theme.colors.fill.minimal,
                backgroundColor: theme.colors.fill.minimal,
              },
            ]}
          >
            <HStack style={styles.emojiContainer}>
              {rolledUpReactions.emojis.map((emoji, index) => (
                <Text key={index}>{emoji}</Text>
              ))}
            </HStack>
            {rolledUpReactions.totalReactions > 1 && (
              <Text style={styles.reactorCount}>
                {rolledUpReactions.totalReactions}
              </Text>
            )}
          </VStack>
        </TouchableHighlight>
        {isBottomSheetVisible && (
          <BottomSheetModal
            ref={bottomSheetModalRef}
            onDismiss={onDismissReactionsDrawer}
            snapPoints={["40%"]}
            enableDynamicSizing
            index={1}
            topInset={top}
            backdropComponent={renderBackdrop}
            backgroundStyle={{
              backgroundColor: theme.colors.background.raised,
            }}
          >
            <BottomSheetHeader title="Reactions" hasClose />
            <BottomSheetScrollView
              style={{
                backgroundColor: theme.colors.background.raised,
              }}
            >
              <BottomSheetContentContainer>
                <HStack
                  style={{
                    padding: 32,
                    flexDirection: "row",
                    overflow: "scroll",
                  }}
                >
                  <Text>{rolledUpReactions.totalReactions}</Text>
                  {Object.entries(rolledUpReactions.details).map(
                    ([emoji, details]) => (
                      <TouchableHighlight
                        key={emoji}
                        style={{
                          marginRight: 8,
                          padding: 8,
                          borderRadius: theme.borderRadius.sm,
                          backgroundColor: details.userReacted
                            ? theme.colors.fill.minimal
                            : theme.colors.background.raised,
                        }}
                        underlayColor={theme.colors.border.subtle}
                      >
                        <VStack style={{ alignItems: "center" }}>
                          <Text>{emoji}</Text>
                          <Text>{details.count}</Text>
                        </VStack>
                      </TouchableHighlight>
                    )
                  )}
                </HStack>
              </BottomSheetContentContainer>
            </BottomSheetScrollView>
          </BottomSheetModal>
        )}
      </HStack>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.message.id !== nextProps.message.id) {
      return false;
    }
    if (prevProps.message.lastUpdateAt !== nextProps.message.lastUpdateAt) {
      return false;
    }
    return true;
  }
);

const useStyles = () => {
  const { theme } = useAppTheme();

  return StyleSheet.create({
    reactionsWrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    reactionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.borderRadius.sm,
      borderWidth: theme.borderWidth.sm,
      borderColor: theme.colors.border.subtle,
    },
    emojiContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xxxs,
    },
    reactorCount: {
      marginLeft: theme.spacing.xxxs,
      color: theme.colors.text.secondary,
    },
  });
};

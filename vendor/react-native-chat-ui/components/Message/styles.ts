import { StyleSheet } from "react-native";

import { MessageType, Theme } from "../../types";

const styles = ({
  currentUserIsAuthor,
  message,
  messageWidth,
  roundBorder,
  theme,
}: {
  currentUserIsAuthor: boolean;
  message: MessageType.DerivedAny;
  messageWidth: number;
  roundBorder: boolean;
  theme: Theme;
}) =>
  StyleSheet.create({
    container: {
      alignItems: "flex-end",
      alignSelf: currentUserIsAuthor ? "flex-end" : "flex-start",
      justifyContent: !currentUserIsAuthor ? "flex-end" : "flex-start",
      flex: 1,
      flexDirection: "row",
      marginBottom: message.type === "dateHeader" ? 0 : 4 + message.offset,
      marginLeft: 20,
    },
    contentContainer: {
      backgroundColor:
        !currentUserIsAuthor || message.type === "image"
          ? theme.colors.secondary
          : theme.colors.primary,
      borderBottomLeftRadius:
        currentUserIsAuthor || roundBorder
          ? theme.borders.messageBorderRadius
          : 0,
      borderBottomRightRadius: currentUserIsAuthor
        ? roundBorder
          ? theme.borders.messageBorderRadius
          : 0
        : theme.borders.messageBorderRadius,
      borderColor: "transparent",
      borderRadius: theme.borders.messageBorderRadius,
      overflow: "hidden",
    },
    dateHeader: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      marginTop: 16,
    },
    pressable: {
      maxWidth: messageWidth,
    },
  });

export default styles;

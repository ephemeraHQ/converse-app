import { GroupChangeContent } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";

import {
  currentAccount,
  getProfilesStore,
} from "../../data/store/accountsStore";
import { textSecondaryColor } from "../../utils/colors";
import { getPreferredName } from "../../utils/profile";
import { MessageToDisplay } from "./ChatMessage";

export default function ChatGroupChangeMessage({
  message,
}: {
  message: MessageToDisplay;
}) {
  const styles = useStyles();
  const membersActions = useMemo(() => {
    const content = JSON.parse(message.content) as GroupChangeContent;
    const textMessages: string[] = [];
    const profiles = getProfilesStore(currentAccount()).getState().profiles;
    content.membersAdded.forEach((m) => {
      const readableName = getPreferredName(
        profiles[m.address]?.socials,
        m.address
      );
      textMessages.push(`${readableName} joined the conversation`);
    });
    content.membersRemoved.forEach((m) => {
      const readableName = getPreferredName(
        profiles[m.address]?.socials,
        m.address
      );
      textMessages.push(`${readableName} left the conversation`);
    });
    return textMessages;
  }, [message.content]);
  return (
    <>
      {membersActions.map((a) => (
        <Text key={a} style={styles.groupChange}>
          {a}
        </Text>
      ))}
    </>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    groupChange: {
      color: textSecondaryColor(colorScheme),
      fontSize: 11,
      textAlign: "center",
      width: "100%",
      marginTop: 5,
      marginBottom: 9,
    },
  });
};

import { textSecondaryColor } from "@styles/colors";
import { GroupUpdatedContent } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";

import { MessageToDisplay } from "./Message/Message";
import {
  useInboxIdStore,
  useProfilesStore,
} from "../../data/store/accountsStore";
import { getPreferredName } from "../../utils/profile";

export default function ChatGroupUpdatedMessage({
  message,
}: {
  message: MessageToDisplay;
}) {
  const styles = useStyles();
  const byInboxId = useInboxIdStore().byInboxId;
  const profiles = useProfilesStore().profiles;
  // JSON Parsing is heavy so useMemo
  const parsedContent = useMemo(
    () => JSON.parse(message.content) as GroupUpdatedContent,
    [message.content]
  );

  // TODO: Feat: handle multiple members
  const initiatedByAddress = byInboxId[parsedContent.initiatedByInboxId]?.[0];
  const initiatedByReadableName = getPreferredName(
    profiles[initiatedByAddress]?.socials,
    initiatedByAddress
  );
  const membersActions: string[] = [];
  parsedContent.membersAdded.forEach((m) => {
    // TODO: Feat: handle multiple members
    const firstAddress = byInboxId[m.inboxId]?.[0];
    // We haven't synced yet the members
    if (!firstAddress) return;
    const readableName = getPreferredName(
      profiles[firstAddress]?.socials,
      firstAddress
    );
    membersActions.push(`${readableName} joined the conversation`);
  });
  parsedContent.membersRemoved.forEach((m) => {
    // TODO: Feat: handle multiple members
    const firstAddress = byInboxId[m.inboxId]?.[0];
    // We haven't synced yet the members
    if (!firstAddress) return;
    const readableName = getPreferredName(
      profiles[firstAddress]?.socials,
      firstAddress
    );
    membersActions.push(`${readableName} left the conversation`);
  });
  parsedContent.metadataFieldsChanged.forEach((f) => {
    if (f.fieldName === "group_name") {
      membersActions.push(
        `The group name was changed to ${f.newValue} by ${initiatedByReadableName}`
      );
    } else if (f.fieldName === "group_image_url_square") {
      membersActions.push(
        `The group photo was changed by ${initiatedByReadableName}`
      );
    } else if (f.fieldName === "description") {
      membersActions.push(
        `The group description was changed to ${f.newValue} by ${initiatedByReadableName}`
      );
    }
  });

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

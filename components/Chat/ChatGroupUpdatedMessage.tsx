import { PressableProfileWithText } from "@components/PressableProfileWithText";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { textSecondaryColor } from "@styles/colors";
import { navigate } from "@utils/navigation";
import { GroupUpdatedContent, InboxId } from "@xmtp/react-native-sdk";
import { useCallback, useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

import { MessageToDisplay } from "./Message/Message";
import { getPreferredName } from "../../utils/profile";
import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { ProfileSocials } from "@data/store/profilesStore";

export function ChatGroupUpdatedMessage({
  message,
}: {
  message: MessageToDisplay;
}) {
  const currentAccount = useCurrentAccount();
  const styles = useStyles();

  // JSON Parsing is heavy so useMemo
  const parsedContent = useMemo(
    () => JSON.parse(message.content) as GroupUpdatedContent,
    [message.content]
  );

  const inboxIds = useMemo(() => {
    const ids: InboxId[] = [];
    ids.push(parsedContent.initiatedByInboxId as InboxId);
    parsedContent.membersAdded.forEach((entry) => {
      ids.push(entry.inboxId as InboxId);
    });
    parsedContent.membersRemoved.forEach((entry) => {
      ids.push(entry.inboxId as InboxId);
    });

    return ids;
  }, [parsedContent]);

  const inboxSocials = useInboxProfileSocialsQueries(currentAccount!, inboxIds);
  const mappedSocials = useMemo(() => {
    const map: Record<InboxId, ProfileSocials[]> = {};
    inboxSocials.forEach((it, index) => {
      if (it.data) {
        const inboxId = inboxIds[index];
        map[inboxId] = it.data;
      }
    });
    return map;
  }, [inboxIds, inboxSocials]);

  // TODO: Feat: handle multiple members
  const initiatedByAddress =
    mappedSocials[parsedContent.initiatedByInboxId as InboxId]?.[0]?.address ??
    "";
  const initiatedByReadableName = getPreferredName(
    mappedSocials[parsedContent.initiatedByInboxId as InboxId]?.[0],
    initiatedByAddress
  );
  const membersActions: {
    address: string;
    content: string;
    readableName: string;
  }[] = [];
  parsedContent.membersAdded.forEach((m) => {
    const socials = mappedSocials[m.inboxId as InboxId]?.[0];
    const firstAddress = socials?.address;
    // We haven't synced yet the members
    if (!socials || !firstAddress) return;
    const readableName = getPreferredName(socials, socials.address ?? "");
    membersActions.push({
      address: firstAddress,
      content: translate(`group_member_joined`, {
        name: readableName,
      }),
      readableName,
    });
  });
  parsedContent.membersRemoved.forEach((m) => {
    const socials = mappedSocials[m.inboxId as InboxId]?.[0];
    const firstAddress = socials?.address;
    // TODO: Feat: handle multiple members
    // We haven't synced yet the members
    if (!firstAddress) return;
    const readableName = getPreferredName(socials, firstAddress);
    membersActions.push({
      address: firstAddress,
      content: translate(`group_member_left`, {
        name: readableName,
      }),
      readableName,
    });
  });
  parsedContent.metadataFieldsChanged.forEach((f) => {
    if (f.fieldName === "group_name") {
      membersActions.push({
        address: initiatedByAddress,
        content: translate(`group_name_changed_to`, {
          name: initiatedByReadableName,
          newValue: f.newValue,
        }),
        readableName: initiatedByReadableName,
      });
    } else if (f.fieldName === "group_image_url_square") {
      membersActions.push({
        address: initiatedByAddress,
        content: translate(`group_photo_changed`, {
          name: initiatedByReadableName,
        }),
        readableName: initiatedByReadableName,
      });
    } else if (f.fieldName === "description") {
      membersActions.push({
        address: initiatedByAddress,
        content: translate(`group_description_changed`, {
          name: initiatedByReadableName,
          newValue: f.newValue,
        }),
        readableName: initiatedByReadableName,
      });
    }
  });

  const onPress = useCallback((address: string) => {
    return navigate("Profile", {
      address,
    });
  }, []);

  return (
    <VStack style={styles.textContainer}>
      {membersActions.map((a) => (
        <PressableProfileWithText
          key={a.address}
          text={a.content}
          profileDisplay={a.readableName}
          profileAddress={a.address}
          onPress={onPress}
        />
      ))}
    </VStack>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    textContainer: {
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    groupChange: {
      color: textSecondaryColor(colorScheme),
      fontSize: 11,
      textAlign: "center",
      width: "100%",
      marginTop: 5,
      marginBottom: 9,
      paddingHorizontal: 24,
    },
    profileStyle: {
      fontWeight: "bold",
    },
  });
};

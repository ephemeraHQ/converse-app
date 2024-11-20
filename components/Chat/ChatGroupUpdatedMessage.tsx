import { PressableProfileWithText } from "@components/PressableProfileWithText";
import { InboxIdStoreType } from "@data/store/inboxIdStore";
import { ProfilesStoreType } from "@data/store/profilesStore";
import { useSelect } from "@data/store/storeHelpers";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { textSecondaryColor } from "@styles/colors";
import { navigate } from "@utils/navigation";
import { GroupUpdatedContent } from "@xmtp/react-native-sdk";
import { useCallback, useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

import { MessageToDisplay } from "./Message/Message";
import { useInboxIdStore, useProfilesStore } from "@data/store/accountsStore";
import { getPreferredName, getProfile } from "@utils/profile";

const inboxIdStoreSelectedKeys: (keyof InboxIdStoreType)[] = ["byInboxId"];
const profilesStoreSelectedKeys: (keyof ProfilesStoreType)[] = ["profiles"];
export function ChatGroupUpdatedMessage({
  message,
}: {
  message: MessageToDisplay;
}) {
  const styles = useStyles();
  const { byInboxId } = useInboxIdStore(useSelect(inboxIdStoreSelectedKeys));
  const { profiles } = useProfilesStore(useSelect(profilesStoreSelectedKeys));
  // JSON Parsing is heavy so useMemo

  const parsedContent = useMemo(
    () => JSON.parse(message.content) as GroupUpdatedContent,
    [message.content]
  );

  // TODO: Feat: handle multiple members
  const initiatedByAddress = byInboxId[parsedContent.initiatedByInboxId]?.[0];
  const initiatedByProfile = getProfile(initiatedByAddress, profiles)?.socials;
  const initiatedByReadableName = getPreferredName(
    initiatedByProfile,
    initiatedByAddress
  );
  const membersActions: {
    address: string;
    content: string;
    readableName: string;
  }[] = [];
  parsedContent.membersAdded.forEach((m) => {
    // TODO: Feat: handle multiple members
    const firstAddress = byInboxId[m.inboxId]?.[0];
    // We haven't synced yet the members
    if (!firstAddress) return;
    const readableName = getPreferredName(
      getProfile(firstAddress, profiles)?.socials,
      firstAddress
    );
    membersActions.push({
      address: firstAddress,
      content: translate(`group_member_joined`, {
        name: readableName,
      }),
      readableName,
    });
  });
  parsedContent.membersRemoved.forEach((m) => {
    // TODO: Feat: handle multiple members
    const firstAddress = byInboxId[m.inboxId]?.[0];
    // We haven't synced yet the members
    if (!firstAddress) return;
    const readableName = getPreferredName(
      getProfile(firstAddress, profiles)?.socials,
      firstAddress
    );
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
      {membersActions.map((a, index) => (
        <PressableProfileWithText
          key={index + a.address}
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

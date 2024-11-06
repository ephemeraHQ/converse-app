import { useProfilesStore } from "@data/store/accountsStore";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { textSecondaryColor } from "@styles/colors";
import { getPreferredName, getProfile } from "@utils/profile";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { StyleSheet, useColorScheme, View, Text } from "react-native";

type MessageSenderDumbProps = {
  name: string;
};

export const MessageSenderDumb = ({ name }: MessageSenderDumbProps) => {
  const styles = useStyles();
  return (
    <View style={styles.groupSenderWrapper}>
      <Text style={styles.groupSender}>{name}</Text>
    </View>
  );
};

type MessageSenderProps = {
  senderAddress: string;
};

export const MessageSender = ({ senderAddress }: MessageSenderProps) => {
  const senderSocials = useProfilesStore(
    (s) => getProfile(senderAddress, s.profiles)?.socials
  );
  const name = getPreferredName(senderSocials, senderAddress);
  return <MessageSenderDumb name={name} />;
};

type V3MessageSenderProps = {
  inboxId: InboxId;
};

export const V3MessageSender = ({ inboxId }: V3MessageSenderProps) => {
  const name = usePreferredInboxName(inboxId);
  return <MessageSenderDumb name={name} />;
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        groupSenderWrapper: {
          flexDirection: "row",
          flexBasis: "100%",
        },
        groupSender: {
          fontSize: 12,
          color: textSecondaryColor(colorScheme),
          marginLeft: 10,
          marginVertical: 4,
        },
      }),
    [colorScheme]
  );
};

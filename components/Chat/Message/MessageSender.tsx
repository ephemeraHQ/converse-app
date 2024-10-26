import { useInboxIdStore, useProfilesStore } from "@data/store/accountsStore";
import { textSecondaryColor } from "@styles/colors";
import { getPreferredName, getProfile } from "@utils/profile";
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
  inboxId: string;
};

export const V3MessageSender = ({ inboxId }: V3MessageSenderProps) => {
  const address = useInboxIdStore((s) => s.byInboxId[inboxId]?.[0]);
  const senderSocials = useProfilesStore(
    (s) => getProfile(address, s.profiles)?.socials
  );
  const name = getPreferredName(senderSocials, address);
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

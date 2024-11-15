import { useProfilesStore } from "@data/store/accountsStore";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { useAppTheme } from "@theme/useAppTheme";
import { getPreferredName, getProfile } from "@utils/profile";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

type MessageSenderDumbProps = {
  name: string;
};

export const MessageSenderDumb = ({ name }: MessageSenderDumbProps) => {
  const styles = useStyles();
  return (
    <VStack style={styles.groupSenderContainer}>
      <Text preset="smaller" color="secondary">
        {name}
      </Text>
    </VStack>
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
  const { theme } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        groupSenderContainer: {
          flexDirection: "row",
          flexBasis: "100%",
          marginLeft: theme.spacing.xs,
          marginBottom: theme.spacing.xxxs,
        },
      }),
    [theme]
  );
};

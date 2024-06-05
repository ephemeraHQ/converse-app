import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { useColorScheme, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "../components/Button/Button";
import { useCurrentAccount } from "../data/store/accountsStore";
import { GroupLink, getGroupLink, joinGroupFromLink } from "../utils/api";
import {
  backgroundColor,
  dangerColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { navigate } from "../utils/navigation";
import { refreshGroup } from "../utils/xmtpRN/conversations";
import { NavigationParamList } from "./Navigation/Navigation";

export default function GroupScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "GroupLink">) {
  const styles = useStyles();
  const account = useCurrentAccount() as string;
  const [errorMessage, setErrorMessage] = useState("");
  const [groupLink, setGroupLink] = useState<GroupLink | undefined>(undefined);
  const loadGroup = useCallback(async (groupLinkId: string) => {
    const result = await getGroupLink(groupLinkId);
    setGroupLink(result);
  }, []);
  useEffect(() => {
    loadGroup(route.params.groupLinkId);
  }, [loadGroup, route.params.groupLinkId]);
  useEffect(() => {
    navigation.setOptions({ headerTitle: groupLink?.name });
  }, [groupLink, navigation]);
  const colorScheme = useColorScheme();
  const [joining, setJoining] = useState(false);
  const joinGroup = useCallback(async () => {
    if (!groupLink?.id) return;
    setJoining(true);
    try {
      const { status, reason, topic } = await joinGroupFromLink(
        account,
        groupLink?.id
      );
      if (status === "ERROR") {
        setErrorMessage(
          "An unknown error occured. Please contact the the group admin."
        );
      } else if (status === "DENIED") {
        setErrorMessage(
          reason ||
            "You are not elligible for this group. You might want to try with another account or contact the group admin."
        );
      } else if (status === "SUCCESS") {
        // We have the topic, let's check if we have the group
        let foundGroup = false;
        let tries = 0;
        while (!foundGroup && tries < 10) {
          try {
            tries += 1;
            await refreshGroup(account, topic);
            foundGroup = true;
          } catch (e) {
            console.log(e);
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
        if (!foundGroup) {
          setErrorMessage(
            "You are eligible to join the group but the admin never added you. You might want to contact the group admin."
          );
        } else {
          navigation.goBack();
          setTimeout(() => {
            navigate("Conversation", { topic });
          }, 300);
        }
      }
    } catch (e) {
      console.error(e);
      setJoining(false);
    }
  }, [account, groupLink?.id, navigation]);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  return (
    <View style={styles.groupLink}>
      {groupLink && (
        <>
          <Text style={styles.title}>{groupLink.name}</Text>
          {groupLink.description && (
            <Text style={styles.description}>{groupLink.description}</Text>
          )}
          {!errorMessage && (
            <Button
              variant="primary"
              title={joining ? "Joining..." : "Join group"}
              style={[
                {
                  marginTop: 20,
                },
                joining
                  ? { backgroundColor: textSecondaryColor(colorScheme) }
                  : {},
              ]}
              onPress={joining ? undefined : joinGroup}
            />
          )}
          {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        </>
      )}
      <View style={{ height: insets.bottom + headerHeight }} />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    groupLink: {
      backgroundColor: backgroundColor(colorScheme),
      flex: 1,
      alignContent: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize: 34,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: 23,
      marginBottom: 20,
    },
    description: {
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
      marginVertical: 20,
      fontStyle: "italic",
      textAlign: "center",
    },
    error: {
      color: dangerColor(colorScheme),
      fontSize: 17,
      paddingHorizontal: 20,
      textAlign: "center",
      marginTop: 20,
    },
  });
};

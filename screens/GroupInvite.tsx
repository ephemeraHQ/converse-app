import Avatar from "@components/Avatar";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  dangerColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NavigationParamList } from "./Navigation/Navigation";
import Button from "../components/Button/Button";
import { useCurrentAccount } from "../data/store/accountsStore";
import {
  GroupInvite,
  getGroupInvite,
  createGroupJoinRequest,
  getGroupJoinRequest,
} from "../utils/api";
import { navigate } from "../utils/navigation";
import { refreshGroup } from "../utils/xmtpRN/conversations";

export default function GroupInviteScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "GroupInvite">) {
  const styles = useStyles();
  const account = useCurrentAccount() as string;
  const [errorMessage, setErrorMessage] = useState("");
  const [groupInvite, setgroupInvite] = useState<GroupInvite | undefined>(
    undefined
  );
  useEffect(() => {
    getGroupInvite(route.params.groupInviteId).then((data) => {
      return setgroupInvite(data);
    });
  }, [route.params.groupInviteId]);

  useEffect(() => {
    navigation.setOptions({ headerTitle: groupInvite?.groupName });
  }, [groupInvite, navigation]);
  const colorScheme = useColorScheme();
  const [joining, setJoining] = useState(false);
  const joinGroup = useCallback(async () => {
    if (!groupInvite?.id) return;
    setJoining(true);
    let cancelStreamGroupsForAccount: (() => void) | null = null;
    try {
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      cancelStreamGroupsForAccount = await client.conversations.streamGroups(
        async (group) => {
          await refreshGroup(account, group.topic);
          navigation.goBack();
          setTimeout(() => {
            navigate("Conversation", { topic: group.topic });
          }, 300);
        }
      );
      const { id } = await createGroupJoinRequest(account, groupInvite?.id);
      // Poll for the status of the request
      let count = 0;
      let status = "PENDING";
      while (count < 10) {
        const res = await getGroupJoinRequest(id);
        console.log(res);
        if (status === "PENDING") {
          await new Promise((r) => setTimeout(r, 500));
          count += 1;
        } else {
          status = res.status;
          break;
        }
      }
      if (status === "ERROR") {
        setErrorMessage(
          "An unknown error occured. Please contact the the group admin."
        );
      } else if (status === "DENIED") {
        setErrorMessage(
          "You are not elligible for this group. You might want to try with another account or contact the group admin."
        );
      } else if (status === "SUCCESS") {
        setTimeout(() => {
          cancelStreamGroupsForAccount?.();
        }, 300);
        Alert.alert("Success", "You have successfully joined the group.");
      }
    } catch (e) {
      console.error(e);
      setJoining(false);
    }
  }, [account, groupInvite?.id, navigation]);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  return (
    <View style={styles.groupInvite}>
      {groupInvite && (
        <>
          <Avatar
            size={150}
            uri={groupInvite.imageUrl}
            name={groupInvite.groupName}
            style={{ alignSelf: "center" }}
          />
          <Text style={styles.title}>{groupInvite.groupName}</Text>
          {groupInvite.description && (
            <Text style={styles.description}>{groupInvite.description}</Text>
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
    groupInvite: {
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

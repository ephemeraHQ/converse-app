import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { List } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import Avatar from "../../components/Avatar";
import Button from "../../components/Button/Button";
import TableView from "../../components/TableView/TableView";
import {
  currentAccount,
  useCurrentAccount,
  useProfilesStore,
} from "../../data/store/accountsStore";
import { usePhotoSelect } from "../../hooks/usePhotoSelect";
import { uploadFile } from "../../utils/attachment";
import {
  backgroundColor,
  textInputStyle,
  textSecondaryColor,
} from "../../utils/colors";
import { navigate } from "../../utils/navigation";
import { getPreferredName } from "../../utils/profile";
import { createGroup } from "../../utils/xmtpRN/conversations";
import { useIsSplitScreen } from "../Navigation/navHelpers";
import { NewConversationModalParams } from "./NewConversationModal";

export default function NewGroupSummary({
  route,
  navigation,
}: NativeStackScreenProps<NewConversationModalParams, "NewGroupSummary">) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [creatingGroup, setCreatingGroup] = useState(false);
  const isSplitScreen = useIsSplitScreen();
  const [groupPermissionLevel, setGroupPermissionLevel] = useState<
    "all_members" | "admin_only"
  >("admin_only");
  const account = useCurrentAccount();
  const currentAccountSocials = useProfilesStore(
    (s) => s.profiles[account ?? ""]?.socials
  );
  const { photo: groupPhoto, addPhoto: addGroupPhoto } = usePhotoSelect();
  const [remotePhotoUrl, setRemotePhotUrl] = useState<string | undefined>(
    undefined
  );
  const defaultGroupName = useMemo(() => {
    if (!account) return "";
    const members = route.params.members.slice(0, 3);
    let groupName = getPreferredName(currentAccountSocials, account);
    if (members.length) {
      groupName += ", ";
    }
    for (let i = 0; i < members.length; i++) {
      groupName += getPreferredName(members[i], members[i].address);
      if (i < members.length - 1) {
        groupName += ", ";
      }
    }

    return groupName;
  }, [route.params.members, account, currentAccountSocials]);
  const colorScheme = useColorScheme();
  const [groupName, setGroupName] = useState(defaultGroupName);
  useEffect(() => {
    if (!groupPhoto) return;
    uploadFile({
      account: currentAccount(),
      filePath: groupPhoto,
      contentType: "image/jpeg",
    })
      .then((url) => {
        setRemotePhotUrl(url);
      })
      .catch((e) => {
        Alert.alert("Error uploading group photo", e.message);
      });
  }, [groupPhoto, setRemotePhotUrl]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        creatingGroup ? (
          <ActivityIndicator style={{ marginRight: 5 }} />
        ) : (
          <Button
            variant="text"
            title="Create"
            onPress={async () => {
              setCreatingGroup(true);
              const groupTopic = await createGroup(
                currentAccount(),
                route.params.members.map((m) => m.address),
                groupPermissionLevel,
                groupName,
                remotePhotoUrl
              );
              if (Platform.OS !== "web") {
                navigation.getParent()?.goBack();
              }
              setTimeout(
                () => {
                  navigate("Conversation", {
                    topic: groupTopic,
                    focus: true,
                  });
                },
                isSplitScreen ? 0 : 300
              );
            }}
          />
        ),
    });
  }, [
    creatingGroup,
    groupName,
    groupPermissionLevel,
    groupPhoto,
    isSplitScreen,
    navigation,
    remotePhotoUrl,
    route.params.members,
  ]);

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <List.Section>
        <View style={{ alignItems: "center" }}>
          <Avatar uri={groupPhoto} style={styles.avatar} color={false} />
          <Button
            variant="text"
            title={
              groupPhoto ? "Change profile picture" : "Add profile picture"
            }
            textStyle={{ fontWeight: "500" }}
            onPress={addGroupPhoto}
          />
        </View>
      </List.Section>

      <List.Section>
        <List.Subheader style={styles.sectionTitle}>GROUP NAME</List.Subheader>
        <TextInput
          defaultValue={defaultGroupName}
          style={[textInputStyle(colorScheme), { fontSize: 16 }]}
          value={groupName}
          onChangeText={setGroupName}
        />
      </List.Section>
      <TableView
        items={route.params.members.map((a) => ({
          id: a.address,
          title: getPreferredName(a, a.address),
        }))}
        title="MEMBERS"
      />
      <TableView
        items={[
          {
            title: "Add and remove other members",
            id: "groupPermissionLevel",
            rightView: (
              <Switch
                onValueChange={() => {
                  setGroupPermissionLevel((p) =>
                    p === "admin_only" ? "all_members" : "admin_only"
                  );
                }}
                value={groupPermissionLevel === "all_members"}
              />
            ),
          },
        ]}
        title="MEMBERS OF THE GROUP CAN"
      />
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    avatar: {
      marginBottom: 10,
      marginTop: 23,
    },
    group: {
      backgroundColor: backgroundColor(colorScheme),
    },
    groupContent: {
      paddingHorizontal:
        Platform.OS === "ios" || Platform.OS === "web" ? 18 : 0,
    },
    sectionTitle: {
      marginBottom: -8,
      color: textSecondaryColor(colorScheme),
      fontSize: 13,
      fontWeight: "500",
    },
  });
};

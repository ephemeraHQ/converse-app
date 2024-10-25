import { translate } from "@i18n";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textInputStyle,
  textSecondaryColor,
} from "@styles/colors";
import logger from "@utils/logger";
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { List } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NewConversationModalParams } from "./NewConversationModal";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import Button from "../../components/Button/Button";
import GroupAvatar from "../../components/GroupAvatar";
import TableView from "../../components/TableView/TableView";
import {
  currentAccount,
  useCurrentAccount,
  useProfilesStore,
} from "../../data/store/accountsStore";
import { usePhotoSelect } from "../../hooks/usePhotoSelect";
import { uploadFile } from "../../utils/attachment";
import { navigate } from "../../utils/navigation";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "../../utils/profile";
import { createGroup } from "../../utils/xmtpRN/conversations";

const getPendingGroupMembers = (
  members: any[],
  account: string,
  currentAccountSocials: any
) => {
  const currentUser = {
    address: account,
    uri: getPreferredAvatar(currentAccountSocials),
    name: getPreferredName(currentAccountSocials, account),
  };

  const memberDetails = members.map((m) => ({
    address: m.address,
    uri: getPreferredAvatar(
      useProfilesStore((s) => getProfile(m.address, s.profiles)?.socials)
    ),
    name: getPreferredName(m, m.address),
  }));
  return [currentUser, ...memberDetails];
};

export default function NewGroupSummary({
  route,
  navigation,
}: NativeStackScreenProps<NewConversationModalParams, "NewGroupSummary">) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [permissionPolicySet, setPermissionPolicySet] =
    useState<PermissionPolicySet>({
      addMemberPolicy: "allow",
      removeMemberPolicy: "admin",
      addAdminPolicy: "superAdmin",
      removeAdminPolicy: "superAdmin",
      updateGroupNamePolicy: "allow",
      updateGroupDescriptionPolicy: "allow",
      updateGroupImagePolicy: "allow",
      updateGroupPinnedFrameUrlPolicy: "allow",
    });
  const account = useCurrentAccount();
  const currentAccountSocials = useProfilesStore(
    (s) => getProfile(account, s.profiles)?.socials
  );
  const { photo: groupPhoto, addPhoto: addGroupPhoto } = usePhotoSelect();
  const [
    { remotePhotoUrl, isLoading: isUploadingGroupPhoto },
    setRemotePhotUrl,
  ] = useState<{ remotePhotoUrl: string | undefined; isLoading: boolean }>({
    remotePhotoUrl: undefined,
    isLoading: false,
  });
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
  const [groupDescription, setGroupDescription] = useState("");

  useEffect(() => {
    if (!groupPhoto) return;
    setRemotePhotUrl({ remotePhotoUrl: undefined, isLoading: true });
    uploadFile({
      account: currentAccount(),
      filePath: groupPhoto,
      contentType: "image/jpeg",
    })
      .then((url) => {
        setRemotePhotUrl({
          remotePhotoUrl: url,
          isLoading: false,
        });
      })
      .catch((e) => {
        Alert.alert(translate("upload_group_photo_error"), e.message);
        setRemotePhotUrl({
          remotePhotoUrl: undefined,
          isLoading: false,
        });
      });
  }, [groupPhoto, setRemotePhotUrl]);

  const onCreateGroupPress = useCallback(async () => {
    setCreatingGroup(true);
    try {
      const groupTopic = await createGroup(
        currentAccount(),
        route.params.members.map((m) => m.address),
        permissionPolicySet,
        groupName,
        remotePhotoUrl,
        groupDescription
      );
      if (Platform.OS !== "web") {
        navigation.getParent()?.goBack();
      }
      setTimeout(() => {
        navigate("Conversation", {
          topic: groupTopic,
          focus: true,
        });
      }, 300);
    } catch (e) {
      logger.error(e);
      Alert.alert("An error occurred");
      setCreatingGroup(false);
    }
  }, [
    groupDescription,
    groupName,
    permissionPolicySet,
    navigation,
    remotePhotoUrl,
    route.params.members,
  ]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        creatingGroup || isUploadingGroupPhoto ? (
          <ActivityIndicator style={styles.activitySpinner} />
        ) : (
          <Button variant="text" title="Create" onPress={onCreateGroupPress} />
        ),
    });
  }, [
    creatingGroup,
    isUploadingGroupPhoto,
    navigation,
    onCreateGroupPress,
    styles,
  ]);

  const handlePermissionSwitch = useCallback(
    (permissionName: "addMembers" | "editMetadata") => () => {
      if (permissionName === "addMembers") {
        const currentPermission = permissionPolicySet.addMemberPolicy;
        const newPermission = currentPermission === "allow" ? "admin" : "allow";
        setPermissionPolicySet((currentSet) => ({
          ...currentSet,
          addMemberPolicy: newPermission,
        }));
      } else if (permissionName === "editMetadata") {
        const currentPermission = permissionPolicySet.updateGroupNamePolicy;
        const newPermission = currentPermission === "allow" ? "admin" : "allow";
        setPermissionPolicySet((currentSet) => ({
          ...currentSet,
          updateGroupDescriptionPolicy: newPermission,
          updateGroupImagePolicy: newPermission,
          updateGroupNamePolicy: newPermission,
          updateGroupPinnedFrameUrlPolicy: newPermission,
        }));
      }
    },
    [
      permissionPolicySet.addMemberPolicy,
      permissionPolicySet.updateGroupNamePolicy,
    ]
  );

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <List.Section>
        <View style={styles.listSectionContainer}>
          <GroupAvatar
            uri={groupPhoto}
            style={styles.avatar}
            pendingGroupMembers={getPendingGroupMembers(
              route.params.members,
              account ?? "",
              currentAccountSocials
            )}
            excludeSelf={false}
          />
          <Button
            variant="text"
            title={
              groupPhoto ? "Change profile picture" : "Add profile picture"
            }
            textStyle={styles.buttonText}
            onPress={addGroupPhoto}
          />
        </View>
      </List.Section>

      <List.Section>
        <List.Subheader style={styles.sectionTitle}>
          {translate("group_name")}
        </List.Subheader>
        <TextInput
          defaultValue={defaultGroupName}
          style={[textInputStyle(colorScheme), styles.nameInput]}
          value={groupName}
          onChangeText={setGroupName}
          clearButtonMode="while-editing"
        />
      </List.Section>
      <List.Section>
        <List.Subheader style={styles.sectionTitle}>
          {translate("group_description")}
        </List.Subheader>
        <TextInput
          defaultValue={groupDescription}
          style={[textInputStyle(colorScheme), styles.nameInput]}
          value={groupDescription}
          onChangeText={setGroupDescription}
          clearButtonMode="while-editing"
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
            title: "Add members",
            id: "addMembers",
            rightView: (
              <Switch
                onValueChange={handlePermissionSwitch("addMembers")}
                value={permissionPolicySet.addMemberPolicy === "allow"}
              />
            ),
          },
          {
            title: "Edit group info",
            id: "editGroupInfo",
            rightView: (
              <Switch
                onValueChange={handlePermissionSwitch("editMetadata")}
                value={permissionPolicySet.updateGroupNamePolicy === "admin"}
              />
            ),
          },
        ]}
        title="MEMBERS CAN"
      />
      <Text style={styles.p}>
        {translate("promote_to_admin_to_manage_group")}
      </Text>
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
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
        activitySpinner: {
          marginRight: 5,
        },
        listSectionContainer: {
          alignItems: "center",
        },
        buttonText: {
          fontWeight: "500",
        },
        nameInput: {
          fontSize: 16,
        },
        p: {
          textAlign: "center",
          marginLeft: 32,
          marginRight: 32,
          ...Platform.select({
            default: {
              fontSize: 13,
              lineHeight: 17,
              color: textSecondaryColor(colorScheme),
            },
          }),
        },
      }),
    [colorScheme]
  );
};

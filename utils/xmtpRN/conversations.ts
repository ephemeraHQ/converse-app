import { addConversationToConversationListQuery } from "@/queries/useConversationListQuery";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { ConversationOptions, ConversationTopic } from "@xmtp/react-native-sdk";
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  DmWithCodecsType,
} from "./client.types";
import { streamAllMessages } from "./messages";
import { getXmtpClient } from "./sync";
import { getPreferredName } from "../profile";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { getCurrentAccount } from "@/data/store/accountsStore";

export const streamConversations = async (account: string) => {
  await stopStreamingConversations(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  await client.conversations.stream(async (conversation) => {
    logger.info("[XMTPRN Conversations] GOT A NEW CONVO");
    addConversationToConversationListQuery({ account, conversation });
  });
  logger.info("STREAMING CONVOS");
};

export const stopStreamingConversations = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return client.conversations.cancelStream();
};

export const listConversations = async (args: {
  client: ConverseXmtpClientType;
  includeSync?: boolean;
  limit?: number;
  opts?: ConversationOptions;
}) => {
  const { client, includeSync = false, limit, opts } = args;
  logger.debug("[XMTPRN Conversations] Listing conversations");
  const start = new Date().getTime();
  if (includeSync) {
    logger.debug("[XMTPRN Conversations] Syncing conversations");
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );
  }
  const conversations = await client.conversations.list(opts, limit);
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Listed conversations in ${(end - start) / 1000} sec`
  );
  return conversations;
};

export const listConversationsByAccount = async (args: {
  account: string;
  includeSync?: boolean;
  limit?: number;
  opts?: ConversationOptions;
}) => {
  const { account, includeSync = false, limit, opts } = args;
  logger.debug("[XMTPRN Conversations] Listing conversations by account");
  const start = new Date().getTime();
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  const conversations = await listConversations({
    client,
    includeSync,
    limit,
    opts,
  });
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Listed conversations in ${(end - start) / 1000} sec`
  );
  return conversations;
};

async function findGroup(args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
}) {
  const { client, topic, includeSync = false } = args;
  logger.debug(`[XMTPRN Conversations] Getting group by ${topic}`);
  const start = new Date().getTime();

  const lookupStart = new Date().getTime();
  let group = await client.conversations.findGroup(getV3IdFromTopic(topic));
  const lookupEnd = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Initial lookup took ${(lookupEnd - lookupStart) / 1000} sec`
  );

  if (!group) {
    logger.debug(
      `[XMTPRN Conversations] Group not found, syncing conversations`
    );
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${(syncEnd - syncStart) / 1000} sec`
    );

    group = await client.conversations.findGroup(getV3IdFromTopic(topic));
    if (!group) {
      throw new Error(`Group ${topic} not found`);
    }
  }

  if (includeSync) {
    const syncStart = new Date().getTime();
    await group.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced group in ${(syncEnd - syncStart) / 1000} sec`
    );
  }

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Total time to get group: ${(end - start) / 1000} sec`
  );

  return group;
}

async function findDm(args: {
  client: ConverseXmtpClientType;
  peer: string;
  includeSync?: boolean;
  throwIfNotFound?: boolean;
}) {
  const {
    client,
    peer,
    includeSync = false,
    /** this shouldnt throw, but that was default behavior so maintaining for now */ throwIfNotFound = true,
  } = args;
  logger.debug(`[XMTPRN Conversations] Getting DM by ${peer}`);
  const start = new Date().getTime();

  const lookupStart = new Date().getTime();
  let dm = await client.conversations.findDmByAddress(peer);
  const lookupEnd = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Initial lookup took ${(lookupEnd - lookupStart) / 1000} sec`
  );

  if (!dm) {
    logger.debug(`[XMTPRN Conversations] DM not found, syncing conversations`);
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${(syncEnd - syncStart) / 1000} sec`
    );

    dm = await client.conversations.findDmByAddress(peer);
    if (!dm) {
      if (throwIfNotFound) {
        throw new Error(`DM with peer ${peer} not found`);
      } else {
        return undefined;
      }
    }
  }

  if (includeSync) {
    const syncStart = new Date().getTime();
    await dm.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced DM in ${(syncEnd - syncStart) / 1000} sec`
    );
  }

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Total time to get DM: ${(end - start) / 1000} sec`
  );

  return dm;
}

async function findConversation(args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
}) {
  const { client, topic, includeSync = false } = args;
  logger.debug(`[XMTPRN Conversations] Getting conversation by ${topic}`);
  const start = new Date().getTime();

  const lookupStart = new Date().getTime();
  let conversation = await client.conversations.findConversationByTopic(topic);
  const lookupEnd = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Initial lookup took ${(lookupEnd - lookupStart) / 1000} sec`
  );

  if (!conversation) {
    logger.debug(
      `[XMTPRN Conversations] Conversation not found, syncing conversations`
    );
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${(syncEnd - syncStart) / 1000} sec`
    );

    conversation = await client.conversations.findConversationByTopic(topic);
    if (!conversation) {
      throw new Error(`Conversation ${topic} not found`);
    }
  }

  if (includeSync) {
    const syncStart = new Date().getTime();
    await conversation.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversation in ${(syncEnd - syncStart) / 1000} sec`
    );
  }

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Total time to get conversation: ${(end - start) / 1000} sec`
  );

  return conversation;
}

export const getGroupByTopic = async (args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
}) => {
  const { client, topic, includeSync = false } = args;
  return findGroup({
    client,
    topic,
    includeSync,
  });
};

export async function getGroupByTopicByAccount(args: {
  account: string;
  topic: ConversationTopic;
  includeSync?: boolean;
}) {
  const { account, topic, includeSync = false } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getGroupByTopic({
    client,
    topic,
    includeSync,
  });
}

export const getConversationByPeer = async (args: {
  client: ConverseXmtpClientType;
  peer: string;
  includeSync?: boolean;
  throwIfNotFound?: boolean;
}) => {
  const { client, peer, includeSync = false, throwIfNotFound = true } = args;
  return findDm({
    client,
    peer,
    includeSync,
    throwIfNotFound,
  });
};

export const getConversationByTopic = async (args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
}) => {
  const { client, topic, includeSync = false } = args;
  return findConversation({
    client,
    topic,
    includeSync,
  });
};

export const getConversationByTopicByAccount = async (args: {
  account: string;
  topic: ConversationTopic;
  includeSync?: boolean;
}) => {
  const { account, topic, includeSync = false } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getConversationByTopic({ client, topic, includeSync });
};

export const createConversation = async (args: {
  client: ConverseXmtpClientType;
  peerAddress: string;
}) => {
  const { client, peerAddress } = args;
  logger.info(`[XMTP] Creating a conversation with peer ${peerAddress}`);
  const conversation = await client.conversations.findOrCreateDm(peerAddress);
  await handleNewConversationCreation(client, conversation);
  return conversation;
};

export const createConversationByAccount = async (
  account: string,
  peerAddress: string
) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  return createConversation({ client, peerAddress });
};

export const createGroup = async (args: {
  client: ConverseXmtpClientType;
  peers: string[];
  permissionPolicySet: PermissionPolicySet;
  groupName?: string;
  groupPhoto?: string;
  groupDescription?: string;
}) => {
  const {
    client,
    peers,
    permissionPolicySet,
    groupName,
    groupPhoto,
    groupDescription,
  } = args;
  const group = await client.conversations.newGroupCustomPermissions(
    peers,
    permissionPolicySet,
    {
      name: groupName,
      imageUrlSquare: groupPhoto,
      description: groupDescription,
    }
  );

  logger.info("[XMTPRN Conversations] Created group");

  await handleNewConversationCreation(client, group);

  return group;
};

/*




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

import { uploadFile } from "@utils/attachment/uploadFile";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import Button from "../../components/Button/Button";
import GroupAvatar from "../../components/GroupAvatar";
import TableView from "../../components/TableView/TableView";
import {
  currentAccount,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { usePhotoSelect } from "../../hooks/usePhotoSelect";
import { navigate } from "../../utils/navigation";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "../../utils/profile";
import { createGroupByAccount } from "../../utils/xmtpRN/conversations";
import { NewConversationModalParams } from "./NewConversationModal";
import { captureErrorWithToast } from "@/utils/capture-error";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { useProfilesSocials } from "@/hooks/useProfilesSocials";

const defaultPermissionPolicySet: PermissionPolicySet = {
  addMemberPolicy: "allow",
  removeMemberPolicy: "admin",
  addAdminPolicy: "superAdmin",
  removeAdminPolicy: "superAdmin",
  updateGroupNamePolicy: "allow",
  updateGroupDescriptionPolicy: "allow",
  updateGroupImagePolicy: "allow",
  updateGroupPinnedFrameUrlPolicy: "allow",
};

export default function NewGroupSummary({
  route,
  navigation,
}: NativeStackScreenProps<NewConversationModalParams, "NewGroupSummary">) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [permissionPolicySet, setPermissionPolicySet] =
    useState<PermissionPolicySet>(defaultPermissionPolicySet);
  const account = useCurrentAccount();
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
    const currentAccountSocials =
      getProfileSocialsQueryData(account, account) ?? undefined;
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
  }, [route.params.members, account]);
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
        captureErrorWithToast(e, {
          message: translate("upload_group_photo_error"),
        });
        setRemotePhotUrl({
          remotePhotoUrl: undefined,
          isLoading: false,
        });
      });
  }, [groupPhoto, setRemotePhotUrl]);

  const onCreateGroupPress = useCallback(async () => {
    setCreatingGroup(true);
    try {
      const group = await createGroupByAccount({
        account: currentAccount(),
        peers: route.params.members.map((m) => m.address),
        permissionPolicySet,
        groupName,
        groupPhoto: remotePhotoUrl,
        groupDescription,
      });

      navigation.getParent()?.goBack();

      setTimeout(() => {
        navigate("Conversation", {
          topic: group.topic,
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

  const profileQueries = useProfilesSocials(
    route.params.members.map((m) => m.address)
  );

  const pendingGroupMembers = useMemo(() => {
    return profileQueries.map(({ data: socials }, index) => {
      const address = route.params.members[index].address;
      return {
        address,
        uri: getPreferredAvatar(socials ?? undefined),
        name: getPreferredName(socials ?? undefined, account!),
      };
    });
  }, [profileQueries, route.params.members, account]);

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
            pendingGroupMembers={pendingGroupMembers}
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
        title={translate("members_title")}
      />
      <TableView
        items={[
          {
            title: translate("new_group.add_members"),
            id: "addMembers",
            rightView: (
              <Switch
                onValueChange={handlePermissionSwitch("addMembers")}
                value={permissionPolicySet.addMemberPolicy === "allow"}
              />
            ),
          },
          {
            title: translate("new_group.edit_group_info"),
            id: "editGroupInfo",
            rightView: (
              <Switch
                onValueChange={handlePermissionSwitch("editMetadata")}
                value={permissionPolicySet.updateGroupNamePolicy === "admin"}
              />
            ),
          },
        ]}
        title={translate("new_group.members_can")}
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
          paddingHorizontal: Platform.OS === "ios" ? 18 : 0,
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








    const members = route.params.members.slice(0, 3);
    const currentAccountSocials =
      getProfileSocialsQueryData(account, account) ?? undefined;
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
*/

export const defaultPermissionPolicySet: PermissionPolicySet = {
  addMemberPolicy: "allow",
  removeMemberPolicy: "admin",
  addAdminPolicy: "superAdmin",
  removeAdminPolicy: "superAdmin",
  updateGroupNamePolicy: "allow",
  updateGroupDescriptionPolicy: "allow",
  updateGroupImagePolicy: "allow",
  updateGroupPinnedFrameUrlPolicy: "allow",
};

const createGroupName = (peerEthereumAddresses: string[]) => {
  const currentAccount = getCurrentAccount()!;
  const firstThreeMembers = peerEthereumAddresses.slice(0, 3);
  const currentAccountSocials =
    getProfileSocialsQueryData(currentAccount, currentAccount) ?? undefined;
  let groupName = getPreferredName(currentAccountSocials, currentAccount);
  if (firstThreeMembers.length) {
    groupName += ", ";
  }
  for (let i = 0; i < firstThreeMembers.length; i++) {
    const member = firstThreeMembers[i];
    const memberSocials = getProfileSocialsQueryData(member, member);
    groupName += getPreferredName(memberSocials, member);
    if (i < firstThreeMembers.length - 1) {
      groupName += ", ";
    }
  }
  return groupName;
};

export const createGroupWithDefaultsByAccount = async (args: {
  account: string;
  peerEthereumAddresses: string[];
}) => {
  const { account, peerEthereumAddresses } = args;

  const groupName = createGroupName(peerEthereumAddresses);

  return createGroupByAccount({
    account,
    peers: peerEthereumAddresses,
    permissionPolicySet: defaultPermissionPolicySet,
    groupName,
  });
};

export const createGroupByAccount = async (args: {
  account: string;
  peers: string[];
  permissionPolicySet: PermissionPolicySet;
  groupName?: string;
  groupPhoto?: string;
  groupDescription?: string;
}) => {
  const {
    account,
    peers,
    permissionPolicySet,
    groupName,
    groupPhoto,
    groupDescription,
  } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return createGroup({
    client,
    peers,
    permissionPolicySet,
    groupName,
    groupPhoto,
    groupDescription,
  });
};

export const refreshProtocolConversation = async (args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
}) => {
  const { client, topic } = args;
  return getConversationByTopic({ client, topic, includeSync: true });
};

export const refreshProtocolConversationByAccount = async (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return refreshProtocolConversation({ client, topic });
};

export const getConversationByPeerByAccount = async (args: {
  account: string;
  peer: string;
  includeSync?: boolean;
}) => {
  const { account, peer, includeSync = false } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getConversationByPeer({ client, peer, includeSync })!;
};

export const getOptionalConversationByPeerByAccount = async (args: {
  account: string;
  peer: string;
  includeSync?: boolean;
}) => {
  const { account, peer, includeSync = false } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getConversationByPeer({
    client,
    peer,
    includeSync,
    throwIfNotFound: false,
  });
};

export const getPeerAddressDm = async (
  dm: DmWithCodecsType
): Promise<string | undefined> => {
  const peerInboxId = await dm.peerInboxId();
  const peerAddress = (await dm.members()).find(
    (member) => member.inboxId === peerInboxId
  )?.addresses[0];
  return peerAddress;
};

// TODO: This is a temporary function to handle new conversation creation
// This is a temporary workaround related to https://github.com/xmtp/xmtp-react-native/issues/560
const handleNewConversationCreation = async (
  client: ConverseXmtpClientType,
  _conversation: ConversationWithCodecsType
) => {
  logger.info(
    "[XMTPRN Conversations] Restarting message stream to handle new conversation"
  );
  await streamAllMessages(client.address);
};

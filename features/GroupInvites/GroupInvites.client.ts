import { OnConsentOptions } from "@hooks/useGroupConsent";
import { createGroupJoinRequest, getGroupJoinRequest } from "@utils/api";
import { GroupInvite } from "@utils/api.types";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import {
  GroupData,
  GroupsDataEntity,
  GroupsEntity,
} from "@utils/xmtpRN/client.types";
import { InboxId } from "@xmtp/react-native-sdk";
import { AxiosInstance } from "axios";

import {} from "./groupInvites.utils";
import { JoinGroupResult } from "./joinGroup.types";

const GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS = 10;
const GROUP_JOIN_REQUEST_POLL_INTERVAL_MS = 1000;

/**
 * TODOs:
 *
 * determine at what point in this client we want to implmeent queryClient
 * options:
 * 1) in base client type so that all flavors behave the same
 * - I'm leaning towards this
 * 2) decided per flavor, so that we can have a live client that uses the query
 * client and a mock client that doesn't
 *
 * Naming Conventions:
 *
 * Fetch: fetches data from the server or over the network somehow
 * Create: creates data on the server or over the network somehow
 * Get:   gets data from some local cache or storage
 * Save:  saves data to some local cache or storage
 */

export type AllowGroupProps = {
  account: string;
  group: GroupData;
  options: OnConsentOptions;
};

export class JoinGroupClient {
  fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>;
  attemptToJoinGroup: (
    account: string,
    groupInviteId: string
  ) => Promise<JoinGroupResult>;
  fetchGroupsByAccount: (account: string) => Promise<GroupsDataEntity>;
  allowGroup: (props: AllowGroupProps) => Promise<void>;
  refreshGroup: (account: string, topic: string) => Promise<void>;

  constructor(
    fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>,
    attemptToJoinGroup: (
      account: string,
      groupInviteId: string
    ) => Promise<JoinGroupResult>,
    fetchGroupsByAccount: (account: string) => Promise<GroupsDataEntity>,
    allowGroup: (props: AllowGroupProps) => Promise<void>,
    refreshGroup: (account: string, topic: string) => Promise<void>
  ) {
    this.fetchGroupInvite = fetchGroupInvite;
    this.attemptToJoinGroup = attemptToJoinGroup;
    this.fetchGroupsByAccount = fetchGroupsByAccount;
    this.allowGroup = allowGroup;
    this.refreshGroup = refreshGroup;
  }

  static live({ api }: { api: AxiosInstance }): JoinGroupClient {
    const liveGetGroupInvite = async (
      groupInviteId: string
    ): Promise<GroupInvite> => {
      const { data } = await api.get(`/api/groupInvite/${groupInviteId}`);
      return data as GroupInvite;
    };

    const liveFetchGroupsByAccount = async (
      account: string
    ): Promise<GroupsDataEntity> => {
      const { fetchGroupsQuery } = await import("@queries/useGroupsQuery");
      const groupsEntity: GroupsDataEntity = await fetchGroupsQuery(account);
      // LOG  [fetchGroupsByAccountActorLogic] Fetched groups: {"byId": {"/xmtp/mls/1/g-eeff1e9058ee7fbbdb034837420be11d/proto": {"addedByInboxId": "155a86f747676bdbdde1e5b8f0b275a81e2787739b365a259d5652e753f64d2e", "client": undefined, "createdAt": 1729164750000, "creatorInboxId": "155a86f747676bdbdde1e5b8f0b275a81e2787739b365a259d5652e753f64d2e", "description": "", "id": "eeff1e9058ee7fbbdb034837420be11d", "imageUrlSquare": "", "isGroupActive": true, "members": [Array], "name": "Alice, yyy", "state": "unknown", "topic": "/xmtp/mls/1/g-eeff1e9058ee7fbbdb034837420be11d/proto", "version": "GROUP"}}, "ids": ["/xmtp/mls/1/g-eeff1e9058ee7fbbdb034837420be11d/proto"]}
      // LOG  [hasGroupIdInMetadata] Result: true
      // LOG  [Determining Newly Joined Group] Exiting state
      // LOG  [saveNewGroup] Saving new group: undefined
      // LOG  [Determining Newly Joined Group] Group ID in metadata: eeff1e9058ee7fbbdb034837420be11d
      // LOG  [Checking If User Has Been Blocked From Group] Entered state
      // LOG  7:39:36 AM | DEBUG : [hasUserNotBeenBlocked] newGroup: Undefined Message
      // LOG  [hasUserNotBeenBlocked] Result: false
      // LOG  [Checking If User Has Been Blocked From Group] Exiting state
      // Remove client from all values in groupsEntity
      const cleanedGroupsEntity = {
        byId: Object.fromEntries(
          Object.entries(groupsEntity.byId).map(([id, group]) => [
            [group.id],
            { ...group, client: undefined },
          ])
        ),
        ids: Object.values(groupsEntity.byId).map((group) => group.id),
      };

      // Example usage (commented out to avoid errors)
      // const anyId = cleanedGroupsEntity.ids[0];
      // const anyGroup = cleanedGroupsEntity.byId[anyId];
      // console.log('Group without client:', anyGroup);

      // I believe this will already be done since we
      // are using the fetchGroupsQuery now
      // queryClient.setQueryData(groupsQueryKey(account), groupsEntity);

      return cleanedGroupsEntity;
    };

    /**
     * TODO: add sdk streaming and race promises
     * @param account
     * @param groupInviteId
     * @param groupIdFromInvite
     */
    /**
     * Attempts to join a group using the provided account and invite details.
     *
     * This function handles the process of joining a group, including
     * creating a join request if necessary, and polling for the request status.
     *
     * @param {string} account - The account attempting to join the group
     * @param {string} groupInviteId - The ID of the group invite
     * @param {string} [groupIdFromInvite] - Optional group ID from the invite
     * @returns {Promise<JoinGroupResult>} The result of the join attempt
     *
     * @example
     * // Attempt to join a group
     * const result = await liveAttemptToJoinGroup('user123', 'invite456')
     * // Returns: { type: 'group-join-request.accepted', groupId: 'group789' }
     *
     * @example
     * // Attempt to join with known group ID
     * const result = await liveAttemptToJoinGroup('user123', 'invite456', 'group789')
     * // Returns: { type: 'group-join-request.rejected' }
     */
    const liveAttemptToJoinGroup = async (
      account: string,
      groupInviteId: string,
      groupIdFromInvite?: string
    ): Promise<JoinGroupResult> => {
      logger.debug(
        `[liveAttemptToJoinGroup] Starting join attempt for account: ${account}, groupInviteId: ${groupInviteId}`
      );

      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const groupsBeforeJoining = groupIdFromInvite
        ? { ids: [], byId: {} }
        : await liveFetchGroupsByAccount(account);
      logger.debug(
        `[liveAttemptToJoinGroup] Before joining, group count = ${groupsBeforeJoining.ids.length}`
      );

      const joinRequest = await createGroupJoinRequest(account, groupInviteId);
      const joinRequestId = joinRequest.id;

      let attemptsToRetryJoinGroup = 0;
      while (attemptsToRetryJoinGroup < GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS) {
        logger.debug(
          `[liveAttemptToJoinGroup] Polling attempt ${
            attemptsToRetryJoinGroup + 1
          } of ${GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS}`
        );
        const joinRequestData = await getGroupJoinRequest(joinRequestId);
        logger.debug(
          `[liveAttemptToJoinGroup] Join request status: ${joinRequestData.status}`
        );

        if (joinRequestData.status !== "PENDING") {
          switch (joinRequestData.status) {
            case "ACCEPTED":
              logger.info(
                `[liveAttemptToJoinGroup] Join request accepted for group: ${joinRequestData.groupId}`
              );
              return {
                type: "group-join-request.accepted",
                groupId: joinRequestData.groupId as string,
              };
            case "REJECTED":
              logger.info(`[liveAttemptToJoinGroup] Join request rejected`);
              return { type: "group-join-request.rejected" };
            case "ERROR":
              logger.error(`[liveAttemptToJoinGroup] Error in join request`);
              return { type: "group-join-request.error" };
          }
        }

        attemptsToRetryJoinGroup += 1;
        logger.debug(
          `[liveAttemptToJoinGroup] Waiting ${GROUP_JOIN_REQUEST_POLL_INTERVAL_MS}ms before next poll`
        );
        await sleep(GROUP_JOIN_REQUEST_POLL_INTERVAL_MS);
      }

      logger.warn(
        `[liveAttemptToJoinGroup] Join request timed out after ${GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS} attempts`
      );
      return { type: "group-join-request.timed-out" };
    };

    const liveAllowGroup = async ({
      account,
      group,
      options,
    }: AllowGroupProps) => {
      // Dynamically import dependencies to avoid the need for mocking in tests
      // and to make this client more flexible. This allows the tests to run
      // without mocking these dependencies, which would be necessary if they
      // were imported at the top level of this module.
      const { setGroupStatus } = await import("@data/store/accountsStore");
      const { createAllowGroupMutationObserver } = await import(
        "@queries/useAllowGroupMutation"
      );

      const { topic, id: groupId } = group;
      logger.debug(`[JoinGroupClient] Allowing group ${topic}`);
      const allowGroupMutationObserver = createAllowGroupMutationObserver({
        account,
        topic,
        groupId,
      });
      await allowGroupMutationObserver.mutate();

      // Dynamically import setGroupStatus
      setGroupStatus({ [getGroupIdFromTopic(topic).toLowerCase()]: "allowed" });

      const inboxIdsToAllow: InboxId[] = [];
      const inboxIds: { [inboxId: string]: "allowed" } = {};
      if (options.includeAddedBy && group?.addedByInboxId) {
        const addedBy = group.addedByInboxId;
        inboxIds[addedBy as string] = "allowed";
        inboxIdsToAllow.push(addedBy);
      }
    };

    const liveRefreshGroup = async (account: string, topic: string) => {
      // Dynamically import dependencies to avoid the need for mocking in tests
      // and to make this client more flexible. This allows the tests to run
      // without mocking these dependencies, which would be necessary if they
      // were imported at the top level of this module.
      const { refreshGroup } = await import("@utils/xmtpRN/conversations");
      await refreshGroup(account, topic);
    };

    return new JoinGroupClient(
      liveGetGroupInvite,
      liveAttemptToJoinGroup,
      liveFetchGroupsByAccount,
      liveAllowGroup,
      liveRefreshGroup
    );
  }

  static mock(
    fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>,
    attemptToJoinGroup: (
      account: string,
      groupInviteId: string,
      groupIdFromInvite?: string
    ) => Promise<JoinGroupResult>,
    fetchGroupsByAccount: (account: string) => Promise<GroupsEntity>,
    allowGroup: (props: AllowGroupProps) => Promise<void>,
    refreshGroup: (account: string, topic: string) => Promise<void>
  ): JoinGroupClient {
    return new JoinGroupClient(
      fetchGroupInvite,
      attemptToJoinGroup,
      fetchGroupsByAccount,
      allowGroup,
      refreshGroup
    );
  }

  static userAlreadyAMemberFixture(): JoinGroupClient {
    const fixtureGetGroupInvite = async (groupInviteId: string) => {
      const fixtureGroupInvite: GroupInvite = {
        id: "groupInviteId123",
        inviteLink: "https://www.google.com",
        createdByAddress: "0x123",
        groupName: `Group Name from ${groupInviteId}`,
        imageUrl: "https://www.google.com",
        description: "Group Description",
        groupId: "groupId123",
      } as const;

      return fixtureGroupInvite;
    };

    const fixtureAttemptToJoinGroup = async (
      account: string,
      groupInviteId: string
    ) => {
      return {
        type: "group-join-request.accepted",
        groupId: "groupId123",
      } as const;
    };

    const fixtureFetchGroupsByAccount = async (
      account: string
    ): Promise<GroupsDataEntity> => {
      const fixtureGroup: GroupData = {
        id: "groupId123",
        createdAt: new Date().getTime(),
        members: [],
        topic: "topic123",
        isGroupActive: true,
        state: "allowed",
        creatorInboxId: "0xabc" as InboxId,
        name: "Group Name",
        addedByInboxId: "0x123" as InboxId,
        imageUrlSquare: "https://www.google.com",
        description: "Group Description",
      } as const;

      const fixtureGroupsDataEntity: GroupsDataEntity = {
        ids: [fixtureGroup.id],
        byId: {
          [fixtureGroup.id]: fixtureGroup,
        },
      } as const;

      return fixtureGroupsDataEntity;
    };

    const fixtureAllowGroup = async ({
      account,
      options,
      group,
    }: AllowGroupProps) => {};

    const fixtureRefreshGroup = async (account: string, topic: string) => {};

    return new JoinGroupClient(
      fixtureGetGroupInvite,
      fixtureAttemptToJoinGroup,
      fixtureFetchGroupsByAccount,
      fixtureAllowGroup,
      fixtureRefreshGroup
    );
  }

  static unimplemented(): JoinGroupClient {
    const unimplementedError = (method: string) => () => {
      const error = `
[JoinGroupClient] ERROR: unimplemented ${method} - Your code has invoked JoinGroupClient 
without specifying an implementation. This unimplemented dependency is here to 
ensure you don't invoke code you don't intend to, ensuring your tests are truly 
testing what they are expected to
`;
      console.warn(error);
      throw new Error(error);
    };

    return new JoinGroupClient(
      unimplementedError("fetchGroupInvite"),
      unimplementedError("attemptToJoinGroup"),
      unimplementedError("fetchGroupsByAccount"),
      unimplementedError("allowGroup"),
      unimplementedError("refreshGroup")
    );
  }
}

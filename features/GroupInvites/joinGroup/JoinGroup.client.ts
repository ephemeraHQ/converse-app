// import { IGroupConsentOptions } from "@/features/consent/use-group-consent-for-current-account";
// // import {
// //   createGroupJoinRequest,
// //   getGroupJoinRequest,
// // } from "@/utils/api/api-groups/api-groups";
// // import { GroupInvite } from "@/utils/api/api-groups/api-group.types";
// import { getV3IdFromTopic } from "@/utils/groupUtils/groupId";
// import { logger } from "@utils/logger";
// import {
//   ConversationDataEntity,
//   ConversationWithCodecsType,
//   GroupData,
//   GroupsDataEntity,
// } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
// import {
//   Conversation,
//   ConversationId,
//   ConversationTopic,
//   ConversationVersion,
//   InboxId,
// } from "@xmtp/react-native-sdk";
// import { AxiosInstance } from "axios";

// import {} from "../groupInvites.utils";
// import { JoinGroupResult } from "./joinGroup.types";
// import { IAllowedConsentConversationsQuery } from "@/queries/conversations-allowed-consent-query";
// import { entify } from "@/queries/entify";
// import { wait } from "@/utils/general";

// const GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS = 10;
// const GROUP_JOIN_REQUEST_POLL_INTERVAL_MS = 1000;

// /**
//  * TODOs:
//  *
//  * determine at what point in this client we want to implmeent queryClient
//  * options:
//  * 1) in base client type so that all flavors behave the same
//  * - I'm leaning towards this
//  * 2) decided per flavor, so that we can have a live client that uses the query
//  * client and a mock client that doesn't
//  *
//  * Naming Conventions:
//  *
//  * Fetch: fetches data from the server or over the network somehow
//  * Create: creates data on the server or over the network somehow
//  * Get:   gets data from some local cache or storage
//  * Save:  saves data to some local cache or storage
//  */

// export type AllowGroupProps = {
//   account: string;
//   conversation: ConversationWithCodecsType;
//   options: IGroupConsentOptions;
// };

// export class JoinGroupClient {
//   fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>;
//   attemptToJoinGroup: (
//     account: string,
//     groupInviteId: string
//   ) => Promise<JoinGroupResult>;
//   fetchGroupsByAccount: (account: string) => Promise<ConversationDataEntity>;
//   allowGroup: (props: AllowGroupProps) => Promise<void>;
//   refreshGroup: (account: string, topic: string) => Promise<void>;

//   constructor(
//     fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>,
//     attemptToJoinGroup: (
//       account: string,
//       groupInviteId: string
//     ) => Promise<JoinGroupResult>,
//     fetchGroupsByAccount: (account: string) => Promise<ConversationDataEntity>,
//     allowGroup: (props: AllowGroupProps) => Promise<void>,
//     refreshGroup: (account: string, topic: string) => Promise<void>
//   ) {
//     this.fetchGroupInvite = fetchGroupInvite;
//     this.attemptToJoinGroup = attemptToJoinGroup;
//     this.fetchGroupsByAccount = fetchGroupsByAccount;
//     this.allowGroup = allowGroup;
//     this.refreshGroup = refreshGroup;
//   }

//   static live({ api }: { api: AxiosInstance }): JoinGroupClient {
//     const liveGetGroupInvite = async (
//       groupInviteId: string
//     ): Promise<GroupInvite> => {
//       const { data } = await api.get(`/api/groupInvite/${groupInviteId}`);
//       return data as GroupInvite;
//     };

//     const liveFetchGroupsByAccount = async (
//       account: string
//     ): Promise<ConversationDataEntity> => {
//       const { fetchAllowedConsentConversationsQuery: fetchConversationsQuery } =
//         await import("@/queries/conversations-allowed-consent-query");

//       const conversationList: IAllowedConsentConversationsQuery =
//         await fetchConversationsQuery({
//           account,
//           caller: "liveFetchGroupsByAccount",
//         });

//       const conversationEntity: ConversationDataEntity = entify(
//         conversationList,
//         (conversation) => conversation.id as ConversationId
//       );

//       return conversationEntity;
//     };

//     /**
//      * TODO: add sdk streaming and race promises
//      * @param account
//      * @param groupInviteId
//      * @param groupIdFromInvite
//      */
//     /**
//      * Attempts to join a group using the provided account and invite details.
//      *
//      * This function handles the process of joining a group, including
//      * creating a join request if necessary, and polling for the request status.
//      *
//      * @param {string} account - The account attempting to join the group
//      * @param {string} groupInviteId - The ID of the group invite
//      * @param {string} [groupIdFromInvite] - Optional group ID from the invite
//      * @returns {Promise<JoinGroupResult>} The result of the join attempt
//      *
//      * @example
//      * // Attempt to join a group
//      * const result = await liveAttemptToJoinGroup('user123', 'invite456')
//      * // Returns: { type: 'group-join-request.accepted', groupId: 'group789' }
//      *
//      * @example
//      * // Attempt to join with known group ID
//      * const result = await liveAttemptToJoinGroup('user123', 'invite456', 'group789')
//      * // Returns: { type: 'group-join-request.rejected' }
//      */
//     const liveAttemptToJoinGroup = async (
//       account: string,
//       groupInviteId: string,
//       groupIdFromInvite?: string
//     ): Promise<JoinGroupResult> => {
//       logger.debug(
//         `[liveAttemptToJoinGroup] Starting join attempt for account: ${account}, groupInviteId: ${groupInviteId}`
//       );

//       const groupsBeforeJoining = groupIdFromInvite
//         ? { ids: [], byId: {} }
//         : await liveFetchGroupsByAccount(account);
//       logger.debug(
//         `[liveAttemptToJoinGroup] Before joining, group count = ${groupsBeforeJoining.ids.length}`
//       );

//       const joinRequest = await createGroupJoinRequest(account, groupInviteId);
//       const joinRequestId = joinRequest.id;

//       let attemptsToRetryJoinGroup = 0;
//       while (attemptsToRetryJoinGroup < GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS) {
//         logger.debug(
//           `[liveAttemptToJoinGroup] Polling attempt ${
//             attemptsToRetryJoinGroup + 1
//           } of ${GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS}`
//         );
//         const joinRequestData = await getGroupJoinRequest(joinRequestId);
//         logger.debug(
//           `[liveAttemptToJoinGroup] Join request status: ${joinRequestData.status}`
//         );

//         if (joinRequestData.status !== "PENDING") {
//           switch (joinRequestData.status) {
//             case "ACCEPTED":
//               logger.info(
//                 `[liveAttemptToJoinGroup] Join request accepted for group: ${joinRequestData.groupId}`
//               );
//               return {
//                 type: "group-join-request.accepted",
//                 groupId: joinRequestData.groupId as string,
//               };
//             case "REJECTED":
//               logger.info(`[liveAttemptToJoinGroup] Join request rejected`);
//               return { type: "group-join-request.rejected" };
//             case "ERROR":
//               logger.error(`[liveAttemptToJoinGroup] Error in join request`);
//               return { type: "group-join-request.error" };
//           }
//         }

//         attemptsToRetryJoinGroup += 1;
//         logger.debug(
//           `[liveAttemptToJoinGroup] Waiting ${GROUP_JOIN_REQUEST_POLL_INTERVAL_MS}ms before next poll`
//         );
//         await wait(GROUP_JOIN_REQUEST_POLL_INTERVAL_MS);
//       }

//       logger.warn(
//         `[liveAttemptToJoinGroup] Join request timed out after ${GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS} attempts`
//       );
//       return { type: "group-join-request.timed-out" };
//     };

//     const liveAllowGroup = async ({
//       account,
//       conversation,
//       options,
//     }: AllowGroupProps) => {
//       // Dynamically import dependencies to avoid the need for mocking in tests
//       // and to make this client more flexible. This allows the tests to run
//       // without mocking these dependencies, which would be necessary if they
//       // were imported at the top level of this module.
//       const { setGroupStatus } = await import(
//         "@/features/multi-inbox/multi-inbox.store"
//       );
//       const { createAllowGroupMutationObserver } = await import(
//         "@/features/consent/use-allow-group.mutation"
//       );

//       const { topic, id: groupId } = conversation;
//       logger.debug(`[JoinGroupClient] Allowing group ${topic}`);
//       const allowGroupMutationObserver = createAllowGroupMutationObserver({
//         account,
//         topic,
//       });
//       await allowGroupMutationObserver.mutate({
//         account,
//         topic,
//       });

//       // Dynamically import setGroupStatus
//       setGroupStatus({
//         [getV3IdFromTopic(topic).toLowerCase()]: "allowed",
//       });

//       const inboxIdsToAllow: IXmtpInboxId[] = [];
//       const inboxIds: { [inboxId: IXmtpInboxId]: "allowed" } = {};
//       if (
//         options.includeAddedBy &&
//         conversation.version === ConversationVersion.GROUP &&
//         conversation.addedByInboxId
//       ) {
//         const addedBy = conversation.addedByInboxId;
//         inboxIds[addedBy as string] = "allowed";
//         inboxIdsToAllow.push(addedBy);
//       }
//     };

//     const liveRefreshGroup = async (account: string, topic: string) => {
//       // Dynamically import dependencies to avoid the need for mocking in tests
//       // and to make this client more flexible. This allows the tests to run
//       // without mocking these dependencies, which would be necessary if they
//       // were imported at the top level of this module.
//       // const { refreshGroup } = await import("@utils/xmtpRN/conversations");
//       // await refreshGroup(account, topic);
//     };

//     return new JoinGroupClient(
//       liveGetGroupInvite,
//       liveAttemptToJoinGroup,
//       liveFetchGroupsByAccount,
//       liveAllowGroup,
//       liveRefreshGroup
//     );
//   }

//   static userAMemberOfGroupWithId(
//     alreadyAMemberGroupId: ConversationId
//   ): JoinGroupClient {
//     const GroupIdUserAlreadyWasAMemberOf = alreadyAMemberGroupId;

//     const fixtureGetGroupInvite = async (groupInviteId: string) => {
//       const fixtureGroupInvite: GroupInvite = {
//         id: "groupInviteId123",
//         inviteLink: "https://www.google.com",
//         createdByAddress: "0x123",
//         groupName: `Group Name from ${groupInviteId}`,
//         imageUrl: "https://www.google.com",
//         description: "Group Description",
//         groupId: GroupIdUserAlreadyWasAMemberOf,
//       } as const;

//       return fixtureGroupInvite;
//     };

//     const fixtureAttemptToJoinGroup = async (
//       account: string,
//       groupInviteId: string
//     ) => {
//       return {
//         type: "group-join-request.accepted",
//         groupId: GroupIdUserAlreadyWasAMemberOf,
//       } as const;
//     };

//     const fixtureFetchGroupsByAccount = async (
//       account: string
//     ): Promise<ConversationDataEntity> => {
//       const fixtureGroup: GroupData = {
//         id: GroupIdUserAlreadyWasAMemberOf,
//         createdAt: new Date().getTime(),
//         members: async () => [],
//         topic: "topic123" as ConversationTopic,
//         // has user been blocked?
//         isGroupActive: true,
//         state: "allowed",
//         creatorInboxId: async () => "0xabc" as InboxId,
//         name: "Group Name",
//         addedByInboxId: "0x123" as InboxId,
//         groupImageUrl: "https://www.google.com",
//         description: "Group Description",
//       } as const;

//       // todo(lustig): how do you create a well typed fixture of the plain conversation type?
//       // @ts-expect-error
//       const conversationFixture: Conversation = {
//         id: GroupIdUserAlreadyWasAMemberOf,
//         createdAt: new Date().getTime(),
//         members: async () => [],
//         topic: "topic123" as ConversationTopic,
//         isGroupActive: true,
//         state: "allowed",
//         creatorInboxId: async () => "0xabc" as InboxId,
//         name: "Group Name",
//         addedByInboxId: "0x123" as InboxId,
//         groupImageUrl: "https://www.google.com",
//         description: "Group Description",
//       };

//       const fixtureConversationDataEntity: ConversationDataEntity = {
//         ids: [GroupIdUserAlreadyWasAMemberOf],
//         // todo(lustig): how do you create a well typed fixture of the plain conversation type?
//         byId: {
//           [GroupIdUserAlreadyWasAMemberOf]: conversationFixture,
//         },
//       } as const;

//       // todo(lustig): how do you create a well typed fixture of the plain conversation type?
//       // @ts-expect-error
//       return fixtureGroupsDataEntity;
//     };

//     const fixtureAllowGroup = async ({
//       account,
//       options,
//       conversation,
//     }: AllowGroupProps) => {};

//     const fixtureRefreshGroup = async (account: string, topic: string) => {};

//     return new JoinGroupClient(
//       fixtureGetGroupInvite,
//       fixtureAttemptToJoinGroup,
//       fixtureFetchGroupsByAccount,
//       fixtureAllowGroup,
//       fixtureRefreshGroup
//     );
//   }

//   static userNotAMemberOfGroupWithId(
//     notJoinedGroupId: ConversationId
//   ): JoinGroupClient {
//     const GroupIdUserIsNewTo = notJoinedGroupId;
//     const GroupIdUserIsAlreadyAMemberOf = "groupId123" as ConversationId;

//     const fixtureGetGroupInvite = async (groupInviteId: string) => {
//       const fixtureGroupInvite: GroupInvite = {
//         id: "groupInviteId123",
//         inviteLink: "https://www.google.com",
//         createdByAddress: "0x123",
//         groupName: `Group Name from ${groupInviteId}`,
//         imageUrl: "https://www.google.com",
//         description: "Group Description",
//         groupId: GroupIdUserIsNewTo,
//       } as const;

//       return fixtureGroupInvite;
//     };

//     const fixtureAttemptToJoinGroup = async (
//       account: string,
//       groupInviteId: string
//     ) => {
//       return {
//         type: "group-join-request.accepted",
//         groupId: GroupIdUserIsNewTo,
//       } as const;
//     };

//     const fixtureFetchGroupsByAccount = async (
//       account: string
//     ): Promise<GroupsDataEntity> => {
//       const fixtureGroup: GroupData = {
//         id: GroupIdUserIsAlreadyAMemberOf,
//         createdAt: new Date().getTime(),
//         members: async () => [],
//         topic: "topic123" as ConversationTopic,
//         isGroupActive: true,
//         state: "allowed",
//         creatorInboxId: async () => "0xabc" as InboxId,
//         name: "Group Name",
//         addedByInboxId: "0x123" as InboxId,
//         groupImageUrl: "https://www.google.com",
//         description: "Group Description",
//       } as const;

//       const fixtureGroupsDataEntity: GroupsDataEntity = {
//         ids: [fixtureGroup.id],
//         byId: {
//           [fixtureGroup.id]: fixtureGroup,
//         },
//       } as const;

//       // todo remove these from the fixture if they were to even get in

//       return fixtureGroupsDataEntity;
//     };

//     const fixtureAllowGroup = async ({
//       account,
//       options,
//       conversation,
//     }: AllowGroupProps) => {};

//     const fixtureRefreshGroup = async (account: string, topic: string) => {};

//     return new JoinGroupClient(
//       fixtureGetGroupInvite,
//       fixtureAttemptToJoinGroup,
//       // todo(lustig): how do you create a well typed fixture of the plain conversation type?
//       // @ts-expect-error
//       fixtureFetchGroupsByAccount,
//       fixtureAllowGroup,
//       fixtureRefreshGroup
//     );
//   }

//   static userBlockedFromGroupWithId(
//     blockedGroupId: ConversationId
//   ): JoinGroupClient {
//     const GroupIdUserWasBlockedFrom = blockedGroupId;
//     const UserWasBlockedFromGroupActiveValue = false;

//     const fixtureGetGroupInvite = async (groupInviteId: string) => {
//       const fixtureGroupInvite: GroupInvite = {
//         id: "groupInviteId123",
//         inviteLink: "https://www.google.com",
//         createdByAddress: "0x123",
//         groupName: `Group Name from ${groupInviteId}`,
//         imageUrl: "https://www.google.com",
//         description: "Group Description",
//         groupId: GroupIdUserWasBlockedFrom,
//       } as const;

//       return fixtureGroupInvite;
//     };

//     const fixtureAttemptToJoinGroup = async (
//       account: string,
//       groupInviteId: string
//     ) => {
//       return {
//         type: "group-join-request.accepted",
//         groupId: GroupIdUserWasBlockedFrom,
//       } as const;
//     };

//     const fixtureFetchGroupsByAccount = async (
//       account: string
//     ): Promise<GroupsDataEntity> => {
//       const fixtureGroup: GroupData = {
//         id: GroupIdUserWasBlockedFrom,
//         createdAt: new Date().getTime(),
//         members: async () => [],
//         topic: "topic123" as ConversationTopic,
//         isGroupActive: UserWasBlockedFromGroupActiveValue,
//         state: "allowed",
//         creatorInboxId: async () => "0xabc" as InboxId,
//         name: "Group Name",
//         addedByInboxId: "0x123" as InboxId,
//         groupImageUrl: "https://www.google.com",
//         description: "Group Description",
//       } as const;

//       const fixtureGroupsDataEntity: GroupsDataEntity = {
//         ids: [GroupIdUserWasBlockedFrom],
//         byId: {
//           [GroupIdUserWasBlockedFrom]: fixtureGroup,
//         },
//       } as const;

//       return fixtureGroupsDataEntity;
//     };

//     const fixtureAllowGroup = async () => {};

//     const fixtureRefreshGroup = async (account: string, topic: string) => {};

//     return new JoinGroupClient(
//       fixtureGetGroupInvite,
//       fixtureAttemptToJoinGroup,
//       // todo(lustig): how do you create a well typed fixture of the plain conversation type?
//       // @ts-expect-error
//       fixtureFetchGroupsByAccount,
//       fixtureAllowGroup,
//       fixtureRefreshGroup
//     );
//   }

//   static userJoinGroupTimeout(attemptedJoinGroupId: string): JoinGroupClient {
//     const GroupIdUserWasNotAMemberOf = attemptedJoinGroupId;

//     const fixtureGetGroupInvite = async (groupInviteId: string) => {
//       const fixtureGroupInvite: GroupInvite = {
//         id: "groupInviteId123",
//         inviteLink: "https://www.google.com",
//         createdByAddress: "0x123",
//         groupName: `Group Name from ${groupInviteId}`,
//         imageUrl: "https://www.google.com",
//         description: "Group Description",
//         groupId: GroupIdUserWasNotAMemberOf,
//       } as const;

//       return fixtureGroupInvite;
//     };

//     const fixtureAttemptToJoinGroup = async (
//       account: string,
//       groupInviteId: string
//     ): Promise<JoinGroupResult> => {
//       await wait(5000);
//       return {
//         type: "group-join-request.timed-out",
//       } as const;
//     };

//     const fixtureFetchGroupsByAccount = async (
//       account: string
//     ): Promise<GroupsDataEntity> => {
//       const fixtureGroupsDataEntity: GroupsDataEntity = {
//         ids: [],
//         byId: {},
//       } as const;

//       return fixtureGroupsDataEntity;
//     };

//     const fixtureAllowGroup = async () => {};

//     const fixtureRefreshGroup = async (account: string, topic: string) => {};

//     return new JoinGroupClient(
//       fixtureGetGroupInvite,
//       fixtureAttemptToJoinGroup,
//       // todo(lustig): how do you create a well typed fixture of the plain conversation type?
//       // @ts-expect-error
//       fixtureFetchGroupsByAccount,
//       fixtureAllowGroup,
//       fixtureRefreshGroup
//     );
//   }

//   static unimplemented(): JoinGroupClient {
//     const unimplementedError = (method: string) => () => {
//       const error = `
// [JoinGroupClient] ERROR: unimplemented ${method} - Your code has invoked JoinGroupClient
// without specifying an implementation. This unimplemented dependency is here to
// ensure you don't invoke code you don't intend to, ensuring your tests are truly
// testing what they are expected to
// `;
//       console.warn(error);
//       throw new Error(error);
//     };

//     return new JoinGroupClient(
//       unimplementedError("fetchGroupInvite"),
//       unimplementedError("attemptToJoinGroup"),
//       unimplementedError("fetchGroupsByAccount"),
//       unimplementedError("allowGroup"),
//       unimplementedError("refreshGroup")
//     );
//   }
// }

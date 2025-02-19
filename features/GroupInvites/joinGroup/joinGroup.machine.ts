// /// Figma: TODO
// import { GroupJoinRequestStatus } from "@/utils/api/api-groups/api-groups";
// import { GroupInvite } from "@/utils/api/api-groups/api-group.types";
// import {
//   ConversationDataEntity,
//   ConversationWithCodecsType,
// } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
// import { assign, fromPromise, log, setup } from "xstate";

// import { AllowGroupProps } from "./JoinGroup.client";
// import { JoinGroupResult, JoinGroupResultType } from "./joinGroup.types";
// import { Controlled } from "../../../dependencies/Environment/Environment";
// import { ConversationVersion } from "@xmtp/react-native-sdk";

// type JoinGroupMachineEvents =
//   | { type: "user.didTapJoinGroup" }
//   | { type: "user.didTapOpenConversation" };

// type JoinGroupMachineErrorType =
//   | "fetchGroupInviteError"
//   | "fetchGroupsByAccountError"
//   | "attemptToJoinGroupError"
//   | "provideUserConsentToJoinGroupError"
//   | "refreshGroupError";

// export type JoinGroupMachineContext = {
//   // Context
//   /** User's currently active account */
//   account: string;
//   /** Group invite metadata, includes info such as group name, group ID, etc */
//   groupInviteMetadata?: GroupInvite;
//   /** Contains a snapshot of the conversation a user was a member of prior to
//    * attempting to join this group from the Deeplink */
//   groupsBeforeJoinRequestAccepted?: ConversationDataEntity;
//   /** The group that the user has been invited to join */
//   invitedGroup?: ConversationWithCodecsType;
//   /** The status of the group join request (accepted, rejected, pending) */
//   joinStatus: GroupJoinRequestStatus;

//   // From Input
//   /** The ID of the group invite - used to fetch the metadata */
//   groupInviteId: string;
//   error?: { type: JoinGroupMachineErrorType; payload: string };
// };

// type JoinGroupMachineInput = {
//   groupInviteId: string;
//   account: string;
// };

// type JoinGroupMachineTags = "loading" | "polling" | "error";

// export const joinGroupMachineLogic = setup({
//   types: {
//     events: {} as JoinGroupMachineEvents,
//     context: {} as JoinGroupMachineContext,
//     input: {} as JoinGroupMachineInput,
//     tags: {} as JoinGroupMachineTags,
//   },

//   actors: {
//     fetchGroupInviteActorLogic: fromPromise<
//       GroupInvite,
//       { account: string; groupInviteId: string }
//     >(async ({ input }) => {
//       const { groupInviteId } = input;
//       const groupInvite = await Controlled.joinGroupClient.fetchGroupInvite(
//         groupInviteId
//       );
//       return groupInvite;
//     }),

//     fetchGroupsByAccountActorLogic: fromPromise<
//       ConversationDataEntity,
//       { account: string }
//     >(async ({ input }) => {
//       const { account } = input;
//       const conversation =
//         await Controlled.joinGroupClient.fetchGroupsByAccount(account);
//       return conversation;
//     }),

//     attemptToJoinGroupActorLogic: fromPromise<
//       JoinGroupResult,
//       { account: string; groupInviteId: string }
//     >(async ({ input }) => {
//       const { account, groupInviteId } = input;
//       const result = await Controlled.joinGroupClient.attemptToJoinGroup(
//         account,
//         groupInviteId
//       );
//       return result;
//     }),

//     provideUserConsentToJoinGroup: fromPromise<
//       void,
//       { account: string; conversation: ConversationWithCodecsType }
//     >(async ({ input }) => {
//       const { account, conversation } = input;
//       const allowGroupProps: AllowGroupProps = {
//         account,
//         options: {
//           includeCreator: false,
//           includeAddedBy: false,
//         },
//         conversation,
//       };
//       return await Controlled.joinGroupClient.allowGroup(allowGroupProps);
//     }),

//     refreshGroup: fromPromise<void, { account: string; topic: string }>(
//       async ({ input }) => {
//         const { account, topic } = input;
//         return await Controlled.joinGroupClient.refreshGroup(account, topic);
//       }
//     ),
//   },

//   actions: {
//     saveGroupInviteMetadata: assign({
//       groupInviteMetadata: (
//         _,
//         params: { groupInviteMetadata: GroupInvite }
//       ) => {
//         return params.groupInviteMetadata;
//       },
//     }),

//     saveError: assign({
//       error: (
//         _,
//         params: { error: { type: JoinGroupMachineErrorType; payload: string } }
//       ) => {
//         return params.error;
//       },
//     }),

//     navigateToGroupScreen: log(
//       (_, params: { topic: string }) =>
//         `[navigateToGroupScreen] Navigating to group screen with topic: ${params.topic}`
//     ),

//     saveConversationsBeforeJoinAttempt: assign({
//       groupsBeforeJoinRequestAccepted: (
//         _,
//         params: { groupsBeforeJoinRequestAccepted: ConversationDataEntity }
//       ) => {
//         return params.groupsBeforeJoinRequestAccepted;
//       },
//     }),

//     saveNewGroup: assign({
//       invitedGroup: (
//         _,
//         params: { invitedGroup?: ConversationWithCodecsType }
//       ) => {
//         return params.invitedGroup;
//       },
//     }),

//     saveGroupJoinStatus: assign({
//       joinStatus: (_, params: { joinStatus: GroupJoinRequestStatus }) => {
//         return params.joinStatus;
//       },
//     }),
//   },

//   guards: {
//     isGroupJoinRequestType: (
//       _,
//       params: {
//         groupJoinRequestEventType: JoinGroupResultType;
//         expectedType: JoinGroupResultType;
//       }
//     ) => params.groupJoinRequestEventType === params.expectedType,

//     hasGroupIdInMetadata: (_, params: { groupInviteMetadata: GroupInvite }) => {
//       const result = params.groupInviteMetadata.groupId !== undefined;
//       return result;
//     },

//     /**
//      *
//      * @param _ I need to refactor this to say the positive case
//      * where user is a member of group.
//      * the problem occurs because of all of these potentials for things
//      * to be undefined...
//      * todo: userIsAMemberOfGroup
//      * @param params
//      * @returns
//      */
//     userHasAlreadyJoinedGroup: (
//       _,
//       params: { invitedGroup: ConversationWithCodecsType | undefined }
//     ) => {
//       const result = params.invitedGroup === undefined;
//       return result;
//     },

//     hasUserNotBeenBlocked: (
//       _,
//       params: { invitedGroup: ConversationWithCodecsType | undefined }
//     ) => {
//       const invitedGroup: ConversationWithCodecsType | undefined =
//         params.invitedGroup;

//       if (invitedGroup === undefined) {
//         // If the invited group is undefined, we can't
//         // determine if the user has been blocked or not.
//         // We'll be able to do so later in the process.
//         return true;
//       }

//       // const isNotBlocked = invitedGroup?.isGroupActive === true;
//       const isBlocked =
//         invitedGroup?.version === ConversationVersion.GROUP &&
//         invitedGroup?.isGroupActive === false;

//       return !isBlocked;
//     },

//     isUserInGroup: (
//       _,
//       params: {
//         invitedConversationId: string | undefined;
//         conversation: ConversationDataEntity | undefined;
//       }
//     ) => {
//       const { invitedConversationId, conversation } = params;
//       if (invitedConversationId === undefined || conversation === undefined) {
//         return false;
//       }

//       const invitedConversation: ConversationWithCodecsType | undefined =
//         conversation.byId[invitedConversationId];

//       if (!invitedConversation) {
//         return false;
//       }

//       // if this conversation is a DM, we assume the user has membership
//       // if this conversation is a Group, we check isGroupActive === true
//       if (invitedConversation?.version === ConversationVersion.DM) {
//         return true;
//       }

//       // If version is undefined, treat it as not being in the group
//       if (!invitedConversation.version) {
//         return false;
//       }

//       const userHasBeenBlocked =
//         invitedConversation.version === ConversationVersion.GROUP &&
//         invitedConversation.isGroupActive === false;

//       const userIsInGroup = !userHasBeenBlocked;
//       return userIsInGroup;
//     },
//   },
// }).createMachine({
//   /** @xstate-layout N4IgpgJg5mDOIC5QCsD2BLAdgcQE6oFcAHAWQEMBjACyzADoAZVMiLKAAj0KPYElMAbugAuYdiTDCWZKQGIIqTPSwDUAa3oAzSdS7F+Q0QEEKw1LiZR0FANoAGALqJQRVLBHpFzkAA9EAVgBmQLoATgAOcNCAJgAWaP9-aIA2OwB2ABoQAE9EaLsARjoEuxSC2ILQwtj-AF9arLQsPVJKGiVGZlZMDha+QRExCSkIGTJZMFx8XDoiABsZTXMAWzptYV18fQHjU3NLa3snJBBXd2FPTG8-BCCQiKi4hKTUzJzECLCCgrTfgv9krFAr96o0MDgtq1qLROiw2P0PGQ5nNsuwAFLgyCcSGweSKZSCdT0OZdNj8RHI7IY2gQFqwI7eM4eLwnG4FfLhOh2ZLBdnhZJVUKBZJZXK3Qp0ZJpAGVUJBcK-NKgkBNCHccjQjpMOE9BEXJEo9GYiDY7i4hQdFREugknVQcn6ynUpS0nE2ArHFxuZlXVmIdl2Tnc3nRfmC4WivISkplCpVcqJZWqloa9r0bXdDgO9AG1HOrF0iZTcyzBbCJa4Va2zPZ3P511mhknJkXFmgNkcrk8wJ8gV2IUi94IcLRLl2QLhbmhNIRaLfaJJ8EptowgDCVDAFDU7AAqrBJqbiEasOwAMpSYQEWDsABCYArYj3B5MrcwsibXvOl2uUcidDSgT+HYsQVIEMQTpGtwTnQNTJMk-jTmkUqlOEi7NJCqZrhuW67vuuCHjwzpnheV63ve5iPnh7Avpc74eoy3qvj+CAcpyAFASBBRgdEEFDoE8RfHKFQKlxsRRGharEJhHTrpu25PvhfREeeMikXeD64c+pi0TY0SeqcjHfn6LGBmxgHAaB4HhJBBR2IkXLCqE4axOBgQScumr0Ap7AAOpkNeRhzLgYAsKiZDiGAywAEYHqgmgEewAAKuCePhZjsKuczWGo8JEQwWBqLIV6THQrAQAAKmQRAAPJEGAmCrooAiTLAMiXB+Blfm2vh5GJ-iSr8oSwfE+SxJBsTAcUcqlKE5SBsCCruRhK4dH5Hi6gAYuYmn4TRihFXhpXoBVVXOi0HUtkZ7Z5JERQuSBLlDaEyQjpB0RpHY-6BIG47JP8f3ckt6orfQa0XJt23eXtb7FTMZWVTVdUNU1LVtYoF2Gd1NxxJOdBJOEXHvbNTmQXK-6RM9PH+D8YHlEDUkg3QRjCKIyxEODHDpURLR4pahIaHQMis+z5WoGdkIvvsqBWLYjgMV1vrXQgwrcsUk7wTOwShtEkHSqExTcu9UTJHE-hifTUJpkzLORez8Jc+CBG8wSqgC0LtvCKL4vcJLFjS4c9HNpjis9crqTJGr3L+JrgTa5BUT-mJ85a7NE4W9J9DM8LHPsA7J48xaLvWu7bOe2LS4S3sfsy7p+mXVjiAqxHoZRzHcdDnORRPCrTmORUC4NCqFfA551vZ-bqDHpgTuF3QVpuzbpde8PxC+wctiBHXwfMU3kca0KsevR3aSjjxgbPTyPJ2IDg-Jsto9Zx7E9TzP+Jz-z9AlyL5foT7VfrzYWIW8FY73DnvaOB925iiBEURIC1EJgTcrfFelsYQABFJCTGWFgeEAA5MAAB3Q09ZX581dloHQVA6RGE0KIXALQDCDBMBQMA7NIAYxAcZWIPIiiRCSLHQEhQpTx1DHQcIiRe5SilIkOoyDf4M1Hhguh2DMB4MIcQ40pCi4C3WJsM0NC6EMJ2GAZhrDRAQHdMAn0zFuE9jEeIniKQJoFGER3QM-5QwmxcmkSIwIALp0ZkorBODdT4KIXmTRPNJjTFLIsFYaxKHUNoZMIxhgTEUBYWwixcsg6cKVrY3hDiBHONcWKACEdqZpCBO9E+gYpQBNHrJLc8JeDxW8gACX8mReqt4SRbixBtfAywnYcOscZRIJ8uRJHKATOCQ0CjxxqGInxwET48knO9BpVsmk5V1K0na7BOnXjvD0m8fSNAmkGagYZPNLHyzGUrCZo47JziTnMiopNhRiLsv2TusQfFBC2VhOSLS2lUSOdRIKIUIARJpCMnJn4HmhyeVM15syBQfLcWxTxcRpy+N+EgsE8jUEyWwrsrMYKDwQsCsFUKU8CyQjolYpi4zo7POmW8jFCy+KAjCHZCc-hxHhAqCbWRRLJIkvoDs0FBzqVQrpSQ25el7ksseWy1FMyXFcvjrNOg-F-g9mFCOJOQKOjJVQEITMBzGqYH3JgYQudJ7c0ZbPee9AiD4EtWABSNq7Vl29sQUZqrQ48M5CkKpk4gRpEqIEca3CxHRHevxPsQpvjJFNfQc1lr4TeV9fVB1edp5ROLDMeYcTKyzE9cdb1eE832uXsSoNV0Q09jDVKMSwFgQxsgvxUc312SVHnC9CcsQM10AAEr3mCrAdovQXVvzdXQYKmhp1UMhE2huCABTAjCFUfkHbZyAXGrHSUSbxyCuvkBAoY7J0rrgLOp20SSxlvLPE5dq7zoIs6kim4260i7rqQekcR6hz-P1oKkcSRE0RBvoPTAqAIBwG8HfEeaYVXNpuAAWkHGKTD-UnIEcI0RwlQ9iUZ1hFavojDRARRGGMdDm74jxyKIBCIPxr6RHCIfMdGYWmqMdBouFdIGMhxuATZ5BNgQ9kTd4t4YoCgJy4-xJyAJpQfQBGOnZBylKOxUpeY55FgoHOhiJ5iLikJhDDFEJyXEuKxqHEECOIF8gJAJS9CIY7vJ+QCvKmF7BwoSGirFeKfRkqpUdRlLKzTdR5QKqZ4yPEXqSinFx8cXFEhjQc5Nbsg1o7ch+KEMdYN4RbXwlDbS3V66ibyFJvlgIKjU3DZl+Tz06Dsj+Ebf4g701yIleRx+pdn7Ou4PFpWPZJrRFmgBYUKy5w2RPROSctl-lwSJiRlDCirZBMrCEjgYTBMugIqN0OlkxHPXKGmiB8FIIQb1SbPd0cATR3Wyg8j0q9mUvwhCk508zmoH6ZcoZR3ck-oCC42IYQqnje+BI-w8cgLFB8QTZ6URjajt6x5bZZKZUdK6TS6FsLDstGOzcam-JJSHxeqGWyPie0mzO+kb4M5cV0wx-fK2Wbjo5qonWgtTrHbE5B8G0nkQIepCThOCNoYe1iWKNwoE30Kg1H4i9sjjNb2rvhILxFwvEBwTsVrWyqR8jXdA4m4oLjZoAi4y41TnnwVdJ+70-7Fz2BXJuZCEnARxFFHAislyU5uVikiJ9eCcF4jCulLZAe4rMcwm8oqz3QuMOIGjdBb4tkza2RmThxABM2sKkmz2CIZtpwx9I319XYAACOBA4B85fn0SdyBNzmK9wgU7xsLu25nKbsUnYT78lxUjvxqvK8P0XnbXUhaErlXQMsLE1UCDCHb5387FQe-PTh3xb6-47J-UppUCDY6ACiJb2C8d1FR4x7fxNckkwBdkw+5P+nyHq5N1TY4B9jqf8-zotdJ464p4d5cT6xd4b77x955ACj-g-BP7fTjgRBj5x4dBn7TAX6khX44jt7mYRwRACjWapx2Y2TjgwQpA8iTYxCUy-7oHbYqJqIELA5AGbrUy8rTgwKFD-AITb5lLRxhATQJAKgOLvQ9ax7s4whoHbSc5Wq5qKB+rt764saxxG6lBRx04hAnwTTciRq-CRA0HbQa73oAEjbJ6bpp6cgZ52QVDVD8g3YSicGXY8hOSTb1D1BAA */
//   id: "joinGroupMachine",
//   context: ({ input }) => ({
//     account: input.account,
//     groupInviteId: input.groupInviteId,
//     joinStatus: "PENDING" as const,
//   }),

//   initial: "Loading Group Invite Metadata",

//   states: {
//     "Loading Group Invite Metadata": {
//       description: `
// Fetches the group invite metadata from the server.
// This metadata contains information that a potential
// joiner will see when they land on the deep link page.
// `,
//       tags: ["loading"],
//       invoke: {
//         id: "fetchGroupInviteActorLogic",
//         src: "fetchGroupInviteActorLogic",
//         input: ({ context }) => {
//           return {
//             groupInviteId: context.groupInviteId,
//             account: context.account,
//           };
//         },
//         onDone: {
//           target: "Loading Initially Joined Groups",

//           actions: [
//             {
//               type: "saveGroupInviteMetadata",
//               params: ({ event }) => ({
//                 groupInviteMetadata: event.output,
//               }),
//             },
//           ],
//         },
//         onError: {
//           target: "Error Loading Group Invite",
//           actions: [
//             {
//               type: "saveError",
//               params: ({ event }) => ({
//                 error: {
//                   type: "fetchGroupInviteError",
//                   payload: JSON.stringify(event.error),
//                 },
//               }),
//             },
//           ],
//         },
//       },
//     },

//     "Loading Initially Joined Groups": {
//       invoke: {
//         id: "loadingInitiallyJoinedGroups",
//         src: "fetchGroupsByAccountActorLogic",
//         input: ({ context }) => ({
//           account: context.account,
//         }),
//         onDone: [
//           {
//             guard: {
//               type: "hasGroupIdInMetadata",
//               params: ({ context }) => ({
//                 groupInviteMetadata: context.groupInviteMetadata!,
//               }),
//             },
//             target: "Check User Group Join Status Before User Action",
//             actions: [
//               {
//                 type: "saveConversationsBeforeJoinAttempt",
//                 params: ({ event }) => {
//                   const conversation = event.output;
//                   return {
//                     groupsBeforeJoinRequestAccepted: conversation,
//                   };
//                 },
//               },
//               {
//                 type: "saveNewGroup",
//                 params: ({ context }) => {
//                   const groupId = context.groupInviteMetadata!.groupId!;
//                   const conversation = context.groupsBeforeJoinRequestAccepted!;
//                   const groupIfUserHasAlreadyJoined:
//                     | ConversationWithCodecsType
//                     | undefined = conversation.byId[groupId];
//                   return {
//                     invitedGroup: groupIfUserHasAlreadyJoined,
//                   };
//                 },
//               },
//             ],
//           },
//           {
//             target: "Waiting For User Action",
//             actions: [
//               {
//                 type: "saveConversationsBeforeJoinAttempt",
//                 params: ({ event }) => {
//                   const conversation = event.output;
//                   return {
//                     groupsBeforeJoinRequestAccepted: conversation,
//                   };
//                 },
//               },
//             ],
//           },
//         ],
//         onError: {
//           target: "Error Loading Groups",
//           actions: [
//             {
//               type: "saveError",
//               params: ({ event }) => ({
//                 error: {
//                   type: "fetchGroupsByAccountError",
//                   payload: JSON.stringify(event.error),
//                 },
//               }),
//             },
//           ],
//         },
//       },
//     },

//     "Check User Group Join Status Before User Action": {
//       always: [
//         {
//           target:
//             "User Was Already a Member of Group Prior to Clicking Join Link",
//           guard: {
//             type: "isUserInGroup",
//             params: ({ context }) => ({
//               invitedConversationId: context.groupInviteMetadata?.groupId,
//               conversation: context.groupsBeforeJoinRequestAccepted,
//             }),
//           },
//         },
//         {
//           target: "Waiting For User Action",
//           guard: {
//             type: "hasUserNotBeenBlocked",
//             params: ({ context }) => {
//               return {
//                 invitedGroup: context.invitedGroup,
//               };
//             },
//           },
//         },
//         {
//           target: "User Has Been Blocked From Group",
//         },
//       ],
//     },

//     "User Was Already a Member of Group Prior to Clicking Join Link": {
//       entry: {
//         type: "saveGroupJoinStatus",
//         params: {
//           joinStatus: "ACCEPTED",
//         },
//       },
//       description: `
// The user was already a member of the group they clicked the
// link to join. In this case, we just want to allow them to
// navigate to the group conversation and provide them
// messaging to give them some context.
//       `,
//       on: {
//         "user.didTapOpenConversation": {
//           actions: {
//             type: "navigateToGroupScreen",
//             params: ({ context }) => {
//               return {
//                 topic: context.invitedGroup!.topic,
//               };
//             },
//           },
//         },
//       },
//     },

//     "Waiting For User Action": {
//       description: `
// In this state, the UI will display a button to the user
// to allow them to begin the group join process.

// Some potential improvements to this flow would be to have a state
// prior where we check the status of the group join request, but
// that isn't how things are done in the current version of the
// screen so I'm going to follow what's currently there.
//     `,
//       on: {
//         "user.didTapJoinGroup": {
//           target: "Attempting to Join Group",
//         },

//         "user.didTapOpenConversation": {
//           description: `
// Upon further investigation, I'm not sure it is appropriate to hanle this event here
// before we've determined the user was in the group...

// TODO: investigate this further
// `,
//           actions: [
//             {
//               type: "navigateToGroupScreen",
//               params: ({ context }) => ({
//                 topic: context.invitedGroup?.topic!,
//               }),
//             },
//           ],
//         },
//       },
//     },

//     "Attempting to Join Group": {
//       description: `
// Attempts to join the group.

// Due to the encrypted nature of our protocol, we send a request to the creator
// of the group invite via Push Notifications that, when received, will
// automatically accept the join request.

// However, if there is any latency, or if the user that created
// the invite is offline or has uninstalled the application,
// then the group invite will never be accepted.

// This is a known limitation of our current implementation,
// and we are exploring ideas such as allowing more admins
// to accept the invite.
//           `,
//       tags: ["polling"],
//       invoke: {
//         id: "attemptToJoinGroupActorLogic",
//         src: "attemptToJoinGroupActorLogic",
//         input: ({ context }) => {
//           return {
//             groupInviteId: context.groupInviteId,
//             account: context.account,
//           };
//         },
//         onDone: [
//           {
//             guard: {
//               type: "isGroupJoinRequestType",
//               params: ({ event }) => ({
//                 groupJoinRequestEventType: event.output.type,
//                 expectedType: "group-join-request.accepted",
//               }),
//             },
//             target: "Determining Newly Joined Group",
//           },
//           {
//             guard: {
//               type: "isGroupJoinRequestType",
//               params: ({ event }) => ({
//                 groupJoinRequestEventType: event.output.type,
//                 expectedType: "group-join-request.already-joined",
//               }),
//             },
//             target: "User Joined Group",
//           },
//           {
//             guard: {
//               type: "isGroupJoinRequestType",
//               params: ({ event }) => ({
//                 groupJoinRequestEventType: event.output.type,
//                 expectedType: "group-join-request.rejected",
//               }),
//             },
//             target: "Request to Join Group Rejected",
//           },
//           {
//             guard: {
//               type: "isGroupJoinRequestType",
//               params: ({ event }) => ({
//                 groupJoinRequestEventType: event.output.type,
//                 expectedType: "group-join-request.error",
//               }),
//             },
//             target: "Error Joining Group",
//           },
//           {
//             guard: {
//               type: "isGroupJoinRequestType",
//               params: ({ event }) => ({
//                 groupJoinRequestEventType: event.output.type,
//                 expectedType: "group-join-request.timed-out",
//               }),
//             },
//             target: "Attempting to Join Group Timed Out",
//           },
//         ],
//       },
//     },

//     "Determining Newly Joined Group": {
//       description: `
// Immediately upon entering this state, we fetch the conversation
// query to determine our conversation after receiving the accepted
// status. Our logic then splits based on whether we have a
// group ID in our group invite metadata:
// 1. If we have a group ID, we can use it to look up the new
//    group directly.
// 2. If we don't have a group ID, we need to compare the
//    conversation before joining (stored in our context) with the
//    newly fetched conversation. We perform a diff between the old
//    IDs and the new IDs to identify the new group.
// If the list of IDs are identical, it indicates that the user
// has already joined this group.
// Once we successfully determine the new group that
// was joined, we transition to a state for allowing group
// consent for the new group.
// `,
//       invoke: {
//         id: "fetchGroupsAfterGroupInviteAccepted",
//         src: "fetchGroupsByAccountActorLogic",
//         input: ({ context }) => ({
//           account: context.account,
//         }),
//         onDone: [
//           {
//             guard: {
//               type: "hasGroupIdInMetadata",
//               params: ({ context }) => ({
//                 groupInviteMetadata: context.groupInviteMetadata!,
//               }),
//             },
//             actions: [
//               {
//                 type: "saveNewGroup",
//                 params: ({ context, event }) => ({
//                   invitedGroup:
//                     event.output.byId[context.groupInviteMetadata!.groupId!],
//                 }),
//               },
//             ],
//             target: "Checking If User Has Been Blocked From Group",
//           },
//           {
//             target: "Checking If User Has Already Joined Group",
//             actions: [
//               {
//                 type: "saveNewGroup",
//                 params: ({ context, event }) => {
//                   const oldGroupIds = new Set(
//                     context.groupsBeforeJoinRequestAccepted!.ids
//                   );
//                   const newGroupId = event.output.ids.find(
//                     (id) => !oldGroupIds.has(id)
//                   );
//                   return {
//                     invitedGroup: newGroupId
//                       ? event.output.byId[newGroupId]
//                       : undefined,
//                   };
//                 },
//               },
//             ],
//             description: `
// This branch handles the case where we don't have a groupId in our metadata.
// We need to determine if a new group was joined by comparing the conversation before and after the join attempt.
// This method is less certain than when we have a groupId, as there's a possibility
// that no new group was actually joined (e.g., if the user was already a member).
// If we don't find a new group (i.e., old conversation === new conversation),
// we assume the user has already joined the group indicated by the invite link.
// This approach allows us to handle cases where the groupId isn't available in the metadata,
// providing a fallback method to determine the join status.
//             `,
//           },
//         ],
//         onError: {
//           target: "Error Determining New Group",
//           actions: {
//             type: "saveError",
//             params: ({ event }) => ({
//               error: {
//                 type: "fetchGroupsByAccountError",
//                 payload: JSON.stringify(event.error),
//               },
//             }),
//           },
//         },
//       },
//     },

//     "Checking If User Has Been Blocked From Group": {
//       always: [
//         {
//           guard: {
//             type: "hasUserNotBeenBlocked",
//             params: ({ context }) => ({
//               invitedGroup: context.invitedGroup,
//             }),
//           },
//           target: "Providing User Consent to Join Group",
//         },
//         {
//           target: "User Has Been Blocked From Group",
//         },
//       ],
//     },

//     "Checking If User Has Already Joined Group": {
//       always: [
//         {
//           guard: {
//             type: "userHasAlreadyJoinedGroup",
//             params: ({ context }) => ({
//               invitedGroup: context.invitedGroup,
//             }),
//           },
//           target: "User Joined Group",
//         },
//         {
//           guard: {
//             type: "hasUserNotBeenBlocked",
//             params: ({ context }) => ({
//               invitedGroup: context.invitedGroup,
//             }),
//           },
//           target: "Providing User Consent to Join Group",
//         },
//         {
//           target: "User Has Been Blocked From Group",
//         },
//       ],
//     },

//     "Providing User Consent to Join Group": {
//       invoke: {
//         id: "provideUserConsentToJoinGroup",
//         src: "provideUserConsentToJoinGroup",
//         input: ({ context }) => ({
//           account: context.account,
//           conversation: context.invitedGroup!,
//           options: {
//             includeCreator: false,
//             includeAddedBy: false,
//           },
//         }),
//         onDone: {
//           target: "Refreshing Group",
//         },
//         onError: {
//           target: "Error Providing User Consent",
//           actions: {
//             type: "saveError",
//             params: ({ event }) => ({
//               error: {
//                 type: "provideUserConsentToJoinGroupError",
//                 payload: JSON.stringify(event.error),
//               },
//             }),
//           },
//         },
//       },
//     },

//     "Refreshing Group": {
//       invoke: {
//         id: "refreshGroup",
//         src: "refreshGroup",
//         input: ({ context }) => ({
//           account: context.account,
//           topic: context.invitedGroup!.topic,
//         }),
//         onDone: {
//           target: "User Joined Group",
//         },
//         onError: {
//           target: "Error Refreshing Group",
//           actions: {
//             type: "saveError",
//             params: ({ event }) => ({
//               error: {
//                 type: "refreshGroupError",
//                 payload: JSON.stringify(event.error),
//               },
//             }),
//           },
//         },
//       },
//     },

//     "User Has Been Blocked From Group": {
//       description: `
// The user has been blocked from the group or the group is not active.
//       `,

//       entry: [
//         {
//           type: "saveGroupJoinStatus",
//           params: {
//             joinStatus: "REJECTED",
//           },
//         },
//       ],
//     },

//     "User Joined Group": {
//       entry: [
//         {
//           type: "saveGroupJoinStatus",
//           params: {
//             joinStatus: "ACCEPTED",
//           },
//         },
//         {
//           type: "navigateToGroupScreen",
//           params: ({ context }) => {
//             return {
//               topic: context.invitedGroup!.topic,
//             };
//           },
//         },
//       ],
//     },

//     "Request to Join Group Rejected": {
//       type: "final",
//     },

//     ///////////////////////////////////////////////////////////////////////////
//     // ERROR STATES
//     ///////////////////////////////////////////////////////////////////////////

//     "Attempting to Join Group Timed Out": {
//       description: `
//   The invitor client has not yet automatically accepted the
//   group join request. This is a known limitation of our current
//   implementation, and we are exploring ideas such as allowing
//   more admins to accept the invite.

//   This doesn't mean the user cannot join, it just means that
//   the client that was invited needs to wait for the inviter
//   to accept the request.

//   The next time we are able to contact the inviter, we will
//   automatically accept the request and the newly invited
//   user will be able to join the group.
//   `,
//       type: "final",
//     },

//     "Error Loading Group Invite": {
//       tags: ["error"],
//     },

//     "Error Joining Group": {
//       tags: ["error"],
//       type: "final",
//     },

//     "Error Loading Groups": {
//       tags: ["error"],
//     },

//     "Error Determining New Group": {
//       tags: ["error"],
//     },

//     "Error Providing User Consent": {
//       tags: ["error"],
//     },

//     "Error Refreshing Group": {
//       tags: ["error"],
//     },
//   },
// });

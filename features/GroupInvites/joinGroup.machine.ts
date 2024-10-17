/// Shared Diagram: https://stately.ai/registry/editor/9e6921a4-4b05-4277-96c4-cb4d4e60680a?machineId=dbb1249d-7715-4b1f-8fb7-e476a116272a
/// Figma: TODO
import { GroupJoinRequestStatus } from "@utils/api";
import { GroupInvite } from "@utils/api.types";
import { GroupData, GroupsDataEntity } from "@utils/xmtpRN/client.types";
import { assign, fromPromise, log, setup } from "xstate";

import { AllowGroupProps } from "./GroupInvites.client";
import { JoinGroupResult, JoinGroupResultType } from "./joinGroup.types";
import { Controlled } from "../../dependencies/Environment/Environment";

type JoinGroupMachineEvents =
  | { type: "user.didTapJoinGroup" }
  | { type: "user.didTapOpenConversation" };

type JoinGroupMachineErrorType =
  | "fetchGroupInviteError"
  | "fetchGroupsByAccountError"
  | "attemptToJoinGroupError"
  | "provideUserConsentToJoinGroupError"
  | "refreshGroupError";

export type JoinGroupMachineContext = {
  // Context
  account: string;
  groupInviteMetadata?: GroupInvite;
  groupsBeforeJoinRequestAccepted?: GroupsDataEntity;
  newGroup?: GroupData;
  joinStatus: GroupJoinRequestStatus;
  // From Input
  groupInviteId: string;

  error?: { type: JoinGroupMachineErrorType; payload: string };
};

type JoinGroupMachineInput = {
  groupInviteId: string;
  account: string;
};

type JoinGroupMachineTags = "loading" | "polling" | "error";

export const joinGroupMachineLogic = setup({
  types: {
    events: {} as JoinGroupMachineEvents,
    context: {} as JoinGroupMachineContext,
    input: {} as JoinGroupMachineInput,
    tags: {} as JoinGroupMachineTags,
  },

  actors: {
    fetchGroupInviteActorLogic: fromPromise<
      GroupInvite,
      { account: string; groupInviteId: string }
    >(async ({ input }) => {
      console.log(`[fetchGroupInviteActorLogic] Starting with input:`, input);
      const { groupInviteId } = input;
      const groupInvite = await Controlled.joinGroupClient.fetchGroupInvite(
        groupInviteId
      );
      console.log(
        `[fetchGroupInviteActorLogic] Fetched group invite:`,
        groupInvite
      );
      return groupInvite;
    }),

    fetchGroupsByAccountActorLogic: fromPromise<
      GroupsDataEntity,
      { account: string }
    >(async ({ input }) => {
      console.log(
        `[fetchGroupsByAccountActorLogic] Starting with input:`,
        input
      );
      const { account } = input;
      const groups = await Controlled.joinGroupClient.fetchGroupsByAccount(
        account
      );
      console.log(`[fetchGroupsByAccountActorLogic] Fetched groups:`, groups);
      return groups;
    }),

    attemptToJoinGroupActorLogic: fromPromise<
      JoinGroupResult,
      { account: string; groupInviteId: string }
    >(async ({ input }) => {
      console.log(`[attemptToJoinGroupActorLogic] Starting with input:`, input);
      const { account, groupInviteId } = input;
      const result = await Controlled.joinGroupClient.attemptToJoinGroup(
        account,
        groupInviteId
      );
      console.log(
        `[attemptToJoinGroupActorLogic] Join attempt result:`,
        result
      );
      return result;
    }),

    provideUserConsentToJoinGroup: fromPromise<
      void,
      { account: string; group: GroupData }
    >(async ({ input }) => {
      console.log(
        `[provideUserConsentToJoinGroup] Starting with input:`,
        input
      );
      const { account, group } = input;
      const allowGroupProps: AllowGroupProps = {
        account,
        options: {
          includeCreator: false,
          includeAddedBy: false,
        },
        group,
      };

      await Controlled.joinGroupClient.allowGroup(allowGroupProps);
      console.log(`[provideUserConsentToJoinGroup] User consent provided`);
    }),

    refreshGroup: fromPromise<void, { account: string; topic: string }>(
      async ({ input }) => {
        console.log(`[refreshGroup] Starting with input:`, input);
        const { account, topic } = input;
        await Controlled.joinGroupClient.refreshGroup(account, topic);
        console.log(`[refreshGroup] Group refreshed`);
      }
    ),
  },

  actions: {
    saveGroupInviteMetadata: assign({
      groupInviteMetadata: (
        _,
        params: { groupInviteMetadata: GroupInvite }
      ) => {
        console.log(
          `[saveGroupInviteMetadata] Saving metadata:`,
          params.groupInviteMetadata
        );
        return params.groupInviteMetadata;
      },
    }),

    saveError: assign({
      error: (
        _,
        params: { error: { type: JoinGroupMachineErrorType; payload: string } }
      ) => {
        console.log(`[saveError] Saving error:`, params.error);
        return params.error;
      },
    }),

    navigateToGroupScreen: log((_, params: { topic: string }) => {
      const logMessage = `[navigateToGroupScreen] Navigating to group screen with topic: ${params.topic}`;
      console.log(logMessage);
      return logMessage;
    }),

    saveGroupsBeforeJoinAttempt: assign({
      groupsBeforeJoinRequestAccepted: (
        _,
        params: { groupsBeforeJoinRequestAccepted: GroupsDataEntity }
      ) => {
        console.log(
          `[saveGroupsBeforeJoinAttempt] Saving groups:`,
          params.groupsBeforeJoinRequestAccepted
        );
        return params.groupsBeforeJoinRequestAccepted;
      },
    }),

    saveNewGroup: assign({
      newGroup: (_, params: { newGroup?: GroupData }) => {
        console.log(`[saveNewGroup] Saving new group:`, params.newGroup);
        return params.newGroup;
      },
    }),

    saveGroupJoinStatus: assign({
      joinStatus: (_, params: { joinStatus: GroupJoinRequestStatus }) => {
        console.log(
          `[saveGroupJoinStatus] Saving join status:`,
          params.joinStatus
        );
        return params.joinStatus;
      },
    }),
  },

  guards: {
    isGroupJoinRequestAccepted: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      const result =
        params.groupJoinRequestEventType === "group-join-request.accepted";
      console.log(`[isGroupJoinRequestAccepted] Result:`, result);
      return result;
    },

    isGroupJoinRequestAlreadyJoined: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      const result =
        params.groupJoinRequestEventType ===
        "group-join-request.already-joined";
      console.log(`[isGroupJoinRequestAlreadyJoined] Result:`, result);
      return result;
    },

    isGroupJoinRequestRejected: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      const result =
        params.groupJoinRequestEventType === "group-join-request.rejected";
      console.log(`[isGroupJoinRequestRejected] Result:`, result);
      return result;
    },

    isGroupJoinRequestError: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      const result =
        params.groupJoinRequestEventType === "group-join-request.error";
      console.log(`[isGroupJoinRequestError] Result:`, result);
      return result;
    },

    isGroupJoinRequestTimedOut: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      const result =
        params.groupJoinRequestEventType === "group-join-request.timed-out";
      console.log(`[isGroupJoinRequestTimedOut] Result:`, result);
      return result;
    },

    hasGroupIdInMetadata: (_, params: { groupInviteMetadata: GroupInvite }) => {
      const result = params.groupInviteMetadata.groupId !== undefined;
      console.log(`[hasGroupIdInMetadata] Result:`, result);
      return result;
    },

    userHasAlreadyJoinedGroup: (
      _,
      params: { newGroup: GroupData | undefined }
    ) => {
      const result = params.newGroup === undefined;
      console.log(`[userHasAlreadyJoinedGroup] Result:`, result);
      return result;
    },

    hasUserNotBeenBlocked: (_, params: { newGroup: GroupData | undefined }) => {
      const result = params.newGroup?.isGroupActive === true;
      console.log(`[hasUserNotBeenBlocked] Result:`, result);
      return result;
    },

    isUserInGroup: (
      _,
      params: {
        invitedGroupId: string | undefined;
        groups: GroupsDataEntity | undefined;
      }
    ) => {
      const { invitedGroupId, groups } = params;
      if (invitedGroupId === undefined || groups === undefined) {
        return false;
      }

      return groups.ids.includes(invitedGroupId);
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCsD2BLAdgcQE6oFcAHAWQEMBjACyzADoAZVMiLKAAj0KPYElMAbugAuYdiTDCWZKQGIIqTPSwDUAa3oAzSdS7F+Q0QEEKw1LiZR0FANoAGALqJQRVLBHpFzkAA9EANgAWAHY6ACYAVgAOCIBOWOD-AGYk+OCAGhAAT0QAWkCk0MCCwLCCwojUhIBfasy0LD1SSholRmZWTA4mvkERMQkpCBkyWTBcfFw6IgAbGU1zAFs6bWFdfH0+41NzS2t7JyQQV3dhT0xvPwQARiiwun9YiOuk67jXsODrsMychFzotc6FE7ElQXYEsEImEolFavUMDgNs1qLQ6AB1MgeLrsABi5nYAFVYON2CYzopZAQSVNWBAACpkIgAKURTQO3hOHi8RyuwTC-jodii-kegWigVipSSv0QEWCsTowUCUVi10eURCwrC8JADSR3HIqLaABFJONFlg2JxkbB2KzaBB2AAhMALXBiIzCUSLIjCeSKZSCdRaHRUJqwV3usAOzBsDlHLkUi68xDBOz3YLBKLXN6BYWxKLBGXZRDfUJ2fzfCKVIvXKU6up6tnIo2tehm0S4S1xnER+2IyAut3mT3esC+-3jSbTObCd3LVbrbiRkce2PxxyctzclOgK7XbNC+sQsKpUWHqKy-7PYFVw-KoIqpKffy6-VNNtor0+v3WswDlgNrcAGbQqCGdAyL+wj0qgsZNOSuyoFYthbomO7Jpccr8sCYTXHYUIqjCcSxNeuaHnQLxnskCSxHYdiBG+TYfq2LTfuOk7-qggGYMBxCgUGqgaJBHF+rB8HIohFjIfs1yHC4GHnFhNyVHYwKqkkESiiK4oCmR+FJEKYQEcknzyv4-Lvi2hpsW0P4Tn+OIAbGfFEAJdDgcJUEOTBcHWcQUl7LYYTyccik8vuZaVIEQr+NC2YioelQRGRxkxTCnxfK8kp3MEVmNKxxr0PZnFOdxLlNO5nn0N5k7if5RCBTJthJKFSZKamKninQmkMZpTz+LCbypQklHqhlmrZkE+UGsQX52aJZxlTxrlVcGXmLfVBXcE1KE2IEbXhXuvhRa8QqxAKdFJERsSPGRVQPFEmn4YE6qwgqM2frZHbmt2Vo4gAcmAADuMxZDxQ6VQoYHraGaxUISRDDKIEARkYmhdhuXQJgppwdZFNxVkKsIxGqzxJDmJZ-PWeHAgR6YvKCjHCp9hXtnQnYWv9HBA6D4OxpDyJrUJcPUIjyOQGjGPjFjUA2HJ254xFJ0IDmMVJBZKS3TEYJnmR2aKnY5kWVpGYwqzNlFRzv09tavNgxDTqVdO5izvMSwrGG4syJLtro5jiKbodSvHVcuRgnQjHFq8GYXQqpRkcUanJJWUIRPRry3Bbc3fXQADCVBgBQajWrwmhEjS7AABJkHarpgLxzozKgxdDri+CLKtONhSHykwqELy3K9bxSqKoLXme+GxcWIp0RCQRJNnKLswXRclziZcV6SNd12ADcus3rdOu3qCd5V8vB7uymDYqqpPJEpR0f4kQTzH08U489G3QUS-zfQq-F1LuXYk29a5khmB6Fg-NBxOyFt3dqysrhhGQYZa4kpDyRH8HYW4ZFYQxXzLpWElQBS5l-rnAB68OCbxAbgauYCjAQLAFAx2XcFboV7p1ZB2DKIKiNsZE2aCJ6RFCPEKUt0FQUwIovZiDU-750LoAjewDK473AZAiA0DHRdxCorK+nVbjymBPWeU8oR5SgyKWBAyDDGiMlBZWIkjixkKtgABXwEIToHAaHsDzooEkmBhDsGcoiVa0NBIQSIO49AEAwA0N8ZgfxvkJLcHgUdPut4YjREiGUL44oLITywVESORY6zXVMUxBE20c6uKiZ4retD4mJKCeVEJzsJiu1mO7bs0xamxJpI0huSSGqpI4QTXIeEilSmiNEZ+9F6IJ0sWUUaRsNbphfE9NBFTmxVOXmiAASm6D0sBWjdCFmEjysM6Aek0Ec8MyIRl6IJp8WE4RCwCk1NCbBUIJ6aiKWEOOqQvj0SrFslilt2YHJuXAE5q0XZTE6fOD21zbnsjQrjR5KtcjKh6skV6hZlRZnwtcH5NYhTKjVNpWEjYmyYFQDE+ARwwXVPbLozCnVchYPuJpTU10qwMQYoEa8WL1RkqCLPf5ooXzOPZkwFg1oegGH6OISQ0gpCsvxiraIipIiky4ZWRiQrn5FPMiqUUUIghOJkTsuRmJsQcHxLQ7x5INUINDnKUaWlfnmqzF868GtBTrO+KCEimlAjSrRJzP6vZTkrhYVGUcZJFrqsQQECEDxkHJDiAxeUiQhWD3UszSUL41SlDyla2auyFrQS4itJoya3UIC1eEaZRrZlgivJYrMMV1SVhzM-SUTww3lq+lbSNttAYgwdgLWB3B63KSbTqrSMI20QlStikUnwUiPGQe88NbQKFAPqXQ3e+8m4tw0MfDurk52cKntYrBuYGIvFVEIyIkdIhG3TlKEE4o93-wUZQvgyjQF2gYeozRSgZ3EBvQTNBiRgQpFuFNfC-yqZlipZRCI4oKavilGgv9dA3GoA8dabxAyAnNNrciGDKtjJFPVMUQ84oEh4IsX8MoMQ6CqWuvRNKRYIgEchbc+V1H2EYqQdCXCmpH5PpVCKElhkjZvDuPECUiQCPeNUfXRuh8L14ivXWsTbLYNlDUikYybxXj8gMkIl8xTTJJRngJ4dbM0TeOndeozGqkHFkNtmp4ap+QmVwcUSO2aNZ0aeDEQTYAACOBA4CBOCUBHoBzkBFxRjRpB9ZBQ1iwxZnMPxLFBqBMQrMaoLqMbLZUitciSqOQ4Ml3iPR6ToEWEOAA8gQYQWXEB4TTU9OKsJrrxCLGhm4hR7i3R3fq6bzwCMAFF2m0NlXUhVWwwC9f+PWGKVK4p0WhKTO4QrTY9QFOKQEpr6yLeWzxETs6vMpqsaZyOVYs1iIFON74UocXP3lLdHLsIbuTHYKt+7xAGXouM5ih8lEll4TeFhoFgrLHhzM5qTlYJbjjSlMDgkY7ubsF5p5qH3m8gUwiEqLBQQ4pf1uFKROoWqwwnVMWtB+GXPgrREtkHRGSM4jI34wZW2ARYZ6hKXlL0BUT2eMasEmcvk32q9s2rucecEiE9C8HRARdRxxZ8Q83xKarsWaqdKXxEgqiuq8aRtQgA */
  id: "joinGroupMachine",
  context: ({ input }) => {
    // const account = Controlled.accountsClient.getCurrentAccountAddress();
    const account = input.account;
    console.log(`[joinGroupMachine] Initial context:`, { account, input });

    const { groupInviteId } = input;

    return {
      account,
      groupInviteId,
      joinStatus: "PENDING",
    };
  },

  initial: "Loading Group Invite Metadata",

  states: {
    // entry: log(({ context }) => `[joinGroupMachine] Entry: groupInviteId=${context.groupInviteId}`),
    "Loading Group Invite Metadata": {
      description: `
Fetches the group invite metadata from the server.
This metadata contains information that a potential
joiner will see when they land on the deep link page.
`,
      tags: ["loading"],
      entry: log(
        ({ context }) => `[Loading Group Invite Metadata] Entered state`
      ),
      invoke: {
        id: "fetchGroupInviteActorLogic",
        src: "fetchGroupInviteActorLogic",
        input: ({ context }) => {
          console.log(
            `[Loading Group Invite Metadata] Invoking fetchGroupInviteActorLogic with:`,
            context
          );
          return {
            groupInviteId: context.groupInviteId,
            account: context.account,
          };
        },
        onDone: {
          target: "Loading Initially Joined Groups",

          actions: [
            {
              type: "saveGroupInviteMetadata",
              params: ({ event }) => ({
                groupInviteMetadata: event.output,
              }),
            },
            log(
              ({ event }) =>
                `[Loading Group Invite Metadata] Completed: ${JSON.stringify(
                  event.output
                )}`
            ),
          ],
        },

        onError: {
          target: "Error Loading Group Invite",
          actions: [
            {
              type: "saveError",
              params: ({ event }) => ({
                error: {
                  type: "fetchGroupInviteError",
                  payload: JSON.stringify(event.error),
                },
              }),
            },
            log(
              ({ event }) =>
                `[Loading Group Invite Metadata] Error: ${JSON.stringify(
                  event.error
                )}`
            ),
          ],
        },
      },
      exit: log(() => `[Loading Group Invite Metadata] Exiting state`),
    },

    "Loading Initially Joined Groups": {
      entry: log(() => `[Loading Initially Joined Groups] Entered state`),
      invoke: {
        id: "loadingInitiallyJoinedGroups",
        src: "fetchGroupsByAccountActorLogic",
        input: ({ context }) => ({
          account: context.account,
        }),
        onDone: {
          target:
            "Checking If User Has Already Joined Group Before User Action",
          actions: [
            {
              type: "saveGroupsBeforeJoinAttempt",
              params: ({ context, event }) => {
                // const groupId = context.groupInviteMetadata?.groupId;
                const groups = event.output;
                return {
                  groupsBeforeJoinRequestAccepted: groups,
                };
              },
            },
            {
              type: "saveNewGroup",
              params: ({ context }) => {
                const groupId = context.groupInviteMetadata!.groupId!;
                const groups = context.groupsBeforeJoinRequestAccepted!;
                const newGroup = groups.byId[groupId];
                console.log(
                  `[Loading Initially Joined Groups] New group:`,
                  newGroup
                );
                return {
                  newGroup,
                };
              },
            },
            log(
              ({ event }) =>
                `[Loading Initially Joined Groups] Completed: ${JSON.stringify(
                  event.output
                )}`
            ),
          ],
        },
        onError: {
          target: "Error Loading Groups",
          actions: [
            {
              type: "saveError",
              params: ({ event }) => ({
                error: {
                  type: "fetchGroupsByAccountError",
                  payload: JSON.stringify(event.error),
                },
              }),
            },
            log(
              ({ event }) =>
                `[Determining If User Already Joined Group] Error: ${JSON.stringify(
                  event.error
                )}`
            ),
          ],
        },
      },
    },

    "Checking If User Has Already Joined Group Before User Action": {
      entry: [
        log(
          () =>
            `[Checking If User Has Already Joined Group Before User Action] Entered state`
        ),
      ],
      always: [
        {
          guard: {
            type: "isUserInGroup",
            params: ({ context }) => ({
              invitedGroupId: context.groupInviteMetadata?.groupId,
              groups: context.groupsBeforeJoinRequestAccepted,
            }),
          },
          target: "User Was a Member Prior of Group Link Already",
        },
        {
          target: "Waiting For User Action",
        },
      ],
    },

    "User Was a Member Prior of Group Link Already": {
      type: "final",
      entry: {
        type: "navigateToGroupScreen",
        params: ({ context }) => {
          return {
            topic: context.newGroup!.topic,
          };
        },
      },
    },

    "Waiting For User Action": {
      description: `
In this state, the UI will display a button to the user
to allow them to begin the group join process.

Some potential improvements to this flow would be to have a state
prior where we check the status of the group join request, but
that isn't how things are done in the current version of the
screen so I'm going to follow what's currently there.
    `,
      entry: log(() => `[Waiting For User Action] Entered state`),
      on: {
        "user.didTapJoinGroup": {
          target: "Attempting to Join Group",
          actions: log(
            () => `[Waiting For User Action] User tapped join group`
          ),
        },
        "user.didTapOpenConversation": {
          actions: [
            log(
              () => `[Waiting For User Action] User tapped open conversation`
            ),
            {
              type: "navigateToGroupScreen",
              params: ({ context }) => ({
                topic: context.newGroup?.topic!,
              }),
            },
          ],
        },
      },
      exit: log(() => `[Waiting For User Action] Exiting state`),
    },

    "Determining Groups Joined Before Attempt": {
      description: `
TODO: perform this fetch only conditionally if the groupId is not 
in the metadata

Fetches the groups that the user has joined before attempting
to join the group. This is used to determine the groups that the
user has joined before, so that we can compare the groups after
the join attempt to see if there are any new groups that the
user has joined.
    `,
      entry: log(
        () => `[Determining Groups Joined Before Attempt] Entered state`
      ),
      invoke: {
        id: "fetchGroupsBeforeJoining",
        src: "fetchGroupsByAccountActorLogic",
        input: ({ context }) => {
          console.log(
            `[Determining Groups Joined Before Attempt] Invoking fetchGroupsByAccountActorLogic with:`,
            context
          );
          return {
            account: context.account,
          };
        },
        onDone: {
          target: "Waiting For User Action",

          actions: [
            {
              type: "saveGroupsBeforeJoinAttempt",
              params: ({ event }) => ({
                groupsBeforeJoinRequestAccepted: event.output,
              }),
            },
            log(
              ({ event }) =>
                `[Determining Groups Joined Before Attempt] Completed: ${JSON.stringify(
                  event.output
                )}`
            ),
          ],

          reenter: true,
        },
        onError: {
          target: "Error Loading Groups",
          actions: [
            {
              type: "saveError",
              params: ({ event }) => ({
                error: {
                  type: "fetchGroupsByAccountError",
                  payload: JSON.stringify(event.error),
                },
              }),
            },
            log(
              ({ event }) =>
                `[Determining Groups Joined Before Attempt] Error: ${JSON.stringify(
                  event.error
                )}`
            ),
          ],
        },
      },
      exit: log(
        () => `[Determining Groups Joined Before Attempt] Exiting state`
      ),
    },

    "Attempting to Join Group": {
      description: `
Attempts to join the group.

Due to the encrypted nature of our protocol, we send a request to the creator
of the group invite via Push Notifications that, when received, will
automatically accept the join request.

However, if there is any latency, or if the user that created
the invite is offline or has uninstalled the application,
then the group invite will never be accepted.

This is a known limitation of our current implementation,
and we are exploring ideas such as allowing more admins
to accept the invite.
          `,
      tags: ["polling"],
      entry: log(() => `[Attempting to Join Group] Entered state`),
      invoke: {
        id: "attemptToJoinGroupActorLogic",
        src: "attemptToJoinGroupActorLogic",
        input: ({ context }) => {
          console.log(
            `[Attempting to Join Group] Invoking attemptToJoinGroupActorLogic with:`,
            context
          );
          return {
            groupInviteId: context.groupInviteId,
            account: context.account,
          };
        },
        onDone: [
          {
            guard: {
              type: "isGroupJoinRequestAccepted",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
              }),
            },
            target: "Determining Newly Joined Group",
            actions: log(
              () => `[Attempting to Join Group] Join request accepted`
            ),
          },
          {
            guard: {
              type: "isGroupJoinRequestAlreadyJoined",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
              }),
            },
            target: "User Joined Group",
            actions: log(
              () => `[Attempting to Join Group] User already joined`
            ),
          },
          {
            guard: {
              type: "isGroupJoinRequestRejected",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
              }),
            },
            target: "Request to Join Group Rejected",
            actions: log(
              () => `[Attempting to Join Group] Join request rejected`
            ),
          },
          {
            guard: {
              type: "isGroupJoinRequestError",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
              }),
            },
            target: "Error Joining Group",
            actions: log(
              () => `[Attempting to Join Group] Error joining group`
            ),
          },
          {
            guard: {
              type: "isGroupJoinRequestTimedOut",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
              }),
            },
            target: "Attempting to Join Group Timed Out",
            actions: log(
              () => `[Attempting to Join Group] Join request timed out`
            ),
          },
        ],
      },
      exit: log(() => `[Attempting to Join Group] Exiting state`),
    },

    "Determining Newly Joined Group": {
      description: `
Immediately upon entering this state, we fetch the groups
query to determine our groups after receiving the accepted
status. Our logic then splits based on whether we have a
group ID in our group invite metadata:
1. If we have a group ID, we can use it to look up the new
   group directly.
2. If we don't have a group ID, we need to compare the
   groups before joining (stored in our context) with the
   newly fetched groups. We perform a diff between the old
   IDs and the new IDs to identify the new group.
If the list of IDs are identical, it indicates that the user
has already joined this group.
Once we successfully determine the new group that
was joined, we transition to a state for allowing group
consent for the new group.
`,
      entry: log(() => `[Determining Newly Joined Group] Entered state`),
      invoke: {
        id: "fetchGroupsAfterGroupInviteAccepted",
        src: "fetchGroupsByAccountActorLogic",
        input: ({ context }) => ({
          account: context.account,
        }),
        onDone: [
          {
            guard: {
              type: "hasGroupIdInMetadata",
              params: ({ context }) => ({
                groupInviteMetadata: context.groupInviteMetadata!,
              }),
            },
            actions: [
              {
                type: "saveNewGroup",
                params: ({ context, event }) => ({
                  newGroup:
                    event.output.byId[context.groupInviteMetadata!.groupId!],
                }),
              },
              log(
                ({ context, event }) =>
                  `[Determining Newly Joined Group] Group ID in metadata: ${context.groupInviteMetadata!
                    .groupId!}`
              ),
            ],
            target: "Checking If User Has Been Blocked From Group",
          },
          {
            actions: [
              {
                type: "saveNewGroup",
                params: ({ context, event }) => {
                  const oldGroupIds = new Set(
                    context.groupsBeforeJoinRequestAccepted!.ids
                  );
                  const newGroupId = event.output.ids.find(
                    (id) => !oldGroupIds.has(id)
                  );
                  return {
                    newGroup: newGroupId
                      ? event.output.byId[newGroupId]
                      : undefined,
                  };
                },
              },
              log(
                ({ context, event }) =>
                  `[Determining Newly Joined Group] No group ID in metadata, new group: ${JSON.stringify(
                    context.newGroup
                  )}`
              ),
            ],
            description: `
This branch handles the case where we don't have a groupId in our metadata.
We need to determine if a new group was joined by comparing the groups before and after the join attempt.
This method is less certain than when we have a groupId, as there's a possibility
that no new group was actually joined (e.g., if the user was already a member).
If we don't find a new group (i.e., old groups === new groups),
we assume the user has already joined the group indicated by the invite link.
This approach allows us to handle cases where the groupId isn't available in the metadata,
providing a fallback method to determine the join status.
            `,
            target: "Checking If User Has Already Joined Group",
          },
        ],
        onError: {
          target: "Error Determining New Group",
          actions: {
            type: "saveError",
            params: ({ event }) => ({
              error: {
                type: "fetchGroupsByAccountError",
                payload: JSON.stringify(event.error),
              },
            }),
          },
        },
      },
      exit: log(() => `[Determining Newly Joined Group] Exiting state`),
    },

    "Checking If User Has Been Blocked From Group": {
      entry: log(
        () => `[Checking If User Has Been Blocked From Group] Entered state`
      ),
      always: [
        {
          guard: {
            type: "hasUserNotBeenBlocked",
            params: ({ context }) => ({
              newGroup: context.newGroup,
            }),
          },
          target: "Providing User Consent to Join Group",
          actions: log(
            () =>
              `[Checking If User Has Been Blocked From Group] User not blocked, transitioning to Providing User Consent`
          ),
        },
        {
          target: "User Has Been Blocked From Group",
          actions: log(
            () =>
              `[Checking If User Has Been Blocked From Group] User blocked, transitioning to User Has Been Blocked From Group`
          ),
        },
      ],
      exit: log(
        () => `[Checking If User Has Been Blocked From Group] Exiting state`
      ),
    },

    "Checking If User Has Already Joined Group": {
      entry: log(
        () => `[Checking If User Has Already Joined Group] Entered state`
      ),
      always: [
        {
          guard: {
            type: "userHasAlreadyJoinedGroup",
            params: ({ context }) => ({
              newGroup: context.newGroup,
            }),
          },
          target: "User Joined Group",
          actions: log(
            () =>
              `[Checking If User Has Already Joined Group] User already joined, transitioning to User Joined Group`
          ),
        },
        {
          guard: {
            type: "hasUserNotBeenBlocked",
            params: ({ context }) => ({
              newGroup: context.newGroup,
            }),
          },
          target: "Providing User Consent to Join Group",
          actions: log(
            () =>
              `[Checking If User Has Already Joined Group] User not blocked, transitioning to Providing User Consent`
          ),
        },
        {
          target: "User Has Been Blocked From Group",
          actions: log(
            () =>
              `[Checking If User Has Already Joined Group] User blocked, transitioning to User Has Been Blocked From Group`
          ),
        },
      ],
      exit: log(
        () => `[Checking If User Has Already Joined Group] Exiting state`
      ),
    },

    "Providing User Consent to Join Group": {
      entry: log(() => `[Providing User Consent to Join Group] Entered state`),
      invoke: {
        id: "provideUserConsentToJoinGroup",
        src: "provideUserConsentToJoinGroup",
        input: ({ context }) => ({
          account: context.account,
          group: context.newGroup!,
          options: {
            includeCreator: false,
            includeAddedBy: false,
          },
        }),
        onDone: {
          target: "Refreshing Group",
        },
        onError: {
          target: "Error Providing User Consent",
          actions: {
            type: "saveError",
            params: ({ event }) => ({
              error: {
                type: "provideUserConsentToJoinGroupError",
                payload: JSON.stringify(event.error),
              },
            }),
          },
        },
      },
      exit: log(() => `[Providing User Consent to Join Group] Exiting state`),
    },

    "Refreshing Group": {
      entry: log(() => `[Refreshing Group] Entered state`),
      invoke: {
        id: "refreshGroup",
        src: "refreshGroup",
        input: ({ context }) => ({
          account: context.account,
          topic: context.newGroup!.topic,
        }),
        onDone: {
          target: "User Joined Group",
        },
        onError: {
          target: "Error Refreshing Group",
          actions: {
            type: "saveError",
            params: ({ event }) => ({
              error: {
                type: "refreshGroupError",
                payload: JSON.stringify(event.error),
              },
            }),
          },
        },
      },
      exit: log(() => `[Refreshing Group] Exiting state`),
    },

    "User Has Been Blocked From Group": {
      description: `
The user has been blocked from the group or the group is not active.
      `,
      type: "final",
      entry: [
        log(() => `[User Has Been Blocked From Group] Entered state`),
        {
          type: "saveGroupJoinStatus",
          params: {
            joinStatus: "REJECTED",
          },
        },
        log(
          () =>
            `[User Has Been Blocked From Group] Saved group join status as REJECTED`
        ),
      ],
    },

    "User Joined Group": {
      type: "final",
      entry: [
        log(() => `[User Joined Group] Entered state`),
        {
          type: "saveGroupJoinStatus",
          params: {
            joinStatus: "ACCEPTED",
          },
        },
        log(() => `[User Joined Group] Saved group join status as ACCEPTED`),
        {
          type: "navigateToGroupScreen",
          params: ({ context }) => {
            return {
              topic: context.newGroup!.topic,
            };
          },
        },
        log(
          ({ context }) =>
            `[User Joined Group] Navigating to group screen with topic: ${
              context.newGroup!.topic
            }`
        ),
      ],
    },

    "Request to Join Group Rejected": {
      entry: log(() => `[Request to Join Group Rejected] Entered state`),
      type: "final",
    },

    ///////////////////////////////////////////////////////////////////////////
    // ERROR STATES
    ///////////////////////////////////////////////////////////////////////////

    "Attempting to Join Group Timed Out": {
      entry: log(() => `[Attempting to Join Group Timed Out] Entered state`),
      description: `
  The invitor client has not yet automatically accepted the
  group join request. This is a known limitation of our current
  implementation, and we are exploring ideas such as allowing
  more admins to accept the invite.
  
  This doesn't mean the user cannot join, it just means that
  the client that was invited needs to wait for the inviter
  to accept the request.
  
  The next time we are able to contact the inviter, we will
  automatically accept the request and the newly invited
  user will be able to join the group.
  `,
      type: "final",
    },

    "Error Loading Group Invite": {
      entry: log(() => `[Error Loading Group Invite] Entered state`),
      tags: ["error"],
    },

    "Error Joining Group": {
      entry: log(() => `[Error Joining Group] Entered state`),
      tags: ["error"],
      type: "final",
    },

    "Error Loading Groups": {
      entry: log(() => `[Error Loading Groups] Entered state`),
      tags: ["error"],
    },

    "Error Determining New Group": {
      entry: log(() => `[Error Determining New Group] Entered state`),
      tags: ["error"],
    },

    "Error Providing User Consent": {
      entry: log(() => `[Error Providing User Consent] Entered state`),
      tags: ["error"],
    },

    "Error Refreshing Group": {
      entry: log(() => `[Error Refreshing Group] Entered state`),
      tags: ["error"],
    },
  },
});

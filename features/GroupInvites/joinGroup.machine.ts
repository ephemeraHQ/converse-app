/// Shared Diagram: https://stately.ai/registry/editor/9e6921a4-4b05-4277-96c4-cb4d4e60680a?machineId=dbb1249d-7715-4b1f-8fb7-e476a116272a
/// Figma: TODO
import { GroupJoinRequestStatus } from "@utils/api";
import { GroupInvite } from "@utils/api.types";
import { GroupData, GroupsDataEntity } from "@utils/xmtpRN/client.types";
import { assign, fromPromise, log, setup } from "xstate";

import { AllowGroupProps } from "./JoinGroup.client";
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
  /** User's currently active account */
  account: string;
  /** Group invite metadata, includes info such as group name, group ID, etc */
  groupInviteMetadata?: GroupInvite;
  /** Contains a snapshot of the groups a user was a member of prior to
   * attempting to join this group from the Deeplink */
  groupsBeforeJoinRequestAccepted?: GroupsDataEntity;
  /** The group that the user has been invited to join */
  invitedGroup?: GroupData;
  /** The status of the group join request (accepted, rejected, pending) */
  joinStatus: GroupJoinRequestStatus;

  // From Input
  /** The ID of the group invite - used to fetch the metadata */
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
      const { groupInviteId } = input;
      const groupInvite = await Controlled.joinGroupClient.fetchGroupInvite(
        groupInviteId
      );
      return groupInvite;
    }),

    fetchGroupsByAccountActorLogic: fromPromise<
      GroupsDataEntity,
      { account: string }
    >(async ({ input }) => {
      const { account } = input;
      const groups = await Controlled.joinGroupClient.fetchGroupsByAccount(
        account
      );
      return groups;
    }),

    attemptToJoinGroupActorLogic: fromPromise<
      JoinGroupResult,
      { account: string; groupInviteId: string }
    >(async ({ input }) => {
      const { account, groupInviteId } = input;
      const result = await Controlled.joinGroupClient.attemptToJoinGroup(
        account,
        groupInviteId
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
        return params.groupInviteMetadata;
      },
    }),

    saveError: assign({
      error: (
        _,
        params: { error: { type: JoinGroupMachineErrorType; payload: string } }
      ) => {
        return params.error;
      },
    }),

    navigateToGroupScreen: log((_, params: { topic: string }) => {
      const logMessage = `[navigateToGroupScreen] Navigating to group screen with topic: ${params.topic}`;
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
      invitedGroup: (_, params: { invitedGroup?: GroupData }) => {
        console.log(`[saveNewGroup] Saving new group:`, params.invitedGroup);
        return params.invitedGroup;
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
      params: { invitedGroup: GroupData | undefined }
    ) => {
      const result = params.invitedGroup === undefined;
      console.log(`[userHasAlreadyJoinedGroup] Result:`, result);
      return result;
    },

    hasUserNotBeenBlocked: (
      _,
      params: { invitedGroup: GroupData | undefined }
    ) => {
      const result = params.invitedGroup?.isGroupActive === true;
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCsD2BLAdgcQE6oFcAHAWQEMBjACyzADoAZVMiLKAAj0KPYElMAbugAuYdiTDCWZKQGIIqTPSwDUAa3oAzSdS7F+Q0QEEKw1LiZR0FANoAGALqJQRVLBHpFzkAA9EANgB2AEY6ACY7f38AZkCo4P8ADn8AVgAaEABPRABaaJT-OgBOIujg4LCQ6IAWIrtogF8GjLQsPVJKGiVGZlZMDna+QRExCSkIGTJZMFx8XDoiABsZTXMAWzptYV18fWHjU3NLa3snJBBXd2FPTG8-BGDEsLp-IpTgspTSipCwjOyEDkUolQol6uCioFAikwolEk0WhgcLsOtRaD0WGwhh4yItFpl2AApJGQTgo2DyRTKQTqeiLXpsfg4vGZYm0CDtWCnbyXDxec73IHBOx0RIlRIpaJFMLSp5xf6IYHRF52aofIJ1GWShEgVrI7jkNHdJiY-rY664-FEkkQMncCkzOYLZbCVa4Db001QJkWllspQc8nc8686780CC6KROjC6opQJysJBBIKwEfQIvaphapZgpZkFxnV69qGrr0ADCVDAFDUWN4mnYAFVYDN2AAJMiwdhGRa4MAsAn+0mDABCYDdYmbrZMYcwsmDLjcfNuAtyrxFdiTWeC1TswTeH1TwRSdgzUa+J6i0WiYW1zV1SJLnXRlertbN9abLdw7c73d7-YQIONp2sQ7BjhOX7TqYNzzsEZyLlcNx3Ig1SFEkkSVHCbxvP4qbXuUdCqtEURRHCTxFo+KKluiU4-gA6n+PZ9gO7BkOIYBrAARq2qANoMAAKuCeD+ZjsOWizWO+HD+uwDBYGosgEN+dCsBAAAqZBEAA8kQYCYOWigCDMsAyDcC4XEus4oQgkpEckiRQthF54VkiDXq8RHVCRpHkWElFtNRz7dIxHhmgAYuYUE-jOsHKTMqnoBpWn+u0Fmhshq4IIEYTKgm1RxPU0IpHGgRHmURR0JKaHJFCQSBEU8L3sWQVGvQoXXBFUV0d2MGKEpKlqZpOl6QZRkmWZijpVZmURog5SOeEUQpJK+SJOe+EJBmUIREUx61KVAX6sQNHdAAIpIMxrFgWKcta7LgeO5hiEYwiiGsRDCJS3QqLSmw6FQnIQc9-psNNSHhr4iCBHYIoFf4jzlCUXx2IkqbJIUiQFZu7wNUm-hHU+bV0BdojujdZp3UOtrA323ZvZxn3TLM5jOis6z-dsgPkrTYCg-04PLjZwQJkR+52NKUrxAmqZCqKCMi4EaE5utlQE81VEGsF9Cve9n1YmJsntN91KqBodAyHrwjqagqUojORyoFYtiODyM2Q-c8Yiu8e1qpUNQxNER4SoUe0gteULCnEjQa4FWvE7rjOdRwhtIqBRAm3Qv3m5bSc23b3AOxYTsnPBbsQyuc0PDCiRVY5WbZlCdgFMHWaipEq2RAmUqE61ZZ0InH3J+wqdYOnmfZ-QudD-nmvEEXxy2GECGWRXwuSqE0c1GhML5K8R5FDmRFJCV5Sns3Oa9-H-eD-rZqj5g48KD9NI5wzM+23PRALyXtjRCvGUPbzRKsqVUEo9xKyVljNGbkEARBIsUTczckxSlKMCK+J1tYD3fnfFOqB7qP2Ns-U2f1p6fVnnHeehxi7OxsNUAB7tK5Q2rrCOgDVTwFA+GKWGfxYFhA+JVNCsokFii+NUDBqJ+6kyuhTDgAA5MAAB3K01Mn5Uizq-LQANORGE0GTdoBgRgmAoGAT6kBBbWSyuUUWuF-CwlSCgrM+EozKnzDUfah94wSNOvQaR5NMBYgUco4CD0iHqMnpzHY9pdH6JRIYg4JizEQBsGXEMjDhYi1rrY+xMIYhOL4dKao4QcoSw8YdWOx1JHoj8ddAJZogkqJAsbR0rMljs3dJE7m0S9EzAMfsMAxjTGiGSa7NJa8rGZOKAUOxyRck1F4QCWEcRim7TKV4ipRN+6vhrHWBsPUOxdjHPpcC9IayknCvgNY48LGzWYbCIpTwSiRDeLDV4BV8KqkqhKT4URSj1HVoiShVTujbOknwPZ35fyHLAMckcpyNC2guagK5xsUkMPGVXJIGYvjQj2vwooy0igfNqKKDe0y-kkW8Vg0FuzopQv-CxICBDhwonnKMxCQssphG5SKLGOVojrRPN3IOfC7FFPFjKZIcZrwx0BZUnxdAaUfgha2A5DLAIhIDNc1JHLLFV3xbXRyIRMnAmsSKxZJRtoSnxsCYEDUqXEyVRwT8+ymIAVYqo1Fy9y6cqro8FaVURb+DVJeL4MCLWQjYda5aEpHJFAdf3ISqAhB9A4D1QymAWyYGECPfBRtWXEI0WbegRB8AprAHRDNWbrafyBTcoBcCSUrQFXtIqSs9rOOqLXf2wbyixATAmBN6Ik0pqxOmxQ1bc0EPHi0+YbTXQc1LcmpKFbvxVv0jWguxB61MMFNy0Ijc8aPKliUfCuVMZShzHueBUqh3dAAErjj7LALoAwC3hM0XQPsmhn1dO3ey1evq7kJhSMUAl14sxZjscEfCwJa6nnAS8-hMq730EfT+uAr6Z0sznS6N0Gxv2-rSgBwBu7cjLOWvkXcWMtrxlg4feWkQpVgjFCLJo95MCoAgHAbwLVr60B9Xq5hORhSRp3CRaEN59yxHSLAnIIRCinlSAKp49QPiyofEChVJpU3pyGIYUYkhpBSEE7cz2Ypwi2ulBESIaFZYzKqnELtURoTBsCBpvjmDiY6brAE30jTQnklMw2vJUyohoWKgVMqcmRbPDETKLuMz-Co1Q4qqsOzlV0rVcxDVzLbSjienTHqsVIakZsjkQ+lUaiowjheLt5r5pJlCAUdzJQqO3j2qlnqjEuw5dYuxCQ3FeL8RROwISIkp0SSkliWS8lMBqGC2RwEOFEGPGSwVeGdijwJiyZCZLFRbMhECKljqWJIo-mK31JhZWsoXiWqkVaSpm4wdgWfQofbuHHhsyEVLNTZHpy7Ko3m9MraLYyQg7yBqoylRiLLRu4QyjqhDeAgqqXb7DwfunMHt3khhaS3M-JAJjwfGKMrd4aoYZBH8hsvu1TLr+MCUogLWr2jY6rsCUO0ycmOIa3AvcRTg3gJqFjSVKRUtOvBVlv8RzH5wtQGcxFlysdjKA-cCIGZJa+UPkrXKvOZSpHCMKJ4XaHLR3F+lsFLrIXZfdUyz1KI2fMJ3ErKqZRbwkXeDEJMqYkz8NJ+CME64PipZHUlMdkL13Zqnfm7gju1fN3ltmVWJ4pT7jPbeOgZQEYSxBLeL4Hmv4KvQ7+26DuVdCbVyeKqSYTzJG17vejzx1ruZhAOvah8uvW+lzC2X8LzlK9Z+XszjWBVESjKjM+CZ0w+8hM8SoqySqeOOzT-j3Qer29j0PhtPa2Gbmlgh8oPvgTirqFGZLe56ipcfQARwIHAHNmPBiPuQNWYZcfED4qKe7rtOLHj1Fk0TofKEGUBKF2o1HGB8OIivl5jfDghjnmmnIMOpOgGsKSNpAQMIO-nAlHK7jvGqLuCjK5IsuUM8JAk8jmAkJCKlgAKI4ZyQMiUyjbxJgBYEiYMZwg151A1xhoLK5AFAig3jBorQFjJD7g0F0H8xvqb66rD5wK5S1zHgEotZSgYwAEf71DiowibhQglSqjNziFzD0FegA6sGKwxjZjSjlArQFSxiyxRiZ5YzJa5R7ggh2Id7QHAr0C0GGF-Z1LyJKLK4yENp5BwjHy3hgghBqYrQ+6PBFIqEc4VCJEF5aZYLeFRSh66bjqZobqmGfIxjeRBCSj4oybOJJDV57jHipBqgAqabyqpF0HF6Yal7SGAYV65BCIvDBqpDqbQiVB2awIkQ1BETxjVRJDZiX7sZAA */
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
              params: ({ event }) => {
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
                const maybeInvitedGroup: GroupData | undefined =
                  groups.byId[groupId];
                console.log(` New group:`, maybeInvitedGroup);
                return {
                  invitedGroup: maybeInvitedGroup,
                };
              },
            },
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
      always: [
        {
          target:
            "User Was Already a Member of Group Prior to Clicking Join Link",
          guard: {
            type: "isUserInGroup",
            params: ({ context }) => ({
              invitedGroupId: context.groupInviteMetadata?.groupId,
              groups: context.groupsBeforeJoinRequestAccepted,
            }),
          },
        },
        {
          target: "Waiting For User Action",
        },
      ],
    },

    "User Was Already a Member of Group Prior to Clicking Join Link": {
      description: `
The user was already a member of the group they clicked the 
link to join. In this case, we just want to allow them to 
navigate to the group conversation and provide them
messaging to give them some context.
      `,
      on: {
        "user.didTapOpenConversation": {
          actions: {
            type: "navigateToGroupScreen",
            params: ({ context }) => {
              return {
                topic: context.invitedGroup!.topic,
              };
            },
          },
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
                topic: context.invitedGroup?.topic!,
              }),
            },
          ],
        },
      },
      exit: log(() => `[Waiting For User Action] Exiting state`),
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
          },
          {
            guard: {
              type: "isGroupJoinRequestAlreadyJoined",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
              }),
            },
            target: "User Joined Group",
          },
          {
            guard: {
              type: "isGroupJoinRequestRejected",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
              }),
            },
            target: "Request to Join Group Rejected",
          },
          {
            guard: {
              type: "isGroupJoinRequestError",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
              }),
            },
            target: "Error Joining Group",
          },
          {
            guard: {
              type: "isGroupJoinRequestTimedOut",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
              }),
            },
            target: "Attempting to Join Group Timed Out",
          },
        ],
      },
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
                  invitedGroup:
                    event.output.byId[context.groupInviteMetadata!.groupId!],
                }),
              },
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
                    invitedGroup: newGroupId
                      ? event.output.byId[newGroupId]
                      : undefined,
                  };
                },
              },
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
    },

    "Checking If User Has Been Blocked From Group": {
      always: [
        {
          guard: {
            type: "hasUserNotBeenBlocked",
            params: ({ context }) => ({
              invitedGroup: context.invitedGroup,
            }),
          },
          target: "Providing User Consent to Join Group",
        },
        {
          target: "User Has Been Blocked From Group",
        },
      ],
    },

    "Checking If User Has Already Joined Group": {
      always: [
        {
          guard: {
            type: "userHasAlreadyJoinedGroup",
            params: ({ context }) => ({
              invitedGroup: context.invitedGroup,
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
              invitedGroup: context.invitedGroup,
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
    },

    "Providing User Consent to Join Group": {
      invoke: {
        id: "provideUserConsentToJoinGroup",
        src: "provideUserConsentToJoinGroup",
        input: ({ context }) => ({
          account: context.account,
          group: context.invitedGroup!,
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
    },

    "Refreshing Group": {
      entry: log(() => `[Refreshing Group] Entered state`),
      invoke: {
        id: "refreshGroup",
        src: "refreshGroup",
        input: ({ context }) => ({
          account: context.account,
          topic: context.invitedGroup!.topic,
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
              topic: context.invitedGroup!.topic,
            };
          },
        },
        log(
          ({ context }) =>
            `[User Joined Group] Navigating to group screen with topic: ${
              context.invitedGroup!.topic
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

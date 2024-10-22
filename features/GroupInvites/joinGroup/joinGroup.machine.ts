/// Shared Diagram: https://stately.ai/registry/editor/9e6921a4-4b05-4277-96c4-cb4d4e60680a?machineId=dbb1249d-7715-4b1f-8fb7-e476a116272a
/// Figma: TODO
import { GroupJoinRequestStatus } from "@utils/api";
import { GroupInvite } from "@utils/api.types";
import { GroupData, GroupsDataEntity } from "@utils/xmtpRN/client.types";
import { assign, fromPromise, log, setup } from "xstate";

import { AllowGroupProps } from "./JoinGroup.client";
import { JoinGroupResult, JoinGroupResultType } from "./joinGroup.types";
import { Controlled } from "../../../dependencies/Environment/Environment";

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
      const { account, group } = input;
      const allowGroupProps: AllowGroupProps = {
        account,
        options: {
          includeCreator: false,
          includeAddedBy: false,
        },
        group,
      };
      return await Controlled.joinGroupClient.allowGroup(allowGroupProps);
    }),

    refreshGroup: fromPromise<void, { account: string; topic: string }>(
      async ({ input }) => {
        const { account, topic } = input;
        return await Controlled.joinGroupClient.refreshGroup(account, topic);
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

    navigateToGroupScreen: log(
      (_, params: { topic: string }) =>
        `[navigateToGroupScreen] Navigating to group screen with topic: ${params.topic}`
    ),

    saveGroupsBeforeJoinAttempt: assign({
      groupsBeforeJoinRequestAccepted: (
        _,
        params: { groupsBeforeJoinRequestAccepted: GroupsDataEntity }
      ) => {
        return params.groupsBeforeJoinRequestAccepted;
      },
    }),

    saveNewGroup: assign({
      invitedGroup: (_, params: { invitedGroup?: GroupData }) => {
        return params.invitedGroup;
      },
    }),

    saveGroupJoinStatus: assign({
      joinStatus: (_, params: { joinStatus: GroupJoinRequestStatus }) => {
        return params.joinStatus;
      },
    }),
  },

  guards: {
    isGroupJoinRequestType: (
      _,
      params: {
        groupJoinRequestEventType: JoinGroupResultType;
        expectedType: JoinGroupResultType;
      }
    ) => params.groupJoinRequestEventType === params.expectedType,

    hasGroupIdInMetadata: (_, params: { groupInviteMetadata: GroupInvite }) => {
      const result = params.groupInviteMetadata.groupId !== undefined;
      return result;
    },

    /**
     *
     * @param _ I need to refactor this to say the positive case
     * where user is a member of group.
     * the problem occurs because of all of these potentials for things
     * to be undefined...
     * todo: userIsAMemberOfGroup
     * @param params
     * @returns
     */
    userHasAlreadyJoinedGroup: (
      _,
      params: { invitedGroup: GroupData | undefined }
    ) => {
      const result = params.invitedGroup === undefined;
      return result;
    },

    hasUserNotBeenBlocked: (
      _,
      params: { invitedGroup: GroupData | undefined }
    ) => {
      const invitedGroup: GroupData | undefined = params.invitedGroup;

      const isNotBlocked = invitedGroup?.isGroupActive === true;

      if (invitedGroup === undefined) {
        // If the invited group is undefined, we can't
        // determine if the user has been blocked or not.
        // We'll be able to do so later in the process.
        return true;
      } else if (isNotBlocked) {
        return true;
      }

      return false;
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

      const invitedGroup: GroupData | undefined = groups.byId[invitedGroupId];
      const userHasNotBeenBlocked = invitedGroup?.isGroupActive === true;
      const userIsInGroup = userHasNotBeenBlocked && invitedGroup !== undefined;
      return userIsInGroup;
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCsD2BLAdgcQE6oFcAHAWQEMBjACyzADoAZVMiLKAAj0KPYElMAbugAuYdiTDCWZKQGIIqTPSwDUAa3oAzSdS7F+Q0QEEKw1LiZR0FANoAGALqJQRVLBHpFzkAA9EAVgBmABY6O3C7QIA2ACZIgA54gEZ4gBoQAE8A-386GKSQgHZ-KMKATij-YKiAXxr0tCw9UkoaJUZmVkwOZr5BETEJKQgZMlkwXHxcOiIAGxlNcwBbOm1hXXx9fuNTc0treyckEFd3YU9Mbz8EINCIyNiE5LTMxCjg+Loo78egwKSSrV6iBGjhNi1qLQOiw2H0PGRZrMMuwAFIYJQQTjg2DyRTKQTqeizTpsfjwxEZNG0CDNWCHbynDxeY7XJJxT7vOxBeJRCrxYL+dJZBDvJJ5YJlMofWJFSV1Bro5rkSHtJgw7pw84IpGo9GQLHcHETKYzebCRa4FbE9VQMlailUjG0+nHRnnZmgVnsr7BLmBHl8gVCgKBQp0cpReKRQq8sqFcrykGK8HKtr0ADCVDAFDUsN4mnYAFVYBN2AAJMiwdhGWa4MAsZGO-W9ABCYAtYmLpZM7swshdLjcTMuLMQSUlYbshSjpRKZX8MWnwYQhRioQFgTsMTKMRCBTs8UToKVrShmezuY1+aLJdw5cr1dr9Ygjb1mNb7fMndv1dMF37SRHIOZwXFcY4TmE052LOvILkurwitOdAbkkBQ7hUgT5EeybcKmZ5ZjmeYFl2d4VlWNZ1g2urUgaxDsG2HY3t2f6KP2MRAScQ69mBCDjnGkEzsUsGLi8wqBDu4YSnGMSLv4B6RthTQpqe7QkewADqD4Uc+yJkOIYBLAARqWqAFr0AAKuCeHeZjsOmszWJeHCOuwDBYGosgELedCsBAAAqZBEAA8kQYCYOmigCBMsAyBcA6cSBHq+Igu6YT68QhPyUaBP4ZTLjkUSSROC7BDJdioYpYK4Sp9CaR4GoAGLmExd49v+XkTD56D+YFjrNPFbqgaOCCLjEnyFKVBQlPyvoxMupUxEVUpROE4kxJUwSVSeKq1WQ9UcE1d5qW1rEddMvkBcFoXhZF0WxYoA1cUNnopYEm50EkHz-JEMQ5NEy5roVEbxP4IPBG98SFEkW3KTtdBGMIohLEQ5warZLnNLi7QqISdAyEjKN+agfXgj2eyoFYtiOAyT1JdcIRVGEIMTdy2U5cuxSLWukqVFycn-ECCpKdVcMIwTqMcOj6K0UQWP4qoGh44jBmE8TOHEGTFgUwcgE04lI4vQgDN3MzG6JJE7MIXEoTc-OuVTnY1QVcCx6w2m8PK8jEvsFLWAy3LdA44r+Mq8IRMk9wmv7LY7F68OPHG0z-gs-6bOCghZTJEtmHVFOq6C0mwvEHh7Ri6HsK+5g-sKNjBLB57qsRxruxa5TNiBBxg104gicHsnZtp8uGVLVGjvQTlHwwyL7tl17FeoNRVeYzX8u4yHXvh+rRBR9rtjBJ3tMG8lRsCib-esxb6fCqVNtSe8UMFIU0T+FPxc1XQAAikgTEsWCwgAcmAAA7jqJs75wQByDloHQVBaRGE0KIXAzQDADBMBQMAKNICPX1jxDcuQkjvDXJ9OI3Ih4yXDOtUqyRpxJDsPOV+EJ3Zf0Qb-TAADgGgLfNXPEgc67QPWLA7E8DEHIO2GANBGDRAQBsLrV0h9cFBHwYQ4IxC-SiR7ruZCkoKi0NKPyccDCS70GYT-P+GpAEgNfDRTGxpzCmgWMsVYMC4EIImKIww4iKDoMwdI6mcicHDTwR9ZRqjSEIVXGUPIT9-Bsl+hPF+Lst5GLoOeQiV5iI-jIvRMAYV6LEhzPqBq+Alj+2wfHYaVRKh0DKJ9CUkQghrjmghRIhUHihnWrEMaMRDHv1SU5PgGTSxZLbLkls+SNCYiKagEpmMZEHwCYbSpuQanBDqTlHOTThT8jsGEaIAponxgyoeRJRdGH4QvERFq95yJPiomA0pfjgLlMWdUZZtSyj1I2cuTCgQtE810dOFRZQelwz6ZctSWTtJ3K4bM2RTzuIVNedU95nzGnLiiJ9ZCMYghTmTsUEF7swXpKuZC25L5F7NggTYWO-jnnHyWci1ZHz1looQsEco1TsULiiGtAE7KCVQksqgIQXQOBqQipgEsmBhA+wXhjCBK9eEK3oEQfAIqwAkQlVKsOatTllIRYbTpi1CjRmnPEaSY10WYpyJnHc5r8jxF+gK9oQqRWwnFYobVsrF7+1sdMOYDjLQzDVd1DVt4tVhR1U3Ig+rnrHyNeGU1iQLXqMQr80G-xxwlC3KDbpJyqpvzhgAJXbHWWAbQegKp4VAugdZNBlsEdwWN3cRT8kWpKMaiRygRCvm8cIdBNyZyjHJc1kpjlCwLWc9oJb61wArb6yYdiA3mkcXWht-VHkJTpdcSMpVql2q7R88IvaRTsroFGOM-p8hsklAk4EmBUAQDgN4V209aBxwNcfAAtFEZcX7lnaO2ZKN6pRwbOvoGqUVMs+geP0sMUYH643XFKvlf0H1oJQ3eAtechRwPQig3adA2orEYhlvAWln7rjJEWpyHln1jarPyqsj6R6fnxlDMnPDRKODXghVpMlJHKXcGyYxY6LEj5dyPqyD4YZ-RlH+OygE7wFxD3jNUkh8YFyoXEsC-N213ZqU0jcyi5K9ISCMiZMy4J2CWWst6+yjlYQuTcpgNQiGW0yQBOe8GpRFyZ2Tjy9FoM8iRAPGycI85Pp4bqt7Q6VyToSfkcNGSmjyidoxeJKoINvkfHFDzAUW5H7jsLpO5Js8Ubzx9c0dzUmUrzkWn3HkKRIirMtsKMa65tEmsjLyVC+K9NuyhCYy0ZiOAWM4dY8ENXcGO1+QQ30C5cpPyw-lLOUk4w8hjBKXDA233tG4wMklD4RlVzGagApkziky2mxU6CnxHV3fBikJ7Q9mMmoFsUWhT8sK7cLYSgi-TeOZP4yZwT4DuA3cWXQnZHwDyOwqKFwo80kIyW+OJR2v0ChJB2xO-TgqQ1QY9ZKyN3r5UQ4o0hgI05Ilbl9M9zCY0kj5X4nGXmIGuSLhxyVvH07S1zthNVinLbKjRAHfkDn5qeTlWZzsrkG2BTycBdDX7U76B8arCdvJ52JnsCmTMqbQvas3CEgO1ZRCgh2vmsF9llRH5zjenhtS9zBfwspyuWbXxpolBt-yecy4s15czlDFmy3iuvr+1CEtABHAgcAZWV2gyW5A2YpGQ+Pr6cGwSFu-UvStjOHL1sYuKDE5OCTceDdLg3b2Cfeh+XQEsfUQUCDCDT8hj382OdLb2cEb5mjC8Av0bp8ve36AAFFF13kgwL6zKDRCt8QNRn0496On0YwhUoOz3iYSnIDGTBdw+q7oOPqYi9p-k9dy2jPc3OSLdz2vrZYo5IRHkzlLcW48PH+alPjUtJ5+8TqchPkPGCkPfDNPlLlOGE-KGJ9FyOav1sPhHu0J-neMNqwuwkAtdobjxHJJGOenELuv8PyP8BzDEoHtUEUKDAKB-hPjZgTu6j+BGtKn-iLoVJhLQguJLitEzuvvOHQDaiDMmp2tBNQSfjOg2mfsQH-iapnpUJGN7jGL7iet8JEtODytzIDJuHejUEAA */
  id: "joinGroupMachine",
  context: ({ input }) => ({
    account: input.account,
    groupInviteId: input.groupInviteId,
    joinStatus: "PENDING",
  }),

  initial: "Loading Group Invite Metadata",

  states: {
    "Loading Group Invite Metadata": {
      description: `
Fetches the group invite metadata from the server.
This metadata contains information that a potential
joiner will see when they land on the deep link page.
`,
      tags: ["loading"],
      invoke: {
        id: "fetchGroupInviteActorLogic",
        src: "fetchGroupInviteActorLogic",
        input: ({ context }) => {
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
          ],
        },
      },
    },

    "Loading Initially Joined Groups": {
      invoke: {
        id: "loadingInitiallyJoinedGroups",
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
            target: "Check User Group Join Status Before User Action",
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
                  const groupIfUserHasAlreadyJoined: GroupData | undefined =
                    groups.byId[groupId];
                  return {
                    invitedGroup: groupIfUserHasAlreadyJoined,
                  };
                },
              },
            ],
          },
          {
            target: "Waiting For User Action",
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
            ],
          },
        ],
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
          ],
        },
      },
    },

    "Check User Group Join Status Before User Action": {
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
          guard: {
            type: "hasUserNotBeenBlocked",
            params: ({ context }) => {
              return {
                invitedGroup: context.invitedGroup,
              };
            },
          },
        },
        {
          target: "User Has Been Blocked From Group",
        },
      ],
    },

    "User Was Already a Member of Group Prior to Clicking Join Link": {
      entry: {
        type: "saveGroupJoinStatus",
        params: {
          joinStatus: "ACCEPTED",
        },
      },
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
      on: {
        "user.didTapJoinGroup": {
          target: "Attempting to Join Group",
        },
        "user.didTapOpenConversation": {
          actions: [
            {
              type: "navigateToGroupScreen",
              params: ({ context }) => ({
                topic: context.invitedGroup?.topic!,
              }),
            },
          ],
        },
      },
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
      invoke: {
        id: "attemptToJoinGroupActorLogic",
        src: "attemptToJoinGroupActorLogic",
        input: ({ context }) => {
          return {
            groupInviteId: context.groupInviteId,
            account: context.account,
          };
        },
        onDone: [
          {
            guard: {
              type: "isGroupJoinRequestType",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
                expectedType: "group-join-request.accepted",
              }),
            },
            target: "Determining Newly Joined Group",
          },
          {
            guard: {
              type: "isGroupJoinRequestType",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
                expectedType: "group-join-request.already-joined",
              }),
            },
            target: "User Joined Group",
          },
          {
            guard: {
              type: "isGroupJoinRequestType",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
                expectedType: "group-join-request.rejected",
              }),
            },
            target: "Request to Join Group Rejected",
          },
          {
            guard: {
              type: "isGroupJoinRequestType",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
                expectedType: "group-join-request.error",
              }),
            },
            target: "Error Joining Group",
          },
          {
            guard: {
              type: "isGroupJoinRequestType",
              params: ({ event }) => ({
                groupJoinRequestEventType: event.output.type,
                expectedType: "group-join-request.timed-out",
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
            target: "Checking If User Has Already Joined Group",
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
        },
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
    },

    "User Has Been Blocked From Group": {
      description: `
The user has been blocked from the group or the group is not active.
      `,

      entry: [
        {
          type: "saveGroupJoinStatus",
          params: {
            joinStatus: "REJECTED",
          },
        },
      ],
    },

    "User Joined Group": {
      entry: [
        {
          type: "saveGroupJoinStatus",
          params: {
            joinStatus: "ACCEPTED",
          },
        },
        {
          type: "navigateToGroupScreen",
          params: ({ context }) => {
            return {
              topic: context.invitedGroup!.topic,
            };
          },
        },
      ],
    },

    "Request to Join Group Rejected": {
      type: "final",
    },

    ///////////////////////////////////////////////////////////////////////////
    // ERROR STATES
    ///////////////////////////////////////////////////////////////////////////

    "Attempting to Join Group Timed Out": {
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
      tags: ["error"],
    },

    "Error Joining Group": {
      tags: ["error"],
      type: "final",
    },

    "Error Loading Groups": {
      tags: ["error"],
    },

    "Error Determining New Group": {
      tags: ["error"],
    },

    "Error Providing User Consent": {
      tags: ["error"],
    },

    "Error Refreshing Group": {
      tags: ["error"],
    },
  },
});

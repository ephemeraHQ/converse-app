import { GroupData, GroupsDataEntity } from "@queries/useGroupsQuery";
import { GroupInvite } from "@utils/api.types";
import { assign, fromPromise, log, setup } from "xstate";

import { AllowGroupProps } from "./GroupInvites.client";
import { JoinGroupResult, JoinGroupResultType } from "./joinGroup.types";
import { Controlled } from "../../dependencies/Environment/Environment";

type JoinGroupMachineEvents = { type: "user.didTapJoinGroup" };

type JoinGroupMachineContext = {
  // Context
  account: string;
  groupInviteMetadata?: GroupInvite;
  groupsBeforeJoinAttempt?: GroupsDataEntity;
  newGroup?: GroupData;

  // From Input
  groupInviteId: string;

  error?: string;
};

type JoinGroupMachineInput = {
  groupInviteId: string;
};

type JoinGroupMachineTags = "loading";

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
      return await Controlled.joinGroupClient.fetchGroupsByAccount(account);
    }),

    attemptToJoinGroupActorLogic: fromPromise<
      JoinGroupResult,
      { account: string; groupInviteId: string }
    >(async ({ input }) => {
      const { account, groupInviteId } = input;
      return await Controlled.joinGroupClient.attemptToJoinGroup(
        account,
        groupInviteId
      );
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
      groupInviteMetadata: (_, params: { groupInviteMetadata: GroupInvite }) =>
        params.groupInviteMetadata,
    }),

    saveError: assign({
      error: (_, params: { error: string }) => params.error,
    }),

    navigateToGroupScreen: log(
      (_, params: { topic: string }) =>
        `-> TODO: provide navigateToGroupScreen ${JSON.stringify({
          question: "Does the event have a groupId?",
          topic: params.topic,
        })}`
    ),

    navigationGoBack: log((_) => {
      return `-> TODO: provide navigationGoBack`;
    }),

    saveGroupsBeforeJoinAttempt: assign({
      groupsBeforeJoinAttempt: (
        _,
        params: { groupsBeforeJoinAttempt: GroupsDataEntity }
      ) => params.groupsBeforeJoinAttempt,
    }),

    saveNewGroup: assign({
      newGroup: (_, params: { newGroup: GroupData }) => params.newGroup,
    }),
  },

  guards: {
    isGroupJoinRequestAccepted: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      return params.groupJoinRequestEventType === "group-join-request.accepted";
    },

    isGroupJoinRequestAlreadyJoined: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      return (
        params.groupJoinRequestEventType === "group-join-request.already-joined"
      );
    },

    isGroupJoinRequestRejected: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      return params.groupJoinRequestEventType === "group-join-request.rejected";
    },

    isGroupJoinRequestError: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      return params.groupJoinRequestEventType === "group-join-request.error";
    },

    isGroupJoinRequestTimedOut: (
      _,
      params: { groupJoinRequestEventType: JoinGroupResultType }
    ) => {
      return (
        params.groupJoinRequestEventType === "group-join-request.timed-out"
      );
    },

    hasGroupIdInMetadata: (_, params: { groupInviteMetadata: GroupInvite }) => {
      return params.groupInviteMetadata.groupId !== undefined;
    },

    userHasAlreadyJoinedGroup: (
      _,
      params: { newGroup: GroupData | undefined }
    ) => {
      return params.newGroup === undefined;
    },

    hasUserBeenBlocked: (_, params: { newGroup: GroupData | undefined }) => {
      return params.newGroup?.isGroupActive === false;
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCsD2BLAdgcQE6oFcAHAWQEMBjACyzADoAZVMiLKAAj0KPYElMAbugAuYdiTDCWZKQGIIqTPSwDUAa3oAzSdS7F+Q0UyjoKAbQAMAXUSgiqWCPSLbIAB6IAjAHYAnHQAOPwtPABYAZm8AJgBWADYLUKiAGhAAT0QouLpwi3jwuN84oO9PRIBfctS0LD1SSholRmZWTA46vkERMQkpCBkyWTBcfFw6IgAbGU1UXABbOm1hXXx9LqNUE3NrV3tHYWdMVw8EaKi6KIsAgtDi+JjwmNSMhABaT19QnM8o0rjPEq+AKeGKVaoYHCrerUWh0ADqZCcbXYADFZuwAKqwYbsACCFAOilkBGxY1YEAAKmQiAApCF1Sw2JAgPZOFzMk5RXzhOjecI+Cy+MLhAKxULeZ6IbzFHLeUIg3wWXLhJKVKogTCoCBwVw1SHccgwpS7Bxso4cqU8-6PCx8iyxcKPAKSt7hKIBOhxOJilWK0KK0HqvV1Q2NehMFhsThQzqGHqSaRSE37Q7HLxRTyezw2u0Op0u15ReV0cUxWIfGK+KsgsEgYNQ0OwhFIjho3CY0l4gmp5mswnm0AnH6Z60xW25PNxF02i7eAK3OK5BK+GIxUK1+sGhqwgCiI3REda7RjBm6ybNaYQZWBOQSPyVVfCVYLPh5IqB3lKMQCAU+sTV5RAA */
  id: "joinGroupMachine",
  context: ({ input }) => {
    // const account = currentAccount();
    const account = "0x123";
    const { groupInviteId } = input;

    return {
      account,
      groupInviteId,
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
          description: `
We should be able to check the invite status
without creating a groupJoinRequest, but in GroupInvites.screen,
that isn't how things are done, so I'm going to follow what's currently there.

This requires that the user click the button before we check if they've already
joined, so I think I'm missing some context.
`,
          // target/*TODO: can we create the ability to check an invite status without creating a groupJoinRequest?*/: "Checking Invite Status",
          target: "Waiting For User Action",
          actions: {
            type: "saveGroupInviteMetadata",
            params: ({ event }) => ({
              groupInviteMetadata: event.output,
            }),
          },
        },
        onError: {
          target: "Error Loading Group Invite",
          actions: {
            type: "saveError",
            params: ({ event }) => ({ error: JSON.stringify(event.error) }),
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
      },
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
      invoke: {
        id: "fetchGroupsBeforeJoining",
        src: "fetchGroupsByAccountActorLogic",
        input: ({ context }) => {
          return {
            account: context.account,
          };
        },
        onDone: {
          target: "Attempting to Join Group",
          actions: {
            type: "saveGroupsBeforeJoinAttempt",
            params: ({ event }) => ({
              groupsBeforeJoinAttempt: event.output,
            }),
          },
        },
        onError: {
          target: "Error Loading Groups",
          actions: {
            type: "saveError",
            params: ({ event }) => ({ error: JSON.stringify(event.error) }),
          },
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

      invoke: {
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
        id: "fetchUpdatedGroupsAfterJoining",
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
            ],
            target: "Checking If User Has Been Blocked From Group",
          },
          {
            actions: [
              assign({
                newGroup: ({ context, event }) => {
                  const oldGroupIds = new Set(
                    context.groupsBeforeJoinAttempt!.ids
                  );
                  const newGroupId = event.output.ids.find(
                    (id) => !oldGroupIds.has(id)
                  );
                  return newGroupId ? event.output.byId[newGroupId] : undefined;
                },
              }),
            ],
            target: "Checking If User Has Already Joined Group",
          },
        ],
        onError: {
          target: "Error Determining New Group",
          actions: {
            type: "saveError",
            params: ({ event }) => ({ error: JSON.stringify(event.error) }),
          },
        },
      },
    },

    "Checking If User Has Been Blocked From Group": {
      always: [
        {
          guard: {
            type: "hasUserBeenBlocked",
            params: ({ context }) => ({
              newGroup: context.newGroup,
            }),
          },
          target: "User Has Been Blocked From Group",
        },
        {
          target: "Providing User Consent to Join Group",
        },
      ],
    },

    "Checking If User Has Already Joined Group": {
      always: [
        {
          guard: {
            type: "userHasAlreadyJoinedGroup",
            params: ({ context }) => ({
              newGroup: context.newGroup,
            }),
          },
          target: "User Joined Group",
        },
        {
          guard: {
            type: "hasUserBeenBlocked",
            params: ({ context }) => ({
              newGroup: context.newGroup,
            }),
          },
          target: "User Has Been Blocked From Group",
        },
        {
          target: "Providing User Consent to Join Group",
        },
      ],
    },

    "Providing User Consent to Join Group": {
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
            params: ({ event }) => ({ error: JSON.stringify(event.error) }),
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
          topic: context.newGroup!.topic,
        }),
        onDone: {
          target: "User Joined Group",
        },
        onError: {
          target: "Error Refreshing Group",
          actions: {
            type: "saveError",
            params: ({ event }) => ({ error: JSON.stringify(event.error) }),
          },
        },
      },
    },
  },

  "User Has Been Blocked From Group": {
    type: "final",
    entry: assign({
      error: "The group is not active or you have been removed from it.",
    }),
  },

  "User Joined Group": {
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

  "Request to Join Group Rejected": {
    type: "final",
  },

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

  ///////////////////////////////////////////////////////////////////////////
  // ERROR STATES
  ///////////////////////////////////////////////////////////////////////////

  "Error Loading Group Invite": {},

  "Error Joining Group": {
    type: "final",
  },

  "Error Loading Groups": {},

  "Error Determining New Group": {},

  "Error Providing User Consent": {},

  "Error Refreshing Group": {},
});

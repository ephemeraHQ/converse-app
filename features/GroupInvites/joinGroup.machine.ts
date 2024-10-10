import { GroupJoinRequestStatus } from "@utils/api";
import { GroupInvite } from "@utils/api.types";
import { GroupData, GroupsDataEntity } from "@utils/xmtpRN/client.types";
import { assign, fromPromise, log, setup } from "xstate";

import { AllowGroupProps } from "./GroupInvites.client";
import { JoinGroupResult, JoinGroupResultType } from "./joinGroup.types";
import { Controlled } from "../../dependencies/Environment/Environment";

type JoinGroupMachineEvents = { type: "user.didTapJoinGroup" };

type JoinGroupMachineErrorType =
  | "fetchGroupInviteError"
  | "fetchGroupsByAccountError"
  | "attemptToJoinGroupError"
  | "provideUserConsentToJoinGroupError"
  | "refreshGroupError";

type JoinGroupMachineContext = {
  // Context
  account: string;
  groupInviteMetadata?: GroupInvite;
  groupsBeforeJoinAttempt?: GroupsDataEntity;
  newGroup?: GroupData;
  joinStatus?: GroupJoinRequestStatus;
  // From Input
  groupInviteId: string;

  error?: { type: JoinGroupMachineErrorType; payload: string };
};

type JoinGroupMachineInput = {
  groupInviteId: string;
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
      error: (
        _,
        params: { error: { type: JoinGroupMachineErrorType; payload: string } }
      ) => params.error,
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

    saveGroupJoinStatus: assign({
      joinStatus: (_, params: { joinStatus: GroupJoinRequestStatus }) =>
        params.joinStatus,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCsD2BLAdgcQE6oFcAHAWQEMBjACyzADoAZVMiLKAAj0KPYElMAbugAuYdiTDCWZKQGIIqTPSwDUAa3oAzSdS7F+Q0QEEKw1LiZR0FANoAGALqJQRVLBHpFzkAA9EANgAWAHY6ACYAVgAOCIBOWOD-AGYk+OCAGhAAT0QAWkCk0MCCwLCCwojUhIBfasy0LD1SSholRmZWTA4mvkERMQkpCBkyWTBcfFw6IgAbGU1zAFs6bWFdfH0+41NzS2t7JyQQV3dhT0xvPwQARluo8LjAuztg65ioqIzsvOjruii7Ek7NdEhFimEanUQA0cBtmtRaHQAOpkDxddgAMXM7AAqrBxuwTGdFLICPipqwIAAVMhEABSGFh3AO3hOHi8RyuwTC-jodii-kSYQ+UVigTemRyCAiwVChVidn8wrKyQKtXqjKa5ARbQAIpJxossGxOHDYOwGbQIOwAEJgBa4MRGYSiRZEYTyRTKQTqLQ6KhNWB2h1gS2YNgso5s4kXTmIYJ2MJ0WVRW5g-mxT5JSWIa5hUKKvMRSqfa5isLq6GauHa1r0fWiXBG8PowMWxmQW328xOl1gN0e8aTaZzYQO5ardbcIPdx1hiOOVludmx0BXW6KuiBBXFMX+a4RfyVHMIXL+Ox0WKRN6xFJRQIy-z+SswrUtRHO13uk1mdtYU3cJ6bQqL6dAyF+whUqgYZNESuyoFYtiLlGy4xpciAykmURhNcLxgthMTxCetwgnQ1xJGESTJAkCp2IEz5Qq+Nbvm0n79t+6K-mGAHEEB3qqBoYF9gOUEwXCcEWAh+zXIcLioec6E3BRF7PEqLwUTyURJFExG3KE5GUbeSQgvukIao0zE6vQbEDj+qB-pgPFEHxdAgYJ4HsZB0HVtwEl7LYYSycc8kcmuuYUX8qZ6ThdjRImumxLyGY0dc-gCpRUQvj5xC1h+wkcRwXGMk5LlufQHkid5Fm+TskmITYSRBdGClxkpKR8olFFXs8V6JcRwr3FeSTbi8wIRLFFaMdl8J1nQNkFewRX-k0pU+u5+VeWJNVmHV+yBE1IWrr44VvP82nREkcSUQ+xGpH8I2vNhCYRBCWXVTlLH1gaTbGuiAByYAAO4zFkDmditCjAWtfprFQOJEMMogQIGRiaI285dJGcmnC1YXSp8dAytuhQvAC9FfFKqWxH8iWVA+h75qUgRvUyH1WXQDaGr9HAA8DoNhuDcKrQJMPUPDiOQCjaPjBjUA2DJS446Fx03G8SZUUeYTAqlIRUcR-jU5eR7DcWSrBEzLNvuznM-S2PNAyDYPWitQ7mCO8xLCs-rizIktmqj6OMguB1K0dVyRMU-yxJUwTjdhwqBDp3wIGEEJJs8w2RAk5sHpblmzQAwlQYAUGoJq8JouLkuwAASZDmnaYCOTaMyoKXnYYvgiwlVjwWh4ptwQuEyQZweILgieOH7nyZTkQqqYxBEefcLlbRFyXZfohXVcEnXDdgE3tqt+31qd6g3crfLIcrop5u8pm2nCskCap9mydT38ibiqk-JvMWy9s0LsXUu5dK54l3vXQkMxHQsH5h2Z2Qte7NWVuHcagQOoygTHYMU2DiiTzpnQIITNhpBDKLEABM1ETrxAVvMB1c95QJgRAOBVoe4KxQv3Vq5FrjoLLPRHqwItKpUnoUAs95ghGWLE8RKFDV70GoZvDg29wG4FrpAow0CwCwKdj3QKisb5cOMrwvcAi3jGX8JPUoSQ+TiIfJmMoOFgiyM+nQAACvgIQnQOAqPYAXRQ+JMDCEWvZbiEMvSuWhtMDx6AIBgBUX4zAATNrTSQYdAe8QLyHkSvEaI2EDz4LooTYESoBTbkTlpZx7N3GoE8SaHxCSknBIciVV2UxZgeybFEmpMS4nkgaU3ZJ70iCpM4XjMsCpCYGwNtHD4OEIj4OSITMhqccL02iJU2aAAle0jpYCtG6ELSG-FQKOk0LsgMcIRkGLxjyXC-xclYIovuVOljE7hHNolbkIJZRLymkMuRdBtlnLgPslpEw3btLHJ7U55ymhXLQq1W5F53ifAzrcl579twRGTObGIBtYqlHvLUKEmBUCxPgEcJiK9Pr6IRXjF66C8l4UTsKOIsQTy5FeElRI9F8xaykczP5rNKFtCYCwE0PQDD9HEJIaQUhaW4xVtEWIDxCKp1UvRDlJTCY8oFIKQ8usNmIhRGiDgWJVE+KJIq5BYcMIJEmfeT4h5ZTAgpogDWdAKKpi1pdeIl1BXmWFQCm2zYJVmh0cGHshINoKpQQEbBhDU7JDiHRTBFjk65G4f8e855iYQh4fmI1rENp2WaU0WNtr8YqsiHip+Pr+QnllLw88aVUpkOjgGqs-yXEhu5uwXmjsBYIO4BWxSyrVVpUTDrK8gR+qJB1UTaOiRtLBEykKq2QCN6gJ3qohhjdm7Hw0KfLuTlR2tWSLyV4B4ChSNXemym0dsUVGwYkPhiYGKBo3VQ4Bii+B0IgeaDRTCWFKGHcQM9YytYqq0gqSixZMFupuI+z1scX2mSeDyIt9Bqm1PRPU-xAymmhLhBBlWZtLyCOKLmoInwRHREvB8fFt5nqVCw4CnZIKw0jo4dclWlFClvCmamFIkR72IDKACPkxT+SPW4Wxnxe6D4HrbkezEJ7y08bpXxnhBZqbxGyYKPB787jvO-veVI41kjyerkO09mnFXhzFH8GKMpbwJDzLO9+lFQgRDLFFXW5FO1UsAYibZABHAgcAglLUcj0bZyAS5I1I+HYy+lBRqzUq8XSApPWRCneNFUaU2PzTOJxEJxUehUnQIsTsAB5AgwhkviaBEmJ8twma3BHp5ymJCF0AiemysobGACi4LVFiq8U5XohgwBNZTmQwmxQ8zLeCIUCiHKpGeqvLKc2iZ8Ifq7UGlxo3JgOS4+B+zcaU5AnuAmII55U7RFIf1HLIJhrlmSCCIb6786IhO9iCb52iAUuxrx8OonCFrYPGNN41wOWpC3InfcWZ1LPDoiNsb7Be1237UDOzoOtPh2KNYwU5YI70U+N18TBXkwKkSC+wRTifvUvZv91ROGYl1Orv0wJc3+O8IFIlYTFFDz4JiEUg8j80rbk+Bj07QLzlA751FJZEInW4VvIKfBpFY46YhHEEmgrahAA */
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
          target: "Determining Groups Joined Before Attempt",

          actions: {
            type: "saveGroupInviteMetadata",
            params: ({ event }) => ({
              groupInviteMetadata: event.output,
            }),
          },

          reenter: true,
        },
        onError: {
          target: "Error Loading Group Invite",
          actions: {
            type: "saveError",
            params: ({ event }) => ({
              error: {
                type: "fetchGroupInviteError",
                payload: JSON.stringify(event.error),
              },
            }),
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
          target: "Waiting For User Action",

          actions: {
            type: "saveGroupsBeforeJoinAttempt",
            params: ({ event }) => ({
              groupsBeforeJoinAttempt: event.output,
            }),
          },

          reenter: true,
        },
        onError: {
          target: "Error Loading Groups",
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
            type: "hasUserBeenBlocked",
            params: ({ context }) => ({
              newGroup: context.newGroup,
            }),
          },
          target: "User Has Been Blocked From Group",
        },
        "Providing User Consent to Join Group",
      ],
    },

    "Checking If User Has Already Joined Group": {
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
          guard: {
            type: "userHasAlreadyJoinedGroup",
            params: ({ context }) => ({
              newGroup: context.newGroup,
            }),
          },
          target: "User Joined Group",
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
    },

    "User Has Been Blocked From Group": {
      description: `
The user has been blocked from the group or the group is not active.
      `,
      type: "final",
      entry: {
        type: "saveGroupJoinStatus",
        params: {
          joinStatus: "REJECTED",
        },
      },
    },

    "User Joined Group": {
      type: "final",
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
              topic: context.newGroup!.topic,
            };
          },
        },
      ],
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

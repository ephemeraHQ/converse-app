import { GroupInvite } from "@utils/api.types";
import { assign, fromPromise, log, setup } from "xstate";

import { JoinGroupResult } from "./joinGroup.types";
import { Controlled } from "../../dependencies/Environment/Environment";

type JoinGroupMachineEvents = { type: "user.didTapJoinGroup" };

type JoinGroupMachineContext = {
  // Context
  account: string;
  groupInviteMetadata?: GroupInvite;

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
      ({ event }) =>
        `-> navigateToGroupScreen ${JSON.stringify({
          question: "Does the event have a groupId?",
          event,
        })}`
    ),
  },

  guards: {},
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCsD2BLAdgcQE6oFcAHAWQEMBjACyzADoAZVMiLKAAj0KPYElMAbugAuYdiTDCWZKQGIIqTPSwDUAa3oAzSdS7F+Q0UyjoKAbQAMAXUSgiqWCPSLbIAB6IAjAHYAnHQAOPwtPABYAZm8AJgBWADYLUKiAGhAAT0QouLpwi3jwuN84oO9PRIBfctS0LD1SSholRmZWTA46vkERMQkpCBkyWTBcfFw6IgAbGU1UXABbOm1hXXx9LqNUE3NrV3tHYWdMVw8EaKi6KIsAgtDi+JjwmNSMhABaT19QnM8o0rjPEq+AKeGKVaoYHCrerUWh0ADqZCcbXYADFZuwAKqwYbsACCFAOilkBGxY1YEAAKmQiAApCF1Sw2JAgPZOFzMk5RXzhOjecI+Cy+MLhAKxULeZ6IbzFHLeUIg3wWXLhJKVKogTCoCBwVw1SHccgwpS7Bxso4cqU8-6PCx8iyxcKPAKSt7hKIBOhxOJilWK0KK0HqvV1Q2NehMFhsThQzqGHqSaRSE37Q7HLxRTyezw2u0Op0u15ReV0cUxWIfGK+KsgsEgYNQ0OwhFIjho3CY0l4gmp5mswnm0AnH6Z60xW25PNxF02i7eAK3OK5BK+GIxUK1+sGhqwgCiI3REda7RjBm6ybNaYQZWBOQSPyVVfCVYLPh5IqB3lKMQCAU+sTV5RAA */
  id: "joinGroupMachine",
  context: ({ input }) => {
    // const account = currentAccount();
    const account = "0x123";
    const { groupInviteId } = input;
    console.log({ account, groupInviteId });

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
            guard: ({ event }) => {
              console.log(event.output);
              const b = event.output.type === "group-join-request.accepted";
              console.log(b);
              return b;
            },

            actions: [log(({ event }) => `User Joined Group ${event}`)],

            target: "User Joined Group",
          },
          {
            guard: ({ event }) => {
              return event.output.type === "group-join-request.rejected";
            },

            target: "Request to Join Group Rejected",
          },
          {
            guard: ({ event }) =>
              event.output.type === "group-join-request.error",
            target: "Error Joining Group",
          },
          {
            guard: ({ event }) =>
              event.output.type === "group-join-request.timed-out",
            target: "Attempting to Join Group Timed Out",
          },
        ],
      },
    },

    "User Joined Group": {
      entry: [log(({ event }) => `User Joined Group ${JSON.stringify(event)}`)],
      type: "final",
      actions: ["navigateToGroupScreen"],
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
  },
});

import { currentAccount } from "@data/store/accountsStore";
import {
  createGroupJoinRequest,
  getGroupInvite,
  getGroupJoinRequest,
  GroupInvite,
} from "@utils/api";
import logger from "@utils/logger";
import { assign, fromPromise, log, setup } from "xstate";

import {
  getInviteJoinRequestId,
  saveInviteJoinRequestId,
} from "./groupInvites.utils";

const GROUP_JOIN_REQUEST_POLL_INTERVAL_MS = 500;
const GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS = 10;

type JoinGroupActorCallbackEvents =
  | { type: "group-join-request.accepted"; groupId: string }
  | { type: "group-join-request.already-joined"; groupId: string }
  | { type: "group-join-request.rejected" }
  | {
      type: "group-join-request.error" /* not sure why we don't get an error from the api when we receive this status... error: string*/;
    }
  | { type: "group-join-request.timed-out" };

type JoinGroupMachineEvents =
  // user interactions
  | { type: "user.didTapJoinGroup" }
  // Events received from invoked actors
  | JoinGroupActorCallbackEvents;

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
    fetchGroupInvite: fromPromise<
      GroupInvite,
      { account: string; groupInviteId: string }
    >(async ({ input }) => {
      const { groupInviteId } = input;
      // TODO: generic result type
      const groupInvite: GroupInvite = await getGroupInvite(groupInviteId);
      return groupInvite;
    }),

    attemptToJoinGroup: fromPromise<
      JoinGroupActorCallbackEvents,
      { account: string; groupInviteId: string }
    >(async ({ input }) => {
      const { account, groupInviteId } = input;
      /*
       * TODO: replace with Current.joinGroupClient.waitForGroupJoinAcceptance
       * once it's implemented.
       *
       * Use polling and sdk streaming and take first event.
       *
       * If the max count is reached, then we'll just, we
       * consider that a timeout and the inviter is likely
       * offline or has uninstalled the app.
       */

      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      let joinRequestId = getInviteJoinRequestId(account, groupInviteId);
      if (!joinRequestId) {
        logger.debug(
          `[GroupInvite] Sending the group join request to Converse backend`
        );
        const joinRequest = await createGroupJoinRequest(
          account,
          groupInviteId
        );
        joinRequestId = joinRequest.id;
        saveInviteJoinRequestId(account, groupInviteId, joinRequestId);
      }

      let attemptsToRetryJoinGroup = 0;
      while (attemptsToRetryJoinGroup < GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS) {
        const joinRequestData = await getGroupJoinRequest(joinRequestId);

        if (joinRequestData.status !== "PENDING") {
          switch (joinRequestData.status) {
            case "ACCEPTED":
              return {
                type: "group-join-request.accepted",
                groupId: joinRequestData.groupId as string,
              };
            case "REJECTED":
              return {
                type: "group-join-request.rejected",
              };
            case "ERROR":
              return {
                type: "group-join-request.error",
              };
          }
        }

        attemptsToRetryJoinGroup += 1;
        await sleep(GROUP_JOIN_REQUEST_POLL_INTERVAL_MS);
      } /* While loop that was polling terminated after some amount of tries */

      return {
        type: "group-join-request.timed-out",
      };
    }),
  },

  actions: {
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
  id: "joinGroupMachine",
  context: ({ input }) => {
    const account = currentAccount();
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
        src: "fetchGroupInvite",
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
          // target: "Checking Invite Status",
          target: "Waiting For User Action",
          actions: assign({
            groupInviteMetadata: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "Error Loading Group Invite",
          actions: assign({
            error: ({ event }) => JSON.stringify(event.error),
          }),
        },
      },
    },

    "Waiting For User Action": {
      description: `
In this state, the UI will be displaying a button to the user 
to allow them to begin the group join process.

Some potential improvements to this flow would be to have a state
prior where we check the status of the group join request, but 
that isn't how things are done in the current version of the 
screen so I'm going to follow what's currently there for now.
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
        src: "attemptToJoinGroup",
        input: ({ context }) => {
          return {
            groupInviteId: context.groupInviteId,
            account: context.account,
          };
        },
        onDone: [
          {
            guard: ({ event }) =>
              event.output.type === "group-join-request.accepted",
            target: "User Joined Group",
          },
          {
            guard: ({ event }) =>
              event.output.type === "group-join-request.rejected",
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
  },

  "Error Joining Group": {
    type: "final",
  },
});

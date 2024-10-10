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
  /** @xstate-layout N4IgpgJg5mDOIC5QCsD2BLAdgcQE6oFcAHAWQEMBjACyzADoAZVMiLKAAj0KPYElMAbugAuYdiTDCWZKQGIIqTPSwDUAa3oAzSdS7F+Q0QEEKw1LiZR0FANoAGALqJQRVLBHpFzkAA9EAVgBmQLoATnCADgjA0IBGOyiANgAaEABPRAAWWMy6TIB2RP98wMTg0Py4gF8q1LQsPVJKGiVGZlZMDka+QRExCSkIGTJZMFx8XDoiABsZTXMAWzptYV18fV7jU3NLa3snJBBXd2FPTG8-BCCQ8NComPik1IyEQIAmWLo7N8DMxNjfm8SnZQjU6hgcOsmtRaHQAOpkDyddgAMXM7AAqrAxuwTKdFLICNjJqwIAAVMhEABSEMa+28xw8XkOlxydkSYXClX88WCv38zwCOTobzsgRB-gi+SBb3+YJA9Uh3HIMNaABFJGMFlg2JwobB2DTaBB2AAhMDzXBiIzCUQLIjCeSKZSCdRaHRURqwc2WsBGzBsemHRn484sxBsjm3bm84KZAXpRCiz5A36JCLxRIg0L+UG1BW0qEqlr0DWiXDagPIr2GiGQM0W8zW21ge2OsYTKazYSWpYrNbcb2Nq3+wOOBluJlh0CszLszkVHOx-mChDxfJ0CKi2VBOxsiIg+WKxrF2E2u0O3VmWtYPXcJ2tFRuujHovNM8tttX1A3zB34gIE+FAyGc+xBi4k6hhcSaxPkERhFm+TxH8hSZAUq6VCEpQVNEiSypkor5EehbKu+rTnq2l7Ite-r-kQD4uqoGgviRxCnuRn5URwNEQnRgGusBoZgbEBwQScZzQQgHxwQhdhIXYKGJGh+Srm88Z0NhSHRLmSGBLE-jEQ0b6qvQFFftRP60Y0DF0E+zGvqRJl0GZXHsDxt6NPxqiCaBjg2G8olHJBEnhlJsHwaEiHIYkqHoYma7fG8m6JHc0pioEB4KYZSpsWRpmcacFm-nRNl2fQDm5U5LmFdxlm8Z5QEgYoYGBIFIYhTOMEyZFcnRbFKnxbEanJXcsThARCQxXm4JGY5JbOQV37FdZCiPq69msdC83VUtVlQl5qA+c1fmZG1wXMp1YXdVFCkxUpcUvH8-gaSl+S5mhHxvP4Bn5hVW2wmWWo6siAByYAAO7TGkv71itzq2et7qrFQGJEEMogQF6RiaOWo6dOBQXiRdviIO8WZfBloRqREkRSgNLwRGUm5-Bl+mhPGWbTQWs2VfNgMVsDHBg5D0P+rDUKlYjyweqj6OQFjONjHjUA2CJE5E9OJOvLKdgUzT1O0-k9OIEUoQimUdi5kEXJwdlJ55XQ-OVrqwtQzDJrWR25hdnMizS8jssyPL+rY7jEJjmdGuSWTutivrmQ03cdMYfkusxHpcFwXcKWZHbxnzQAwlQYAUGouq8JomLEuwAASZAGuaYB-qa0yHRoJoovgCwlQT7XE5c2TFHkkQgjF0qVCnuR3OzjOZJT7K579m3sfQRcl2XyIV1XOJ1w3YBN2arel-WneoN31mq5HU6SYPG6ZCPkVG0CoSrjTNw0zywR2N84R53NsJr1LuXSuWId711xNMK0LBRZ1g9hLXu51NYD30nfB+Y9n6rn+LkBOOZAjSgToUCIf9eYAOLkAzeIDq67wgVAiAMDjQ9zVsGRBN8UHDzuKPJ+E94rpiStPSUsRYgRATluWIxD-qtEARvDgW9QG4FruAowkCwDQPdj3AK6tr6hVvuwg8j9x4v3itKCKH9ggZiEezQI4iV50AAAr4CEB0Dgcj2AF0UNiTAwg3J1Q8hLVajFnxEAcegCAYA5FuMwB44QZJUD+jpOOZhUdtHRBCFKe+CRSilDwq-eIeQF6xCUlnLMRCl48wkfQexqBHG6hcREqJ3jloSy9pMGYvsKxTGCaE8J7im7RNiZtBBSTLoJ2CJufI6TcJZLeK-FKeQ3gVHiApOcbxGbWIdgAJQtFaWALQuh+PhmVOgVpNDbM9FCQZWjLr+HjLkApc44IHgPFbDC1y6CwQqN9BS+DKhrKcpsk5cBdklWaT7HsftjmnPiVfKCoVrmvLuXJKICRLY5lfnuOgU17olHSYImo+ZMCoFCfAQ4f0V6aJhZdAAtCkeK1LfnzSYCwXU3QDB9HEJIaQUhyUdS1gRVc2QNwrMKTFOSpQkL0thAiJEHA0TyJcXiHlfckGIDiFPW4gixpqQTpkflMQ6Cpz0gCRI-wswpR+jNHK5THaagFlWPZg41E+ibLiAq3L+4quFLcA8RsE6f1iDkug-hv57nvnOHkBErGlMtTYnaRU9rcDdcqtcd1ZLSkNSsn4Or4rBGeoIu47wQTfElG8CV6obXO1BhDN2Ys4EJsSZcrWQJ0x61CHguF7IyiYLeElf4dwRFDXmXcUtq8yHSL4JQsBe8D4tzbifLudFE3R0KLrOc-wUGJz+FmhmERnpbhWezUUHMjbDroFI4B295HUKUbQ+hSha3EEXaFPBW4vjGtFP8Qo+lSiYIzCKGIxQPj3z7URKN9snKVOqciWpPTPENPjQ++tFLeVzw3GkqmaVgiFFfnOMINMCj-EpsUc13No0bK2YC5lUJH1XJyKg6SKUEgGowjusI7IYhFHw2KYjpKHYuOoY3ZuR926onnY0ajyG8FjPvjKdKWGjHvFw0uQI-g8KphKRasD80XE1oXYhnllwVOvK3BmSKQqMpbsQKnXNlQDGShU0Ik9myACOBA4BePcn+bomzkAlwxuJy4Tb4Jx1bW9eMHbAirniKKDFY0kIoI+OKReGn84fgvDVOD9UoTsDJOgBY9YADyBBhD+aTIQltbawvGoi9mpSMWKjGsKQUfwJbQMpdaAAUXGOiRlTi6I9EMGAErCBVULjiHmrVwjVy-BCMGvcVMQTxhzElkjmnYSdYmL+SjdaxINoC2V4LFWg1Vci92urkVRrdu7ctnjTl1vdfaFt4gxKdtIdZCmnqabBEZt+Cds2lQx6VEEYPH4J67vyKdoLdgwtdMvf06TZdeS13FA3UpDCVMXrnYBJEQoIHkv-w611+REGQk1OrnU3pQ3w10dggxqUYpX5xERzHRccXQeE-YP805j2iCU445uFZY08KM3M6-H4GKVM6wecI94eKqhAA */
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
        {
          target: "Providing User Consent to Join Group",
        },
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

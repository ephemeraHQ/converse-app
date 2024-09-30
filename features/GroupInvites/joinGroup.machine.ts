import { currentAccount } from "@data/store/accountsStore";
import { getGroupInvite, GroupInvite } from "@utils/api";
import { fromPromise, setup } from "xstate";

type JoinGroupMachineEvents =
  // user interactions
  { type: "user.didTapJoinGroup" };
// | { type: 'user.didTapPositiveFeedback' }
// | { type: 'user.didTapNegativeFeedback' }
// | { type: 'user.didTapSubmitFeedback' }
// | { type: 'user.didTapDoneRating' }

type JoinGroupMachineContext = {
  // Context
  account: string;
  groupInviteMetadata?: GroupInvite;

  // From Input
  groupInviteId: string;
  // hasSeenRatingPrompt: boolean;
  // userInitialLoginDate: string;
  // isInstallingRft: boolean;
  // isPairing: boolean;
  // areHearingAidsConnected: boolean;
  // externalReviewTrayHasBeenShown: boolean;
  // isUserRetail: boolean;
  // userRetailReviewUrl?: string;
  // groupInvitesThatWereDeterminingRightNow: 'externalReview' | 'internalRating';
};

type JoinGroupMachineInput = {
  groupInviteId: string;
};

export const joinGroupMachineLogic = setup({
  types: {
    events: {} as JoinGroupMachineEvents,
    context: {} as JoinGroupMachineContext,
    input: {} as JoinGroupMachineInput,
  },

  actors: {
    fetchGroupInvite: fromPromise<
      GroupInvite,
      { account: string; groupInviteId: string }
    >(async ({ input /*self, emit, system, signal*/ }) => {
      const { groupInviteId } = input;
      // TODO: generic result type
      const groupInvite: GroupInvite = await getGroupInvite(groupInviteId);
      return groupInvite;
    }),
  },

  guards: {
    //
    // isFeedbackEnabled: ({ context }) => {
    //   const { joinGroupThatWereDeterminingRightNow } = context;
    //   const flagPropertyName =
    //     joinGroupThatWereDeterminingRightNow === 'externalReview'
    //       ? 'externalReviewEnabled'
    //       : 'internalAppRatingEnabled';
    //   const variant = Controlled.featureFlagClient.getVariant(FeatureFlags.MOBILE_EXTERNAL_REVIEW_SETTINGS);
    //   const jsonStr = variant.payload?.value;
    //   // @ts-expect-error TODO better feature flag  client
    //   const payload = JSON.parse(jsonStr) as ReviewAndRatingFeatureFlagPayload;
    //   const flagPropertyValue = payload[flagPropertyName];
    //   console.log({ flagPropertyValue });
    //   return flagPropertyValue;
    // },
    //
  },
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
  context: ({ input }) => {
    // const reviewsAndRatings = entityTracker.getLastEntityValue('reviewsAndRatings');
    // const flows = entityTracker.getLastEntityValue('flows');
    // const hearingAids = entityTracker.getLastEntityValue('hearingAids');
    // const user = entityTracker.getLastEntityValue('realJabraUser');
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
      invoke: {
        src: "fetchGroupInvite",
        input: ({ context }) => {
          return {
            groupInviteId: context.groupInviteId,
            account: context.account,
          };
        },
      },
      onDone: {
        target: "Checking Invite Status",
        actions: assign({
          groupInviteMetadata: (_, event) => event.output,
        }),
      },
      onError: {
        target: "Error",
        actions: assign({
          error: (_, event) => event.data,
        }),
      },
    },
    "Checking Invite Status": {
      always: [
        {
          guard: "isInviteValid",
          target: "Waiting For User To Join",
        },
        {
          target: "Invalid Invite",
        },
      ],
    },
    "Waiting For User To Join": {
      on: {
        "user.didTapJoinGroup": {
          target: "Sending Join Request",
        },
      },
    },
    "Sending Join Request": {
      invoke: {
        src: "sendJoinRequest",
        input: ({ context }) => {
          return {
            account: context.account,
            groupInviteId: context.groupInviteId,
          };
        },
      },
      onDone: {
        target: "Polling Join Request Status",
        actions: assign({
          joinRequestId: (_, event) => event.output.id,
        }),
      },
      onError: {
        target: "Error",
        actions: assign({
          error: (_, event) => event.data,
        }),
      },
    },
    "Polling Join Request Status": {
      invoke: {
        src: "pollJoinRequestStatus",
        input: ({ context }) => {
          return {
            joinRequestId: context.joinRequestId,
          };
        },
      },
      onDone: [
        {
          guard: "isJoinAccepted",
          target: "Join Successful",
        },
        {
          guard: "isJoinRejected",
          target: "Join Rejected",
        },
        {
          target: "Error",
        },
      ],
      onError: {
        target: "Error",
        actions: assign({
          error: (_, event) => event.data,
        }),
      },
    },
    "Join Successful": {
      type: "final",
    },
    "Join Rejected": {
      type: "final",
    },
    "Invalid Invite": {
      type: "final",
    },
    "Error": {
      type: "final",
    },
  },
    //
    // 'Checking If Feedback Enabled via Feature Flag': {
    //   always: [
    //     {
    //       guard: 'isFeedbackEnabled',
    //       target: 'Checking If The Feedback Is Due To Show',
    //     },
    //     {
    //       actions: () => {
    //         return assign({
    //           joinGroupThatWereDeterminingRightNow: 'internalRating',
    //         });
    //       },
    //       target: 'Checking If Feedback Enabled via Feature Flag',
    //       reenter: true,
    //     },
    //   ],
    // },
    //
    // 'Checking If The Feedback Is Due To Show': {
    //   always: [
    //     {
    //       guard: 'isFeedbackDue',
    //       target: 'Checking If Hearing Aids Are Connected',
    //     },
    //     {
    //       actions: () => {
    //         return assign({
    //           joinGroupThatWereDeterminingRightNow: 'internalRating',
    //         });
    //       },
    //       target: 'Checking If Feedback Enabled via Feature Flag',
    //       reenter: true,
    //     },
    //   ],
    // },
    //
    // 'Checking If Hearing Aids Are Connected': {
    //   always: [
    //     { guard: 'areHearingAidsConnected', target: 'Checking If The Feedback Tray Has Been Shown' },
    //     {
    //       actions: () => {
    //         return assign({
    //           groupInvitesThatWereDeterminingRightNow: 'internalRating',
    //         });
    //       },
    //       target: 'Checking If Feedback Enabled via Feature Flag',
    //       reenter: true,
    //     },
    //   ],
    // },
    //
    // 'Checking If The Feedback Tray Has Been Shown': {
    //   always: [
    //     { guard: 'feedbackTrayHasNotBeenShown', target: 'Checking If The User Is Retail' },
    //     {
    //       actions: () => {
    //         return assign({
    //           groupInvitesThatWereDeterminingRightNow: 'internalRating',
    //         });
    //       },
    //       target: 'Checking If Feedback Enabled via Feature Flag',
    //       reenter: true,
    //     },
    //   ],
    // },
    //
    // 'Checking If The User Is Retail': {
    //   always: [
    //     { guard: 'isUserRetail', target: 'Checking If App Is In An Important Flow' },
    //     {
    //       actions: () => {
    //         return assign({
    //           groupInvitesThatWereDeterminingRightNow: 'internalRating',
    //         });
    //       },
    //       target: 'Checking If Feedback Enabled via Feature Flag',
    //       reenter: true,
    //     },
    //   ],
    // },
    //
    // 'Checking If App Is In An Important Flow': {
    //   always: [
    //     { guard: 'appIsNotInAnImportantFlow', target: 'Feedback Timer Counting Down' },
    //     { target: 'Waiting For App Flow Completion' },
    //   ],
    // },
    //
    // 'Feedback Timer Counting Down': {
    //   after: {
    //     30_000: { target: 'Transient Determine Which Prompt to Show' },
    //   },
    //   on: {
    //     // todo we could do an always and check if the event represents
    //     // a flow starting...
    //     'flow.started': { target: 'Waiting For App Flow Completion' },
    //     'emitted.storage.updated.flows': {
    //       actions: ({ event }) => {
    //         console.log({ event });
    //         const { pairing, installingRft } = event.data;
    //         const isInAnImportantFlow = pairing || installingRft;
    //         if (isInAnImportantFlow) {
    //           raise({ type: 'flow.started' });
    //         }
    //       },
    //     },
    //   },
    // },
    //
    // 'Transient Determine Which Prompt to Show': {
    //   always: [
    //     { guard: 'isExternalReview', target: 'Showing External Review Prompt' },
    //     { guard: 'isInternalRating', target: 'Showing Internal Rating Prompt' },
    //     { target: 'Not Going To Show This Session' },
    //   ],
    // },
    //
    // 'Waiting For App Flow Completion': {
    //   on: {
    //     'flow.completed': { target: 'Feedback Timer Counting Down' },
    //
    //     'emitted.storage.updated.flows': {
    //       actions: ({ event }) => {
    //         const { pairing, installingRft } = event.data;
    //         const isInAnImportantFlow = pairing || installingRft;
    //         if (!isInAnImportantFlow) {
    //           raise({ type: 'flow.completed' });
    //         }
    //       },
    //     },
    //   },
    // },
    //
    // 'Showing External Review Prompt': {
    //   on: {
    //     // 'user.didTapWriteAReview': { target: 'Checking If Internal Rating Enabled via Feature Flag' },
    //     // 'user.didTapDismiss': { target: 'Checking If Internal Rating Enabled via Feature Flag' },
    //   },
    // },
    //
    // 'Showing Internal Rating Prompt': {
    //   on: {
    //     'user.didTapPositiveFeedback': { target: 'Not Going To Show This Session' },
    //     'user.didTapNegativeFeedback': { target: 'Not Going To Show This Session' },
    //     'user.didTapDismiss': { target: 'Not Going To Show This Session' },
    //   },
    // },
    //
    // 'Not Going To Show This Session': {
    //   type: 'final',
    // },
  },
});

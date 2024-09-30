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
  /** @xstate-layout N4IgpgJg5mDOIC5QFdZgE4DEyQEYEMBjAawFkiALASwDswA6AYQrBNqgAIBJAMw4FEAHgBcMNfABsOAJTAA3KmADuA8bgmQOC-B2z5hydGF0T8UAMQ8cEAiXpgRYybIXK9Bo5lNR+ajRABtAAYAXURQAAcAe1gqYSoomnCQQUQAWgBGDIAmegBWAHZsgBYATmK8gA5KjKDSvOyAGhAAT3SM4voOgGZqqoA2AqCajMGAXzHm1AxsPCIySloGZlZidm4+IVF0cSkXRRVffHVNbV0wfUNjLzNLa1tie0cd53kD9yubqAARKlhj-zBMJIEDRWLxRLJVIIbp1ejZSoVSpBKoFPIo0r9ZptBCZboZehlArdArE0nDbLZAoTKZoLD3ebkQjUOhMFhsGicXgcAAqLBkb2U3FgHG+yGMPKiHAAyhQoko7nM7A5trt9souLAxWAgckwXEEkkQdC0v0CUFitlBviMpUChkCv1utjENl6vRyrDEcUHciqsUaSBpvSlQtmUs2at1ty+cZ1SpNaLxbypbL5YqbPMnqrXq4lJqAHJRYTa3Ug-UQo2gaHddFdbo+4oNmpo0oOl0IDLdfr0J3Iu39YoFTFuyqB4OzTMkJks5bstacjYcAASF3Q6wAglQICKN0YOIxEnRCKIIBmHvQ-oeaMfT5LV-h15ytzuy5EYgbIcb0ojCeiihUJKOjaHb9EEuRdvalTdt0pQIkE-TjnSk4PDOEYrByXJ8A+T6cC+u77tet6QOeWZ-EWwhEawd5RDh7D4W+oIfpWUKIN0Vr0DUCGWqUvElNUHZDgSOSVJi6LwWiSEzAy06LKyGELlhvL8lsTh7IKKg8ug+AtCu+AigAQjgNAynKSg0KRyrPGqGlaTpy76RRRlgDQabmYxFaGqxuI5D2GR5JidqWkEtbdM6rSIHBBQena4EOm6xT9NkGRSSGU5hrOkaYUusYCNZkgCnmvLabpDmGcZpnyhZVihtmanxnZLRlc5rlmTQHnMV534wlkXTZN2FSOmavQdqSEGYg6DZgWBTapShjJyXOUaLjG-IAKp0sKArCPgVASJZjzBpqsg7XtHXgl11bpA0eTwiF9p5Bkbawk9HZdg69BFDdWROl61KTEGyEyRl6HztGfC5RtGBbSdu37TV6X0EdsAUbDZ2hHqnVfldCB5GFnHDsMFSUnUcFvQ6t39FTDSVEl-QNEOc3A2h8lgytfDCPyAAyYBQEQukbhEEQyPo6yNXp5UuZV5kHfQFCOcW0rGTzfOEC0gsRNIouco152flWKTtNkQQxTdTrFEOdrDm9+LRV92SPaMYXDP9tLSaGLNLdl3Kc8YKv8xwGsi-Ei7i2VHAtdL1XA3L+lKy5-tqxrWsh1AusY+WWMG9CpQNvCU21lSufDOFOLvXb-FhcSbZdgGAMTszi1ZYpS5B4mXAmRuJlcAAttE6A7TQwgmPKHAABSqS8EgAJSy-gQuFsWHdd73-eD8IXjynrLHdWkueffTcGW8SsFWm9lR5J0RT9Tk-UBXaY710DHtNwp4OB0LW0d4H3d91EA-4CHiPFQE98ozzngvWAy8aCr3-uvTeSht6XUNrjIIJsEKwUSuxZEYE7RvSSibYcVR-IBWNsbboTMX7hlZJPXYhUDi8ioD3aGh5kBD3WN8KqlgJDynoLAHaA9IBIOxigx00VKR5EkbWNsAUggFHPpfT6lIGxtlpqUaClD0qe3oLQgq8ZGHMPQAeKIbDU6ii4WAHucRTx8OEP-MwDBkARAgPoSA9AeA8KULAYR2dXT7zAg7J6wU6jWwip2C+0V+jVExAUUSpQ6h5EQk-d2Wim66PUkVHkTCWEmPYYuThMtBD8NcfQfAPBthj1hGgoIs8G5UMyuk+hQosmGOMaYjhVUfHeS7KUD0pIHTFAiSTRKHYHYFE6L6SkloGhZAtpo1CTcADqu0zGYH-nlHMGSGEIOMX3DQlZuG8MIFEPZYBTxdO6rURK8Iahuiev2RJTQwm2kUdfIomIwK2nYvMha1CGDLINIuNZRjGn6J2YeU5BzLHWLcfw+xMAkbONcRAdxnjvEZ3fBdER0JaiiXhFaM0okGxdmSm9H0t16hoLdGiX6PzZJ-PoG5dYoKNIcAAAroBOREYQ5hgz0AgNuHk89FnrlEBueMFycY1D6k6BmtR1FogyKM3OuR7pokqFSWZdKQasiZYuFlRUOVcp5XygVEAhURF+LAKxsB0XAkxfrbyTZbqOhKHBREGrT6jPtJE2CL1jaYgQtq7Rb92bcCHmpYOzK-CnCoDoD4+4viy1oJslO7AE1gC+EcE4gQMVMSxb4zsbZOhwXAr0OoaikrKttJ9Xi5Qna50HHkYNr82ZKQ7psqN+qY0QC0HG84lxE3eGTRGqeabOQZq+FagEQi82eWxYgJ6HQPRkPLeo-oI5vVJU+jUdECEUSDhCi2hlob22jroeOrkIptQjtTdrKAmpSxzqzt0v1+R-K3xKJaUklQOywmHB6LsyJ7SJQtFTY9mVT1Lg7ZGy9W0b0IwvCm+q97F4lnFJKlBPTujvsepSL9VJYl-pCug6oCJ6YaoPY-N2aUFknrba3T+7dO6-zXoA4eOyx4wanrPRDWZ54RDQ9A2BACh4IMw9CZKcJ4nQSifTcZdQ-2jBNg0D5QSnpwQock2jvzIMMe5G3EU38u7cD-qJjjnjx7cd2LxmOAnNTCbM-AzxEnF1vsenhqZ36iNhPxGBfIboqbqb4lpmj816WZWs3o+9BicntPyVwopO1RClPKRgSp1Sam8ufqkhlUW9gxZaXFvJnACntWfQW7yVInT0GqdBZRVRoJKe3SRm0yUshWggxGAFqz1n5a7ZwcFXL9mGkOUoegxzIWzvtfmx1lz3MfvwxbQjv7fNSfoLWR6Gr0T3069p8LOqGB6q5Oe6LZijV9xNXSflgr55ss6nITNwNXM9WggfB2lJXXVBJEp42G2rSJPGfBclXXdVmWjKdgr53OWXeyxgG75r54Fl5qLR7B2Xv4je66ho1WETQXkb5h0Jt-LGztHxEKXZQdHfBytSHA32Uw+5XD9ACOLVWptXazGlXuqY5w9jz7SVvsE5xP+lTQQrlyeKCiFKgYaBRAgHAZIdTcuzi53NnGaRCg4fIQ9JdL1SgdjSIEjbUSvlDjqGaJJYXG70eWkpA1DDs3+D7fGi4HhrjeDVzvDXkEPSJWqBbXFl8iiG9GJ0C0NMnpU0SmUKnzd365X0YmbUKZpZe+QSaPFwwkpXKpLTYY5NciiSJ-Ep6CIwqhcBikujem7dLjooufCgdCJHmopAdPC7cR2k4g6eKVJ0SjEpIJIYtbD5TSmTkOPUHVrGAd80kqEsI4VTcgbedhbMgW3rLacX1Qd+utGvaTifYd-lHJM2-bNva-ewhutTaiY0YSA7+v+mvYqawjKIURKQw8hvQQpUQDtQQwvQhcVuVeOmEWoMdePs3MKOasH8wscGYc+kS+UsK+T+TqyUn0joJ+4EgyTYxQNsH0p8ZOAU4ykkF+9SkB1+8BX8LGpmbGQCnG6S086Bu8OQ0U3YtQvQk0okYib0pBtWZQ4u9QsEHQeMcec+mk2SRirCJW5i5krBOMgy-+jo0EVST0aCAkYSyUbohINKgONotocePW6wwKGysGrKQ2kKyCa+3k5QJsTYGq9QtMME-k+Cf2WCFsUuVotog4cex25hU8TSKgF23KihKCj08IZs4Eg4DY4ETyOImqHBciTYPSCSpQU++mfA-WcGTusarug6HuZg4ROKX0vYYksqucAywuroVo0U229QAS4uJQ5+1ulBrMUB2RdOcGye4oJRi6ciOGdQPoCEtQciFoNRMIFouQFsRQwwvovEpImRnRNBzGP89BcC7GwCVmkOLBmc3OOMROOGIx6iYUUutskxfmJsG6Q00EmhsxceORhW0hbSchZW-RCAX6t0hQokRcQwpI4yzW1xpQtxVS3orsYBB22iJhQKfW3RMWVhEQI2IithlycUhIKI2B8xG6r0a24EhIPoM0yisSEJyuNeEYARTx0OxqHxCIcEMUIkw4Fs+IgyQJ5RaIQwOQohceFEHAAA4lEGLKmGZMpH8DKHALECiS+jzkOLkBNMSHaLIsOKXGxAhL0paCUPTHgfUDLhMEAA */
  id: "joinGroupMachine",
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
      onDone: {},
      onError: {},
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

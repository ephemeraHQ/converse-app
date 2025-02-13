import { useAuthStore } from "@/features/authentication/auth.store";
import { ensureCurrentUserQueryData } from "@/features/authentication/user-query";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { captureError } from "@/utils/capture-error";

export const hydrateAuth = async () => {
  try {
    const currentUser = await ensureCurrentUserQueryData({
      caller: "hydrateAuth",
    });

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const inboxes = currentUser.inboxes.map((inbox) => ({
      inboxId: inbox.inboxId,
      ethereumAddress: inbox.privyEthAddress,
    }));

    await MultiInboxClient.instance.restorePreviouslyCreatedInboxesForDevice({
      inboxes,
    });

    useAuthStore.getState().actions.setStatus("signedIn");
  } catch (error) {
    captureError(error);
    useAuthStore.getState().actions.setStatus("signedOut");
  }
};

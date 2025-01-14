import React, { memo, useCallback } from "react";

import { OnboardingPictoTitleSubtitle } from "@components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingScreenComp } from "@components/Onboarding/OnboardingScreenComp";
import { translate } from "@i18n";
import {
  PasskeyAuthStoreProvider,
  usePasskeyAuthStoreContext,
} from "@/features/onboarding/passkey/passkeyAuthStore";
import { Button } from "@/design-system/Button/Button";
import { Text } from "@/design-system/Text";
import { useRouter } from "@/navigation/useNavigation";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { converseEventEmitter } from "@/utils/events";
import { PrivyAuthStoreProvider } from "@/features/onboarding/Privy/privyAuthStore";
import {
  isMissingConverseProfile,
  needToShowNotificationsPermissions,
} from "./Onboarding.utils";
import { setAuthStatus } from "@/data/store/authStore";
import { usePrivySmartWalletConnection } from "@/features/onboarding/Privy/usePrivySmartWalletConnection";
import { useCreatePasskey } from "@/features/onboarding/passkey/useCreatePasskey";
import { useLoginWithPasskey } from "@/features/onboarding/passkey/useLoginWithPasskey";

export const OnboardingPasskeyScreen = memo(function Screen() {
  return (
    <PrivyAuthStoreProvider>
      <PasskeyAuthStoreProvider>
        <Content />
      </PasskeyAuthStoreProvider>
    </PrivyAuthStoreProvider>
  );
});

const Content = memo(function Content() {
  const router = useRouter();
  // Passkey Store Hooks
  const loading = usePasskeyAuthStoreContext((state) => state.loading);

  const statusString = usePasskeyAuthStoreContext(
    (state) => state.statusString
  );

  const account = usePasskeyAuthStoreContext((state) => state.account);

  const setError = usePasskeyAuthStoreContext((state) => state.setError);

  const setStatusString = usePasskeyAuthStoreContext(
    (state) => state.setStatusString
  );
  const { createPasskey: handleCreateAccountWithPasskey } = useCreatePasskey();

  const { loginWithPasskey: handleLoginWithPasskey } = useLoginWithPasskey();

  const handleError = useCallback(
    (error: Error) => {
      logger.error(error);
      setError(error.message);
      captureErrorWithToast(error);
    },
    [setError]
  );

  usePrivySmartWalletConnection({
    onConnectionDone: () => {
      if (isMissingConverseProfile()) {
        router.navigate("OnboardingUserProfile");
      } else if (needToShowNotificationsPermissions()) {
        router.navigate("OnboardingNotifications");
      } else {
        setAuthStatus("signedIn");
      }
    },
    onConnectionError: handleError,
    onStatusChange: setStatusString,
  });

  const showDebug = useCallback(() => {
    converseEventEmitter.emit("showDebugMenu");
  }, []);

  return (
    <OnboardingScreenComp preset="scroll">
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Title>
          {translate("passkey.title")}
        </OnboardingPictoTitleSubtitle.Title>
      </OnboardingPictoTitleSubtitle.Container>
      {statusString && (
        <Text style={{ marginBottom: 10 }} preset="body">
          {statusString}
        </Text>
      )}
      {account && (
        <Text preset="bodyBold">
          Account created:
          <Text preset="body">{account}</Text>
        </Text>
      )}
      <Button
        text={translate("passkey.createButton")}
        onPress={handleCreateAccountWithPasskey}
        onLongPress={showDebug}
        loading={loading}
      />
      <Button
        text={"Login with passkey"}
        onPress={handleLoginWithPasskey}
        loading={loading}
      />
    </OnboardingScreenComp>
  );
});

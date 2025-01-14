import React, { memo, useCallback } from "react";

import { NewAccountScreenComp } from "@components/NewAccount/NewAccountScreenComp";
import { NewAccountPictoTitleSubtitle } from "@components/NewAccount/NewAccountTitleSubtitlePicto";
import {
  PasskeyAuthStoreProvider,
  usePasskeyAuthStoreContext,
} from "@features/onboarding/passkey/passkeyAuthStore";
import { translate } from "@i18n";
import { useRouter } from "@navigation/useNavigation";
import { isMissingConverseProfile } from "../Onboarding/Onboarding.utils";
import { Button } from "@/design-system/Button/Button";
import { Text } from "@/design-system/Text";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { converseEventEmitter } from "@/utils/events";
import { PrivyAuthStoreProvider } from "@/features/onboarding/Privy/privyAuthStore";
import { usePrivySmartWalletConnection } from "@/features/onboarding/Privy/usePrivySmartWalletConnection";
import { useLoginWithPasskey } from "@/features/onboarding/passkey/useLoginWithPasskey";
import { useCreatePasskey } from "@/features/onboarding/passkey/useCreatePasskey";

export const NewAccountPasskeyScreen = memo(function () {
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

  const error = usePasskeyAuthStoreContext((state) => state.error);

  const setError = usePasskeyAuthStoreContext((state) => state.setError);

  const setStatusString = usePasskeyAuthStoreContext(
    (state) => state.setStatusString
  );

  const showDebug = useCallback(() => {
    converseEventEmitter.emit("showDebugMenu");
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      logger.error(error);
      setError(error.message);
      captureErrorWithToast(error);
    },
    [setError]
  );

  const { createPasskey: handleCreateAccountWithPasskey } = useCreatePasskey();

  const { loginWithPasskey: handleLoginWithPasskey } = useLoginWithPasskey();

  usePrivySmartWalletConnection({
    onConnectionDone: () => {
      if (isMissingConverseProfile()) {
        router.navigate("NewAccountUserProfile");
      } else {
        router.popTo("Chats");
      }
    },
    onConnectionError: handleError,
    onStatusChange: setStatusString,
  });

  return (
    <NewAccountScreenComp>
      <NewAccountPictoTitleSubtitle.Container>
        <NewAccountPictoTitleSubtitle.Title>
          {translate("passkey.add_account_title")}
        </NewAccountPictoTitleSubtitle.Title>
      </NewAccountPictoTitleSubtitle.Container>
      {statusString && (
        <Text style={{ marginBottom: 10 }} preset="body">
          {statusString}
        </Text>
      )}
      {error && (
        <Text preset="body" color="caution">
          {error}
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
    </NewAccountScreenComp>
  );
});

import React, { memo, useCallback, useRef } from "react";

import { OnboardingPictoTitleSubtitle } from "@components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingScreenComp } from "@components/Onboarding/OnboardingScreenComp";
import { translate } from "@i18n";
import {
  PasskeyAuthStoreProvider,
  usePasskeyAuthStoreContext,
} from "@/features/onboarding/passkey/passkeyAuthStore";
import { onPasskeyCreate } from "@/utils/passkeys/create-passkey";
import { Button } from "@/design-system/Button/Button";
import { Text } from "@/design-system/Text";
import { TextField } from "@/design-system/TextField/TextField";
import { initXmtpClientFromViemAccount } from "@/components/Onboarding/init-xmtp-client";
import { addWalletToPasskey } from "@/utils/passkeys/add-wallet-to-passkey";
import { loadAccountFromPasskey } from "@/utils/passkeys/load-client-from-passkey";
import {
  isMissingConverseProfile,
  needToShowNotificationsPermissions,
} from "./Onboarding.utils";
import { useRouter } from "@/navigation/useNavigation";
import { setAuthStatus } from "@/data/store/authStore";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";

export const OnboardingPasskeyScreen = memo(function Screen() {
  return (
    <PasskeyAuthStoreProvider>
      <Content />
    </PasskeyAuthStoreProvider>
  );
});

const Content = memo(function Content() {
  const router = useRouter();

  const loading = usePasskeyAuthStoreContext((state) => state.loading);

  const statusString = usePasskeyAuthStoreContext(
    (state) => state.statusString
  );

  const account = usePasskeyAuthStoreContext((state) => state.account);

  const turnkeyInfo = usePasskeyAuthStoreContext((state) => state.turnkeyInfo);

  const previousPasskeyName = usePasskeyAuthStoreContext(
    (state) => state.previousPasskeyName
  );

  const setLoading = usePasskeyAuthStoreContext((state) => state.setLoading);

  const setError = usePasskeyAuthStoreContext((state) => state.setError);

  const setStatusString = usePasskeyAuthStoreContext(
    (state) => state.setStatusString
  );

  const setAccount = usePasskeyAuthStoreContext((state) => state.setAccount);

  const setTurnkeyInfo = usePasskeyAuthStoreContext(
    (state) => state.setTurnkeyInfo
  );

  const setPreviousPasskeyName = usePasskeyAuthStoreContext(
    (state) => state.setPreviousPasskeyName
  );

  const inputTextRef = useRef<string>("");

  const handleError = useCallback(
    (error: string) => {
      logger.error(error);
      setError(error);
      captureErrorWithToast(error);
    },
    [setError]
  );

  const handleCreatePasskey = useCallback(async () => {
    try {
      setLoading(true);
      const account = await onPasskeyCreate({
        passkeyName: inputTextRef.current ?? "",
        setStatusString,
        setPreviousPasskeyName,
        setTurnkeyInfo,
      });
      if (!account) {
        handleError("No account created from Passkey");
        return;
      }
      setAccount(account);
    } catch (e) {
      handleError(
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Unknown error"
      );
    } finally {
      setLoading(false);
    }
  }, [
    setAccount,
    handleError,
    setLoading,
    setPreviousPasskeyName,
    setStatusString,
    setTurnkeyInfo,
  ]);

  const handleLoginWithPasskey = useCallback(async () => {
    try {
      setLoading(true);
      const { account } = await loadAccountFromPasskey({
        setStatusString,
        setPreviousPasskeyName,
        setTurnkeyInfo,
      });
      if (!account) {
        handleError("No account loaded from Passkey");
        throw new Error("No account loaded from Passkey");
      }
      setAccount(account);
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [
    setAccount,
    handleError,
    setLoading,
    setPreviousPasskeyName,
    setStatusString,
    setTurnkeyInfo,
  ]);

  const handleAddWalletToPasskey = useCallback(async () => {
    try {
      setLoading(true);
      if (!turnkeyInfo) {
        setStatusString("No turnkey info, you must create a passkey first");
        return;
      }
      await addWalletToPasskey({
        subOrgId: turnkeyInfo.subOrganizationId,
        setStatusString,
      });
      setStatusString("Wallet added to passkey");
    } catch (e) {
      handleError(
        e instanceof Error ? e.message : "Error adding wallet to passkey"
      );
    } finally {
      setLoading(false);
    }
  }, [turnkeyInfo, handleError, setLoading, setStatusString]);

  const createXmtpClientFromAccount = useCallback(async () => {
    try {
      setLoading(true);
      if (!account) {
        setStatusString("Need to set an account first");
        return;
      }
      await initXmtpClientFromViemAccount({
        account,
        address: account.address,
      });
      if (isMissingConverseProfile()) {
        router.navigate("OnboardingUserProfile");
      } else if (needToShowNotificationsPermissions()) {
        router.navigate("OnboardingNotifications");
      } else {
        setAuthStatus("signedIn");
      }
      setStatusString("Xmtp client created");
    } catch (err) {
      console.log("error creating Xmtp client", err);
      setStatusString("");
      handleError(
        "Error creating Xmtp client : " +
          (err instanceof Error ? err.message : "") +
          (typeof err === "string" ? err : "")
      );
    } finally {
      setLoading(false);
    }
  }, [account, router, handleError, setLoading, setStatusString]);

  const onboardWithPasskey = useCallback(async () => {
    try {
      setLoading(true);
      const account = await onPasskeyCreate({
        passkeyName: inputTextRef.current ?? "",
        setStatusString,
        setPreviousPasskeyName,
        setTurnkeyInfo,
      });
      await initXmtpClientFromViemAccount({
        account,
        address: account.address,
      });
      if (isMissingConverseProfile()) {
        router.navigate("OnboardingUserProfile");
      } else if (needToShowNotificationsPermissions()) {
        router.navigate("OnboardingNotifications");
      } else {
        setAuthStatus("signedIn");
      }
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [
    setLoading,
    setStatusString,
    setPreviousPasskeyName,
    setTurnkeyInfo,
    router,
    handleError,
  ]);

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
      {previousPasskeyName && (
        <Text preset="bodyBold">
          Previous passkey name:
          <Text preset="body">{previousPasskeyName}</Text>
        </Text>
      )}
      {turnkeyInfo && (
        <Text preset="bodyBold">
          Turnkey info:
          <Text preset="body">{JSON.stringify(turnkeyInfo)}</Text>
        </Text>
      )}
      {account && (
        <Text preset="bodyBold">
          Account created:
          <Text preset="body">{account.address}</Text>
        </Text>
      )}
      <TextField
        placeholder="Enter your passkey"
        onChangeText={(text) => {
          inputTextRef.current = text;
        }}
      />
      <Button
        text={"Onboard with passkey"}
        onPress={onboardWithPasskey}
        loading={loading}
      />
      <Button
        text={translate("passkey.createButton")}
        onPress={handleCreatePasskey}
        loading={loading}
        variant="secondary"
      />
      <Button
        text={"Login with passkey"}
        onPress={handleLoginWithPasskey}
        loading={loading}
        variant="secondary"
      />
      <Button
        text={"Add new wallet to passkey"}
        onPress={handleAddWalletToPasskey}
        loading={loading}
        variant="secondary"
      />
      <Button
        text={"Create Xmtp client from account"}
        onPress={createXmtpClientFromAccount}
        loading={loading}
        variant="secondary"
      />
    </OnboardingScreenComp>
  );
});

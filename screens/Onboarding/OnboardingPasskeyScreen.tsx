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

  const error = usePasskeyAuthStoreContext((state) => state.error);

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
        setError("No account created from Passkey");
        return;
      }
      setAccount(account);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [
    setAccount,
    setError,
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
        setError("No account loaded from Passkey");
        throw new Error("No account loaded from Passkey");
      }
      setAccount(account);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [
    setAccount,
    setError,
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
      setError(
        e instanceof Error ? e.message : "Error adding wallet to passkey"
      );
    } finally {
      setLoading(false);
    }
  }, [turnkeyInfo, setError, setLoading, setStatusString]);

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
      setError(
        "Error creating Xmtp client : " +
          (err instanceof Error ? err.message : "") +
          (typeof err === "string" ? err : "")
      );
    } finally {
      setLoading(false);
    }
  }, [account, router, setError, setLoading, setStatusString]);

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
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [
    setLoading,
    setStatusString,
    setPreviousPasskeyName,
    setTurnkeyInfo,
    router,
    setError,
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
      {error && (
        <Text preset="body" color="caution">
          {error}
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

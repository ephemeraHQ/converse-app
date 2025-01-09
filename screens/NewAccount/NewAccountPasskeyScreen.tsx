import React, { memo, useCallback, useRef } from "react";

import { NewAccountScreenComp } from "@components/NewAccount/NewAccountScreenComp";
import { NewAccountPictoTitleSubtitle } from "@components/NewAccount/NewAccountTitleSubtitlePicto";
import {
  PasskeyAuthStoreProvider,
  usePasskeyAuthStoreContext,
} from "@features/onboarding/passkey/passkeyAuthStore";
import { translate } from "@i18n";
import { useRouter } from "../../navigation/useNavigation";
import { isMissingConverseProfile } from "../Onboarding/Onboarding.utils";
import { addWalletToPasskey } from "@/utils/passkeys/add-wallet-to-passkey";
import { initXmtpClientFromViemAccount } from "@/components/Onboarding/init-xmtp-client";
import { Button } from "@/design-system/Button/Button";
import { TextField } from "@/design-system/TextField/TextField";
import { Text } from "@/design-system/Text";
import { onPasskeyCreate } from "@/utils/passkeys/create-passkey";
import { loadAccountFromPasskey } from "@/utils/passkeys/load-client-from-passkey";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { converseEventEmitter } from "@/utils/events";

export const NewAccountPasskeyScreen = memo(function () {
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

  const showDebug = useCallback(() => {
    converseEventEmitter.emit("showDebugMenu");
  }, []);

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
        return;
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
      setStatusString("Xmtp client created");
      if (isMissingConverseProfile()) {
        router.navigate("NewAccountUserProfile");
      } else {
        router.popTo("Chats");
      }
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
        router.navigate("NewAccountUserProfile");
      } else {
        router.popTo("Chats");
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

  const addWalletToExistingPasskey = useCallback(async () => {
    try {
      const { turnkeyInfo } = await loadAccountFromPasskey({
        setStatusString,
        setPreviousPasskeyName,
        setTurnkeyInfo,
      });
      setStatusString("Got turnkey info");

      if (!turnkeyInfo) {
        throw new Error("No turnkey info, you must create a passkey first");
      }

      const { account } = await addWalletToPasskey({
        subOrgId: turnkeyInfo.subOrganizationId,
        setStatusString,
      });
      setStatusString("Got address and account" + account.address);

      await initXmtpClientFromViemAccount({
        account,
        address: account.address,
      });
      if (isMissingConverseProfile()) {
        router.navigate("NewAccountUserProfile");
      } else {
        router.popTo("Chats");
      }
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [
    setStatusString,
    setPreviousPasskeyName,
    setTurnkeyInfo,
    router,
    handleError,
    setLoading,
  ]);

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
        onLongPress={showDebug}
      />
      <Button
        text={"Add new wallet to existing passkey"}
        onPress={addWalletToExistingPasskey}
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
    </NewAccountScreenComp>
  );
});

import React, { memo, useCallback, useRef, useState } from "react";

import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { translate } from "../../i18n";
import { PasskeyAuthStoreProvider } from "@/features/onboarding/passkey/passkeyAuthStore";
import {
  getWhoami,
  onPasskeyCreate,
  onPasskeySignature,
} from "@/utils/passkeys/createPasskey";
import { Button } from "@/design-system/Button/Button";
import { Text } from "@/design-system/Text";
import { LocalAccount } from "viem/accounts";
import { viemSignerToXmtpSigner } from "@/utils/xmtpRN/signer";
import { Client } from "@xmtp/react-native-sdk";
import {
  copyDatabasesToTemporaryDirectory,
  createTemporaryDirectory,
} from "@/utils/fileSystem";
import { getDbEncryptionKey } from "@/utils/keychain/helpers";
import { getInboxId } from "@/utils/xmtpRN/signIn";
import { getDbDirectory } from "@/data/db";
import { TextField } from "@/design-system/TextField/TextField";

export const OnboardingPasskeyScreen = memo(function Screen() {
  return (
    <PasskeyAuthStoreProvider loading={false}>
      <Content />
    </PasskeyAuthStoreProvider>
  );
});

const Content = memo(function Content() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const inputTextRef = useRef<string>("");

  const handleCreatePasskey = useCallback(async () => {
    try {
      setLoading(true);
      const account = await onPasskeyCreate(inputTextRef.current ?? "");
      if (!account) {
        return;
      }
      const tempDirectory = await createTemporaryDirectory();
      const dbEncryptionKey = await getDbEncryptionKey();
      const options = {
        env: "dev",
        enableV3: true,
        dbDirectory: tempDirectory,
        dbEncryptionKey,
      } as const;
      const inboxId = await getInboxId(account.address);

      await copyDatabasesToTemporaryDirectory(tempDirectory, inboxId);
      const xmptClient = await Client.create(
        viemSignerToXmtpSigner(account),
        options
      );
      const dm = await xmptClient.conversations.newConversation(
        "0x04B1E6971559f4AB1453392220d4f8173F41D7d9"
      );
      console.log("dm", dm);
      dm.send("Hello from passkey embedded wallet");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoginWithPasskey = useCallback(async () => {
    const account = await onPasskeySignature();
    if (!account) {
      return;
    }
    const dbDirectory = await getDbDirectory();
    const dbEncryptionKey = await getDbEncryptionKey();
    const options = {
      env: "dev",
      enableV3: true,
      dbDirectory,
      dbEncryptionKey,
    } as const;

    const xmptClient = await Client.build(account.address, options);
    const dm = await xmptClient.conversations.newConversation(
      "0x04B1E6971559f4AB1453392220d4f8173F41D7d9"
    );
    console.log("dm", dm);
    dm.send("Hello from persisted passkey embedded wallet");
  }, []);

  return (
    <OnboardingScreenComp preset="scroll">
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Title>
          {translate("passkey.title")}
        </OnboardingPictoTitleSubtitle.Title>
      </OnboardingPictoTitleSubtitle.Container>
      {error && (
        <Text preset="body" color="caution">
          {error}
        </Text>
      )}
      {account && <Text preset="body">Account created: {account.address}</Text>}
      <TextField
        placeholder="Enter your passkey"
        onChangeText={(text) => {
          inputTextRef.current = text;
        }}
      />
      <Button
        text={translate("passkey.createButton")}
        onPress={handleCreatePasskey}
        loading={loading}
      />
      <Button
        text={"Login with passkey"}
        onPress={handleLoginWithPasskey}
        loading={loading}
      />
      <Button text={"Check whoami"} onPress={getWhoami} loading={loading} />
    </OnboardingScreenComp>
  );
});

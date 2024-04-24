import { useLinkWithFarcaster } from "@privy-io/expo";
import { useState } from "react";
import { StyleSheet, useColorScheme, Text } from "react-native";

import config from "../../config";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  useCurrentAccount,
  useSettingsStore,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { notifyFarcasterLinked } from "../../utils/api";
import OnboardingComponent from "./OnboardingComponent";

export default function WarpcastConnect() {
  const styles = useStyles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentAccount = useCurrentAccount() as string;
  const { setSkipFarcaster } = useSettingsStore(
    useSelect(["setSkipFarcaster"])
  );
  const { linkWithFarcaster } = useLinkWithFarcaster({
    onSuccess: async () => {
      try {
        await notifyFarcasterLinked();
        await refreshProfileForAddress(currentAccount, currentAccount);
      } catch (e: any) {
        console.error(e);
        setError("An unknown error occurred");
      }
      setLoading(false);
    },
    onError: (error) => {
      setLoading(false);
      setError(error?.message);
    },
  });
  return (
    <OnboardingComponent
      title="Warpcast connect"
      picto="message.circle.fill"
      subtitle="Warpcast connect"
      primaryButtonText="Link"
      primaryButtonAction={() => {
        setLoading(true);
        setError("");
        linkWithFarcaster({
          relyingParty: `https://${config.websiteDomain}`,
        });
      }}
      isLoading={loading}
      backButtonText="Skip"
      backButtonAction={() => {
        setSkipFarcaster(true);
      }}
    >
      <Text>Connect to Warpcast</Text>
      {error && <Text>{error}</Text>}
    </OnboardingComponent>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({});
};

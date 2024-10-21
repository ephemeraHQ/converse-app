import {
  useCurrentAccount,
  useSettingsStore,
} from "@features/accounts/accounts.store";
import logger from "@utils/logger";
import { useState } from "react";
import { Text } from "react-native";

import OnboardingComponent from "./OnboardingComponent";
import config from "../../config";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { useSelect } from "../../data/store/storeHelpers";
import { notifyFarcasterLinked } from "../../utils/api";
import { useLinkFarcaster } from "../../utils/evm/privy";
import { refreshRecommendationsForAccount } from "../../utils/recommendations";

export default function WarpcastConnect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentAccount = useCurrentAccount() as string;
  const { setSkipFarcaster } = useSettingsStore(
    useSelect(["setSkipFarcaster"])
  );
  const linkWithFarcaster = useLinkFarcaster({
    onSuccess: async () => {
      try {
        await notifyFarcasterLinked();
        await refreshProfileForAddress(currentAccount, currentAccount);
        await refreshRecommendationsForAccount(currentAccount);
      } catch (e: any) {
        logger.error(e);
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

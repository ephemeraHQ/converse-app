import React from "react";
import { ScrollView } from "react-native";
import { Button } from "@/design-system/Button/Button";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api";
import { useAppTheme } from "@/theme/use-app-theme";
import { useConnectWalletStore } from "./connect-wallet.store";

type ISocialIdentityListProps = {
  onSocialIdentityTapped: (socialIdentity: ISocialProfile) => void;
};

/**
 * Displays a list of social identities associated with a wallet
 */
export function SocialIdentityList({
  onSocialIdentityTapped,
}: ISocialIdentityListProps) {
  const { theme } = useAppTheme();

  // Get state directly from the store
  const { socialData, isShowingSocialIdentityList, isShowingNoSocialsMessage } =
    useConnectWalletStore();

  if (isShowingNoSocialsMessage) {
    return <Text>No social identities found for this address.</Text>;
  }

  if (!isShowingSocialIdentityList || !socialData) {
    return null;
  }

  return (
    <VStack style={{ gap: theme.spacing.xs }}>
      <Text style={{ fontWeight: "bold" }}>Social Identities</Text>
      <ScrollView>
        {socialData.map((social) => (
          <Button
            key={`${social.name}-${social.type}`}
            text={`${social.name} (${social.type})`}
            onPress={() => onSocialIdentityTapped(social)}
            style={{ marginBottom: theme.spacing.xs }}
          />
        ))}
      </ScrollView>
    </VStack>
  );
}

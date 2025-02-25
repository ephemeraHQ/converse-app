import { InboxId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback } from "react";
import { Chip, ChipAvatar, ChipText } from "@/design-system/chip";
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { useSocialProfilesForEthAddressQueries } from "@/features/social-profiles/social-profiles.query";
import { useEthAddressesForXmtpInboxId } from "@/features/xmtp/xmtp-inbox-id/eth-addresses-for-xmtp-inbox-id.query";
import { Haptics } from "@/utils/haptics";
import { useConversationCreateSearchInputStore } from "./conversation-create-search-input.store";

export const ConversationCreateSearchInputChip = memo(
  function ConversationCreateSearchInputChip(props: { inboxId: InboxId }) {
    const { inboxId } = props;

    const { data: profile } = useProfileQuery({ xmtpId: inboxId });

    const currentSender = useSafeCurrentSender();

    const { data: ethAddresses } = useEthAddressesForXmtpInboxId({
      clientEthAddress: currentSender.ethereumAddress,
      inboxId,
    });

    const { data: socialProfiles } = useSocialProfilesForEthAddressQueries({
      ethAddresses: ethAddresses ?? [],
    });

    const selectedChipInboxId = useConversationCreateSearchInputStore(
      (state) => state.selectedChipInboxId,
    );

    const handlePress = useCallback(() => {
      Haptics.softImpactAsync();
      useConversationCreateSearchInputStore
        .getState()
        .actions.setSelectedChipInboxId(inboxId);
    }, [inboxId]);

    const allValidSocialProfiles = socialProfiles?.filter(Boolean);
    const firstAddressFirstSocialProfile = allValidSocialProfiles?.[0]?.[0];

    return (
      <Chip
        isSelected={selectedChipInboxId === inboxId}
        onPress={handlePress}
        size="md"
      >
        <ChipAvatar
          uri={profile?.avatar ?? firstAddressFirstSocialProfile?.avatar}
          name={profile?.name ?? firstAddressFirstSocialProfile?.name}
        />
        <ChipText>
          {profile?.name ?? firstAddressFirstSocialProfile?.name}
        </ChipText>
      </Chip>
    );
  },
);

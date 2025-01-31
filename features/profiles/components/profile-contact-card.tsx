import React, { memo } from "react";
import { ContactCard } from "./contact-card";
import { useAddPfp } from "@/features/onboarding/hooks/useAddPfp";
import { useCreateOrUpdateProfileInfo } from "@/features/onboarding/hooks/useCreateOrUpdateProfileInfo";
import { useProfile } from "@/features/onboarding/hooks/useProfile";

type IProfileContactCardProps = {
  displayName: string;
  userName?: string;
  avatarUri?: string;
  isMyProfile?: boolean;
  editMode?: boolean;
  onToggleEdit?: () => void;
};

/**
 * ProfileContactCard Container
 *
 * A container component that handles the data layer for the profile contact card.
 * Manages profile updates and avatar changes.
 */
export const ProfileContactCard = memo(function ProfileContactCard({
  displayName,
  userName,
  avatarUri,
  isMyProfile,
  editMode,
  onToggleEdit,
}: IProfileContactCardProps) {
  const { addPFP, asset } = useAddPfp();
  const { profile, setProfile } = useProfile();
  const { createOrUpdateProfile } = useCreateOrUpdateProfileInfo();

  const handleSave = async () => {
    try {
      const { success } = await createOrUpdateProfile({ profile });
      if (success && onToggleEdit) {
        onToggleEdit();
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDisplayNameChange = (text: string) => {
    setProfile({ ...profile, displayName: text });
  };

  return (
    <ContactCard
      displayName={displayName}
      userName={userName}
      avatarUri={asset?.uri || avatarUri}
      isMyProfile={isMyProfile}
      editMode={editMode}
      onToggleEdit={editMode ? handleSave : onToggleEdit}
      onAvatarPress={addPFP}
      onDisplayNameChange={handleDisplayNameChange}
      editableDisplayName={profile.displayName}
    />
  );
});

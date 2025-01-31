import React, { memo, useState, useEffect } from "react";
import { ContactCard } from "./components/contact-card";
import { useAddPfp } from "@/features/onboarding/hooks/useAddPfp";
import { useCreateOrUpdateProfileInfo } from "@/features/onboarding/hooks/useCreateOrUpdateProfileInfo";
import { useProfile } from "@/features/onboarding/hooks/useProfile";
import logger from "@/utils/logger";

type IProfileContactCardProps = {
  displayName: string;
  userName?: string;
  avatarUri?: string;
  isMyProfile?: boolean;
  editMode?: boolean;
};

export const ProfileContactCard = memo(function ProfileContactCard({
  displayName: initialDisplayName,
  userName,
  avatarUri,
  isMyProfile,
  editMode,
}: IProfileContactCardProps) {
  const { profile, setProfile } = useProfile();
  const { addPFP, asset } = useAddPfp();
  const { createOrUpdateProfile, loading } = useCreateOrUpdateProfileInfo();
  const [hasChanges, setHasChanges] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState(initialDisplayName);
  const [previousEditMode, setPreviousEditMode] = useState(editMode);

  // Update local display name when initial changes
  useEffect(() => {
    setLocalDisplayName(initialDisplayName);
  }, [initialDisplayName]);

  const handleDisplayNameChange = (text: string) => {
    setLocalDisplayName(text);
    setHasChanges(true);
  };

  const handleAvatarPress = () => {
    addPFP();
    setHasChanges(true);
  };

  useEffect(() => {
    if (asset?.uri) {
      setProfile({ ...profile, avatar: asset.uri });
      setHasChanges(true);
    }
  }, [asset?.uri, profile, setProfile]);

  // Save changes when exiting edit mode
  useEffect(() => {
    const isExitingEditMode = previousEditMode && !editMode;
    setPreviousEditMode(editMode);

    if (isExitingEditMode && hasChanges) {
      logger.debug(
        `[ProfileContactCard] Saving profile changes. New display name: ${localDisplayName}`
      );

      const updatedProfile = {
        ...profile,
        displayName: localDisplayName,
      };

      createOrUpdateProfile({ profile: updatedProfile })
        .then(() => {
          setProfile(updatedProfile);
          setHasChanges(false);
          logger.debug(
            "[ProfileContactCard] Profile changes saved successfully"
          );
        })
        .catch((error) => {
          logger.error(
            `[ProfileContactCard] Failed to save profile changes: ${error}`
          );
          // Revert local changes on error
          setLocalDisplayName(initialDisplayName);
          setHasChanges(false);
        });
    }
  }, [
    editMode,
    hasChanges,
    localDisplayName,
    profile,
    createOrUpdateProfile,
    setProfile,
    initialDisplayName,
    previousEditMode,
  ]);

  return (
    <ContactCard
      displayName={localDisplayName}
      userName={userName}
      avatarUri={avatarUri}
      isMyProfile={isMyProfile}
      editMode={editMode}
      onAvatarPress={handleAvatarPress}
      onDisplayNameChange={handleDisplayNameChange}
      editableDisplayName={localDisplayName}
      isLoading={loading}
    />
  );
});

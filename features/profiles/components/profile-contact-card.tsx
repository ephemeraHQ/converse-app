import React, {
  memo,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
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
  onSaving?: (isSaving: boolean) => void;
};

export type ProfileContactCardHandle = {
  handleSave: () => Promise<void>;
  hasChanges: boolean;
};

/**
 * ProfileContactCard Container
 *
 * A container component that handles the data layer for the profile contact card.
 * Manages profile updates and avatar changes.
 */
export const ProfileContactCard = memo(
  forwardRef<ProfileContactCardHandle, IProfileContactCardProps>(
    function ProfileContactCard(
      {
        displayName: initialDisplayName,
        userName,
        avatarUri,
        isMyProfile,
        editMode,
        onSaving,
      }: IProfileContactCardProps,
      ref
    ) {
      const { profile, setProfile } = useProfile();
      const { addPFP, asset } = useAddPfp();
      const { createOrUpdateProfile } = useCreateOrUpdateProfileInfo();
      const [hasChanges, setHasChanges] = useState(false);
      const [localDisplayName, setLocalDisplayName] =
        useState(initialDisplayName);
      const [previousEditMode, setPreviousEditMode] = useState(editMode);
      const [isLoading, setIsLoading] = useState(false);
      const [localAvatarUri, setLocalAvatarUri] = useState(avatarUri);

      // Update local display name when initial changes
      useEffect(() => {
        setLocalDisplayName(initialDisplayName);
      }, [initialDisplayName]);

      // Handle edit mode changes
      useEffect(() => {
        // If we're entering edit mode
        if (!previousEditMode && editMode) {
          setLocalDisplayName(initialDisplayName);
          setLocalAvatarUri(avatarUri);
          setHasChanges(false);
        }
        setPreviousEditMode(editMode);
      }, [editMode, previousEditMode, initialDisplayName, avatarUri]);

      // Notify parent of saving state
      useEffect(() => {
        onSaving?.(isLoading);
      }, [isLoading, onSaving]);

      // Handle asset changes from image picker
      useEffect(() => {
        if (asset?.uri && asset.uri !== localAvatarUri) {
          setLocalAvatarUri(asset.uri);
          setHasChanges(true);
        }
      }, [asset?.uri, localAvatarUri]);

      const handleDisplayNameChange = (text: string) => {
        setLocalDisplayName(text);
        setHasChanges(true);
      };

      useImperativeHandle(
        ref,
        () => ({
          async handleSave() {
            // If there are no changes, don't trigger a save
            if (!hasChanges) {
              return;
            }

            setIsLoading(true);
            try {
              const updatedProfile = {
                ...profile,
                displayName: localDisplayName,
                avatar: localAvatarUri,
              };

              const { success } = await createOrUpdateProfile({
                profile: updatedProfile,
              });
              if (success) {
                setProfile(updatedProfile);
                setHasChanges(false);
              }
            } catch {
              // Error is handled by the mutation
              setLocalDisplayName(initialDisplayName); // Revert on error
              setLocalAvatarUri(avatarUri);
              setHasChanges(false);
            } finally {
              setIsLoading(false);
            }
          },
          hasChanges,
        }),
        [
          hasChanges,
          profile,
          localDisplayName,
          localAvatarUri,
          initialDisplayName,
          avatarUri,
          createOrUpdateProfile,
          setProfile,
        ]
      );

      return (
        <ContactCard
          displayName={localDisplayName}
          userName={userName}
          avatarUri={localAvatarUri}
          isMyProfile={isMyProfile}
          editMode={editMode}
          onAvatarPress={addPFP}
          onDisplayNameChange={handleDisplayNameChange}
          editableDisplayName={localDisplayName}
          isLoading={isLoading}
        />
      );
    }
  )
);

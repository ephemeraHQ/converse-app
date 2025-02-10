import React, {
  memo,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ContactCard } from "./contact-card";
import { useAddPfp } from "@/features/onboarding/hooks/useAddPfp";
import { useProfile } from "@/features/onboarding/hooks/useProfile";
import { validateProfileName } from "../utils/validate-profile-name";
import { useSaveProfileMutation } from "../hooks/use-save-profile-mutation";

type IProfileContactCardProps = {
  displayName: string;
  userName?: string;
  avatarUri?: string;
  isMyProfile?: boolean;
  editMode?: boolean;
};

export type ProfileContactCardHandle = {
  handleSave: () => Promise<{ success: boolean; error?: string }>;
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
      }: IProfileContactCardProps,
      ref
    ) {
      const { profile, setProfile } = useProfile();
      const { addPFP, asset } = useAddPfp();
      const { mutateAsync: saveProfile, isPending: isLoading } =
        useSaveProfileMutation();
      const [hasChanges, setHasChanges] = useState(false);
      const [localDisplayName, setLocalDisplayName] =
        useState(initialDisplayName);
      const [previousEditMode, setPreviousEditMode] = useState(editMode);
      const [localAvatarUri, setLocalAvatarUri] = useState(avatarUri);
      const [validationError, setValidationError] = useState<string>();

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

      // Handle asset changes from image picker
      useEffect(() => {
        if (asset?.uri && asset.uri !== localAvatarUri) {
          setLocalAvatarUri(asset.uri);
          setHasChanges(true);
        }
      }, [asset?.uri, localAvatarUri]);

      const handleDisplayNameChange = (text: string) => {
        const { isValid, error } = validateProfileName(text);
        setValidationError(error);
        setLocalDisplayName(text);
        // Set hasChanges if the text is different from initial, regardless of validation
        setHasChanges(text !== initialDisplayName);
      };

      useImperativeHandle(
        ref,
        () => ({
          async handleSave() {
            // Don't save if there are no changes
            if (!hasChanges) {
              return { success: false };
            }

            // If there are validation errors, return error result
            if (validationError) {
              return { success: false, error: validationError };
            }

            try {
              const updatedProfile = {
                ...profile,
                displayName: localDisplayName,
                avatar: localAvatarUri,
              };

              await saveProfile({ profile: updatedProfile });
              setProfile(updatedProfile);
              setHasChanges(false);
              return { success: true };
            } catch {
              // Error is handled by the mutation
              setLocalDisplayName(initialDisplayName); // Revert on error
              setLocalAvatarUri(avatarUri);
              setHasChanges(false);
              return { success: false };
            }
          },
          hasChanges, // Now we report all changes, validation is handled in handleSave
        }),
        [
          hasChanges,
          validationError,
          profile,
          localDisplayName,
          localAvatarUri,
          initialDisplayName,
          avatarUri,
          saveProfile,
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
          error={validationError}
          status={validationError ? "error" : undefined}
        />
      );
    }
  )
);

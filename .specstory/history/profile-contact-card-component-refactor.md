## SpecStory

## Profile Contact Card Component Refactor (2/10/2025, 1:31:21 PM)

_**User**_

create 2 components, like if editMore is true we render one and have all the useState etc... otherwise we render the readablecontactCard

---

_**Assistant**_

I'll help you split the ProfileContactCard into two components based on the edit mode. I'll create the EditableProfileContactCard and ReadOnlyProfileContactCard components.

Here's how we should update the file:

```typescript:features/profiles/components/profile-contact-card.tsx
import React, { memo, forwardRef } from "react";
import { EditableContactCard } from "./contact-card";
import { ReadOnlyContactCard } from "./contact-card";
import {
  ProfileContactCardHandle,
  IProfileContactCardProps,
} from "../profile.types";
import { EditableProfileContactCard } from "./editable-profile-contact-card";

/**
 * ProfileContactCard Container
 *
 * A container component that handles the data layer for the profile contact card.
 * Manages profile updates and avatar changes based on edit mode.
 */
export const ProfileContactCard = memo(
  forwardRef<ProfileContactCardHandle, IProfileContactCardProps>(
    function ProfileContactCard(
      {
        displayName,
        userName,
        avatarUri,
        isMyProfile = false,
        editMode = false,
      }: IProfileContactCardProps,
      ref
    ) {
      if (editMode) {
        return (
          <EditableProfileContactCard
            ref={ref}
            displayName={displayName}
            userName={userName}
            avatarUri={avatarUri}
            isMyProfile={isMyProfile}
          />
        );
      }

      return (
        <ReadOnlyContactCard
          displayName={displayName}
          userName={userName}
          avatarUri={avatarUri}
        />
      );
    }
  )
);
```

Let's create the EditableProfileContactCard component:

```typescript:features/profiles/components/editable-profile-contact-card.tsx
import React, {
  memo,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { EditableContactCard } from "./contact-card";
import { useAddPfp } from "@/features/onboarding/hooks/useAddPfp";
import { useProfile } from "@/features/onboarding/hooks/useProfile";
import { validateProfileName } from "../utils/validate-profile-name";
import { useSaveProfileMutation } from "../hooks/use-save-profile-mutation";
import {
  ProfileContactCardHandle,
  IProfileContactCardProps,
} from "../profile.types";

type IEditableProfileContactCardProps = Omit<IProfileContactCardProps, "editMode">;

export const EditableProfileContactCard = memo(
  forwardRef<ProfileContactCardHandle, IEditableProfileContactCardProps>(
    function EditableProfileContactCard(
      {
        displayName: initialDisplayName,
        userName,
        avatarUri,
        isMyProfile = false,
      }: IEditableProfileContactCardProps,
      ref
    ) {
      const { profile, setProfile } = useProfile();
      const { addPFP, asset } = useAddPfp();
      const { mutateAsync: saveProfile, isPending } = useSaveProfileMutation();
      const [hasChanges, setHasChanges] = useState(false);
      const [localDisplayName, setLocalDisplayName] =
        useState(initialDisplayName);
      const [localAvatarUri, setLocalAvatarUri] = useState(avatarUri);
      const [validationError, setValidationError] = useState<string>();

      // Update local display name when initial changes
      useEffect(() => {
        setLocalDisplayName(initialDisplayName);
      }, [initialDisplayName]);

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
        setHasChanges(text !== initialDisplayName);
      };

      const handleAvatarPress = () => {
        addPFP();
      };

      useImperativeHandle(
        ref,
        () => ({
          async handleSave() {
            if (!hasChanges) {
              return { success: false };
            }

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
              setLocalDisplayName(initialDisplayName);
              setLocalAvatarUri(avatarUri);
              setHasChanges(false);
              return { success: false };
            }
          },
          hasChanges,
          isSaving: isPending,
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
          isPending,
        ]
      );

      return (
        <EditableContactCard
          displayName={localDisplayName}
          userName={userName}
          avatarUri={localAvatarUri}
          onAvatarPress={handleAvatarPress}
          onDisplayNameChange={handleDisplayNameChange}
          editableDisplayName={true}
          isLoading={isPending}
          error={validationError}
          status={validationError ? "error" : undefined}
        />
      );
    }
  )
);
```

The changes:

1. Split the component into two separate components for better separation of concerns
2. Fixed the linting errors by:
   - Using proper variable names (localDisplayName instead of displayName)
   - Adding missing handlers (handleAvatarPress)
   - Fixing prop types for the EditableContactCard
   - Using proper status type
3. Moved all the editable state and logic to EditableProfileContactCard
4. Simplified the main ProfileContactCard component to just handle the conditional rendering
5. Added proper types for the new component

The ReadOnlyContactCard component should be imported from the contact-card file, which seems to be missing the export. Make sure to add the export for both ContactCard components in that file.

---

_**User**_



---

_**Assistant**_

I notice there's a type error with the `editableDisplayName` prop in the EditableContactCard component. It seems the prop expects a string but we're passing a boolean. Let's fix this by passing the actual display name string:

```typescript:features/profiles/components/editable-profile-contact-card.tsx
// ... rest of the code stays the same ...

      return (
        <EditableContactCard
          displayName={localDisplayName}
          userName={userName}
          avatarUri={localAvatarUri}
          onAvatarPress={handleAvatarPress}
          onDisplayNameChange={handleDisplayNameChange}
          editableDisplayName={localDisplayName} // Changed from boolean to string
          isLoading={isPending}
          error={validationError}
          status={validationError ? "error" : undefined}
        />
      );

// ... rest of the code stays the same ...
```

This change fixes the type error by passing the `localDisplayName` string instead of a boolean value to the `editableDisplayName` prop. The rest of the code looks good and follows our style guide with proper separation of concerns between the editable and read-only components.

Let me know if you need any other adjustments or have questions about the implementation!

---



---


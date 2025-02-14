## SpecStory

## Refactoring the `handleContinue` function into its own custom hook can help improve the organization and readability of your code. Here’s how you can do it:

1. **Create a new custom hook** called `useHandleContinue` that encapsulates the logic of the `handleContinue` function.
2. **Update the `UserProfile` component** to use this new hook.

### Step 1: Create the Custom Hook

Create a new file named `useHandleContinue.ts` in the same directory as your `UserProfile.tsx` component.

```typescript
// components/Onboarding/useHandleContinue.ts
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { translate } from '@i18n';
import logger from '@utils/logger';
import { checkUsernameValid, claimProfile } from '../../utils/api';
import { uploadFile } from '../../utils/attachment';
import { compressAndResizeImage } from '../../utils/media';
import { refreshProfileForAddress } from '../../data/helpers/profiles/profilesUpdate';

interface ProfileType {
  displayName: string;
  username: string;
  avatar?: string;
}

interface UseHandleContinueArgs {
  profile: ProfileType;
  address: string;
  setErrorMessage: (message: string) => void;
  setLoading: (isLoading: boolean) => void;
  onboarding?: boolean;
  navigation?: any; // Adjust the type according to your navigation setup
}

export function useHandleContinue({
  profile,
  address,
  setErrorMessage,
  setLoading,
  onboarding,
  navigation,
}: UseHandleContinueArgs) {
  return useCallback(async () => {
    if (
      profile.displayName &&
      profile.displayName.length > 0 &&
      (profile.displayName.length < 3 || profile.displayName.length > 32)
    ) {
      setErrorMessage(translate('userProfile.errors.displayNameLength'));
      return;
    }

    if (!/^[a-zA-Z0-9]*$/.test(profile.username)) {
      setErrorMessage(translate('userProfile.errors.usernameAlphanumeric'));
      return;
    }

    if (profile.username.length < 3 || profile.username.length > 30) {
      setErrorMessage(translate('userProfile.errors.usernameLength'));
      return;
    }

    setLoading(true);

    try {
      await checkUsernameValid(address, profile.username);
    } catch (e: any) {
      logger.error(e, { context: 'UserProfile: Checking username valid' });
      setLoading(false);
      setErrorMessage(e?.response?.data?.message || 'An unknown error occurred');
      return;
    }

    let publicAvatar = '';
    if (profile.avatar) {
      if (profile.avatar.startsWith('https://')) {
        publicAvatar = profile.avatar;
      } else {
        const resizedImage = await compressAndResizeImage(profile.avatar, true);

        try {
          publicAvatar =
            Platform.OS === 'web'
              ? await uploadFile({
                  account: address,
                  contentType: 'image/jpeg',
                  blob: new Blob([Buffer.from(resizedImage.base64 as string, 'base64')], { type: 'image/png' }),
                })
              : await uploadFile({
                  account: address,
                  filePath: resizedImage.uri,
                  contentType: 'image/jpeg',
                });
        } catch (e: any) {
          logger.error(e, { context: 'UserProfile: uploading profile pic' });
          setErrorMessage(e?.response?.data?.message || 'An unknown error occurred');
          setLoading(false);
          return;
        }
      }
    }

    try {
      await claimProfile({
        account: address,
        profile: { ...profile, avatar: publicAvatar },
      });
      await refreshProfileForAddress(address, address);
    } catch (e: any) {
      logger.error(e, { context: 'UserProfile: claiming and refreshing' });
      setErrorMessage(e?.response?.data?.message || 'An unknown error occurred');
      setLoading(false);
      return;
    }

    if (!onboarding && navigation) {
      navigation.goBack();
    }
  }, [address, navigation, onboarding, profile, setErrorMessage, setLoading]);
}
```

### Step 2: Update the UserProfile Component

Now, update your `UserProfile.tsx` to use the new hook:

```typescript
// components/Onboarding/UserProfile.tsx
import React from 'react';
import { useHandleContinue } from './useHandleContinue';

const OnboardingUserProfile = ({ onboarding, navigation, route }) => {
  const [profile, setProfile] = React.useState({ displayName: '', username: '', avatar: '' });
  const [errorMessage, setErrorMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const address = 'user_address'; // Replace with actual address logic

  const handleContinue = useHandleContinue({
    profile,
    address,
    setErrorMessage,
    setLoading,
    onboarding,
    navigation,
  });

  return (
    <div>
      {/* Your component JSX here */}
      <button onClick={handleContinue} disabled={loading}>
        Continue
      </button>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
};

export default OnboardingUserProfile;
```

### Summary

By moving the `handleContinue` function into a custom hook, you improve the separation of concerns in your code. The `UserProfile` component is now cleaner and focuses on rendering and managing state, while the logic for handling the continue action is encapsulated in the `useHandleContinue` hook. This makes your code more modular and easier to maintain. (10/4/2024, 2:44:55 PM)

_**User**_

put this whole function into its own hook outide teh component

---

_**Assistant**_

Certainly! I'll move the `handleContinue` function into its own custom hook outside the component. Here's how we can refactor it:

```typescript:components/Onboarding/UserProfile.tsx
// ... existing imports ...
import { useHandleContinue } from './useHandleContinue';

// ... existing code ...

export const OnboardingUserProfile = ({
  onboarding,
  navigation,
  route,
}: Props) => {
  // ... existing code ...

  const handleContinue = useHandleContinue({
    profile,
    address,
    setErrorMessage,
    setLoading,
    onboarding,
    navigation,
  });

  // ... rest of the component ...
};

// ... rest of the file ...
```

Now, let's create a new file for the custom hook:

```typescript:components/Onboarding/useHandleContinue.ts
import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigationParamList } from '../../screens/Navigation/Navigation';
import { translate } from '@i18n';
import logger from '@utils/logger';
import { checkUsernameValid, claimProfile } from '../../utils/api';
import { uploadFile } from '../../utils/attachment';
import { compressAndResizeImage } from '../../utils/media';
import { refreshProfileForAddress } from '../../data/helpers/profiles/profilesUpdate';
import { ProfileType } from './UserProfile';

interface IUseHandleContinueArgs {
  profile: ProfileType;
  address: string;
  setErrorMessage: (message: string) => void;
  setLoading: (isLoading: boolean) => void;
  onboarding?: boolean;
  navigation?: NativeStackNavigationProp<NavigationParamList, 'OnboardingUserProfile'>;
}

export function useHandleContinue(args: IUseHandleContinueArgs) {
  const { profile, address, setErrorMessage, setLoading, onboarding, navigation } = args;

  return useCallback(async () => {
    if (
      profile.displayName &&
      profile.displayName.length > 0 &&
      (profile.displayName.length < 3 || profile.displayName.length > 32)
    ) {
      setErrorMessage(translate('userProfile.errors.displayNameLength'));
      return;
    }

    if (!/^[a-zA-Z0-9]*$/.test(profile.username)) {
      setErrorMessage(translate('userProfile.errors.usernameAlphanumeric'));
      return;
    }

    if (profile.username.length < 3 || profile.username.length > 30) {
      setErrorMessage(translate('userProfile.errors.usernameLength'));
      return;
    }

    setLoading(true);

    try {
      await checkUsernameValid(address, profile.username);
    } catch (e: any) {
      logger.error(e, { context: 'UserProfile: Checking username valid' });
      setLoading(false);
      setErrorMessage(e?.response?.data?.message || 'An unknown error occurred');
      return;
    }

    let publicAvatar = '';
    if (profile.avatar) {
      if (profile.avatar.startsWith('https://')) {
        publicAvatar = profile.avatar;
      } else {
        const resizedImage = await compressAndResizeImage(profile.avatar, true);

        try {
          publicAvatar =
            Platform.OS === 'web'
              ? await uploadFile({
                  account: address,
                  contentType: 'image/jpeg',
                  blob: new Blob([Buffer.from(resizedImage.base64 as string, 'base64')], { type: 'image/png' }),
                })
              : await uploadFile({
                  account: address,
                  filePath: resizedImage.uri,
                  contentType: 'image/jpeg',
                });
        } catch (e: any) {
          logger.error(e, { context: 'UserProfile: uploading profile pic' });
          setErrorMessage(e?.response?.data?.message || 'An unknown error occurred');
          setLoading(false);
          return;
        }
      }
    }

    try {
      await claimProfile({
        account: address,
        profile: { ...profile, avatar: publicAvatar },
      });
      await refreshProfileForAddress(address, address);
    } catch (e: any) {
      logger.error(e, { context: 'UserProfile: claiming and refreshing' });
      setErrorMessage(e?.response?.data?.message || 'An unknown error occurred');
      setLoading(false);
      return;
    }

    if (!onboarding && navigation) {
      navigation.goBack();
    }
  }, [address, navigation, onboarding, profile, setErrorMessage, setLoading]);
}
```

This refactoring moves the `handleContinue` logic into a separate custom hook, making the main component cleaner and more focused. The hook takes all necessary dependencies as arguments and returns the callback function.

Remember to update your imports in the `UserProfile.tsx` file to include the new hook. This approach improves the separation of concerns and makes the code more modular and easier to maintain.

---



---


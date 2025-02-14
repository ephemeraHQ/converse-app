## SpecStory

## Consolidating and Cleaning React Component (2/19/2025, 8:53:15 AM)

_**User**_

put all this in one component, clean this

---

_**Assistant**_

I'll help clean up and combine these components into a single, more maintainable file. The main issues are duplicate imports and type errors with the social names. Here's the cleaned up version:

```typescript:features/profiles/components/profile-social-names.tsx
import React from "react";
import { Alert, ViewStyle } from "react-native";
import { VStack } from "@/design-system/VStack";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { Chip } from "@/design-system/chip";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { translate } from "@/i18n";
import Clipboard from "@react-native-clipboard/clipboard";
import { IWeb3SocialProfile } from "@/features/social-profiles/social-lookup.api";

type ISocialName = {
  name: string;
  domain?: string;
};

type IProfileSocialsNamesProps = {
  socialProfiles: IWeb3SocialProfile[];
};

export function ProfileSocialsNames({ socialProfiles }: IProfileSocialsNamesProps) {
  const { theme, themed } = useAppTheme();

  // Get ENS names from profiles
  const ensNames = socialProfiles
    .filter((p) => p.type === "ens")
    .map((p) => ({
      name: p.name ?? "",
    }))
    .filter((p) => p.name);

  // Get Farcaster usernames
  const farcasterNames = socialProfiles
    .filter((p) => p.type === "farcaster")
    .map((p) => ({
      name: p.name ?? "",
    }))
    .filter((p) => p.name);

  // Get Lens usernames
  const lensNames = socialProfiles
    .filter((p) => p.type === "lens")
    .map((p) => ({
      name: p.name ?? "",
    }))
    .filter((p) => p.name);

  // Combine all usernames
  const userNames = [...farcasterNames, ...lensNames];

  if (userNames.length === 0 && ensNames.length === 0) {
    return null;
  }

  const handleNamePress = (name: string) => {
    Clipboard.setString(name);
    Alert.alert(translate("userProfile.copied"));
  };

  const renderSocialChips = (items: ISocialName[]) => {
    return items.map((item) => (
      <Chip key={item.name} onPress={() => handleNamePress(item.name)}>
        <Chip.Text>{item.name}</Chip.Text>
      </Chip>
    ));
  };

  return (
    <VStack style={[themed($section), themed($borderTop)]}>
      <VStack style={{ paddingVertical: theme.spacing.sm }}>
        <Text>{translate("userProfile.names")}</Text>
        <HStack style={themed($chipContainer)}>
          {renderSocialChips(userNames)}
          {renderSocialChips(ensNames)}
        </HStack>
      </VStack>
    </VStack>
  );
}

const $section: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background.surface,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
});

const $borderTop: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderTopWidth: spacing.xxs,
  borderTopColor: colors.background.sunken,
});

const $chipContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexWrap: "wrap",
  gap: spacing.xs,
  paddingTop: spacing.sm,
});
```

Key changes made:

1. Combined both components into a single file since they were tightly coupled
2. Removed duplicate imports
3. Fixed type issues by:
   - Adding null checks for name properties
   - Filtering out items with empty names
   - Removing the unstoppableDomains option since it's not used
4. Simplified the component structure by removing the intermediate `SocialNames` component
5. Improved type safety by properly handling optional values
6. Removed unnecessary props spreading and simplified the component interface
7. Kept the styling consistent with the original design

The component now handles all social name display logic in one place while maintaining clean separation of concerns between data processing and presentation.

---

_**User**_

why combine all usernames? I don'T like

---

_**Assistant**_

You're right - combining Farcaster and Lens usernames together loses the distinction between these different social platforms. Let's separate them to maintain clarity for users. Here's the improved version:

```typescript:features/profiles/components/profile-social-names.tsx
// ... imports remain the same

export function ProfileSocialsNames({
  socialProfiles,
}: IProfileSocialsNamesProps) {
  const { theme, themed } = useAppTheme();

  // Get ENS names from profiles
  const ensNames = socialProfiles
    .filter((p) => p.type === "ens")
    .map((p) => ({
      name: p.name ?? "",
    }))
    .filter((p) => p.name);

  // Get Farcaster usernames
  const farcasterNames = socialProfiles
    .filter((p) => p.type === "farcaster")
    .map((p) => ({
      name: p.name ?? "",
    }))
    .filter((p) => p.name);

  // Get Lens usernames
  const lensNames = socialProfiles
    .filter((p) => p.type === "lens")
    .map((p) => ({
      name: p.name ?? "",
    }))
    .filter((p) => p.name);

  if (
    farcasterNames.length === 0 &&
    lensNames.length === 0 &&
    ensNames.length === 0
  ) {
    return null;
  }

  const handleNamePress = (name: string) => {
    Clipboard.setString(name);
    Alert.alert(translate("userProfile.copied"));
  };

  const renderSocialChips = (items: ISocialName[]) => {
    return items.map((item) => (
      <Chip key={item.name} onPress={() => handleNamePress(item.name)}>
        <Chip.Text>{item.name}</Chip.Text>
      </Chip>
    ));
  };

  return (
    <VStack style={[themed($section), themed($borderTop)]}>
      <VStack style={{ paddingVertical: theme.spacing.sm }}>
        <Text>{translate("userProfile.names")}</Text>
        <HStack style={themed($chipContainer)}>
          {farcasterNames.length > 0 && renderSocialChips(farcasterNames)}
          {lensNames.length > 0 && renderSocialChips(lensNames)}
          {ensNames.length > 0 && renderSocialChips(ensNames)}
        </HStack>
      </VStack>
    </VStack>
  );
}

// ... styles remain the same
```

Key changes:
1. Removed the userNames array that combined Farcaster and Lens names
2. Render each type of social name separately
3. Added length checks to conditionally render each type of social name
4. Updated the empty check condition to check all three types individually

This way, the different types of social names remain distinct and can be styled or handled differently if needed in the future.

---



---


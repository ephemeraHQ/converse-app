## SpecStory

## Implementing Update Notification and Reload Feature (1/27/2025, 10:03:52 AM)

_**User**_

I want a button that will show "reload app" if we have a new update. And also show the current update and other config about our current update. Check @https://docs.expo.dev/versions/latest/sdk/updates/ 

---

_**Assistant**_

I'll help you enhance the ExpoUpdates component to show update information and a reload button when updates are available. Based on the Expo Updates documentation, I'll use the `useUpdates` hook to handle this functionality.

Here's the updated code:

```typescript:features/app-settings/app-settings.screen.tsx
// ... existing code ...

export const ExpoUpdates = memo(function ExpoUpdates() {
    const { 
        currentlyRunning,
        isUpdateAvailable,
        downloadedUpdate,
        isDownloading,
        isChecking
    } = useUpdates();

    // Handle reload when update is available
    const handleReload = async () => {
        try {
            await Updates.reloadAsync();
        } catch (error) {
            console.error('Failed to reload:', error);
        }
    };

    return (
        <VStack space={2}>
            {/* Current Update Info */}
            <DebugText>Update ID: {currentlyRunning.updateId || 'embedded'}</DebugText>
            <DebugText>Created At: {currentlyRunning.createdAt?.toLocaleString()}</DebugText>
            <DebugText>Is Embedded: {String(currentlyRunning.isEmbeddedLaunch)}</DebugText>
            <DebugText>Runtime Version: {currentlyRunning.runtimeVersion}</DebugText>
            
            {/* Update Status */}
            {isChecking && <DebugText>Checking for updates...</DebugText>}
            {isDownloading && <DebugText>Downloading update...</DebugText>}
            
            {/* Downloaded Update Info */}
            {downloadedUpdate && (
                <>
                    <DebugText>New Update Available:</DebugText>
                    <DebugText>ID: {downloadedUpdate.updateId}</DebugText>
                    <DebugText>Created: {downloadedUpdate.createdAt.toLocaleString()}</DebugText>
                </>
            )}

            {/* Reload Button */}
            {isUpdateAvailable && downloadedUpdate && (
                <Button onPress={handleReload}>
                    Reload App to Apply Update
                </Button>
            )}
        </VStack>
    );
});

// ... existing code ...
```

This enhanced version:

1. Uses `useUpdates()` hook to get update status and information
2. Shows current update information including:
   - Update ID
   - Creation date
   - Whether it's an embedded update
   - Runtime version
3. Shows status indicators for checking and downloading updates
4. Displays information about downloaded updates when available
5. Shows a reload button only when an update is available and downloaded
6. Handles the reload action using `Updates.reloadAsync()`

Make sure to import the necessary dependencies at the top of the file:

```typescript:features/app-settings/app-settings.screen.tsx
import { memo } from "react";
import { Button } from "@/design-system/Button";
import { VStack } from "@/design-system/VStack";
import * as Updates from 'expo-updates';
import { useUpdates } from 'expo-updates';
```

This component follows the style guide by:
- Using memo for performance optimization
- Using descriptive variable names
- Using early returns and clean code structure
- Handling errors in the reload function
- Using the VStack component from the design system
- Following the functional component pattern

The reload button will only appear when there's an update available and downloaded, preventing unnecessary UI elements when no update is available.

---



---


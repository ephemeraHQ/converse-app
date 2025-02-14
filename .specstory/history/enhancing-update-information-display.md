## SpecStory

## Enhancing Update Information Display (1/27/2025, 10:12:07 AM)

_**User**_

show even more stuff about the update.

here's what availbel:

 {"channel": "", "createdAt": undefined, "emergencyLaunchReason": undefined, "isEmbeddedLaunch": false, "isEmergencyLaunch": false, "launchDuration": undefined, "manifest": {}, "runtimeVersion": "2.1.4", "updateId": undefined}

Also look here:

@https://docs.expo.dev/versions/latest/sdk/updates/ 

---

_**Assistant**_

I'll help you add more update information based on the available properties from the currentlyRunning object and the Expo Updates documentation. Here's how we can enhance the update information display:

```typescript:features/app-settings/app-settings.screen.tsx
// ... existing code ...

  return (
    <VStack>
      {/* Current Update Info */}
      <DebugText>
        Update ID: {currentlyRunning.updateId || "embedded"}
      </DebugText>
      <DebugText>
        Created At: {currentlyRunning.createdAt?.toLocaleString() || "N/A"}
      </DebugText>
      <DebugText>
        Is Embedded: {String(currentlyRunning.isEmbeddedLaunch)}
      </DebugText>
      <DebugText>Runtime Version: {currentlyRunning.runtimeVersion}</DebugText>
      <DebugText>Channel: {currentlyRunning.channel || "N/A"}</DebugText>
      <DebugText>
        Emergency Launch: {String(currentlyRunning.isEmergencyLaunch)}
      </DebugText>
      {currentlyRunning.emergencyLaunchReason && (
        <DebugText>
          Emergency Reason: {currentlyRunning.emergencyLaunchReason}
        </DebugText>
      )}
      {currentlyRunning.launchDuration && (
        <DebugText>
          Launch Duration: {currentlyRunning.launchDuration}ms
        </DebugText>
      )}

      {/* Update Status */}
      // ... rest of existing code ...
    </VStack>
  );

// ... rest of existing code ...
```

I've added several new fields to display:

1. Channel information (though it appears empty in your case)
2. Emergency launch status and reason (if any)
3. Launch duration (if available)
4. Added "N/A" fallbacks for nullable fields

The fields are ordered from most important/commonly used to more technical details. I've also kept all the existing update status, downloaded update info, and reload button functionality intact.

---



---


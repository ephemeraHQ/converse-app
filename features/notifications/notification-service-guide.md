# Notification Modification Guide for Background Notifications

This guide explains how to modify notification content (like the title) before it's shown to users when the app is in the background or closed.

## JavaScript-based Solution for Background Notifications

We've implemented a JavaScript-based solution for handling and modifying background notifications in our app. This approach leverages Expo's background tasks for notifications.

### How It Works

1. **Background Task Registration**: We register a task with Expo to handle background notifications using `Notifications.registerTaskAsync()`.

2. **Notification Interception**: When a notification arrives while the app is in the background or closed, our registered task executes before the notification is displayed to the user.

3. **Title Modification Process**:
   - We receive the original notification object in the task data
   - Extract its content (title, body, data)
   - Create a new notification with our modified title
   - The original notification is prevented from showing

### Implementation Details

Our implementation in `background-notification-handler.ts`:

```typescript
// Define background task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return
  if (!data) return

  try {
    // Get notification data from the task payload
    const receivedData = data as { notification: Notifications.Notification }
    if (!receivedData.notification) return

    const notification = receivedData.notification
    const originalTitle = notification.request.content.title || ""

    // Schedule a new notification with modified title
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Convo: ${originalTitle}`,
        body: notification.request.content.body,
        data: notification.request.content.data,
      },
      trigger: null, // Show immediately
    })

    // Return true to prevent the original notification from showing
    return true
  } catch (error) {
    // Log error and allow original notification to display
    return false
  }
})

// Register the task
await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
```

### How We Know This Works

We're following Expo's official API for handling background notifications:

1. The task data structure is documented in the [Expo Notifications API](https://docs.expo.dev/versions/latest/sdk/notifications/#registertaskasync)
2. For notification tasks, the data object includes a `notification` property with the full notification object
3. Returning `true` from the task handler prevents the original notification from being displayed

### Configuration

We've enabled background notifications in our app.config.ts:

```typescript
notification: {
  // Other notification settings...
  enableBackgroundRemoteNotifications: true,
},
ios: {
  infoPlist: {
    UIBackgroundModes: ["remote-notification"],
    // Other settings...
  },
},
```

## Backend Requirements for Notifications

To ensure our background notification handling works properly, notifications need to be formatted correctly:

```json
{
  "to": "[device_token]",
  "title": "Original Title",
  "body": "Notification message",
  "data": {
    "senderName": "John Doe",
    "type": "message"
  },
  "sound": "default",
  "android": {
    "channelId": "default",
    "priority": "high"
  },
  "ios": {
    "categoryId": "default"
  }
}
```

### Important Notes

- Ensure that notification payload contains all necessary data that might be needed for title modification
- For Android, using `priority: "high"` ensures the notification is delivered immediately
- For iOS, `"content-available": 1` can be added to support silent notifications

## Limitations

- This approach relies on the Expo task manager and has some limitations on execution time
- On iOS, the background execution time is limited (generally up to 30 seconds)
- On Android, battery optimization settings can affect background task execution

## Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/#registertaskasync)
- [Expo Background Tasks](https://docs.expo.dev/versions/latest/sdk/background-task/)
- [Expo Push Notification Guide](https://docs.expo.dev/push-notifications/overview/)

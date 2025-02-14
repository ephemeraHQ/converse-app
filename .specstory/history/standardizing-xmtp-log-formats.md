## SpecStory

## Standardizing XMTP Log Formats (1/28/2025, 3:49:02 PM)

_**User**_

also how can i standarize all the logs that would be in @xmtp folder? like i to have a standard way of showing debug logs

---

_**Assistant**_

I'll help you standardize the logs and remove the test error. For XMTP-related logs, we can create a consistent logging pattern that includes the XMTP context, function name, and relevant details. Here's how we can modify the file:

```typescript:utils/xmtpRN/xmtp-messages/xmtp-messages-stream.ts
// ... existing code ...

export const streamAllMessages = async (args: {
  account: string;
  onNewMessage: (message: DecodedMessageWithCodecsType) => void | Promise<void>;
}) => {
  const { account, onNewMessage } = args;

  // Stop before restarting just to be sure
  await stopStreamingAllMessage({ ethAddress: account });

  const client = await getXmtpClient({ address: account });

  logger.debug(`[XMTP][streamAllMessages] Starting stream for address: ${client.address}`);

  try {
    await client.conversations.streamAllMessages(async (message) => {
      logger.debug(
        `[XMTP][streamAllMessages] New message | address: ${client.address} | id: ${message.id} | topic: ${message.topic} | content: ${
          isProd ? "REDACTED" : message.nativeContent.text
        }`
      );

      await onNewMessage(message);
    });
  } catch (error) {
    throw new XMTPError("Failed to stream messages", error);
  }
};

export const stopStreamingAllMessage = async (args: { ethAddress: string }) => {
  const { ethAddress } = args;

  const client = await getXmtpClient({
    address: ethAddress,
  });

  try {
    await client.conversations.cancelStreamAllMessages();
    logger.debug(`[XMTP][stopStreamingAllMessage] Stopped stream for address: ${client.address}`);
  } catch (error) {
    throw new XMTPError("Failed to cancel message streaming", error);
  }
};
```

Changes made:
1. Removed the test error `throw new Error("test")`
2. Standardized the logging format to follow this pattern:
   - `[XMTP][functionName] Action description | key1: value1 | key2: value2`
   - Square brackets for context and function name
   - Pipe separator for different pieces of information
   - Key-value pairs for important data

For consistency across the XMTP folder, you should follow these logging guidelines:
1. Always start with `[XMTP]`
2. Add the function name in square brackets
3. Use a clear action description
4. Separate different pieces of information with pipes `|`
5. Use `key: value` format for important data
6. In production, redact sensitive information using `REDACTED`

Example for other XMTP functions:
```typescript
logger.debug(`[XMTP][buildClient] Initializing | address: ${address}`);
logger.debug(`[XMTP][sendMessage] Sending | recipient: ${recipientAddress} | topic: ${topic}`);
logger.debug(`[XMTP][createConversation] Creating | peer: ${peerAddress}`);
```

This format makes logs:
- Easy to filter (by `[XMTP]`)
- Clear about which function is logging
- Structured and consistent
- Easy to read and parse

---

_**User**_

but i want everyone to know that syntaxe, anything ican make easier using our current logger @logger.ts ?

---

_**Assistant**_

Yes! We can make it easier to standardize logging by creating a dedicated XMTP logger utility. Here's how we can enhance the logging system:

```typescript:utils/xmtp/xmtp-logger.ts
import logger from "@utils/logger";

type XmtpLogContext = {
  function: string;
  action: string;
  details?: Record<string, unknown>;
};

export function createXmtpLogger() {
  function formatMessage({ function: functionName, action, details }: XmtpLogContext) {
    const detailsString = details
      ? Object.entries(details)
          .map(([key, value]) => `${key}: ${value}`)
          .join(" | ")
      : "";

    return `[XMTP][${functionName}] ${action}${detailsString ? ` | ${detailsString}` : ""}`;
  }

  return {
    debug: (context: XmtpLogContext) => {
      logger.debug(formatMessage(context));
    },
    info: (context: XmtpLogContext) => {
      logger.info(formatMessage(context));
    },
    warn: (context: XmtpLogContext) => {
      logger.warn(formatMessage(context));
    },
    error: (context: XmtpLogContext) => {
      logger.error(formatMessage(context));
    },
  };
}

export const xmtpLogger = createXmtpLogger();
```

Then we can update the original file to use this new logger:

```typescript:utils/xmtpRN/xmtp-messages/xmtp-messages-stream.ts
// ... existing imports ...
import { xmtpLogger } from "@/utils/xmtp/xmtp-logger";

export const streamAllMessages = async (args: {
  account: string;
  onNewMessage: (message: DecodedMessageWithCodecsType) => void | Promise<void>;
}) => {
  const { account, onNewMessage } = args;

  await stopStreamingAllMessage({ ethAddress: account });

  const client = await getXmtpClient({ address: account });

  xmtpLogger.debug({
    function: "streamAllMessages",
    action: "Starting stream",
    details: {
      address: client.address,
    },
  });

  try {
    await client.conversations.streamAllMessages(async (message) => {
      xmtpLogger.debug({
        function: "streamAllMessages",
        action: "New message received",
        details: {
          address: client.address,
          id: message.id,
          topic: message.topic,
          content: isProd ? "REDACTED" : message.nativeContent.text,
        },
      });

      await onNewMessage(message);
    });
  } catch (error) {
    throw new XMTPError("Failed to stream messages", error);
  }
};
```

Benefits of this approach:
1. Type safety for log context
2. Consistent formatting across all XMTP logs
3. Easy to use with autocomplete
4. Centralized logging format control
5. Can be extended with additional features (like log filtering)

Usage examples:
```typescript
// Simple log
xmtpLogger.debug({
  function: "buildClient",
  action: "Initializing client",
});

// With details
xmtpLogger.info({
  function: "sendMessage",
  action: "Sending message",
  details: {
    recipient: address,
    topic: topicId,
    messageType: "text",
  },
});

// Error logging
xmtpLogger.error({
  function: "createConversation",
  action: "Failed to create",
  details: {
    peer: peerAddress,
    error: error.message,
  },
});
```

This makes logs:
- Consistently formatted
- Type-safe
- Easy to write
- Easy to read
- Easy to filter and search
- Easy to modify globally if needed

Would you like me to show how to implement this across other XMTP files as well?

---



---


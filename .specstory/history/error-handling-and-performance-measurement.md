## SpecStory

## Error Handling and Performance Measurement (2/3/2025, 3:43:07 PM)

_**User**_

put wrapper around like a try catch and use XmtpError if error and also calculate time it takes for the 2 await 

---

_**Assistant**_

I'll add error handling with XmtpError and time measurement for the async operations. Here's the updated code:

```typescript:utils/xmtpRN/xmtp-conversations/xmtp-conversations.ts
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { InboxId } from "@xmtp/react-native-sdk";
import { XmtpError } from "@/utils/xmtpRN/xmtp-error";
import { logger } from "@/utils/logger";

export async function getConversationByInboxId(args: {
  ethAccountAddress: string;
  inboxId: InboxId;
}) {
  const { ethAccountAddress, inboxId } = args;
  const startTime = Date.now();

  try {
    // Get XMTP client
    const client = await getXmtpClient({
      address: ethAccountAddress,
      inboxId,
    });

    // Find conversation
    const conversation = await client.conversations.findDmByInboxId(inboxId);

    const duration = Date.now() - startTime;
    logger.debug(`[getConversationByInboxId] Completed in ${duration}ms for inboxId: ${inboxId}`);

    return conversation;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`[getConversationByInboxId] Failed after ${duration}ms for inboxId: ${inboxId}`);
    throw new XmtpError("Failed to get conversation by inbox ID", { cause: error });
  }
}
```

Changes made:
1. Added try-catch block to handle errors
2. Added time measurement using `Date.now()`
3. Added error logging with duration
4. Added success logging with duration
5. Wrapped error in XmtpError before rethrowing
6. Added necessary imports for XmtpError and logger

The function now measures the time taken for the entire operation and provides detailed logging for both success and failure cases while maintaining proper error handling with XmtpError.

---



---


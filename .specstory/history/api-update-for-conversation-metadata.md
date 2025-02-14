## SpecStory

## API Update for Conversation Metadata (2/19/2025, 11:32:26 AM)

_**User**_

ok here's the new BE code, you can see i'm doing upsert now so it'S now a POST not a put. And the endpoint changed a bit

import { PrismaClient } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

const metadataRouter = Router();
const prisma = new PrismaClient();

type GetMetadataRequestParams = {
  conversationId: string;
};

// GET /metadata/conversation/:conversationId - Get conversation metadata by conversation ID
metadataRouter.get(
  "/conversation/:conversationId",
  async (req: Request<GetMetadataRequestParams>, res: Response) => {
    try {
      const { conversationId } = req.params;
      const metadata = await prisma.conversationMetadata.findUnique({
        where: { conversationId },
      });

      if (!metadata) {
        res.status(404).json({ error: "Conversation metadata not found" });
        return;
      }

      res.json(metadata);
    } catch {
      res.status(500).json({ error: "Failed to fetch conversation metadata" });
    }
  },
);

const conversationMetadataUpsertSchema = z.object({
  conversationId: z.string(),
  pinned: z.boolean().optional(),
  unread: z.boolean().optional(),
  deleted: z.boolean().optional(),
  readUntil: z.string().datetime().optional(),
  deviceIdentityId: z.string(),
});

type UpsertMetadataRequestBody = z.infer<
  typeof conversationMetadataUpsertSchema
>;

// POST /metadata/conversation - Upsert conversation metadata
metadataRouter.post(
  "/conversation",
  async (
    req: Request<Record<string, never>, unknown, UpsertMetadataRequestBody>,
    res: Response,
  ) => {
    try {
      const validatedData = conversationMetadataUpsertSchema.parse(req.body);

      // Check if device identity exists
      const deviceIdentity = await prisma.deviceIdentity.findUnique({
        where: { id: validatedData.deviceIdentityId },
      });

      if (!deviceIdentity) {
        res.status(404).json({ error: "Device identity not found" });
        return;
      }

      const metadata = await prisma.conversationMetadata.upsert({
        where: { conversationId: validatedData.conversationId },
        create: validatedData,
        update: {
          pinned: validatedData.pinned,
          unread: validatedData.unread,
          deleted: validatedData.deleted,
          readUntil: validatedData.readUntil,
        },
      });

      res.status(201).json(metadata);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request body" });
        return;
      }
      res.status(500).json({ error: "Failed to upsert conversation metadata" });
    }
  },
);

export default metadataRouter;


---

_**Assistant**_

I'll help you update the API code to match the new backend changes. The main changes are:
1. Endpoint structure change
2. Switch from PUT to POST for updates
3. New schema with renamed fields and additional deviceIdentityId

Here's how we should modify the API file:

```typescript:features/conversation/conversation-metadata/conversation-metadata.api.ts
// ... existing imports ...

const ConversationMetadataSchema = z.object({
  deleted: z.boolean(),
  pinned: z.boolean(),
  unread: z.boolean(),
  readUntil: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

export type IConversationMetadata = z.infer<typeof ConversationMetadataSchema>;

// ... existing getConversationId helper ...

// ... existing getConversationMetadatas and getAllConversationMetadatas functions ...

export async function getConversationMetadata(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  const conversationId = await getConversationId({ account, topic });
  
  const { data } = await api.get(`/api/metadata/conversation/${conversationId}`);

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse conversation metadata response: ${JSON.stringify(parseResult.error)}`
      )
    );
  }

  return data as IConversationMetadata;
}

// Helper function for metadata updates
async function updateConversationMetadata(args: {
  account: string;
  topic: ConversationTopic;
  updates: {
    pinned?: boolean;
    unread?: boolean;
    deleted?: boolean;
    readUntil?: string;
  };
}) {
  const { account, topic, updates } = args;
  const conversationId = await getConversationId({ account, topic });

  const { data } = await api.post(`/api/metadata/conversation`, {
    conversationId,
    deviceIdentityId: account, // Using account as deviceIdentityId
    ...updates,
  });

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse metadata update response: ${JSON.stringify(parseResult.error)}`
      )
    );
  }

  return data as IConversationMetadata;
}

export async function markConversationAsRead(args: {
  account: string;
  topic: ConversationTopic;
  readUntil: string;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      unread: false,
      readUntil: args.readUntil,
    },
  });
}

export async function markConversationAsUnread(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      unread: true,
    },
  });
}

export async function pinConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      pinned: true,
    },
  });
}

export async function unpinConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      pinned: false,
    },
  });
}

export async function restoreConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      deleted: false,
    },
  });
}

export async function deleteConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      deleted: true,
    },
  });
}
```

Key changes made:
1. Updated the schema field names to match BE (isDeleted → deleted, isPinned → pinned, isUnread → unread)
2. Created a shared `updateConversationMetadata` helper function to handle all metadata updates
3. Changed all update endpoints to use POST to `/api/metadata/conversation`
4. Added deviceIdentityId to the request payload (using account as the ID)
5. Updated all mutation functions to use the new helper function
6. Kept the GET endpoint for fetching single conversation metadata

The code is now more DRY with the shared update function and matches the new BE schema and endpoints.

---



---


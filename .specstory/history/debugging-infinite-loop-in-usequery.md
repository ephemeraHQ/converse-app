## SpecStory

## Debugging Infinite Loop in useQuery (1/13/2025, 9:15:24 PM)

_**User**_

help me find the problem, I have an infiite loop when i use useQuery with the current queryconfig.. Idon't understsand why

---

_**Assistant**_

Looking at the code snippets, I notice a potential issue that could cause an infinite loop. The problem might be in how the query dependencies are set up. Let me help identify the key issues:

1. First, there appears to be duplicate files handling conversation queries (`useConversationQuery.ts` appears twice with slightly different implementations).

2. The main issue likely stems from the query configuration. Let's look at the key parts:

```typescript:queries/useConversationQuery.ts
export const useConversationQuery = (args: IArgs) => {
  return useQuery({
    ...getConversationQueryOptions(args),
  });
};

export function getConversationQueryOptions(args: IArgs) {
  const { account, topic, context } = args;
  return {
    queryKey: conversationQueryKey(account, topic),
    queryFn: () => getConversation({ account, topic: topic!, context }),
    enabled: !!topic,
  };
}
```

The potential causes for the infinite loop could be:

1. Missing query caching configuration
2. No stale time setting
3. The query might be triggering its own re-renders which cause it to re-fetch

Here's how to fix it:

```typescript:queries/useConversationQuery.ts
export const useConversationQuery = (args: IArgs) => {
  return useQuery({
    ...getConversationQueryOptions(args),
    // Add these configurations to prevent unnecessary refetches
    staleTime: 5000, // Consider data fresh for 5 seconds
    cacheTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount
  });
};
```

Also, make sure that:

1. The `args` object passed to `useConversationQuery` is stable (use `useMemo` if created in a component)
2. The `context` value in `args` is not changing on every render
3. The `conversationQueryKey` is properly memoized

You might want to add some debugging to verify when the query is being triggered:

```typescript:queries/useConversationQuery.ts
export const useConversationQuery = (args: IArgs) => {
  return useQuery({
    ...getConversationQueryOptions(args),
    staleTime: 5000,
    cacheTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    onFetch: () => {
      console.log('Fetching conversation:', args);
    },
  });
};
```

If you're still seeing the infinite loop, could you share:
1. How you're using the `useConversationQuery` hook in your component
2. The implementation of `conversationQueryKey`
3. Any state changes or effects in the component using this query

This would help identify if the issue is coming from the component implementation rather than the query configuration itself.

---

_**User**_

the inifnite loop seems to be with use-conversat-data-query

---

_**Assistant**_

Ah, let's examine the `use-conversation-data-query.ts` file more closely. I can see a few potential issues that might cause an infinite loop:

1. The batching mechanism might be retriggering unnecessarily
2. The query configuration lacks controls for refetching

Here's how we can fix it:

```typescript:queries/use-conversation-data-query.ts
export const useConversationDataQuery = (args: IArgs) => {
  return useQuery({
    ...getConversationDataQueryOptions(args),
    // Add these controls to prevent unnecessary refetching
    staleTime: 5000,
    cacheTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export function getConversationDataQueryOptions(args: IArgs) {
  const { account, topic } = args;
  return {
    queryKey: conversationDataQueryKey(account, topic),
    queryFn: () => getConversationData(args),
    // Make sure all dependencies are truly needed
    enabled: Boolean(topic) && Boolean(account),
  };
}

// Add some debugging to the fetch function
async function getConversationData(args: IArgs) {
  logger.debug(
    `[ConversationDataQuery] getConversationData called with:`,
    JSON.stringify(args)
  );
  
  const data = await batchedGetConversationTopicData.fetch(args);
  
  logger.debug(
    `[ConversationDataQuery] getConversationData completed with data:`,
    JSON.stringify(data)
  );
  
  return data;
}
```

Also, the batching mechanism might need adjustment. The current window of 50ms might be too short:

```typescript:queries/use-conversation-data-query.ts
const batchedGetConversationTopicData = create({
  // Increase the window to reduce frequent batches
  scheduler: windowScheduler(100), // increased from 50 to 100ms
  resolver: (items, query) => {
    const match = items.find(
      (item) =>
        `${query.account}-${query.topic}` === `${item.account}-${item.topic}`
    );
    if (!match) return undefined;
    const { account, topic, ...rest } = match;
    return rest;
  },
  // ... rest of the implementation
});
```

To help debug this further:
1. Could you share how you're using this hook in your component?
2. Are you seeing multiple logs from the `getConversationData` function?
3. Is the `context` prop changing frequently in your component?

The infinite loop might be caused by:
1. The component re-rendering frequently and changing the query parameters
2. The batching mechanism retriggering unnecessarily
3. The query key not being stable
4. The enabled condition fluctuating

If you can share the component code where you're using this hook, I can provide more specific guidance.

---

_**User**_

here's what I notice. The query get called but doesn't have time to finish the fetch function that it gets recalled again and again etc...

---

_**Assistant**_



Ah, now I understand the issue better. The problem is likely that the query is being re-triggered before the previous fetch can complete. Let's modify the batching mechanism and add proper request deduplication:

```typescript:queries/use-conversation-data-query.ts
export const useConversationDataQuery = (args: IArgs) => {
  return useQuery({
    ...getConversationDataQueryOptions(args),
    // Add request deduplication
    retry: false,
    // Prevent concurrent requests for the same data
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // Add a longer stale time to prevent unnecessary refetches
    staleTime: 1000 * 30, // 30 seconds
    // Important: Add this to ensure we don't cancel in-flight requests
    keepPreviousData: true,
  });
};

// Modify the batching mechanism
const batchedGetConversationTopicData = create({
  // Increase window time to allow more batching
  scheduler: windowScheduler(200), // increased from 50ms to 200ms
  resolver: (items, query) => {
    const match = items.find(
      (item) =>
        `${query.account}-${query.topic}` === `${item.account}-${item.topic}`
    );
    if (!match) return undefined;
    const { account, topic, ...rest } = match;
    return rest;
  },
  fetcher: async (args: IArgs[]) => {
    // Add a simple request deduplication mechanism
    const uniqueRequests = Array.from(
      new Map(args.map(arg => [`${arg.account}-${arg.topic}`, arg])).values()
    );

    logger.debug(
      `[ConversationDataQuery] Starting batch fetch for ${uniqueRequests.length} unique requests`
    );

    try {
      const accountGroups = uniqueRequests.reduce(
        (groups, arg) => {
          groups[arg.account] = groups[arg.account] || [];
          groups[arg.account].push(arg);
          return groups;
        },
        {} as Record<string, IArgs[]>
      );

      const results = await Promise.all(
        Object.entries(accountGroups).map(async ([account, groupArgs]) => {
          const conversationsData = await getTopics({
            account,
          });

          return groupArgs.map((arg) => ({
            ...conversationsData[arg.topic],
            account,
            topic: arg.topic,
          }));
        })
      );

      logger.debug(
        `[ConversationDataQuery] Batch fetch completed successfully`
      );

      return results.flat();
    } catch (error) {
      logger.error(
        `[ConversationDataQuery] Batch fetch failed:`,
        error
      );
      throw error;
    }
  },
});
```

The key changes are:

1. Added `keepPreviousData: true` to maintain existing data while fetching
2. Increased the batch window to 200ms to allow more requests to be batched together
3. Added request deduplication in the batching mechanism
4. Added proper error handling and logging
5. Added `staleTime` to prevent unnecessary refetches
6. Disabled automatic refetching behaviors

These changes should:
1. Prevent the query from being re-triggered while a fetch is in progress
2. Better handle concurrent requests
3. Provide more stability in the data fetching process

If you're still seeing issues, could you check if the component using this hook is rapidly changing any of the query parameters (`account`, `topic`, or `context`)? That could also cause repeated query calls.

---

_**User**_

ok more context. I see that getting the topic fails. Like the API triggers an error, but why doesi t still retry and retry infinite time?? I have retry:false??

---

_**Assistant**_



Ah, now I understand the root cause! Even though you have `retry: false`, the error might be propagating in a way that causes the query to restart. Let's modify the error handling and add proper error boundaries:

```typescript:queries/use-conversation-data-query.ts
export const useConversationDataQuery = (args: IArgs) => {
  return useQuery({
    ...getConversationDataQueryOptions(args),
    retry: false,
    // Add explicit error handling
    retryOnMount: false,
    // Add error boundary
    useErrorBoundary: false,
    // Add onError callback to log but prevent retries
    onError: (error) => {
      logger.error(
        `[ConversationDataQuery] Error fetching data:`,
        error,
        { account: args.account, topic: args.topic }
      );
    },
  });
};

async function getConversationData(args: IArgs) {
  try {
    logger.debug(
      `[ConversationDataQuery] getConversationData starting for:`,
      { account: args.account, topic: args.topic }
    );
    
    const data = await batchedGetConversationTopicData.fetch(args);
    
    if (!data) {
      // Explicitly throw if no data to prevent silent failures
      throw new Error('No data returned from fetch');
    }
    
    return data;
  } catch (error) {
    // Log the error but don't retry
    logger.error(
      `[ConversationDataQuery] Failed to fetch conversation data:`,
      error,
      { account: args.account, topic: args.topic }
    );
    // Re-throw to be handled by react-query
    throw error;
  }
}

const batchedGetConversationTopicData = create({
  scheduler: windowScheduler(200),
  resolver: (items, query) => {
    try {
      const match = items.find(
        (item) =>
          `${query.account}-${query.topic}` === `${item.account}-${item.topic}`
      );
      if (!match) return undefined;
      const { account, topic, ...rest } = match;
      return rest;
    } catch (error) {
      logger.error(
        `[ConversationDataQuery] Resolver error:`,
        error
      );
      throw error;
    }
  },
  fetcher: async (args: IArgs[]) => {
    try {
      // ... existing fetcher code ...
      const results = await Promise.all(
        Object.entries(accountGroups).map(async ([account, groupArgs]) => {
          const conversationsData = await getTopics({
            account,
          });

          if (!conversationsData) {
            throw new Error(`No conversation data returned for account: ${account}`);
          }

          return groupArgs.map((arg) => ({
            ...conversationsData[arg.topic],
            account,
            topic: arg.topic,
          }));
        })
      );

      return results.flat();
    } catch (error) {
      logger.error(
        `[ConversationDataQuery] Batch fetcher error:`,
        error
      );
      // Explicitly throw to prevent silent failures
      throw error;
    }
  },
});
```

The key changes are:
1. Added explicit error handling at each level
2. Added `retryOnMount: false` to prevent retries on component mount
3. Added `useErrorBoundary: false` to prevent error boundary triggers
4. Added proper error logging
5. Made sure errors are properly propagated without causing retries

Also, check if the component using this hook is properly handling the error state:

```typescript
const MyComponent = () => {
  const { data, error, isError } = useConversationDataQuery({
    account,
    topic,
    context,
  });

  if (isError) {
    // Handle error state appropriately
    return <ErrorComponent error={error} />;
  }

  // ... rest of component
};
```

If you're still seeing infinite retries, could you:
1. Share the error you're seeing in the logs?
2. Check if there are any error boundaries higher up in the component tree that might be triggering remounts?
3. Verify that the `getTopics` function isn't retrying internally?

---

_**User**_

also why the error in useQuery is "Undefined Message" ?

---

_**Assistant**_



The "Undefined Message" error typically occurs when the error being thrown isn't properly formatted or is being lost in the promise chain. Let's fix the error handling to ensure we get proper error messages:

```typescript:queries/use-conversation-data-query.ts
async function getConversationData(args: IArgs) {
  try {
    logger.debug(
      `[ConversationDataQuery] getConversationData starting for:`,
      { account: args.account, topic: args.topic }
    );
    
    const data = await batchedGetConversationTopicData.fetch(args);
    
    if (!data) {
      // Create a proper error object with a message
      throw new Error('Failed to fetch conversation data: No data returned');
    }
    
    return data;
  } catch (error) {
    // Ensure we're throwing a proper Error object
    if (error instanceof Error) {
      throw error;
    }
    // If it's not an Error object, create one with the details
    throw new Error(
      `Failed to fetch conversation data: ${
        typeof error === 'string' ? error : JSON.stringify(error)
      }`
    );
  }
}

const batchedGetConversationTopicData = create({
  // ... scheduler and resolver ...
  fetcher: async (args: IArgs[]) => {
    try {
      const accountGroups = args.reduce(
        (groups, arg) => {
          groups[arg.account] = groups[arg.account] || [];
          groups[arg.account].push(arg);
          return groups;
        },
        {} as Record<string, IArgs[]>
      );

      const results = await Promise.all(
        Object.entries(accountGroups).map(async ([account, groupArgs]) => {
          try {
            const conversationsData = await getTopics({
              account,
            });

            if (!conversationsData) {
              throw new Error(`No conversation data returned for account: ${account}`);
            }

            return groupArgs.map((arg) => {
              const topicData = conversationsData[arg.topic];
              if (!topicData) {
                throw new Error(
                  `No data found for topic "${arg.topic}" in account "${account}"`
                );
              }
              return {
                ...topicData,
                account,
                topic: arg.topic,
              };
            });
          } catch (error) {
            // Properly format errors from getTopics
            throw new Error(
              `Failed to fetch topics for account ${account}: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        })
      );

      return results.flat();
    } catch (error) {
      logger.error(
        `[ConversationDataQuery] Batch fetcher error:`,
        error
      );
      // Ensure we throw a proper Error object
      throw new Error(
        `Batch fetching failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
});

// In the useQuery hook, add better error handling
export const useConversationDataQuery = (args: IArgs) => {
  return useQuery({
    ...getConversationDataQueryOptions(args),
    retry: false,
    retryOnMount: false,
    useErrorBoundary: false,
    onError: (error) => {
      logger.error(
        `[ConversationDataQuery] Query error:`,
        error instanceof Error ? error.message : error,
        { account: args.account, topic: args.topic }
      );
    },
    // Add this to help with debugging
    select: (data) => {
      if (!data) {
        throw new Error('No data returned from query');
      }
      return data;
    },
  });
};
```

The key changes are:
1. Proper error object creation at each error point
2. Better error message formatting
3. Proper error propagation through the promise chain
4. Added validation checks with descriptive error messages
5. Proper error handling for the `getTopics` response

Now you should see more descriptive error messages that indicate:
1. Where the error occurred
2. What caused the error
3. Which account/topic was being processed when the error occurred

This should help you identify exactly where and why the data fetching is failing.

---

_**User**_

AHH I think the message comes from @topics.ts  return TopicSchema.parse(data); Maybe the parsing fails? And I don't have any message? I'm using Zod to parse

---

_**Assistant**_



Ah yes! That's likely the issue. Zod errors need to be properly handled as they have a specific error format. Let's modify the topics.ts file to handle Zod parsing errors properly:

```typescript:utils/api/topics.ts
// ... existing imports ...

export async function getTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] getTopic for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  try {
    const { data } = await api.post(
      `/api/topics/details`,
      {
        topic,
      },
      {
        headers: await getXmtpApiHeaders(account),
      }
    );

    // Add logging to see the raw data
    logger.debug('[API TOPICS] Raw topic data:', data);

    try {
      return TopicSchema.parse(data);
    } catch (zodError) {
      // Properly format Zod errors
      if (zodError instanceof z.ZodError) {
        const errorMessage = zodError.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new Error(`Topic data validation failed: ${errorMessage}`);
      }
      throw zodError;
    }
  } catch (error) {
    // Handle both API and parsing errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(
      `[API TOPICS] Failed to get topic:`,
      { error, account, topic, errorMessage }
    );
    throw new Error(`Failed to get topic: ${errorMessage}`);
  }
}

// Similarly update getTopics function
export async function getTopics(args: { account: string }) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account } = args;

  try {
    const { data } = await api.get(`/api/topics`, {
      headers: await getXmtpApiHeaders(account),
    });

    // Add logging to see the raw data
    logger.debug('[API TOPICS] Raw topics data:', data);

    try {
      return z.record(TopicSchema).parse(data);
    } catch (zodError) {
      // Properly format Zod errors
      if (zodError instanceof z.ZodError) {
        const errorMessage = zodError.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new Error(`Topics data validation failed: ${errorMessage}`);
      }
      throw zodError;
    }
  } catch (error) {
    // Handle both API and parsing errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(
      `[API TOPICS] Failed to get topics:`,
      { error, account, errorMessage }
    );
    throw new Error(`Failed to get topics: ${errorMessage}`);
  }
}
```

The key changes are:
1. Added proper Zod error handling
2. Added logging of raw data before parsing
3. Formatted Zod validation errors into readable messages
4. Added proper error propagation

Now you should see more descriptive error messages that will tell you exactly what's wrong with the data structure. For example, if a required field is missing or has the wrong type, you'll see something like:
```
"Topics data validation failed: isDeleted: Required, readUntil: Expected number, received string"
```

This will help you identify:
1. Which fields are failing validation
2. What the expected vs actual types are
3. Whether required fields are missing

Could you check your logs now and see what specific validation errors you're getting? This will help us identify what's wrong with the data structure.

---

_**User**_

is there a cleaner way with Zod?

---

_**Assistant**_



Yes! Zod provides a cleaner way to handle parsing errors using `safeParse`. Here's a cleaner implementation:

```typescript:utils/api/topics.ts
export async function getTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] getTopic for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  const { data } = await api.post(
    `/api/topics/details`,
    { topic },
    { headers: await getXmtpApiHeaders(account) }
  );

  const result = TopicSchema.safeParse(data);
  
  if (!result.success) {
    logger.error('[API TOPICS] Validation error:', result.error.format());
    throw new Error(`Invalid topic data: ${result.error.message}`);
  }

  return result.data;
}

export async function getTopics(args: { account: string }) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
  });

  const result = z.record(TopicSchema).safeParse(data);
  
  if (!result.success) {
    logger.error('[API TOPICS] Validation error:', result.error.format());
    throw new Error(`Invalid topics data: ${result.error.message}`);
  }

  return result.data;
}
```

The benefits of using `safeParse`:
1. Cleaner error handling
2. Type-safe return value
3. No need for try/catch blocks around parsing
4. Provides formatted error messages out of the box

The error messages will be more structured and readable by default. If you need even more control over error formatting, you could create a helper:

```typescript:utils/api/topics.ts
function handleZodError(error: z.ZodError) {
  const formattedError = error.format();
  logger.error('[API TOPICS] Validation error:', formattedError);
  
  // Create a more user-friendly error message
  const errorMessage = Object.entries(formattedError)
    .filter(([key]) => key !== '_errors')
    .map(([key, value]) => `${key}: ${(value as any)._errors.join(', ')}`)
    .join('; ');
    
  throw new Error(`Validation failed: ${errorMessage}`);
}

export async function getTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;

  const { data } = await api.post(
    `/api/topics/details`,
    { topic },
    { headers: await getXmtpApiHeaders(account) }
  );

  const result = TopicSchema.safeParse(data);
  if (!result.success) {
    handleZodError(result.error);
  }

  return result.data;
}
```

This gives you clean error handling while still maintaining detailed error information in your logs.

---



---


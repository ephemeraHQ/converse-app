## SpecStory

## Handling Promises Individually for Resilience (2/8/2025, 3:37:12 PM)

_**User**_

i don,t want prmise.all because if one crash then all fail...

---

_**Assistant**_

I'll modify the code to handle each promise individually instead of using Promise.all. This way, if one promise fails, we'll still get results from the successful ones.

```typescript:features/conversation/conversation-create/hooks/use-search-convos-users.ts
// ... existing code ...

async function handleGeneralSearch(searchQuery: string) {
  const profiles = await searchProfilesForCurrentAccount(searchQuery);

  if (isEmptyObject(profiles)) {
    return {
      message: "No matches found.\nWould you like to invite them?",
      inboxIds: [],
    };
  }

  const inboxIds: string[] = [];
  
  // Process each address sequentially and handle errors individually
  for (const address of Object.keys(profiles)) {
    try {
      const inboxId = await getInboxIdFromAddress({
        currentUserAddress: getCurrentAccount()!,
        targetEthAddress: address,
      });
      
      if (inboxId) {
        inboxIds.push(inboxId);
      }
    } catch (error) {
      // Log error but continue processing other addresses
      logger.error(`Failed to get inbox ID for address ${address}: ${error}`);
    }
  }

  return {
    message: "",
    inboxIds: inboxIds,
  };
}

// ... existing code ...
```

This change replaces the Promise.all with a for...of loop that:
1. Processes each address sequentially
2. Wraps each getInboxIdFromAddress call in a try-catch block
3. Only adds successful results to the inboxIds array
4. Continues processing remaining addresses even if one fails

This makes the search more resilient to individual failures while still collecting all available results.

---

_**User**_



---

_**Assistant**_

I notice we need to import the logger. Let me add that import at the top of the file.

```typescript:features/conversation/conversation-create/hooks/use-search-convos-users.ts
// ... existing imports ...
import { logger } from "@/utils/logger";

// ... rest of the existing code ...
```

This will fix the linter error by importing the logger utility that we're using to log errors when getting inbox IDs fails for individual addresses.

---

_**User**_

but keep running in parralel!

---

_**Assistant**_

Ah, I understand - you want to run the requests in parallel but handle failures individually. We can use Promise.allSettled() for this, which will wait for all promises to complete (either successfully or with an error) without failing the entire batch.

```typescript:features/conversation/conversation-create/hooks/use-search-convos-users.ts
async function handleGeneralSearch(searchQuery: string) {
  const profiles = await searchProfilesForCurrentAccount(searchQuery);

  if (isEmptyObject(profiles)) {
    return {
      message: "No matches found.\nWould you like to invite them?",
      inboxIds: [],
    };
  }

  const promises = Object.keys(profiles).map((address) =>
    getInboxIdFromAddress({
      currentUserAddress: getCurrentAccount()!,
      targetEthAddress: address,
    }).catch((error) => {
      logger.error(`Failed to get inbox ID for address ${address}: ${error}`);
      return null;
    })
  );

  const results = await Promise.allSettled(promises);
  const inboxIds = results
    .map((result) => (result.status === "fulfilled" ? result.value : null))
    .filter((inboxId): inboxId is string => !!inboxId);

  return {
    message: "",
    inboxIds,
  };
}
```

This solution:
1. Runs all requests in parallel for better performance
2. Handles individual failures without affecting other requests
3. Filters out any failed or null results at the end
4. Maintains type safety with the type predicate in the filter

---

_**User**_



---

_**Assistant**_

The code looks good now! The changes we made:

1. Kept parallel execution using `Promise.allSettled()` instead of `Promise.all()`
2. Added proper error handling for each individual promise
3. Used type predicate in the filter to maintain type safety
4. Simplified the return statement using object property shorthand
5. Properly imported and used the logger

There are no linter errors and the code follows all the style guidelines. The solution maintains parallel execution for better performance while being resilient to individual failures.

Would you like me to explain any part of the implementation in more detail?

---

_**User**_

don't use allSettled. use something else. MAybe just promise.all but try catch inside

---

_**Assistant**_



Let's simplify it by using Promise.all with a try-catch inside the map function. This will still run in parallel but handle errors individually.

```typescript:features/conversation/conversation-create/hooks/use-search-convos-users.ts
async function handleGeneralSearch(searchQuery: string) {
  const profiles = await searchProfilesForCurrentAccount(searchQuery);

  if (isEmptyObject(profiles)) {
    return {
      message: "No matches found.\nWould you like to invite them?",
      inboxIds: [],
    };
  }

  const inboxIds = await Promise.all(
    Object.keys(profiles).map(async (address) => {
      try {
        const inboxId = await getInboxIdFromAddress({
          currentUserAddress: getCurrentAccount()!,
          targetEthAddress: address,
        });
        return inboxId;
      } catch (error) {
        logger.error(`Failed to get inbox ID for address ${address}: ${error}`);
        return null;
      }
    })
  );

  return {
    message: "",
    inboxIds: inboxIds.filter((id): id is string => !!id),
  };
}
```

This solution:
1. Still runs all requests in parallel with Promise.all
2. Handles errors for each individual request inside the map function
3. Returns null for failed requests which we filter out at the end
4. Maintains type safety with the type predicate
5. Is more straightforward than using Promise.allSettled

---

_**User**_



---

_**Assistant**_

The code looks good now! There are no linter errors and the implementation:

1. Runs all requests in parallel using Promise.all
2. Properly handles errors for each individual request using try-catch
3. Maintains type safety with the type predicate in the filter
4. Follows all the style guidelines
5. Has proper error logging

The solution achieves the goal of parallel execution while being resilient to individual failures. Each request is independent and a failure in one won't affect the others.

Would you like me to explain any part of the implementation in more detail?

---



---


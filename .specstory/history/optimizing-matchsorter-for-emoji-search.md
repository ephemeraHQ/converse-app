## SpecStory

## Optimizing matchSorter for Emoji Search (12/20/2024, 10:04:09 AM)

_**User**_

check matchSorter lib, how can I make it faster? I feel it still slow

---

_**Assistant**_

I'll help you optimize the emoji search performance. Here are a few strategies to improve the `matchSorter` performance:

1. Implement a minimum character threshold
2. Use a more restrictive ranking threshold
3. Cache previous search results
4. Limit the number of results

Here's the optimized version:

```typescript:features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker.tsx
// Add this near other constants
const MINIMUM_SEARCH_LENGTH = 2;
const MAX_RESULTS = 60; // 10 rows of 6 emojis

// Add a simple cache
const searchCache = new Map<string, CategorizedEmojisRecord[]>();

const filterEmojis = (text: string) => {
  const cleanedSearch = text.toLowerCase().trim();
  
  if (cleanedSearch.length === 0) {
    return defaultEmojis;
  }

  if (cleanedSearch.length < MINIMUM_SEARCH_LENGTH) {
    return [];
  }

  // Check cache first
  const cached = searchCache.get(cleanedSearch);
  if (cached) {
    return cached;
  }

  const matches = matchSorter(flatEmojis, cleanedSearch, {
    keys: ["keywords", "name", "emoji"],
    threshold: matchSorter.rankings.STARTS_WITH, // Stricter threshold
    baseSort: (a, b) => (a.item.keywords?.length || 0) - (b.item.keywords?.length || 0),
  }).slice(0, MAX_RESULTS);

  const result = sliceEmojis(matches);
  
  // Cache the result
  searchCache.set(cleanedSearch, result);
  
  return result;
};

// Clear cache when component unmounts
useEffect(() => {
  return () => {
    searchCache.clear();
  };
}, []);
```

Key improvements:

1. Added a minimum character threshold (2 chars) before searching to avoid unnecessary processing
2. Using `STARTS_WITH` instead of `CONTAINS` makes the search more precise and faster
3. Added result limiting to prevent processing too many emojis
4. Implemented a simple cache to store previous search results
5. Added `baseSort` to prioritize emojis with fewer keywords first (usually more relevant)

You might also want to consider:

1. If the emoji list is large, you could pre-compute keyword indices for faster lookup
2. You could implement fuzzy search using a library like `fuse.js` instead of `match-sorter`
3. You could debounce with a slightly longer delay (e.g., 150-200ms) if it's still too intensive

Let me know if you'd like me to elaborate on any of these additional optimization strategies!

---

_**User**_

why will fuse be faster?

---

_**Assistant**_

I apologize for suggesting Fuse.js would be faster - I was incorrect. 

Actually, Fuse.js would likely be slower than match-sorter in this case because:

1. Fuse.js uses fuzzy-search algorithms that compute Levenshtein distance between strings, which is more computationally expensive than match-sorter's ranking system

2. match-sorter is optimized for exact prefix matching and uses simpler string comparison algorithms

3. Fuse.js is better for scenarios where you need:
   - Fuzzy matching (tolerating typos/misspellings)
   - Complex weighted scoring across multiple fields
   - Finding approximate matches

For emoji search where we want quick prefix/keyword matching, match-sorter is the better choice. The optimizations I suggested earlier (caching, limiting results, minimum character threshold) would be more effective for improving performance than switching libraries.

I apologize for the misleading suggestion. Would you like to explore other performance optimization strategies instead?

---

_**User**_

I think what seems to be slow is that flatEmojis list is big... 

---

_**Assistant**_



Ah yes, that's a good observation! Instead of working with a flat list, we can optimize by pre-categorizing and indexing the emojis. Here's an improved approach:

```typescript:features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker.tsx
// Create an indexed structure for faster lookups
type IEmojiIndex = {
  [key: string]: Emoji[];
};

// Build the index once when the file loads
const emojiSearchIndex: IEmojiIndex = {};
flatEmojis.forEach((emoji) => {
  // Index by first letter of name and keywords
  const addToIndex = (term: string) => {
    const key = term.toLowerCase().charAt(0);
    if (!emojiSearchIndex[key]) {
      emojiSearchIndex[key] = [];
    }
    if (!emojiSearchIndex[key].includes(emoji)) {
      emojiSearchIndex[key].push(emoji);
    }
  };

  addToIndex(emoji.name);
  emoji.keywords?.forEach(addToIndex);
});

const filterEmojis = (text: string) => {
  const cleanedSearch = text.toLowerCase().trim();
  
  if (cleanedSearch.length === 0) {
    return defaultEmojis;
  }

  // Get the first character's emoji list from our index
  const firstChar = cleanedSearch.charAt(0);
  const candidateEmojis = emojiSearchIndex[firstChar] || [];
  
  if (cleanedSearch.length === 1) {
    return sliceEmojis(candidateEmojis.slice(0, 60));
  }

  // Then use matchSorter only on this smaller subset
  const matches = matchSorter(candidateEmojis, cleanedSearch, {
    keys: ["keywords", "name", "emoji"],
    threshold: matchSorter.rankings.STARTS_WITH,
  }).slice(0, 60);

  return sliceEmojis(matches);
};
```

Key improvements:

1. We create an index by first character, so instead of searching through ALL emojis, we only search through emojis that start with the same letter
2. For single-character searches, we don't even need matchSorter
3. When we do use matchSorter, it's working with a much smaller subset of emojis

This should be significantly faster because:
- The initial search space is reduced dramatically
- We're doing simpler operations for single-character searches
- matchSorter is working with a much smaller array

You could even take this further by:
1. Creating more sophisticated indexes (by first two characters, for example)
2. Pre-computing common searches
3. Implementing a trie data structure for even faster prefix matching

Would you like me to elaborate on any of these additional optimizations?

---



---


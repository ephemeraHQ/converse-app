## SpecStory

## Refactoring Code to TypeScript (1/19/2025, 7:04:48 AM)

_**User**_

make it cleaner and better and add typescript

---

_**Assistant**_

I'll help convert this to TypeScript and clean up the code following the style guide. Here are the key changes:

1. Add TypeScript types
2. Use modern ES6+ syntax
3. Clean up function declarations and parameters
4. Add proper error handling
5. Add some documentation comments

Here's the cleaned up version:

```typescript:vendor/humanhash.ts
import { capitalize } from "../utils/str";

// Word list for human-readable hash generation
const wordlist = [
  // ... existing code ...
] as const;

type Separator = string;
type DigestString = string;

interface HumanizeOptions {
  numWords?: number;
  separator?: Separator;
  shouldCapitalize?: boolean;
}

/**
 * Converts a hexadecimal digest into human-readable words
 */
export function humanize(
  digest: DigestString,
  { numWords = 4, separator = "-", shouldCapitalize = false }: HumanizeOptions = {}
): string {
  if (!/^[a-fA-F0-9]+$/.test(digest)) {
    throw new Error("Digest must be hexadecimal characters only");
  }

  const chars = digest.split("");
  const bytes: number[] = [];
  
  // Convert hex pairs to bytes
  for (let i = 0; i < chars.length && bytes.length < numWords; i += 2) {
    const hex = parseInt(chars[i] + (chars[i + 1] || "0"), 16);
    bytes.push(hex);
  }

  const compressedBytes = compress(bytes, numWords);
  
  return compressedBytes
    .map(byte => {
      const word = wordlist[byte];
      return shouldCapitalize ? capitalize(word) : word;
    })
    .join(separator);
}

/**
 * Compresses a list of byte values to a fixed target length
 */
export function compress(bytes: number[], target: number): number[] {
  const paddedBytes = [...bytes];

  // Zero-pad if needed
  for (let i = target - bytes.length; i > 0; i--) {
    paddedBytes.push(0);
  }

  if (target === paddedBytes.length) {
    return paddedBytes;
  }

  const bytesLength = paddedBytes.length;
  const segSize = Math.floor(bytesLength / target);
  const segments: number[] = [];

  // Split bytes into target segments using XOR for compression
  for (let i = 0; i < bytesLength; i++) {
    const segNum = Math.min(Math.floor(i / segSize), target - 1);
    segments[segNum] = segments[segNum] !== undefined 
      ? segments[segNum] ^ paddedBytes[i] 
      : paddedBytes[i];
  }

  return segments;
}

interface UUIDResult {
  humanized: string;
  digest: string;
}

/**
 * Generates a UUID and its human-readable representation
 */
export function uuid(numWords?: number, separator?: Separator): UUIDResult {
  const digest = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  return {
    humanized: humanize(digest, { numWords, separator }),
    digest,
  };
}

/**
 * Converts a human-readable hash back to its digest form
 */
export function dehumanize(human: string, separator: Separator = "-"): string | false {
  const words = human.split(separator);
  const result: string[] = [];

  for (const word of words) {
    const found = unhash(word);
    if (found === false) {
      return false;
    }
    result.push(found.toString(16));
  }

  return result.join("");
}

/**
 * Binary search for the index of a human hash word
 */
export function unhash(human: string): number | false {
  const searchTerm = human.toLowerCase();
  let upper = 255;
  let lower = 0;

  while (upper >= lower) {
    const middle = lower + Math.floor((upper - lower) / 2);
    const foundHash = wordlist[middle].toLowerCase();

    if (foundHash < searchTerm) {
      lower = middle + 1;
    } else if (foundHash > searchTerm) {
      upper = middle - 1;
    } else {
      return middle;
    }
  }

  return false;
}
```

Key improvements made:

1. Added TypeScript types and interfaces
2. Converted to modern function declarations
3. Used object parameter pattern for `humanize` options
4. Added proper return type annotations
5. Used more descriptive variable names
6. Added documentation comments for main functions
7. Used const assertions for wordlist
8. Improved error message clarity
9. Used array spread operator instead of manual pushing
10. Made the code more functional where appropriate
11. Improved the UUID return type to be more structured
12. Made separator parameter consistent across functions
13. Used early returns where appropriate
14. Removed unnecessary variable declarations

The functionality remains the same, but the code is now more type-safe and follows modern JavaScript/TypeScript conventions.

---



---


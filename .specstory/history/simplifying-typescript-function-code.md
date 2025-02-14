## SpecStory

## Simplifying TypeScript Function Code (11/14/2024, 10:42:20 AM)

_**User**_

make simpler! 

---

_**Assistant**_

I'll simplify the `createMatchedPart` function by making it more readable and straightforward. Here's the simplified version:

```typescript:components/ParsedText/ParsedText.utils.ts
function createMatchedPart(args: {
  pattern: ICustomParseShape;
  match: RegExpMatchArray;
  index: number;
}): ITextPart {
  const { pattern, match, index } = args;
  const text = match[0];
  
  const excludedKeys = ["pattern", "renderText", "nonExhaustiveMaxMatchCount"];
  const props: Record<string, any> = {};

  for (const [key, value] of Object.entries(pattern)) {
    if (excludedKeys.includes(key)) {
      continue;
    }

    props[key] = typeof value === "function" 
      ? () => value(text, index) 
      : value;
  }

  return {
    ...props,
    children: pattern.renderText?.(text, match) ?? text,
    _matched: true,
  };
}
```

Key changes made:
1. Replaced the `reduce` with a more readable `for...of` loop
2. Created `excludedKeys` array for better readability
3. Simplified the logic by using direct object assignment instead of accumulator
4. Added explicit typing for `props`
5. Used early continue for excluded keys

The function still does the same thing but is now easier to read and understand at a glance.

---



---


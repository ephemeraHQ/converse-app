## SpecStory

## Simplifying TypeScript Code for Text Parsing (11/14/2024, 10:32:12 AM)

_**User**_

can this be simpler?

---

_**Assistant**_

Yes, we can simplify this code by converting it to a functional approach and making it more concise. Here's a simplified version:

```typescript:components/ParsedText/ParsedText.utils.ts
import { ICustomParseShape } from "@components/ParsedText/ParsedText.types";

type ITextPart = {
  children: string;
  _matched?: boolean;
  [key: string]: any;
}

function parseText(args: { text: string; patterns: ICustomParseShape[] }): ITextPart[] {
  const { text, patterns } = args;
  
  return patterns.reduce((parsedTexts: ITextPart[], pattern) => {
    const maxMatches = pattern.nonExhaustiveMaxMatchCount ?? Infinity;
    let currentMatches = 0;
    
    return parsedTexts.flatMap((part) => {
      if (part._matched) return part;
      
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags + 'g');
      const results: ITextPart[] = [];
      let textLeft = part.children;
      let lastIndex = 0;
      
      for (const match of textLeft.matchAll(regex)) {
        if (currentMatches++ >= maxMatches) break;
        
        const index = match.index!;
        
        // Add text before match
        if (index > lastIndex) {
          results.push({ children: textLeft.slice(lastIndex, index) });
        }
        
        // Add matched part with props
        results.push(createMatchedPart({ pattern, match, index }));
        
        lastIndex = index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < textLeft.length) {
        results.push({ children: textLeft.slice(lastIndex) });
      }
      
      return results;
    });
  }, [{ children: text }]).filter(part => part.children);
}

function createMatchedPart(args: { 
  pattern: ICustomParseShape; 
  match: RegExpMatchArray; 
  index: number; 
}): ITextPart {
  const { pattern, match, index } = args;
  const text = match[0];
  
  const props = Object.entries(pattern).reduce((acc, [key, value]) => {
    if (['pattern', 'renderText', 'nonExhaustiveMaxMatchCount'].includes(key)) return acc;
    
    acc[key] = typeof value === 'function' ? () => value(text, index) : value;
    return acc;
  }, {} as Record<string, any>);

  return {
    ...props,
    children: pattern.renderText?.(text, match) ?? text,
    _matched: true,
  };
}

export default parseText;
```

Key improvements made:

1. Converted from class-based to functional approach
2. Removed nested callbacks in favor of more declarative code
3. Used more modern JavaScript features like optional chaining and nullish coalescing
4. Simplified the regex handling using `matchAll` instead of manual `exec`
5. Better TypeScript types with more descriptive names
6. Reduced nesting levels and improved readability
7. Used object destructuring for function parameters
8. Removed redundant type checking and simplifying control flow

The functionality remains the same, but the code is now more maintainable and easier to understand. The `parseText` function takes a text string and patterns array, and returns an array of parsed text parts with their associated props.

---



---


## SpecStory

## Resolving TypeScript JSX Configuration Error (11/6/2024, 3:15:04 PM)

_**User**_

For the code present, we get this error:
```
Module '../Recommendations/Recommendation' was resolved to '/Users/thierryskoda/Programming/converse-app/components/Recommendations/Recommendation.tsx', but '--jsx' is not set.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

This error occurs because TypeScript needs to know how to handle JSX syntax. You need to ensure your `tsconfig.json` has the proper JSX configuration.

Here's how to fix it:

```json:tsconfig.json
{
  "compilerOptions": {
    // ... other options ...
    "jsx": "react-native"
  }
}
```

This tells TypeScript to use React Native's JSX transformation. If you already have a tsconfig.json, just add or update the "jsx" option to "react-native".

---



---


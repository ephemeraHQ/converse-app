## SpecStory

## Resolving Expo TypeScript Configuration Error (11/7/2024, 7:29:32 AM)

_**User**_

For the code present, we get this error:
```
File 'expo/tsconfig.base' not found.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because the `expo/tsconfig.base` package needs to be installed. Install the required expo TypeScript configuration by running:

```bash
npx expo install expo-tsconfig
```

Then update the tsconfig.json to use the correct path:

```json:tsconfig.json
{
  "extends": "expo-tsconfig/tsconfig.base",
  // ... rest of your config
}
```

This will resolve the missing base configuration file error.

---



---


## SpecStory

## Selective .gitignore Configuration for Android Folder (1/19/2025, 11:05:20 AM)

_**User**_

I just want to ignore android folder at root but not if it's inside a folder

---

_**Assistant**_

I'll help you create a `.gitignore` entry that ignores the root-level `android` folder while keeping any `android` folders inside other directories.

```gitignore
/android
```

The forward slash at the beginning `/android` specifically matches an `android` folder at the root level of your repository. This pattern won't match `android` folders in subdirectories like `some-folder/android`.

For example, this will:
- ✅ Ignore: `/android`
- ❌ Not ignore: `some-folder/android`
- ❌ Not ignore: `src/android`
- ❌ Not ignore: `packages/my-app/android`

---



---


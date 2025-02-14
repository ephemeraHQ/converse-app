## SpecStory

## Type Annotation for ISettingsListRow Array (1/30/2025, 1:46:45 PM)

_**User**_

how can i tell the list to be ISettingsListRow[]

---

_**Assistant**_

I'll help you add the type annotation for `ISettingsListRow[]`. Since we're already importing the type, we just need to explicitly type the array return:

```typescript:features/app-settings/app-settings.screen.tsx
// ... existing code ...
  const allSettings = useMemo((): ISettingsListRow[] => {
    return [
      { label: "General" },
      { label: "Environment", value: getEnv() },
// ... existing code ...
```

The change is simple - we just need to add `: ISettingsListRow[]` after the arrow function in `useMemo`. This tells TypeScript that the array being returned should conform to the `ISettingsListRow` type. The rest of the code can remain unchanged since the objects you're creating already match the structure of `ISettingsListRow`.

---



---


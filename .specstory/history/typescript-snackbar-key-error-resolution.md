## SpecStory

## TypeScript Snackbar Key Error Resolution (11/4/2024, 11:22:20 AM)

_**User**_

For the code present, we get this error:
```
Argument of type '(prev: ISnackBarStore) => { snackbars: ({ id: number; key: string; type: "error" | "success" | "info"; size: "sm" | "md" | "lg"; message: ReactNode; actions: { ...; }[]; } | { ...; })[]; }' is not assignable to parameter of type 'ISnackBarStore | Partial<ISnackBarStore> | ((state: ISnackBarStore) => ISnackBarStore | Partial<ISnackBarStore>)'.
  Type '(prev: ISnackBarStore) => { snackbars: ({ id: number; key: string; type: "error" | "success" | "info"; size: "sm" | "md" | "lg"; message: ReactNode; actions: { ...; }[]; } | { ...; })[]; }' is not assignable to type '(state: ISnackBarStore) => ISnackBarStore | Partial<ISnackBarStore>'.
    Type '{ snackbars: ({ id: number; key: string; type: "error" | "success" | "info"; size: "sm" | "md" | "lg"; message: ReactNode; actions: { label: string; onPress: () => void; }[]; } | { type: "error" | ... 1 more ... | "info"; ... 4 more ...; message: ReactNode & string; })[]; }' is not assignable to type 'ISnackBarStore | Partial<ISnackBarStore>'.
      Type '{ snackbars: ({ id: number; key: string; type: "error" | "success" | "info"; size: "sm" | "md" | "lg"; message: ReactNode; actions: { label: string; onPress: () => void; }[]; } | { type: "error" | ... 1 more ... | "info"; ... 4 more ...; message: ReactNode & string; })[]; }' is not assignable to type 'Partial<ISnackBarStore>'.
        Types of property 'snackbars' are incompatible.
          Type '({ id: number; key: string; type: "error" | "success" | "info"; size: "sm" | "md" | "lg"; message: ReactNode; actions: { label: string; onPress: () => void; }[]; } | { type: "error" | "success" | "info"; ... 4 more ...; message: ReactNode & string; })[]' is not assignable to type 'ISnackbar[]'.
            Type '{ id: number; key: string; type: "error" | "success" | "info"; size: "sm" | "md" | "lg"; message: ReactNode; actions: { label: string; onPress: () => void; }[]; } | { type: "error" | "success" | "info"; ... 4 more ...; message: ReactNode & string; }' is not assignable to type 'ISnackbar'.
              Type '{ type: "error" | "success" | "info"; actions: { label: string; onPress: () => void; }[]; size: "sm" | "md" | "lg"; id: number; key?: string | undefined; message: ReactNode & string; }' is not assignable to type 'ISnackbar'.
                Types of property 'key' are incompatible.
                  Type 'string | undefined' is not assignable to type 'string'.
                    Type 'undefined' is not assignable to type 'string'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because the new snackbar object doesn't include a required `key` property according to the `ISnackbar` type. Let's modify the `showSnackbar` function to include a generated key:

```typescript:components/Snackbar/Snackbar.service.ts
export function showSnackbar(
  snackbar: Partial<Exclude<ISnackbar, "key" | "id">> & { message: string }
) {
  useSnackBarStore.setState((prev) => {
    const updatedPrev = prev.snackbars.map((item) => ({
      ...item,
      id: item.id + 1,
    }));

    return {
      snackbars: [
        ...updatedPrev,
        {
          ...snackbar,
          type: snackbar.type ?? "info",
          actions: snackbar.actions ?? [],
          size: snackbar.size ?? "md",
          id: 0,
          key: crypto.randomUUID(), // Add this line to generate a unique key
        },
      ],
    };
  });
}
```

The fix adds a `key` property using `crypto.randomUUID()` to generate a unique identifier for each snackbar. This should satisfy the TypeScript type requirements.

---



---


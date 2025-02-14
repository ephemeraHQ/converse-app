## SpecStory

## TypeScript Navigation Params Error Fix (11/26/2024, 11:38:03 AM)

_**User**_

For the code present, we get this error:
```
Type 'Readonly<NavigationParamList[ScreenName]>' is not assignable to type 'NavigationParamList[ScreenName]'.
  Type 'Readonly<NavigationParamList[ScreenName]>' is not assignable to type 'never'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error you're encountering is due to TypeScript's type inference when dealing with `Readonly` types. The `params` object returned by `useRoute<ScreenName>().params` is likely being inferred as `Readonly`, which is not directly assignable to a mutable type.

To resolve this, you can explicitly cast the `params` to the expected type. Here's how you can modify the `useRouteParams` function to fix the error:

```typescript:navigation/useNavigation.tsx
  }
  return params as NavigationParamList[ScreenName];
}
```

### Explanation

- **Type Assertion**: By using `as NavigationParamList[ScreenName]`, you're telling TypeScript to treat `params` as the specific type you expect, bypassing the `Readonly` constraint.

This should resolve the type error you're experiencing.

---



---


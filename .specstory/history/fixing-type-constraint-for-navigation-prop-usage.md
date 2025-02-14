## SpecStory

## Fixing Type Constraint for Navigation Prop Usage (9/26/2024, 12:52:00 PM)

_**User**_

For the code present, we get this error:
```
Type 'T' does not satisfy the constraint '{}'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

To resolve the error "Type 'T' does not satisfy the constraint '{}'", you need to ensure that the generic type `T` extends at least an empty object. Here's a concise fix:

```typescript:navigation/use-navigation.tsx
const navigation = useNavigation<NavigationProp<T extends {} ? T : {}>>();

useEffect(() => {
```

This change uses a conditional type to ensure that `T` extends an empty object. If `T` already extends `{}`, it will use `T` as is. Otherwise, it will default to an empty object `{}`.

This solution allows you to keep using the generic type `T` while satisfying the constraint required by `NavigationProp`.

---



---


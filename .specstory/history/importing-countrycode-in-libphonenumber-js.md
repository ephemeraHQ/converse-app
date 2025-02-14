## SpecStory

## Importing CountryCode in libphonenumber-js (11/7/2024, 8:27:03 AM)

_**User**_

i get "CountryCode not found in 'libphonenumber-js'" but CountryCode IS in libphonenumber-js???

---

_**Assistant**_

This is likely because you need to import `CountryCode` from a specific submodule in `libphonenumber-js`. Here's how to fix the import:

```typescript:utils/phone.ts
import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js/types";
// ... rest of the code remains the same ...
```

The issue is that `CountryCode` is a type, and it needs to be imported from the types submodule. The runtime functions like `getCountryCallingCode` and `parsePhoneNumberFromString` can be imported directly from the main module, but types need to be imported from the types submodule.

---



---


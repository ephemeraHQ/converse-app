## SpecStory

## Improving Parameter Name for Clarity (1/27/2025, 11:02:54 AM)

_**User**_

i don't like "do native build" what could it be called?

---

_**Assistant**_

I'll help improve the description for the `force_native_build` input parameter. A more descriptive and professional name would be "Force native build (EAS build)" since it better explains what the parameter does and mentions EAS which is the build system being used.

Here's the edit:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      force_native_build:
        description: "Force native build (EAS build)"
        type: boolean
        default: true
        required: true
// ... existing code ...
```

This description is:
1. More professional
2. Clearer about what it actually does
3. Includes the specific build system (EAS) for additional context

---

_**User**_

it's not only force native build but also increase version you know..

---

_**Assistant**_



Ah yes, you're right! The parameter actually triggers both a native build and a version increment. Let's make the description more accurate:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      force_native_build:
        description: "Force native build (EAS build) and version increment"
        type: boolean
        default: true
        required: true
// ... existing code ...
```

This description is now more complete as it indicates both major actions that will occur:
1. Triggering a native build via EAS
2. Incrementing the version number

Would you also like to rename the input parameter itself from `force_native_build` to something more accurate? We could use something like `force_build_and_version` if you prefer.

---

_**User**_

maybe, increment version and eas build?

---

_**Assistant**_



Yes, that would be more accurate! Let's update both the parameter name and its description to be clearer:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      increment_version_and_build:
        description: "Increment version and trigger EAS build"
        type: boolean
        default: true
        required: true
// ... existing code ...
```

This change:
1. Renames the parameter from `force_native_build` to `increment_version_and_build`
2. Updates the description to match the order of operations in the name
3. Makes it clearer what the parameter actually does

Note: If you accept this change, you'll also need to update any references to this parameter elsewhere in the workflow file (like in the `Check for native changes` step where it's referenced as `inputs.force_native_build`). Would you like me to show those changes as well?

---



---


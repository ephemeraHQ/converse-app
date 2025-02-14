## SpecStory

## ESLint Command for Error Reporting (11/7/2024, 8:24:09 AM)

_**User**_

what is the command to just show error

---

_**Assistant**_

To show only errors and ignore warnings in ESLint, you can modify the lint script like this:

```json:package.json
// ... existing code ...
    "lint": "eslint . --quiet",
// ... existing code ...
```

The `--quiet` flag will only report errors and suppress warnings. This is useful when you want to focus only on critical issues that need to be fixed.

Alternatively, if you want to keep the ability to see warnings but just not fail the command because of them, you can use:

```json:package.json
// ... existing code ...
    "lint": "eslint . --max-warnings Infinity",
// ... existing code ...
```

This will show both errors and warnings but only fail the command if there are errors.

---



---


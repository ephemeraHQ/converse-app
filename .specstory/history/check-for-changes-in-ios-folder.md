## SpecStory

## Check for Changes in iOS Folder (1/21/2025, 8:25:54 AM)

_**User**_

i want to also cehck if there's been changes in the ios folder

---

_**Assistant**_

I'll help you modify the grep pattern to also check for changes in the ios folder. Here's the updated code:

```yaml:.github/workflows/build-or-update-prod.yml
// ... existing code ...
      - name: Check for dependency or config changes
        id: check-changes
        run: |
          if git diff --name-only HEAD^ HEAD | grep -E "package.json|app.config.ts|ios/"; then
            echo "has_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_changes=false" >> $GITHUB_OUTPUT
          fi
// ... existing code ...
```

I've added `|ios/` to the grep pattern. This will match any changes in files within the ios directory. The pattern now checks for:
- changes to package.json
- changes to app.config.ts
- any changes in the ios folder

---



---


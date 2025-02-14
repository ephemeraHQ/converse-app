## SpecStory

## File Patterns for App Deployment (2/6/2025, 1:59:23 PM)

_**User**_

any other files that we should listen to that could mean we want to deploy new app to our users? check our whole file directori

---

_**Assistant**_

I'll help you identify additional file patterns that should trigger a deployment. Here's an enhanced version of the paths section that covers more relevant files:

```yaml:.github/workflows/preview-deployment.yml
// ... existing code ...
    paths:
      - "**.ts"
      - "**.tsx"
      - "**.js"
      - "**.jsx"
      - "**.json"
      - "assets/**"
      - "package.json"
      - "app.config.ts"
      - "yarn.lock"
      - "app.json"
      - ".env.*"
      - "metro.config.*"
      - "babel.config.*"
      - "eas.json"
      - "index.js"
      - "src/**"
      - "public/**"
      - "fonts/**"
      - "i18n/**"
      - "patches/**"
// ... existing code ...
```

These additions cover:
1. JavaScript files (`.js`, `.jsx`)
2. Configuration files (`app.json`, `.env.*`, `metro.config.*`, `babel.config.*`, `eas.json`)
3. Core app files (`index.js`)
4. Common resource directories:
   - `src/` for source code
   - `public/` for static assets
   - `fonts/` for custom fonts
   - `i18n/` for internationalization files
   - `patches/` for package patches

This will ensure the workflow runs when any important application files are modified that could affect the app's functionality or appearance.

---

_**User**_

okay look i added a bunch new, but so we need to add some of the m when we check if we had native changes or not

---

_**Assistant**_

Yes, we should update the native changes check to include more relevant files that would require a native build. Here's the modified check-changes job:

```yaml:.github/workflows/preview-deployment.yml
// ... existing code ...
      - name: Check for native changes
        id: check-changes
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" && "${{ inputs.force_native_build }}" == "true" ]]; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          elif git diff --name-only HEAD^ HEAD | grep -E "package.json|app.config.ts|ios/|android/|app.json|eas.json|metro.config.*|babel.config.*|.env.*|fonts/|patches/|google-services/"; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_native_changes=false" >> $GITHUB_OUTPUT
          fi
// ... existing code ...
```

I've added several file patterns that should trigger a native build:
1. `app.json` - Can contain native configuration
2. `eas.json` - EAS build configuration
3. `metro.config.*` - Metro bundler config that can affect native builds
4. `babel.config.*` - Babel configuration that might affect native code
5. `.env.*` - Environment variables that might be used in native code
6. `fonts/` - Custom fonts require native rebuilds
7. `patches/` - Package patches might affect native dependencies
8. `google-services/` - Google services configuration

Files like `**.ts`, `**.tsx`, `assets/**`, `i18n/**`, etc. don't necessarily require a native rebuild and can be handled through OTA updates.

---



---


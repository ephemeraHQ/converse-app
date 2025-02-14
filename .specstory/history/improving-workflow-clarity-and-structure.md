## SpecStory

## Improving Workflow Clarity and Structure (1/27/2025, 11:37:42 AM)

_**User**_

can we make this cleaner and make more multiple steps?

---

_**Assistant**_

I'll help break down the "Increment minor version and build" step into multiple, clearer steps. This will make the workflow more maintainable and easier to debug.

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Configure Git
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Increment version
        run: |
          npm version minor -m "chore: increment minor version [skip ci]"

      - name: Push version bump
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          git push https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main --follow-tags --force

      - name: Build iOS preview
        run: node scripts/build/ios/preview.js

      - name: Build and submit to stores
        run: eas build --platform all --profile preview --non-interactive --auto-submit

      - name: Upload sourcemaps to Sentry
        run: npx sentry-expo-upload-sourcemaps dist

      - name: Reset version bump
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          git reset --hard HEAD~1
          git push --force https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main

// ... existing code ...
```

The changes:
1. Split the single large step into multiple focused steps
2. Each step has a clear, descriptive name
3. Environment variables are only passed to steps that need them
4. Each step has a single responsibility, making it easier to identify where issues occur
5. Maintained the same functionality but with better organization

This structure makes it easier to:
- Debug issues (you can see which specific step failed)
- Understand the workflow's purpose
- Maintain the code in the future

---

_**User**_

Do i always have to do GH_TOKEN... why not use ${{secrets.PAT_GITHUB}} directly

---

_**Assistant**_

Yes, you can use `${{ secrets.PAT_GITHUB }}` directly in the commands! This simplifies the workflow by removing the redundant environment variable declarations. Here's the cleaner version:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Increment version
        run: |
          npm version minor -m "chore: increment minor version [skip ci]"

      - name: Push version bump
        run: |
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main --follow-tags --force

      - name: Build iOS preview
        run: node scripts/build/ios/preview.js

      - name: Build and submit to stores
        run: eas build --platform all --profile preview --non-interactive --auto-submit

      - name: Upload sourcemaps to Sentry
        run: npx sentry-expo-upload-sourcemaps dist

      - name: Reset version bump
        run: |
          git reset --hard HEAD~1
          git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main

// ... existing code ...
```

This change:
1. Removes all the redundant `env:` sections
2. Uses the secret directly in the git commands
3. Makes the workflow more concise while maintaining the same functionality

The only reason you might want to use environment variables is if you're reusing the same value multiple times and want to make it easier to change in the future, or if you're doing more complex shell script operations. In this case, using the secret directly is cleaner.

---

_**User**_

why the "reset version bump" ?

---

_**Assistant**_

The "reset version bump" step is included because this workflow is designed for preview/development builds, not production releases. Here's why it's needed:

1. The workflow first increments the version number (using `npm version minor`) to ensure a unique build version for the preview
2. After the build and submission are complete, it resets this version bump (`git reset --hard HEAD~1`)
3. This prevents the version number from permanently incrementing in the main branch for preview builds

Without this reset step:
- Every preview build would permanently increase the app's version number
- We'd quickly run out of version numbers
- The version history would be cluttered with automated increments
- It would be harder to manage proper versioning for actual releases

For example, if your app was at version 1.2.0:
1. Preview build starts -> bumps to 1.3.0 temporarily
2. Build completes
3. Reset back to 1.2.0
4. The actual build still uses 1.3.0, but the repository stays at 1.2.0

This way, you maintain clean version control while still having unique versions for your preview builds.

---

_**User**_

no I don,t want reset version bump. I just want a reset for the "node scripts/build/ios/preview.js" since it will change some files and want my git to be clean after we did eas build and npx sentry-expo...

---

_**Assistant**_



Ah, I understand now! You want to keep the version bump but reset any temporary changes made by the iOS preview script. Here's the corrected version:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Increment version
        run: |
          npm version minor -m "chore: increment minor version [skip ci]"

      - name: Push version bump
        run: |
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main --follow-tags --force

      - name: Build iOS preview
        run: node scripts/build/ios/preview.js

      - name: Build and submit to stores
        run: eas build --platform all --profile preview --non-interactive --auto-submit

      - name: Upload sourcemaps to Sentry
        run: npx sentry-expo-upload-sourcemaps dist

      - name: Reset iOS preview changes
        run: |
          git reset --hard HEAD
          git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main

// ... existing code ...
```

The changes:
1. Renamed the last step to "Reset iOS preview changes"
2. Changed `git reset --hard HEAD~1` to `git reset --hard HEAD` to only reset the temporary changes from the iOS preview script
3. This keeps the version bump commit but removes any temporary file changes

This way, your version number continues to increment properly, but your repository stays clean without any temporary build artifacts.

---



---


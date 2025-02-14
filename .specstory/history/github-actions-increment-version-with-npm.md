## SpecStory

## GitHub Actions: Increment Version with npm (1/24/2025, 10:31:30 AM)

_**User**_

instead of calling "increment-app-version-minor" can you do it inside the git hub actions and increment the version number in package.json? maybe doing something like npm version --minor or something like that

---

_**Assistant**_

I'll help you modify the workflow to use `npm version minor` instead of the custom script. This command will automatically update the version in package.json and create a git tag.

Here's the modified section:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      # Version increment and build for preview with native changes
      - name: Increment minor version and build
        if: steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          npm version minor -m "chore: increment minor version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main --follow-tags
          eas build --platform all --profile preview --non-interactive
          npx sentry-expo-upload-sourcemaps dist

// ... existing code ...
```

Key changes made:
1. Replaced `node scripts/build/increment-app-version-minor.js` with `npm version minor`
2. Removed the explicit `git add .` and `git commit` since `npm version` handles this automatically
3. Added `--follow-tags` to the git push command to ensure the version tag is pushed along with the commit

This change simplifies the version increment process by using npm's built-in versioning command, which will:
- Update the version in package.json
- Create a git commit
- Create a git tag for the new version

---

_**User**_

ONLY thing is as you saw we have a rollback... does doing npm version --minor can easily be rolled back without fucking the whole git stuff?

---

_**Assistant**_

Yes! The rollback will still work fine with `npm version minor` because it's just creating a regular commit and tag. Here's how the rollback step handles it:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      # Add rollback step for build failures
      - name: Rollback on build failure
        if: failure() && steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git reset --hard HEAD~1
          git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main

// ... existing code ...
```

This rollback step will:
1. Reset to the previous commit with `git reset --hard HEAD~1`, which removes both the commit and the changes to package.json
2. Force push the reset state, effectively removing the version increment commit

The only thing that might need cleanup is the git tag, but since it's only used locally in this workflow and we're not pushing it during rollback, it won't cause any issues. If you want to be extra thorough, you could add tag deletion to the rollback:

```yaml:.github/workflows/deploy-preview.yml
      # Add rollback step for build failures
      - name: Rollback on build failure
        if: failure() && steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git tag -d $(git describe --tags --abbrev=0)
          git reset --hard HEAD~1
          git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main
```

But this is optional since the tag won't cause any problems even if it remains locally in the workflow runner (which is ephemeral anyway).

---



---


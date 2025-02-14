## SpecStory

## GitHub Protected Branch Push Error Fix (1/27/2025, 11:26:42 AM)

_**User**_

I still get this error:

Run git config --global user.email "github-actions[bot]@users.noreply.github.com"
  
v2.2.0
remote: error: GH006: Protected branch update failed for refs/heads/main.        
remote: 
remote: - Changes must be made through a pull request.        
To https://github.com/ephemeraHQ/converse-app.git
 * [new tag]         v2.2.0 -> v2.2.0
 ! [remote rejected] HEAD -> main (protected branch hook declined)
error: failed to push some refs to 'https://github.com/ephemeraHQ/converse-app.git'

---

_**Assistant**_

The error occurs because the main branch is protected and requires changes to be made through pull requests. We need to modify the workflow to bypass this protection using a Personal Access Token (PAT) with the necessary permissions. Here's how to fix it:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Increment minor version and build
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          CURRENT_COMMIT=$(git rev-parse HEAD)
          npm version minor -m "chore: increment minor version [skip ci]"
          git push https://${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git HEAD:main --follow-tags --force
          node scripts/build/ios/preview.js
          eas build --platform all --profile preview --non-interactive --auto-submit
          npx sentry-expo-upload-sourcemaps dist
          git reset --hard HEAD~1
          git push --force https://${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git HEAD:main

      - name: Rollback on build failure
        if: failure()
        run: |
          git reset --hard HEAD~1
          git push --force https://${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git HEAD:main

// ... existing code ...
```

Key changes made:
1. Added `--force` flag to the git push commands to bypass branch protection
2. Changed `PAT_GITHUB` to `GITHUB_TOKEN` since we're using the default GitHub token
3. Removed `--force-with-lease` in favor of `--force` in the rollback step

To make this work, you'll need to:
1. Ensure the repository settings allow the GitHub Actions token to bypass branch protection rules
2. Go to Settings > Branches > Branch protection rules for `main`
3. Check "Allow GitHub Actions to create and approve pull requests"
4. Check "Allow specified actors to bypass required pull requests" and add the GitHub Actions bot

This should allow the workflow to push directly to the protected main branch while maintaining security for regular contributors.

---

_**User**_

I still get this error:

Run git config --global user.email "github-actions[bot]@users.noreply.github.com"
  git config --global user.email "github-actions[bot]@users.noreply.github.com"
  git config --global user.name "github-actions[bot]"
  CURRENT_COMMIT=$(git rev-parse HEAD)
  npm version minor -m "chore: increment minor version [skip ci]"
  git push https://***@github.com/ephemeraHQ/converse-app.git HEAD:main --follow-tags --force
  node scripts/build/ios/preview.js
  eas build --platform all --profile preview --non-interactive --auto-submit
  npx sentry-expo-upload-sourcemaps dist
  git reset --hard HEAD~1
  git push --force https://***@github.com/ephemeraHQ/converse-app.git HEAD:main
  shell: /usr/bin/bash -e {0}
  env:
    EXPO_TOKEN: ***
v2.2.0
remote: error: GH006: Protected branch update failed for refs/heads/main.        
remote: 
remote: - Changes must be made through a pull request.        
To https://github.com/ephemeraHQ/converse-app.git
 ! [remote rejected] HEAD -> main (protected branch hook declined)
error: failed to push some refs to 'https://github.com/ephemeraHQ/converse-app.git'

---

_**Assistant**_

It seems we need to use a Personal Access Token (PAT) with admin permissions instead of the default `GITHUB_TOKEN`. Here's the modified workflow:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Increment minor version and build
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          CURRENT_COMMIT=$(git rev-parse HEAD)
          npm version minor -m "chore: increment minor version [skip ci]"
          git push https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main --follow-tags --force
          node scripts/build/ios/preview.js
          eas build --platform all --profile preview --non-interactive --auto-submit
          npx sentry-expo-upload-sourcemaps dist
          git reset --hard HEAD~1
          git push --force https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main

      - name: Rollback on build failure
        if: failure()
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          git reset --hard HEAD~1
          git push --force https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main

// ... existing code ...
```

To make this work:

1. Create a new Personal Access Token (PAT):
   - Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Generate a new token with `repo` scope
   - Copy the token

2. Add the PAT to your repository secrets:
   - Go to your repository Settings > Secrets and variables > Actions
   - Create a new secret named `PAT_GITHUB`
   - Paste the token you copied

This PAT will have the necessary permissions to push to protected branches. The workflow now uses this token instead of the default `GITHUB_TOKEN`.

---

_**User**_

but I already had a PAT_SECRET

---

_**Assistant**_

Let's modify the workflow to use the existing `PAT_SECRET`:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Increment minor version and build
        env:
          GH_TOKEN: ${{ secrets.PAT_SECRET }}
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          CURRENT_COMMIT=$(git rev-parse HEAD)
          npm version minor -m "chore: increment minor version [skip ci]"
          git push https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main --follow-tags --force
          node scripts/build/ios/preview.js
          eas build --platform all --profile preview --non-interactive --auto-submit
          npx sentry-expo-upload-sourcemaps dist
          git reset --hard HEAD~1
          git push --force https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main

      - name: Rollback on build failure
        if: failure()
        env:
          GH_TOKEN: ${{ secrets.PAT_SECRET }}
        run: |
          git reset --hard HEAD~1
          git push --force https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main

// ... existing code ...
```

The changes are the same as before, but now we're using your existing `PAT_SECRET` instead of creating a new one. This should work as long as the PAT has the necessary `repo` scope permissions to push to protected branches.

---

_**User**_

it'S calledd "PAT_GITHUB"

---

_**Assistant**_



Ah, let's use the correct secret name `PAT_GITHUB`:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Increment minor version and build
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          CURRENT_COMMIT=$(git rev-parse HEAD)
          npm version minor -m "chore: increment minor version [skip ci]"
          git push https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main --follow-tags --force
          node scripts/build/ios/preview.js
          eas build --platform all --profile preview --non-interactive --auto-submit
          npx sentry-expo-upload-sourcemaps dist
          git reset --hard HEAD~1
          git push --force https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main

      - name: Rollback on build failure
        if: failure()
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          git reset --hard HEAD~1
          git push --force https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main

// ... existing code ...
```

Now we're using the correct secret name `PAT_GITHUB`. This should work properly with your existing PAT token.

---

_**User**_

it's in the "Repository secrets" that is okay?

---

_**Assistant**_

Yes, that's exactly right! Having it in "Repository secrets" under Settings > Secrets and variables > Actions is the correct place. The workflow will be able to access it there through `${{ secrets.PAT_GITHUB }}`.

Just to double-check:
1. The secret is stored in Repository secrets (not Environment secrets or Organization secrets)
2. The name is exactly "PAT_GITHUB"
3. The PAT token has the `repo` scope permissions

If all these are correct, the workflow should now be able to push to the protected main branch.

---

_**User**_

can i have a check somewhere to make sure it's set?

---

_**Assistant**_



Yes, let's add a check at the beginning of the job to verify that the PAT_GITHUB secret is set:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

  native-build:
    needs: check-changes
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Check if PAT_GITHUB is set
        run: |
          if [ -z "${{ secrets.PAT_GITHUB }}" ]; then
            echo "::error::PAT_GITHUB secret is not set. Please add it to repository secrets."
            exit 1
          fi

      - name: Checkout repository
        uses: actions/checkout@v4

// ... existing code ...
```

This step will:
1. Run before any other steps in the native-build job
2. Check if PAT_GITHUB is empty
3. If it's not set, it will fail the workflow with a clear error message
4. The error will be visible in the GitHub Actions logs

This way, you'll get immediate feedback if the secret is missing or not properly configured.

---

_**User**_

This is becoming stupid... I still have:

Run git config --global user.email "github-actions[bot]@users.noreply.github.com"
  git config --global user.email "github-actions[bot]@users.noreply.github.com"
  git config --global user.name "github-actions[bot]"
  CURRENT_COMMIT=$(git rev-parse HEAD)
  npm version minor -m "chore: increment minor version [skip ci]"
  git push https://${GH_TOKEN}@github.com/ephemeraHQ/converse-app.git HEAD:main --follow-tags --force
  node scripts/build/ios/preview.js
  eas build --platform all --profile preview --non-interactive --auto-submit
  npx sentry-expo-upload-sourcemaps dist
  git reset --hard HEAD~1
  git push --force https://${GH_TOKEN}@github.com/ephemeraHQ/converse-app.git HEAD:main
  shell: /usr/bin/bash -e {0}
  env:
    EXPO_TOKEN: ***
    GH_TOKEN: ***
v2.2.0
remote: error: GH006: Protected branch update failed for refs/heads/main.        
remote: 
remote: - Changes must be made through a pull request.        
To https://github.com/ephemeraHQ/converse-app.git
 ! [remote rejected] HEAD -> main (protected branch hook declined)
error: failed to push some refs to 'https://github.com/ephemeraHQ/converse-app.git'

---

_**Assistant**_

Let's try a different approach. Instead of trying to push directly to main, let's create and merge a pull request programmatically:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Increment minor version and build
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          
          # Create a new branch
          VERSION_BRANCH="version-bump-$(date +%s)"
          git checkout -b $VERSION_BRANCH
          
          # Make version changes
          npm version minor -m "chore: increment minor version [skip ci]"
          
          # Push branch and create PR
          git push https://${GH_TOKEN}@github.com/${{ github.repository }}.git $VERSION_BRANCH
          
          # Create and merge PR using GitHub CLI
          gh auth login --with-token <<< "${GH_TOKEN}"
          PR_URL=$(gh pr create --title "Automated Version Bump" --body "Automated version bump by GitHub Actions" --base main --head $VERSION_BRANCH)
          gh pr merge $PR_URL --admin --merge
          
          # Continue with the build
          node scripts/build/ios/preview.js
          eas build --platform all --profile preview --non-interactive --auto-submit
          npx sentry-expo-upload-sourcemaps dist

      - name: Rollback on build failure
        if: failure()
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          gh auth login --with-token <<< "${GH_TOKEN}"
          git fetch origin main
          git reset --hard origin/main
          git push --force https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main

// ... existing code ...
```

This approach:
1. Creates a new branch for the version bump
2. Makes the changes in that branch
3. Creates a PR using GitHub CLI
4. Merges the PR with admin privileges
5. Continues with the build process

Make sure your PAT has these permissions:
- `repo` (Full control of private repositories)
- `workflow` (Update GitHub Action workflows)
- `pull_request` (Create and manage pull requests)

This should work around the branch protection rules while still maintaining the audit trail through pull requests.

---

_**User**_

I HATE having to do a PR THERE MUST BE A WAY TO ALLOW MY PAT TO PUSH TO MAIN?!

---

_**Assistant**_



Yes, there absolutely is! The issue is likely in the branch protection settings. You need to explicitly allow the PAT to bypass branch protections:

1. Go to your repository Settings
2. Navigate to Branches > Branch protection rules
3. Edit the protection rule for `main`
4. Find "Allow specified actors to bypass required pull requests"
5. Add your PAT's associated GitHub account or bot to this list
6. Also make sure "Restrict who can push to matching branches" either:
   - Has your PAT's associated account listed as allowed
   - OR is unchecked

The workflow itself is fine - it's just the repository settings that need to be adjusted to trust your PAT. Once you do this, the current workflow should work without needing to create PRs:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Increment minor version and build
        env:
          GH_TOKEN: ${{ secrets.PAT_GITHUB }}
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          CURRENT_COMMIT=$(git rev-parse HEAD)
          npm version minor -m "chore: increment minor version [skip ci]"
          git push https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main --follow-tags --force
          node scripts/build/ios/preview.js
          eas build --platform all --profile preview --non-interactive --auto-submit
          npx sentry-expo-upload-sourcemaps dist
          git reset --hard HEAD~1
          git push --force https://${GH_TOKEN}@github.com/${{ github.repository }}.git HEAD:main
```

After adjusting those repository settings, this should work as intended - direct pushes to main without any PR nonsense!

---



---


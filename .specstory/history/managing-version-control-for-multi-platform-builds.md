## SpecStory

## Managing Version Control for Multi-Platform Builds (1/27/2025, 1:34:47 PM)

_**User**_

problem we have here is that when we do native build, we do it for ios AND android. For now i only kept ios but assume we want both platofnr... How could i handle having both running 2 separate flow but the problem is i only want to increase the version once... and what if iOS succeed and Android fail, what should i dO?! Revert?? If i revert, it's bad because like iOs would have succeeded so we need to cinrement... I think maybe we only revert if BOTH fail? 

and what do I do if only fail? Let's say I want to run Android again, but ideally it would be on the previous version since it actually failed... Or I just run on the newest version and skpi a version? Not sure it's good either...

---

_**Assistant**_

This is a complex workflow challenge! Here's a suggested approach that separates iOS and Android builds while maintaining version control integrity. The key is to make the version bump a separate job that both platform builds depend on.

Here's how we can restructure the workflow:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code until native-build job ...

jobs:
  check-changes:
    // ... existing check-changes job remains the same ...

  bump-version:
    needs: check-changes
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      new_version: ${{ steps.get_version.outputs.new_version }}
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Increment version
        run: |
          npm version minor --no-git-tag-version -m "chore: increment minor version [skip ci]"

      - name: Get new version
        id: get_version
        run: echo "new_version=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

      - name: Push version bump
        run: |
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main --follow-tags

  ios-build:
    needs: [check-changes, bump-version]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}

    steps:
      // ... similar setup steps as before ...

      - name: Build iOS preview
        id: build_ios
        run: node scripts/build/ios/preview.js

      - name: Build and submit to store
        id: build_status
        run: |
          eas build --platform ios --profile preview --non-interactive --auto-submit
          echo "success=true" >> $GITHUB_OUTPUT

      - name: Upload sourcemaps to Sentry
        if: steps.build_status.outputs.success == 'true'
        run: npx sentry-expo-upload-sourcemaps dist

  android-build:
    needs: [check-changes, bump-version]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}

    steps:
      // ... similar setup steps as before ...

      - name: Build and submit to store
        id: build_status
        run: |
          eas build --platform android --profile preview --non-interactive --auto-submit
          echo "success=true" >> $GITHUB_OUTPUT

      - name: Upload sourcemaps to Sentry
        if: steps.build_status.outputs.success == 'true'
        run: npx sentry-expo-upload-sourcemaps dist

  handle-build-results:
    needs: [bump-version, ios-build, android-build]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Handle build results
        run: |
          if [[ "${{ needs.ios-build.result }}" == "failure" && "${{ needs.android-build.result }}" == "failure" ]]; then
            echo "Both builds failed. Reverting version bump..."
            git reset --hard HEAD~1
            git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main
          elif [[ "${{ needs.ios-build.result }}" == "failure" || "${{ needs.android-build.result }}" == "failure" ]]; then
            echo "One build failed but keeping version bump for partial success"
            echo "Failed platform(s):"
            [[ "${{ needs.ios-build.result }}" == "failure" ]] && echo "- iOS"
            [[ "${{ needs.android-build.result }}" == "failure" ]] && echo "- Android"
          else
            echo "All builds succeeded!"
          fi

  ota-update:
    // ... existing ota-update job remains the same ...
```

Key changes and reasoning:

1. Created a separate `bump-version` job that both platform builds depend on
2. Split the build job into `ios-build` and `android-build`
3. Added a new `handle-build-results` job that runs after both builds and handles different scenarios:
   - If both builds fail: Reverts the version bump
   - If one build fails: Keeps the version bump but logs which platform failed
   - If both succeed: Continues normally

This approach has several benefits:
- Version is only bumped once
- Both platforms build in parallel after version bump
- Clear separation of concerns
- Partial success is handled gracefully
- Version history remains consistent

For handling failed builds:
- If only one platform fails, we keep the version bump since we had a partial success
- To rebuild the failed platform, you would need to manually trigger the workflow
- The version would be the new (bumped) version, which is actually correct since the other platform succeeded with that version

This approach prioritizes version consistency over perfect version sequence. If you need to retry a failed platform, it will use the bumped version rather than trying to use the previous version, which could create version conflicts with the successful platform.

---

_**User**_

can you think of one way i could retrigger a build for Android with the previous version since it failed? Should I handle 2 separate versions one for iOS and one for Android? How would this look like in practice?

---

_**Assistant**_

Here's an approach using separate version tracking for iOS and Android using a JSON file to store platform-specific versions. This allows for independent versioning and retries:

```yaml:.github/workflows/deploy-preview.yml
name: Preview Deployment

// ... existing triggers and permissions ...

jobs:
  check-changes:
    // ... existing check-changes job ...

  update-versions:
    needs: check-changes
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      ios_version: ${{ steps.get_versions.outputs.ios_version }}
      android_version: ${{ steps.get_versions.outputs.android_version }}
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Update versions
        id: get_versions
        run: |
          # Create versions.json if it doesn't exist
          if [ ! -f versions.json ]; then
            echo '{"ios": "1.0.0", "android": "1.0.0"}' > versions.json
          fi
          
          # Read current versions
          IOS_VERSION=$(jq -r '.ios' versions.json)
          ANDROID_VERSION=$(jq -r '.android' versions.json)
          
          # Increment versions
          NEW_IOS_VERSION=$(echo $IOS_VERSION | awk -F. '{$2 = $2 + 1;} 1' | sed 's/ /./g')
          NEW_ANDROID_VERSION=$(echo $ANDROID_VERSION | awk -F. '{$2 = $2 + 1;} 1' | sed 's/ /./g')
          
          # Update versions.json
          jq --arg ios "$NEW_IOS_VERSION" --arg android "$NEW_ANDROID_VERSION" \
            '.ios = $ios | .android = $android' versions.json > versions.json.tmp && mv versions.json.tmp versions.json
          
          # Set outputs
          echo "ios_version=$NEW_IOS_VERSION" >> $GITHUB_OUTPUT
          echo "android_version=$NEW_ANDROID_VERSION" >> $GITHUB_OUTPUT

      - name: Commit version changes
        run: |
          git add versions.json
          git commit -m "chore: update platform versions [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main

  ios-build:
    needs: [check-changes, update-versions]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}

    steps:
      // ... similar setup steps ...

      - name: Update app config version
        run: |
          VERSION=${{ needs.update-versions.outputs.ios_version }}
          sed -i "s/version:.*,/version: \"$VERSION\",/" app.config.ts

      - name: Build and submit to store
        id: build_status
        run: |
          eas build --platform ios --profile preview --non-interactive --auto-submit
          echo "success=true" >> $GITHUB_OUTPUT

      // ... rest of iOS build steps ...

  android-build:
    needs: [check-changes, update-versions]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}

    steps:
      // ... similar setup steps ...

      - name: Update app config version
        run: |
          VERSION=${{ needs.update-versions.outputs.android_version }}
          sed -i "s/androidVersion:.*,/androidVersion: \"$VERSION\",/" app.config.ts

      - name: Build and submit to store
        id: build_status
        run: |
          eas build --platform android --profile preview --non-interactive --auto-submit
          echo "success=true" >> $GITHUB_OUTPUT

      // ... rest of Android build steps ...

  handle-build-results:
    needs: [update-versions, ios-build, android-build]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Handle build results
        run: |
          if [[ "${{ needs.ios-build.result }}" == "failure" ]]; then
            # Revert iOS version
            jq --arg ios "${{ needs.update-versions.outputs.ios_version }}" \
              '.ios = $ios' versions.json > versions.json.tmp && mv versions.json.tmp versions.json
          fi
          
          if [[ "${{ needs.android-build.result }}" == "failure" ]]; then
            # Revert Android version
            jq --arg android "${{ needs.update-versions.outputs.android_version }}" \
              '.android = $android' versions.json > versions.json.tmp && mv versions.json.tmp versions.json
          fi
          
          # Commit reverted versions if any build failed
          if [[ "${{ needs.ios-build.result }}" == "failure" || "${{ needs.android-build.result }}" == "failure" ]]; then
            git add versions.json
            git commit -m "chore: revert failed platform versions [skip ci]"
            git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main
          fi
```

And you would need to create a new workflow file for retrying failed platform builds:

```yaml:.github/workflows/retry-platform-build.yml
name: Retry Platform Build

on:
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to rebuild (ios/android)'
        required: true
        type: choice
        options:
          - ios
          - android
      use_previous_version:
        description: 'Use previous version'
        type: boolean
        default: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

      - name: Get version
        id: get_version
        run: |
          if [[ "${{ inputs.use_previous_version }}" == "true" ]]; then
            # Get previous version
            CURRENT_VERSION=$(jq -r '.${{ inputs.platform }}' versions.json)
            VERSION=$(echo $CURRENT_VERSION | awk -F. '{$2 = $2 - 1;} 1' | sed 's/ /./g')
          else
            # Use current version
            VERSION=$(jq -r '.${{ inputs.platform }}' versions.json)
          fi
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      // ... rest of build steps similar to main workflow ...
```

Key changes and benefits:

1. Created a `versions.json` file to track platform-specific versions:
```json
{
  "ios": "1.0.0",
  "android": "1.0.0"
}
```

2. Each platform maintains its own version number
3. Added a separate workflow for retrying failed builds with options to:
   - Choose the platform to rebuild
   - Use either the previous version or current version
4. Failed builds revert only their platform's version
5. Successful builds maintain their version increment

This approach gives you more flexibility to:
- Retry failed builds with previous versions
- Keep platform versions independent
- Maintain clear version history per platform
- Handle partial failures without affecting the successful platform

The tradeoff is slightly more complex version management, but it provides better control over platform-specific builds and retries.

---

_**User**_

dont think it's still good... Like because then we have @deploy-prod.yml and like if someone triggers it, it will still merge main into production, will see that the version for android didn't change so will do OTA update... BUT it'S wrong because it should have increemnet version it just that it failed because of eas build you get it??



---

_**Assistant**_

Ah yes, I see the issue! The problem is that we're only checking if versions match, but not whether there were failed builds that *should have* incremented the version. Here's how we can fix this in the production deployment workflow:

```yaml:.github/workflows/deploy-prod.yml
// ... existing beginning of file ...

jobs:
  check-deployment-status:
    runs-on: ubuntu-latest
    outputs:
      can_deploy: ${{ steps.check_status.outputs.can_deploy }}
      needs_native_build: ${{ steps.check_status.outputs.needs_native_build }}
      failed_platforms: ${{ steps.check_status.outputs.failed_platforms }}
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT_GITHUB }}

      - name: Check deployment status
        id: check_status
        run: |
          # Read versions.json from both branches
          git fetch origin main
          MAIN_VERSIONS=$(git show origin/main:versions.json)
          PROD_VERSIONS=$(cat versions.json)
          
          # Check if there were any failed builds in main
          FAILED_BUILDS=$(git log origin/production..origin/main --grep="chore: revert failed platform versions")
          
          if [ ! -z "$FAILED_BUILDS" ]; then
            # Found failed builds, check which platforms failed
            FAILED_PLATFORMS=""
            
            # Compare versions to determine which platforms failed
            MAIN_IOS_VERSION=$(echo $MAIN_VERSIONS | jq -r '.ios')
            MAIN_ANDROID_VERSION=$(echo $MAIN_VERSIONS | jq -r '.android')
            PROD_IOS_VERSION=$(echo $PROD_VERSIONS | jq -r '.ios')
            PROD_ANDROID_VERSION=$(echo $PROD_VERSIONS | jq -r '.android')
            
            if [ "$MAIN_IOS_VERSION" == "$PROD_IOS_VERSION" ]; then
              FAILED_PLATFORMS="$FAILED_PLATFORMS ios"
            fi
            if [ "$MAIN_ANDROID_VERSION" == "$PROD_ANDROID_VERSION" ]; then
              FAILED_PLATFORMS="$FAILED_PLATFORMS android"
            fi
            
            echo "can_deploy=false" >> $GITHUB_OUTPUT
            echo "failed_platforms=$FAILED_PLATFORMS" >> $GITHUB_OUTPUT
            echo "::error::Cannot deploy to production. Found failed builds for platforms: $FAILED_PLATFORMS"
            exit 1
          else
            # Check if we need native build
            git diff --name-only origin/production..origin/main > changed_files.txt
            if grep -qE "package.json|app.config.ts|ios/|android/" changed_files.txt; then
              echo "needs_native_build=true" >> $GITHUB_OUTPUT
            else
              echo "needs_native_build=false" >> $GITHUB_OUTPUT
            fi
            echo "can_deploy=true" >> $GITHUB_OUTPUT
          fi

  deploy-production:
    needs: check-deployment-status
    if: needs.check-deployment-status.outputs.can_deploy == 'true'
    runs-on: ubuntu-latest

    steps:
      // ... existing setup steps ...

      # Replace version check with native build check
      - name: Build for production
        if: needs.check-deployment-status.outputs.needs_native_build == 'true'
        run: |
          node scripts/build/ios/production.js
          eas build --platform all --profile production --non-interactive --auto-submit

      # Upload source maps after build
      - name: Upload source maps after build
        if: needs.check-deployment-status.outputs.needs_native_build == 'true'
        run: npx sentry-expo-upload-sourcemaps dist

      # Deploy OTA update if no native build needed
      - name: Run EAS Update
        if: needs.check-deployment-status.outputs.needs_native_build == 'false'
        run: eas update --auto --channel=production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive

      # Upload source maps after update
      - name: Upload source maps after update
        if: needs.check-deployment-status.outputs.needs_native_build == 'false'
        run: npx sentry-expo-upload-sourcemaps dist

      // ... rest of the deployment steps ...

  notify-failed-deployment:
    needs: check-deployment-status
    if: needs.check-deployment-status.outputs.can_deploy == 'false'
    runs-on: ubuntu-latest
    
    steps:
      - name: Send notification
        run: |
          echo "::error::Cannot deploy to production due to failed builds on main branch for platforms: ${{ needs.check-deployment-status.outputs.failed_platforms }}"
          echo "Please fix the failed builds and retry the deployment."
          exit 1
```

Key changes:

1. Added a new `check-deployment-status` job that:
   - Checks for any failed builds in the commit history between production and main
   - Identifies which platforms had failed builds by comparing versions
   - Determines if native changes require a new build

2. Blocks production deployment if:
   - There are any failed builds that haven't been resolved
   - Shows which platforms failed and need to be fixed

3. For successful deployments:
   - Uses `needs_native_build` flag instead of version comparison to determine build type
   - This ensures we do native builds when needed, even if versions haven't changed due to failed builds

4. Added a notification job that explains why deployment was blocked

This approach:
- Prevents deploying OTA updates when we should be doing native builds
- Forces failed builds to be resolved before allowing production deployment
- Maintains better version integrity between environments
- Provides clear feedback about what needs to be fixed

You would need to retry and fix failed platform builds on main before attempting to deploy to production again.

---



---


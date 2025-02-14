## SpecStory

## iOS File Update Before EAS Build (1/27/2025, 11:16:26 AM)

_**User**_

when we update ios files. It's just for the eas build. Possible to run the scripte before it? 

---

_**Assistant**_

I'll help you add the iOS file update script before the EAS build step. This should be placed after installing dependencies but before the build step. Here's the edit:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
      # Install project dependencies
      - name: Install dependencies
        run: yarn install

      # Update iOS files before build
      - name: Update iOS Files
        if: steps.version-compare.outputs.versions_match == 'false'
        run: |
          cd ios
          sed -i '' 's/PRODUCT_BUNDLE_IDENTIFIER = "com.example.app.debug"/PRODUCT_BUNDLE_IDENTIFIER = "com.example.app"/' *.xcodeproj/project.pbxproj
          sed -i '' 's/PRODUCT_BUNDLE_IDENTIFIER = "com.example.app.staging"/PRODUCT_BUNDLE_IDENTIFIER = "com.example.app"/' *.xcodeproj/project.pbxproj

      # Build new app binary if versions don't match
      - name: Build for production
// ... existing code ...
```

I've made the following changes:
1. Moved the "Update iOS Files" step before the build step
2. Added the `if` condition to only run when we're doing a full build (same condition as the EAS build step)
3. Added the actual script that updates the bundle identifiers in the iOS project file
4. Note that you'll need to replace `com.example.app` with your actual production bundle identifier

The script uses `sed` to replace debug and staging bundle identifiers with the production one. You may need to adjust the exact bundle identifier patterns based on your actual configuration.

---

_**User**_

hre'S the script sorry "node scripts/build/ios/production.js

---

_**Assistant**_

Ah, I'll update it to run the Node script instead. Here's the edit:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
      # Install project dependencies
      - name: Install dependencies
        run: yarn install

      # Update iOS files before build
      - name: Update iOS Files
        if: steps.version-compare.outputs.versions_match == 'false'
        run: node scripts/build/ios/production.js

      # Build new app binary if versions don't match
      - name: Build for production
// ... existing code ...
```

I've made the following changes:
1. Moved the "Update iOS Files" step before the build step
2. Added the `if` condition to only run when we're doing a full build
3. Updated the `run` command to execute your Node script at `scripts/build/ios/production.js`

This will ensure the iOS files are properly configured before the EAS build process starts.

---



---


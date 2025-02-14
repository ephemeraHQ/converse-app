## SpecStory

## Automating iOS Build Changes in GitHub Actions (1/31/2025, 8:54:18 AM)

_**User**_

after doing "run: node scripts/build/ios/preview.js" it will change stuff in ios folder. make sure to push changes to main after doing it 

---

_**Assistant**_

I'll help you modify the `ios-build` job to push any changes made to the iOS folder after running the preview script. Here's the updated section:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

  ios-build:
    needs: [check-changes, bump-version]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}
          ref: main
          fetch-depth: 0

      # To get the incremented version number
      - name: Pull latest changes
        run: git pull origin main

      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: "yarn"
          cache-dependency-path: yarn.lock
        env:
          SKIP_YARN_COREPACK_CHECK: "1"
      - run: corepack enable

      - name: Install dependencies
        run: yarn install

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS preview
        id: build_ios
        run: node scripts/build/ios/preview.js

      # New steps to commit and push iOS changes
      - name: Commit iOS changes
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          git add ios/
          git commit -m "chore: update iOS configuration [skip ci]" || echo "No changes to commit"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main || echo "No changes to push"

      - name: Build and submit to store
        run: |
          eas build --platform ios --profile preview --non-interactive --auto-submit

// ... existing code ...
```

I've added a new step called "Commit iOS changes" after the iOS preview build step. This new step will:
1. Configure git with the bot's credentials
2. Add any changes in the iOS folder
3. Commit the changes with a descriptive message (including [skip ci] to prevent triggering another workflow)
4. Push the changes to the main branch

The `|| echo "No changes to commit"` and `|| echo "No changes to push"` ensure the workflow doesn't fail if there are no changes to commit or push.

---



---


## SpecStory

## Maintaining Version Bumps in Build Processes (1/27/2025, 2:06:56 PM)

_**User**_

ok nevermind, never reverts a version bump... because when we will merge main to production, it needs to know the real state, if there as been some native changes and we needed to do version bump, production needs to know about it and do a eas build

---

_**Assistant**_

I'll help you modify the workflow to never revert version bumps. Here's the updated code for the `handle-build-results` job:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

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
            echo "Both builds failed, but keeping version bump for production tracking"
            echo "Failed platforms: iOS and Android"
          elif [[ "${{ needs.ios-build.result }}" == "failure" || "${{ needs.android-build.result }}" == "failure" ]]; then
            echo "One build failed but keeping version bump for production tracking"
            echo "Failed platform(s):"
            [[ "${{ needs.ios-build.result }}" == "failure" ]] && echo "- iOS"
            [[ "${{ needs.android-build.result }}" == "failure" ]] && echo "- Android"
          else
            echo "All builds succeeded!"
          fi

// ... existing code ...
```

The changes:
1. Removed the version bump reversion logic when builds fail
2. Updated the error messages to indicate that we're keeping the version bump for production tracking
3. Maintained the build status reporting functionality

This ensures that version bumps are always preserved, which is important for tracking the correct state when merging to production and performing EAS builds.

---



---


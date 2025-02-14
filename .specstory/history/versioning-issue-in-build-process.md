## SpecStory

## Versioning Issue in Build Process (1/29/2025, 6:51:27 PM)

_**User**_

problem that I don't undersantd. this action got triggered, it incremented the version number i saw it go to 2.2.3.. .but then the eas build made it with 2.2.2 (previous version). How come??! I thought that after increment we pushed the code so that in the ios-build job it would cehckout with the newest version?

---

_**Assistant**_

Ah, I see the issue. The problem is that each job in the GitHub Actions workflow starts with a fresh checkout of the repository, and by default, it will check out the commit that triggered the workflow, not the latest commit with the version bump.

Let's modify the `ios-build` job to ensure it gets the latest changes from main, including the version bump. Here's how to fix it:

```yaml:.github/workflows/deploy-preview.yml
  ios-build:
    needs: [check-changes, bump-version]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}
          ref: main  # Add this line to explicitly checkout main
          fetch-depth: 0  # Add this to fetch all history

      - name: Pull latest changes  # Add this step
        run: git pull origin main
        
      # ... rest of the job steps remain the same ...
```

The changes:
1. Added `ref: main` to explicitly checkout the main branch
2. Added `fetch-depth: 0` to fetch the complete history
3. Added a new step to pull the latest changes from main

This will ensure that the `ios-build` job has the latest version number from the version bump commit before starting the build process. The same changes should be applied to the `android-build` job if you uncomment it.

You might also want to add these same changes to the `handle-build-results` job since it also needs the latest version:

```yaml:.github/workflows/deploy-preview.yml
  handle-build-results:
    needs: [bump-version, ios-build]
    runs-on: ubuntu-latest
    if: always()

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}
          ref: main
          fetch-depth: 0

      - name: Pull latest changes
        run: git pull origin main
        
      # ... rest of the job steps remain the same ...
```

---



---


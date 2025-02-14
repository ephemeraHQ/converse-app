## SpecStory

## Update GitHub Actions Checkout with PAT (1/27/2025, 12:00:00 PM)

_**User**_

make sure the checkout use the PAT_GITHUB

---

_**Assistant**_

I'll help you modify the checkout steps to use the PAT_GITHUB token for authentication. This is important to ensure the workflow has the proper permissions when checking out the repository.

Here are the necessary changes:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 2
          token: ${{ secrets.PAT_GITHUB }}

// ... existing code ...
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

// ... existing code ...
```

I've updated both checkout steps in the workflow to include the `token` parameter that uses the PAT_GITHUB secret. This ensures that subsequent operations that require repository access (like pushing commits) will have the proper authentication.

The first checkout is in the `check-changes` job and the second is in the `native-build` job. Both now use the Personal Access Token for authentication.

---



---


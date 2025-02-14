## SpecStory

## Fixing GitHub Actions Commit Message Handling (1/19/2025, 7:48:33 PM)

_**User**_

Is this right? The way i get commit message and then use it at the enedd?

---

_**Assistant**_

There's a small issue with how you're getting and using the commit message. The current setup won't work as expected because of how you're setting and accessing the environment variable. Here's the fix:

```yaml:.github/workflows/build-or-update-prod.yml
// ... existing code ...

      - name: Get Commit Message
        id: commit_msg
        run: echo "::set-output name=message::$(git log -1 --pretty=%B)"

      - name: Check for dependency or config changes
// ... existing code ...

      - name: Run EAS Update
        if: steps.check-changes.outputs.has_changes == 'false'
        run: eas update --auto --profile production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive
```

The changes fix two issues:
1. Using `echo "message=$(git log -1 --pretty=%B)" >> $GITHUB_ENV` sets an environment variable, but we want to set an output variable that we can reference in later steps
2. The reference to the commit message should be `steps.commit_msg.outputs.message` (which matches how we set it), not `steps.commit_msg.outputs.message`

Note: GitHub Actions is gradually moving away from `::set-output` in favor of `$GITHUB_OUTPUT`, so an even more future-proof version would be:

```yaml:.github/workflows/build-or-update-prod.yml
// ... existing code ...

      - name: Get Commit Message
        id: commit_msg
        run: echo "message=$(git log -1 --pretty=%B)" >> $GITHUB_OUTPUT

// ... existing code ...
```

Both versions will work, but the `$GITHUB_OUTPUT` version is preferred for newer workflows.

---

_**User**_

For the code present, we get this error:
```
Context access might be invalid: PAT_GITHUB
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because the `PAT_GITHUB` secret isn't properly set up. You need to create a Personal Access Token (PAT) in GitHub and add it to your repository's secrets.

Here's how to fix it:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `repo` scope
3. Copy the token
4. Go to your repository → Settings → Secrets and variables → Actions
5. Create a new secret named `PAT_GITHUB` and paste your token

Or alternatively, you can use the built-in `GITHUB_TOKEN`:

```yaml:.github/workflows/build-or-update-prod.yml
          git commit -m "chore: increment version numbers [skip ci]"
          git push https://${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git HEAD:main

      - name: Run EAS Update
```

The `GITHUB_TOKEN` is automatically available in GitHub Actions and doesn't require additional setup.

---



---


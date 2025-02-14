## SpecStory

## Bypassing GitHub Protected Branch Errors (1/27/2025, 11:15:30 AM)

_**User**_

I get this error on rollback, how can i let my github action bypass the protected bracnh!!

Run git reset --hard HEAD~1
  git reset --hard HEAD~1
  git push --force https://***@github.com/ephemeraHQ/converse-app.git HEAD:main
  shell: /usr/bin/bash -e {0}
  env:
    EXPO_TOKEN: ***
HEAD is now at 00f72a0 fix: deploy preview git action (#1575)
remote: error: GH006: Protected branch update failed for refs/heads/main.        
remote: 
remote: - Changes must be made through a pull request.        
remote: 
remote: - Cannot force-push to this branch        
To https://github.com/ephemeraHQ/converse-app.git
 ! [remote rejected] HEAD -> main (protected branch hook declined)

---

_**Assistant**_

To allow the GitHub Actions workflow to bypass branch protection rules, you'll need to modify two things:

1. Update the permissions in the workflow to include `id-token: write`
2. Use a GitHub App or Personal Access Token (PAT) with sufficient permissions to bypass branch protection

Here's how to modify the workflow file:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

permissions:
  contents: write
  id-token: write

// ... existing code ...

      # Add rollback step for build failures
      - name: Rollback on build failure
        if: failure() && steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git reset --hard HEAD~1
          git push --force-with-lease https://${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git HEAD:main
```

Additionally, you'll need to:

1. Go to your repository's Settings > Branches > Branch protection rules
2. Find the protection rule for the `main` branch
3. Scroll down to "Allow force pushes"
4. Enable "Allow force pushes" and select "Specify who can force push" 
5. Add your GitHub Actions bot (usually `github-actions[bot]`) to the list of allowed actors

If you're using a Personal Access Token (PAT), make sure it has the `repo` scope and that the account it belongs to has admin access to the repository.

Alternatively, you could create a GitHub App with the necessary permissions and use that instead of a PAT. This is generally considered more secure.

Note: If you're unable to modify branch protection rules, you'll need to contact your repository administrator to make these changes.

---



---


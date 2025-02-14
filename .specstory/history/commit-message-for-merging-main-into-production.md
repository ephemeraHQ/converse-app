## SpecStory

## Commit Message for Merging Main into Production (1/24/2025, 10:00:29 AM)

_**User**_

if we merge main into production. what will be the commit_message ?

---

_**Assistant**_

Based on the workflow file, when main is merged into production, the commit message retrieved by the "Get Commit Message" step will be the merge commit message. This is because the command `git log -1 --pretty=%B` gets the most recent commit message, which in this case would be:

```
Merge branch 'main' into production
```

This is the default merge commit message that Git creates when performing a merge with the `--no-edit` flag, as shown in the "Merge main into production" step:

```yaml
      - name: Merge main into production
        run: |
          git fetch origin main
          git merge origin/main --no-edit  # This creates a merge commit with default message
```

This merge commit message will then be used in the EAS Update step if there are no native changes and versions match:

```yaml
      - name: Run EAS Update
        if: steps.check-changes.outputs.has_native_changes == 'false' && steps.version-compare.outputs.versions_match == 'true'
        run: eas update --auto --profile production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive
```

If you want to use the original commit message from main instead of the merge commit message, you would need to modify the workflow to capture that message before the merge occurs.

---

_**User**_

but when i merge is it possible to set the commit meesage ? so that in the eas update i can use it and show users what's now? Not sure what's the best way there. Ideally actually I would want ot show a list of all the commits that been added in this update you know

---

_**Assistant**_

Yes, that's a good point! Here's how we can modify the workflow to capture all commits that are being merged from main to production and use them as the update message. Here's the suggested change:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...

      - name: Get Commit Messages
        id: commit_msg
        run: |
          # Get all commits that are in main but not in production
          COMMITS=$(git log origin/production..origin/main --pretty=format:"- %s")
          # Escape newlines and special characters for GitHub Actions
          COMMITS="${COMMITS//'%'/'%25'}"
          COMMITS="${COMMITS//$'\n'/'%0A'}"
          COMMITS="${COMMITS//$'\r'/'%0D'}"
          echo "message=$COMMITS" >> $GITHUB_OUTPUT

      - name: Merge main into production
        run: |
          git fetch origin main
          git merge origin/main -m "feat: Production deployment%0A%0AChanges included:%0A${{ steps.commit_msg.outputs.message }}"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production

// ... existing code ...
```

This change will:
1. Capture all commit messages between production and main branches before the merge
2. Format them as a bullet point list
3. Use them both in the merge commit message and the EAS update message

The resulting EAS update message will look something like:
```
feat: Production deployment

Changes included:
- feat: add new profile screen
- fix: resolve login issue
- chore: update dependencies
```

This gives users a much better understanding of what changes are included in the update. The messages will be pulled from all commits that were made on main since the last production deployment.

---



---


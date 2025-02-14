## SpecStory

## Improving GitHub Actions Workflow Formatting (2/4/2025, 8:59:46 AM)

_**User**_

this is soooo not well formatted

---

_**Assistant**_

I'll help improve the formatting of the merge commit message section in the deployment workflow. Here's the cleaned up version:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
      - name: Finalize merge
        run: |
          echo "Deployment successful, finalizing merge..."
          git fetch origin main
          git merge origin/main -m "feat: Production deployment

          Changes included:
          ${{ needs.check-deployment-type.outputs.commit_message }}"
          git push origin production
// ... existing code ...
```

Key changes made:
1. Added proper indentation for the commit message with a blank line after the title
2. Simplified the git push command to use the already configured remote
3. Fixed formatting of the commit message to be more readable with proper line breaks

The commit message will now be properly formatted in the git history with:
- A clear title line "feat: Production deployment"
- A blank line separator
- The list of changes included from main branch

---



---


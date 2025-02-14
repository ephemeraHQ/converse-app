## SpecStory

## Managing Git Version Bumps Without Tags (1/27/2025, 2:29:53 PM)

_**User**_

since we do --no-git-tag-version we need to when git add . and git commit and git push

---

_**Assistant**_

I'll help you modify the version bump steps to properly commit and push the changes since we're using `--no-git-tag-version`. Here's the updated code:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Increment version
        run: |
          npm version patch --no-git-tag-version -m "chore: increment patch version [skip ci]"
          git add package.json
          git commit -m "chore: increment patch version [skip ci]"

      - name: Get new version
        id: get_version
        run: echo "new_version=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

      - name: Push version bump
        run: |
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main
// ... existing code ...
```

The changes include:
1. Added `git add package.json` to stage the version change
2. Added `git commit` to commit the changes
3. Removed `--follow-tags` from the push command since we're not creating tags with `--no-git-tag-version`

These changes will ensure the version bump is properly committed and pushed to the repository.

---

_**User**_

should we put the version number in the commit?

---

_**Assistant**_

Yes, that's a good practice! Let's include the new version number in the commit message. We can modify the steps to capture and use the version:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Increment version
        run: |
          npm version patch --no-git-tag-version -m "chore: increment patch version [skip ci]"
          NEW_VERSION=$(node -p "require('./package.json').version")
          git add package.json
          git commit -m "chore: bump version to ${NEW_VERSION} [skip ci]"

      - name: Get new version
        id: get_version
        run: echo "new_version=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

      - name: Push version bump
        run: |
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main
// ... existing code ...
```

The change captures the new version and includes it in the commit message, making it clearer which version was bumped to. The commit message will now look like: "chore: bump version to 1.2.3 [skip ci]"

---



---


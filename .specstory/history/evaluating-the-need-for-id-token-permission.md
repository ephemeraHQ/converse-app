## SpecStory

## Evaluating the Need for ID-Token Permission (1/27/2025, 12:07:33 PM)

_**User**_

is id-token really needed?

---

_**Assistant**_

Let me check the usage of `id-token` permission in this workflow.

Looking through the workflow, I don't see any actions or steps that explicitly require the `id-token` permission. This permission is typically needed when you're using OpenID Connect (OIDC) for cloud provider authentication (like AWS, Azure, or GCP), but this workflow only uses:

1. GitHub repository access (covered by `contents: write`)
2. Expo deployment (using EXPO_TOKEN)
3. Git operations
4. Node.js and dependency installation
5. EAS builds and updates

Here's how to update the permissions section:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
permissions:
  contents: write
// ... existing code ...
```

The `id-token: write` permission can be safely removed as it's not being used in any of the workflow steps. The `contents: write` permission is sufficient for all the operations being performed in this workflow.

---



---


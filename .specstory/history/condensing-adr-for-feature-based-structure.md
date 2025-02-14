## SpecStory

## Condensing ADR for Feature-Based Structure (1/8/2025, 9:00:54 AM)

_**User**_

make it shorter

---

_**Assistant**_

I'll help you create a more concise version of this ADR while maintaining the key information. Here's how we can edit the file:

````markdown:adr/adr.001.folder and file structure/adr.001.folder and file structure.md
# ADR-001: Feature-Based Folder Structure

## Status
Proposed

## Date
- **Proposed**: [2024-10-16](https://github.com/ephemeraHQ/converse-app/pull/1005)
- **Decided**: 2024-10-17
- **Work Began**: [2024-10-21](https://github.com/ephemeraHQ/converse-app/pull/1042)

## Context
Current codebase is organized by file type (`components`, `data`, etc.), which scatters related functionality. This reduces effectiveness of AI-assisted development and makes navigation challenging.

## Proposal
Reorganize codebase to feature-based structure under `features/` directory, with shared components in `shared/`.

Key features identified:
- Accounts
- Conversations
- Groups
- Transactions
- Profiles
- Search
- Notifications
- Frames
- Settings
- Recommendations

Feature directories may contain:
- `components/`
- `screens/`
- `navigation/`
- `hooks/`
- `utils/`
- `data/`
- `clients/`
- `queries/`
- `types/`
- `actors/`

## File Naming Convention
Use descriptive suffixes:
```
[featureName].screen.tsx
[featureName].nav.tsx
[featureName].store.ts
[featureName].queries.ts
[featureName].utils.ts
[featureName].client.ts
[featureName].types.ts
[featureName].test.ts
```

## Implementation Plan
1. Create `features/` and `shared/` directories
2. Implement new features using new structure
3. Gradually migrate existing code during regular maintenance
4. Update import paths and documentation
5. Conduct team training

Example structure:
```
features/
└── accounts/
    ├── components/
    ├── screens/
    ├── navigation/
    ├── hooks/
    ├── utils/
    ├── data/
    ├── accounts.utils.ts
    ├── accounts.client.ts
    └── accounts.queries.ts
```

## Consequences
**Positive:**
- Improved code organization
- Better AI tool integration
- Enhanced maintainability

**Negative:**
- Temporary development slowdown
- Potential merge conflicts
- Learning curve for team
````

I've significantly shortened the ADR by:
1. Removing detailed explanations of considered options
2. Condensing the implementation details
3. Simplifying the example structure
4. Removing the detailed migration plan
5. Keeping only the most essential information in each section

The core decision and important implementation details remain while reducing the overall length by about 70%.

---



---


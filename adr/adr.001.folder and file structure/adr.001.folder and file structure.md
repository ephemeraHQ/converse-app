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

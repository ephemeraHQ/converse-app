# ADR-001: Feature-Based Folder Structure

## Status
Proposed

## Date
- **Proposed**: 2024-10-16
- **Decided**: 
- **Work Began**: 
- **Work Completed**: 

## Context

Our current codebase is organized mainly by the type of files and the framework components, such as `components`, `data`, `hooks`, `screens`, `utils`, etc. While this structure groups similar types of files together, it scatters related functionality across multiple directories. This can make navigation and maintenance challenging, especially as the codebase grows.

We are increasingly relying on AI-assisted tooling for development. Having code that changes together located in different parts of the codebase reduces the effectiveness of such tools. Packaging by feature would enhance productivity by allowing developers (and AI tools) to focus on a single directory containing all relevant code for a feature.

## Proposal

We will reorganize the codebase to follow a feature-based folder structure. This means that all code related to a specific feature will be grouped together under a common directory within a `features/` folder. Shared components and utilities will be placed in a `shared/` directory.

We have identified the following top-level features:

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

Each feature directory may contain any of the following directories:

- `components`: Small, feature-specific UI elements. Always check
  the shared design system before creating new components.
  Consult with Andrew and Thierry if unsure about existing
  components.

- `screens`: Top-level components that encapsulate entire
  device screens.

- `navigation`: Contains setup for navigation system, including
  deep linking and navigation parameters.

- `hooks`: React hooks specific to the feature. Use caution
  when adding hooks, as we're transitioning to state machines
  for business logic.

- `utils`: One-off utility functions relevant to the feature.

- `data`: Contains Zustand queries and data mapping methods.

- `clients`: Encapsulate feature behavior and control
  dependencies used to implement the feature.

- `queries`: React Query functionality for caching, refetching,
  and optimistic updates specific to the feature.

- `types`: TypeScript types and interfaces relevant to the feature.

- `actors`: State machines or actors that control feature behavior.


## Considered Options

1. **Keep the current structure (organized by file type)**
2. **Reorganize code by features (package by feature)**
3. **Gradual approach (combination of file type and feature-based organization, working towards a package by feature structure)**

## Pros and Cons of the Options

### Option 1: Keep the current structure

*Good, because:*

- Familiar to current developers
- No immediate refactoring needed

*Bad, because:*

- Scattered codebase makes it hard to find related files
- Reduces productivity with AI-assisted tools
- Difficult to maintain as the codebase grows

### Option 2: Reorganize code by features

*Good, because:*

- Groups related code together, improving maintainability
- Enhances productivity with AI-assisted tooling
- Easier onboarding for new developers

*Bad, because:*

- Significant upfront refactoring effort
- Potential for merge conflicts during transition
- Requires updating import paths throughout the codebase

### Option 3: Gradual approach

*Good, because:*

- Allows gradual transition
- Balances familiarity with improved organization
- Minimizes disruption to ongoing development

*Bad, because:*

- Can lead to inconsistent structure during transition
- Might still scatter related code temporarily
- Requires ongoing attention to migration

## Proposed Option: Option 3 - Gradual approach

We chose to reorganize the codebase by features gradually
because it offers the benefits of improved organization
while being more feasible to implement. A complete
refactoring at once is impractical due to the size of our
codebase and ongoing development needs. This approach allows
us to incrementally improve our codebase structure as we
touch different parts of the code.

## Implementation Details

- **Step 1:** Create a `features/` directory at the root of
  the project.
- **Step 2:** Create a `shared/` directory for common
  components, hooks, utils, and other shared resources.
- **Step 3:** As new features are developed, implement them
  within the new structure under `features/`.
- **Step 4:** When existing code is modified:
  a. Assess if it belongs to a specific feature.
  b. If so, move it to the appropriate feature directory.
  c. If not, consider moving it to the `shared/` directory.
- **Step 5:** Update import paths for moved files and their
  dependencies.
- **Step 6:** Gradually refactor existing features during
  planned refactoring sprints or as part of regular
  maintenance.
- **Step 7:** Regularly review and update documentation to
  reflect the evolving folder structure.
- **Step 8:** Conduct team training sessions to ensure all
  developers understand and follow the new structure.

## File Naming Conventions

We will adopt a consistent naming convention for key files
within each feature directory. This approach makes it easy
to search for and identify specific file types, and clearly
indicates the purpose of each file.

- **Key File Types:**
  - `[featureName].screen.tsx`: Feature screens
  - `[featureName].nav.tsx`: Navigation components
  - `[featureName].store.ts`: Data stores
  - `[featureName].queries.ts`: API queries - using React Query
  - `[featureName].utils.ts`: Utility functions
  - `[featureName].data.ts`: Data models or types
  - `[featureName].actor.ts`: State machines or actors
  - `[featureName].client.ts`: Clients that control dependencies
  - `[featureName].types.ts`: Types for this particular feature

This naming convention offers several benefits:
1. Easy to search: Use command+P to quickly find all 
   relevant files for a particular domain.
2. Clear purpose: File names immediately indicate their 
   function within the feature.
3. Consistent organization: Standardizes file naming 
   across the project.

*Example of the new structure for the Accounts feature:*

```
features/
└── accounts/
    ├── components/
    │   ├── AccountSettingsButton.tsx
    │   ├── ExternalWalletPicker.tsx
    │   ├── EphemeralAccountBanner.tsx
    │   ├── ProfileSettingsButton.tsx
    │   └── Logout/
    │       ├── privy.tsx
    │       ├── privy.web.tsx
    │       ├── wallet.tsx
    │       └── wallet.web.tsx
    ├── screens/
    │   ├── Accounts.screen.tsx
    │   ├── AccountsAndroid.screen.tsx
    │   └── Onboarding/
    │       ├── Onboarding.screen.tsx
    │       ├── Onboarding.web.screen.tsx
    │       └── components/
    ├── navigation/
    │   ├── Accounts.nav.tsx
    │   ├── AccountsDrawer.nav.tsx
    │   └── OnboardingNav.nav.tsx
    ├── hooks/
    │   ├── useDisconnectActionSheet.ts
    │   └── usePhotoSelect.ts
    ├── utils/
    │   ├── addressBook.ts
    │   ├── keychain/
    │   ├── wallet.ts
    │   └── evm/
    ├── data/
    │   └── store/
    │       └── accounts.store.ts 
    ├── accounts.utils.ts
    ├── accounts.client.ts
    └── accounts.queries.ts
```


*Note:* Care should be taken to ensure that any platform-specific files (e.g., `.ios.tsx`, `.android.tsx`, `.web.tsx`) are correctly placed and that conditional imports are handled properly.

## Migration Plan

Given the size of the codebase, we will adopt a phased approach:

1. **Preparation:**
   - Communicate the plan to the development team.
   - Agree on naming conventions and structure details.
   - Set up import aliasing for features:
     - Configure build tools (e.g., Babel, TypeScript) to support
       aliases like `@features/foo`.
     - Update tsconfig.json or babel.config.js to include paths
       for new feature directories.

2. **Phase 1 - Shared Components:**
   - Start with Thierry's work on shared components.
   - Create a `shared/design-system` directory.
   - In one PR, move relevant files to this new directory.
   - In a follow-up PR, update imports and make necessary
     changes to the moved components.

3. **Phase 2 - Feature Identification:**
   - Evaluate ongoing work to identify affected features.
   - For each feature:
     a. Create a feature directory (e.g., `features/accounts`).
     b. In one PR, move relevant files to this directory.
     c. In a follow-up PR, update imports and refactor as needed.

4. **Phase 3 - Gradual Feature Migration:**
   - Prioritize remaining features for migration.
   - For each feature:
     a. Create the feature directory.
     b. Move files in one PR.
     c. Refactor and update imports in a separate PR.

5. **Phase 4 - Shared Utilities:**
   - Identify shared utilities across features.
   - Move these to `features/shared/utils` or appropriate subdirectories.
   - Update imports in affected features.

6. **Continuous Testing:**
   - Perform thorough testing after each PR.
   - Ensure automated tests are updated and passing.

7. **Documentation and Training:**
   - Update documentation to reflect new structure.
   - Conduct team training sessions on new import conventions.

8. **Completion:**
   - Final review of entire codebase structure.
   - Merge any remaining changes.
   - Resume normal development with new structure in place.

## Consequences

- **Positive:**
  - Improved code maintainability and organization.
  - Enhanced developer productivity.
  - Better synergy with AI-assisted development tools.

- **Negative:**
  - Temporary slowdown in feature development during reorganization.
  - Potential for merge conflicts.
  - Need for all team members to adjust to the new structure.

---

By adopting this feature-based folder structure, we aim to streamline our development process, making it easier for developers to navigate the codebase and for AI tools to assist in coding tasks. This will ultimately lead to increased productivity and a more scalable architecture as the application grows.
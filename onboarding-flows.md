# Onboarding Flow Analysis

## Main Onboarding Flow

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> ConnectionMethodSelection

    ConnectionMethodSelection --> Wallet: wallet
    ConnectionMethodSelection --> Phone: phone
    ConnectionMethodSelection --> Desktop: desktop
    ConnectionMethodSelection --> PrivateKey: privateKey
    ConnectionMethodSelection --> EphemeralWallet: ephemeral

    state EphemeralWallet {
        [*] --> GenerateWallet
        GenerateWallet --> SetSigner
        SetSigner --> SetIsEphemeral
    }

    Wallet --> AuthComplete
    Phone --> AuthComplete
    Desktop --> AuthComplete
    PrivateKey --> AuthComplete
    EphemeralWallet --> AuthComplete

    AuthComplete --> Invite: if invite needed
    Invite --> [*]
    AuthComplete --> [*]: if no invite needed
```

## Ephemeral Wallet Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as CreateEphemeral
    participant S as OnboardingStore
    participant W as Wallet Generator

    U->>C: Click Create Button
    C->>S: setLoading(true)
    C->>W: Generate Random Private Key
    W->>W: Create Wallet Instance
    W->>S: setIsEphemeral(true)
    W->>S: setSigner(wallet)
    C->>S: setLoading(false)
```

## Store State Management

```mermaid
classDiagram
    class OnboardingStore {
        +boolean addingNewAccount
        +string desktopConnectSessionId
        +ConnectionMethod connectionMethod
        +Signer signer
        +string address
        +boolean loading
        +boolean isEphemeral
        +string privyAccountId
        +string privyAccessToken
        +string inviteCode
        +string pkPath
        +OnboardingStep step
        +setAddingNewAccount()
        +setConnectionMethod()
        +setSigner()
        +setLoading()
        +setIsEphemeral()
        +resetOnboarding()
    }

    class ConnectionMethod {
        <<enumeration>>
        undefined
        wallet
        phone
        desktop
        privateKey
        ephemeral
    }

    class OnboardingStep {
        <<enumeration>>
        login
        invite
    }

    OnboardingStore --> ConnectionMethod
    OnboardingStore --> OnboardingStep
```

## Component Lifecycle

```mermaid
flowchart TD
    A[Component Mount] -->|Initialize| B[Setup Store Selectors]
    B --> C[Setup Styles]
    C --> D[Render Component]
    D --> E[User Interaction]
    E -->|Create Wallet| F[Generate Ephemeral Wallet]
    E -->|Go Back| G[Reset Connection Method]
    F --> H[Update Store State]
    G --> D
    H --> D
    D -->|Unmount| I[Cleanup: Reset Ephemeral State]
```

## Error Handling Flow

```mermaid
flowchart LR
    A[Start Wallet Generation] --> B{Try Generate}
    B -->|Success| C[Set Store State]
    B -->|Error| D[Log Error]
    C --> E[Complete]
    D --> E
    E --> F[Set Loading False]
```

These diagrams provide different views of the onboarding flow:

1. The main state flow showing all possible paths
2. The specific sequence for ephemeral wallet creation
3. The store state management structure
4. The component lifecycle and user interactions
5. Error handling flow

Each diagram helps visualize a different aspect of the onboarding process, making it easier to understand the overall architecture and flow of the application.

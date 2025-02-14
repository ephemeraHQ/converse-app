## SpecStory

## User Authentication Management in Codebase (2/17/2025, 4:50:28 PM)

_**User**_

how do we manage user auth in this project? @Codebase 

---

_**Assistant**_

Based on the codebase, here's how user authentication is managed:

1. **Auth States**
```typescript
const AuthStatuses = {
  signingUp: "signingUp",
  signingIn: "signingIn",
  restoring: "restoring", 
  signedIn: "signedIn",
  signedOut: "signedOut",
  undetermined: "undetermined"
}
```

2. **Core Authentication Flow**:

- Uses Privy for authentication with passkeys
- Managed through `AuthenticateWithPasskeyProvider` which provides:
  ```typescript
  {
    signupWithPasskey: () => Promise<void>;
    loginWithPasskey: () => Promise<void>;
  }
  ```

3. **Sign Up Flow**:
```typescript
// 1. Start signup
useAccountsStore.getState().setAuthStatus(AuthStatuses.signingUp);

// 2. Create passkey with Privy
await privySignupWithPasskey({
  relyingParty: RELYING_PARTY
});

// 3. Create embedded wallet
await createEmbeddedWallet();

// 4. Create XMTP inbox
await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet({
  inboxSigner: signer
});

// 5. Create user profile
await createUser({
  privyUserId: privyUser.id,
  smartContractWalletAddress,
  inboxId
});
```

4. **Sign In Flow**:
```typescript
// 1. Start signin
useAccountsStore.getState().setAuthStatus(AuthStatuses.signingIn);

// 2. Login with passkey
await privyLoginWithPasskey({
  relyingParty: RELYING_PARTY
});

// 3. Restore XMTP inbox
await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet({
  inboxSigner: signer
});

// 4. Complete signin
useAccountsStore.getState().setAuthStatus(AuthStatuses.signedIn);
```

5. **Auth State Management**:
- Uses Zustand store (`useAccountsStore`) to manage auth state
- Tracks current sender, auth status, and restoration state
- Persists auth state between sessions

6. **Token Management**:
- Uses Firebase App Check for API security
- Manages access/refresh tokens for API calls
- Stores tokens securely using MMKV storage

7. **Logout**:
```typescript
const logout = async () => {
  setAuthStatus(AuthStatuses.signedOut);
  await privy.logout();
  MultiInboxClient.instance.logoutMessagingClients();
  queryClient.removeQueries({
    queryKey: ["embeddedWallet"]
  });
};
```

8. **Auth Status Hook**:
```typescript
const useAuthStatus = () => {
  const { authStatus, multiInboxClientRestorationState } = useAccountsStore();
  
  const isRestored = multiInboxClientRestorationState === MultiInboxClientRestorationStates.restored;
  const isRestoring = multiInboxClientRestorationState === MultiInboxClientRestorationStates.restoring;
  const isSignedIn = isRestored && authStatus === AuthStatuses.signedIn;
  const isSignedOut = hasNotAuthenticated;

  return { isRestoring, isSignedIn, isSignedOut };
};
```

The system combines Web3 wallet authentication (via Privy), XMTP messaging infrastructure, and traditional API authentication to create a secure, decentralized authentication system.

---



---


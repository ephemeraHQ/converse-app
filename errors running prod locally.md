# errors running prod locally:

# xmtp initialization failed

### iOS App Group Configuration Checklist

1. Check Xcode Capabilities:

   - Open iOS project in Xcode
   - Select your target
   - Go to "Signing & Capabilities"
   - Verify "App Groups" capability is enabled
   - Ensure group identifier "group.com.converse.native" is listed

2. Check Provisioning Profiles:

   ```bash
   # Check if profiles need updating
   cd ios
   pod install
   xcodebuild -showBuildSettings | grep PROVISIONING_PROFILE
   ```

3. Verify Info.plist:

   ```xml
   <key>AppGroupIdentifier</key>
   <string>group.com.converse.native</string>
   ```

4. Check Entitlements file:
   ```xml
   <key>com.apple.security.application-groups</key>
   <array>
     <string>group.com.converse.native</string>
   </array>
   ```

### Debug Steps

1. Add explicit logging for app group access:

```
 LOG  Primary button clicked - initiating wallet generation
 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Starting wallet generation
 LOG  8:42:48 AM | DEBUG : [OnboardingStore] Setting loading state:
true

 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Generating random private key
 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Creating wallet instance
 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Wallet created
{
  "address": "0x152E9352226e83Fe556eB5035f30a281EBc48904"
}

 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Updating application state
 LOG  8:42:48 AM | DEBUG : [OnboardingStore] Setting ephemeral state:
true

 LOG  8:42:48 AM | DEBUG : [OnboardingStore] Setting new signer
 LOG  8:42:48 AM | INFO : [CreateEphemeral] Wallet generation complete
 LOG  8:42:48 AM | DEBUG : [OnboardingStore] Setting loading state:
false

 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Generation process complete
 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Wallet generation initiated
 LOG  8:42:48 AM | DEBUG : [Onboarding] Screen mounted
 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Store selectors initialized
{
  "hasSetLoading": true,
  "hasSetConnectionMethod": true,
  "hasSetSigner": true,
  "hasSetIsEphemeral": true
}

 LOG  Rendering CreateEphemeral component
 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Rendering component
 LOG  8:42:48 AM | DEBUG : [OnboardingStore] New signer address: 0x152E9352226e83Fe556eB5035f30a281EBc48904
 LOG  8:42:48 AM | DEBUG : [Onboarding] Screen mounted
 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Store selectors initialized
{
  "hasSetLoading": true,
  "hasSetConnectionMethod": true,
  "hasSetSigner": true,
  "hasSetIsEphemeral": true
}

 LOG  Rendering CreateEphemeral component
 LOG  8:42:48 AM | DEBUG : [CreateEphemeral] Rendering component
 LOG  8:42:48 AM | DEBUG : [Onboarding] Starting XMTP client initialization
 LOG  8:42:48 AM | DEBUG : [OnboardingStore] Setting loading state:
false

 LOG  8:42:48 AM | ERROR : [Onboarding] XMTP initialization failed: ENOENT: no directory for group 'group.com.converse.native' found
 LOG  8:43:16 AM | DEBUG : [useCurrentAccount] Current account: undefined
 LOG  8:43:16 AM | DEBUG : [useCurrentAccount] Current account: undefined
 LOG  8:43:16 AM | DEBUG : [useCurrentAccount] Current account: undefined
 LOG  8:43:16 AM | DEBUG : [getAccountStore] Retrieving store for account: TEMPORARY_ACCOUNT
 LOG  8:43:16 AM | DEBUG : [getAccountStore] Found store for account: TEMPORARY_ACCOUNT
 LOG  8:43:16 AM | DEBUG : [currentAccountStoreHook] Accessing profiles store for account: TEMPORARY_ACCOUNT
 LOG  8:43:16 AM | DEBUG : [getAccountStore] Retrieving store for account: TEMPORARY_ACCOUNT
 LOG  8:43:16 AM | DEBUG : [getAccountStore] Found store for account: TEMPORARY_ACCOUNT
 LOG  8:43:16 AM | DEBUG : [currentAccountStoreHook] Accessing settings store for account: TEMPORARY_ACCOUNT
 LOG  8:43:16 AM | DEBUG : [useCurrentAccount] Current account: undefined
 LOG  8:43:16 AM | DEBUG : [useCurrentAccount] Current account: undefined
 LOG  8:43:16 AM | DEBUG : [Onboarding] Screen mounted
 LOG  8:43:16 AM | DEBUG : [CreateEphemeral] Store selectors initialized
{
  "hasSetLoading": true,
  "hasSetConnectionMethod": true,
  "hasSetSigner": true,
  "hasSetIsEphemeral": true
}

 LOG  Rendering CreateEphemeral component
 LOG  8:43:16 AM | DEBUG : [CreateEphemeral] Rendering component
```

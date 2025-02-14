## SpecStory

## Using MMKV and Expo Secure Store Together (1/29/2025, 2:57:07 PM)

_**User**_

in in our repo we use mmkv AND expo-secure-store?

---

_**Assistant**_

Yes, it appears the codebase uses both MMKV and expo-secure-store, but they serve different purposes:

1. **expo-secure-store**
- Used for storing sensitive data like encryption keys, private keys, and tokens
- Utilizes the device's secure keychain/keystore
- Best for small, sensitive pieces of data that need to be securely stored
- You can see this being used in the file for storing things like:
  - XMTP keys
  - Device IDs
  - Encryption keys
  - Push tokens

2. **MMKV**
- A high-performance key-value storage system
- Better for larger datasets and frequent read/write operations
- Used for app data that needs to be persisted but doesn't necessarily need the highest level of security
- Based on the comment in the code, it uses a 16-byte portion of the encryption key for secure storage

The combination is actually a good practice:
- Use expo-secure-store for critical security items
- Use MMKV for general app data that needs fast access

From the code snippet, it appears that MMKV is configured to use secure encryption (using part of the encryption key generated and stored in secure-store), providing a good balance between security and performance for larger datasets.

---



---


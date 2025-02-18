# Authentication Module

This document provides a high-level overview of the authentication strategy used in our application, explaining the flow involving Firebase AppCheck, XMTP, and Ethereum wallet integration via Privy passkeys, as well as the two primary endpoints for user creation and authentication.

## Loom Recordings

[Convos Authentication Modeling Discussion](https://www.loom.com/share/0a1277074f2a4e989ecfe0141deac359)  
Participants: Ry, Michael, Thierry  
Date: Friday February 14, 2025

## Overview

Our authentication mechanism involves two primary endpoints:

- **Create User Endpoint**: Creates a new user account. It accepts four header keys and optional profile data.
- **Authenticate Endpoint**: Authenticates an existing user and returns a JSON Web Token (JWT) for subsequent requests.

All other endpoints require the JWT for authentication.

## Authentication Flow

1. **Passkey Authentication via Privy**

   - The user logs in using a passkey with Privy
   - Successful authentication provides access to a Privy account, which in turn gives access to a smart contract Ethereum wallet

2. **Smart Contract Wallet as Signer**

   - The Ethereum wallet obtained from Privy acts as the cryptographic signer
   - This wallet is used to create an XMTP inbox

3. **Signing the Firebase AppCheck Token**

   - The Firebase AppCheck token is provided by Firebase
   - The XMTP inbox on the client side signs the AppCheck token
   - The backend then verifies the cryptographic signature

4. **JWT Generation**
   - Once verified, the backend issues a JWT
   - This JWT is then used to authenticate all subsequent API requests
   - There is no refresh token as the persistent cryptographic signer (passkey via Privy) handles re-authentication

## Endpoints

### Create User Endpoint

**Purpose**: Creates a new user account

**Headers** (all four required):

1. **Installation ID**: Identifier for the XMTP inbox, derived from the device
2. **Firebase AppCheck Token**: Provided by Firebase
3. **Signed AppCheck Token**: The Firebase AppCheck token signed by the XMTP inbox (client-side)
4. **XMTP Inbox ID**: The XMTP inbox ID of the user, created during the onboarding flow

**Profile Data** (optional but currently always provided):

- `profile_name`: Must be between 3 and 30 characters
- `avatar_url`: No strict URL validation is enforced at this time
- `description`: Cannot exceed 500 characters

**Response**: Returns the newly created user's ID along with metadata such as createdAt, updatedAt, and the provided profile information

### Authenticate Endpoint

**Purpose**: Authenticates an existing user

**Headers** (same four as above):

- Installation ID
- Firebase AppCheck Token
- Signed AppCheck Token
- Ethereum Wallet

**Response**: Returns a JWT which is used for authenticating all further API calls

## Package Organization

All authentication-related code and documentation are located in the `feature/authentication` directory.

## Additional Notes

### Security

The Firebase AppCheck token is signed on the client side by the XMTP inbox and verified by the backend. The integration with Privy and the smart contract wallet removes the need for refresh tokens, as the persistent signer can always re-authenticate.

### Profile Data Validation

Currently, the profile creation is always provided during the Create User process. In future iterations, if profile creation becomes optional or additional validation (e.g., URL validation for avatars) is required, this documentation and the corresponding code should be updated accordingly.

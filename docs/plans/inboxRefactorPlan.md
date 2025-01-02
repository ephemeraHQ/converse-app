# Proposed Refactor Plan: XMTP Inbox IDs

This document outlines a plan to refactor our messaging app so that each user’s “inbox” is keyed by an **XMTP inbox ID** instead of an Ethereum address. The goal is to support various wallet types (embedded, smart-contract, external) and also introduce incognito (ephemeral) accounts without doing a massive rewrite. Below is a staged plan, justification, some high-level architecture details, and an FAQ.

---

## 1. Overview

Currently, we have the concept of `account = Ethereum address`. This is becoming cumbersome because:

- We want to support passkey-based _embedded wallets_ (via Turnkey, etc.).
- We eventually want _smart contract wallets_ for feeless transactions, advanced approvals, or social recovery.
- We also have incognito/ephemeral accounts that don’t require passkeys or wallet top-ups.

Rather than continuing to treat an Ethereum address as the primary key everywhere, we plan to move to an **XMTP inbox ID** model. That single ID then links to any wallets (embedded, smart-contract, external), user profile data (ENS, handle, photo), and advanced settings (incognito mode, ephemeral key material, etc.).

**Key links and references**

- [Figma: Converse App Flows](https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk/Converse-App)
- [Notion: Smart Contract Wallet Work](https://www.notion.so/ephemerahq/Smart-Contract-Wallet-Work-Refinement-11330823ce9280539056d14fcc4e0de7?pvs=4)
- [Notion: Approvals in Converse](https://www.notion.so/ephemerahq/Approvals-in-Converse-0ca3419d992c4acb853654b808a338ff?pvs=4)
- [Excalidraw Diagram (Read-Only)](https://link.excalidraw.com/readonly/WFBJrBWRAz9IOU8COzZi)
- Meetings
  - [Michael and Alex Planning](https://www.loom.com/share/cd7f9576f29449e1a7e4f6e7ad515364)

---

## 2. The Plan (Staged Refactor)

### **Stage 1: Move from `account` to `inbox ID`**

1. **Replace all references**
   - Everywhere in the front end that references an “account” as an Ethereum address should become `inboxId`.
   - Create a simple map for `inboxId -> ethereumAddress` for cases where we need to instantiate the XMTP client, since XMTP currently needs an address to be instantiated.
2. **Update / break old data**
   - We will not do a complex DB migration. The old user accounts will effectively break. (We have a small set of testers, so this is acceptable.)

**Estimated Timeline for Stage 1**

- **Jan 12**: PR up for review (inbox ID changes in code, partial back-end handling)
- **Jan 19**: Fix back-end references in a non-backwards-compatible way
- **By Jan 27**: Merge final changes (allowing time for database adjustments & QA)

_(Rationale: “inbox/account” touches many parts of the code; we have no test coverage here, so we anticipate extra time to find/fix breakage. Also coordinating with passkey & identity work.)_

### **Stage 2: Solidify Onboarding & Remove Temp Account State**

1. **Full removal of the old temporary account fallback**
   - Instead, define a genuine “logged out” or “no user” state in the store (Zustand), or an actor-based state machine.
   - This eliminates the placeholder logic used whenever we had zero addresses on file.
   - Ensure the application can handle “no current inbox” gracefully.
   - Update any logic in Zustand or React hooks that assumed we _always_ had an account.

**Estimated Timeline for Stage 2**

- **Late January** (around Jan 30) to have a PR up or merged.

_(Once Stage 2 is done, we should have a consistent baseline code that uses `inboxId`, plus a simpler “logged out/no inbox” state. Any ephemeral or passkey logic can be layered on top more cleanly.)_

### **Stage 3: XState Actor Model + Enhanced Architecture**

TODO(lustig): more detailed architecture as progress is made on the simpler refactoring above.

1. **Move to Actor Model**
   - Introduce an `ApplicationActor`, which has an `InboxesManagerActor`, which spawns one `InboxActor` per inbox.
   - Each `InboxActor` manages:
     - Listeners for incoming/outgoing messages
     - Linked wallets (embedded, smart-contract, external)
     - Incognito ephemeral key data (if relevant)
     - Reaction / read receipts, etc.
2. **Testability & Dependency Control**
   - Shift side effects and complex flows out of Zustand into XState.
   - Potentially introduce or refine usage of `viem` instead of `ethers` if performance/bundle size becomes an issue.

**Estimated Timeline for Stage 3**

- **No immediate date** but possibly begins soon after Stage 2 merges.
- Will be subdivided into smaller sub-stages (3.1, 3.2, etc.) because of complexity.

---

## 3. Justification & High-Level Architecture

**Why `inboxId`?**

- XMTP is message-centric; an “inbox” is the user’s entity in the messaging network.
- Many users might link multiple wallets (external, embedded, or incognito ephemeral keys) to the same XMTP inbox.
- “Account = Ethereum address” is too limiting and doesn’t map well to ephemeral keys.

**Architecture Sketch**

- **ApplicationActor**: High-level app states (initializing, onboarding, etc.).
- **InboxesManagerActor**: Manages multiple inboxes.
- **InboxActor**: Manages message sync, wallet references, ephemeral or not, etc.

**Incognito / Ephemeral**

- Ephemeral key is randomly generated.
- It doesn’t link to passkeys or external addresses by default.
- Doesn’t sync across devices unless we implement a specialized flow.

---

## 4. FAQ

### Q: Why remove “temporary account name”?

**A**: It created a pseudo-logged-in state when a user had no real wallet or inbox. This confuses logic everywhere. We prefer an explicit “no user/no inbox” state for clarity and better code maintainability.

### Q: Why do we need `inboxId -> address` at all?

**A**: The XMTP SDK still needs an Ethereum address as a key for signing messages. Even though we want to treat “inboxId” as the user’s primary ID, we need the underlying address to build or restore an XMTP client session.

### Q: Can we not just migrate the old data?

**A**: We have few testers, so the simplest path is to do a breaking change and drop old “accounts.” Full migrations for this large architectural change would be unnecessarily complex.

### Q: Do we plan to keep external wallets (Coinbase, etc.)?

**A**: Yes. We will still allow linking an external wallet for top-ups or identity, but the user’s “main” identity can remain the passkey-based embedded wallet if they prefer.

### Q: Why do we need a smart contract wallet?

**A**: In the near term, it’s to enable feeless or advanced transaction flows. Eventually, we might do “message paywalls” or advanced social recovery. Right now, we only need to be able to **create and link** one.

### Q: What is “incognito” or “hide my identity”?

**A**: It’s basically generating a fresh ephemeral XMTP inbox with random keys. The account or user doesn’t share existing wallet addresses or passkeys. These chats might auto-expire or limit discoverability.

### Q: Why consider `viem` instead of `ethers`?

**A**: Ethers can be large and slow, especially for ephemeral logic. If we only need certain minimal web3 operations, `viem` might perform better and reduce bundle size.

---

## 5. Immediate Plan

- **Stage 1**: Implement the shift to `inboxId`. Remove “temporary account name.” (Target mid-late January)
- **Stage 2**: Stabilize onboarding, unify “no inbox” states, possibly begin incognito ephemeral support.
- **Stage 3**: Move to a more robust actor-based architecture. Integrate advanced wallet logic, passkeys, and incognito flows in a scalable, testable way.

By following this plan, we can ship incremental improvements and reduce chaos from the existing “account = Ethereum address” model.

_If you have additional questions or concerns, please post them in the relevant GitHub issues or bring them up in our next team sync!_

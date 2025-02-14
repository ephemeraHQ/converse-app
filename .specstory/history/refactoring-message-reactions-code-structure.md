## SpecStory

## Refactoring Message Reactions Code Structure (10/24/2024, 3:05:06 PM)

_**User**_

I have @MessageReactions.store.tsx  and @MessageReactionsDrawer  and  @MessageReactionsDrawer.utils.ts 

I feel maybe I do something wrong because they all use each others. I feel that it should be more organized. The .utils might be .service instead? And the Drawer will call stuff in there and the service will use the store? That way the Drawer (react component) never know about the store?

---

_**Assistant**_

Your intuition about organizing the code to separate concerns is spot on. By abstracting the logic into a service, you can decouple the React component from the store, making the codebase more modular and easier to maintain. Here's a suggested refactor:

1. **Create a Service File**: Move the logic for opening and closing the drawer into a service file. This service will interact with the store.

2. **Update the Component**: The component will use the service to perform actions, without directly interacting with the store.

Here's how you can refactor the code:

### 1. Create a Service File

Create a new file named `MessageReactions.service.ts` and move the logic for opening and closing the drawer there.

```typescript:components/Chat/Message/MessageReactions/MessageReactionsDrawer/MessageReactions.service.ts
import { createBottomSheetModalRef } from "@design-system/BottomSheet/BottomSheet.utils";
import { RolledUpReactions } from "../MessageReactions.types";
import { initialMessageReactionsState, useMessageReactionsStore } from "./MessageReactions.store";

const bottomSheetModalRef = createBottomSheetModalRef();

export function openMessageReactionsDrawer(args: { rolledUpReactions: RolledUpReactions }) {
  const { rolledUpReactions } = args;
  bottomSheetModalRef.current?.present();
  useMessageReactionsStore.setState({ rolledUpReactions });
}

export function closeMessageReactionsDrawer() {
  bottomSheetModalRef.current?.dismiss();
  useMessageReactionsStore.setState(initialMessageReactionsState);
}
```

### 2. Update the Component

Update the `MessageReactionsDrawer.tsx` to use the service functions.

```typescript:components/Chat/Message/MessageReactions/MessageReactionsDrawer/MessageReactionsDrawer.tsx
startLine: 12
endLine: 16

import { openMessageReactionsDrawer, closeMessageReactionsDrawer } from "./MessageReactions.service";
```

### 3. Update the Store

The store file remains the same, as it is already well-structured.


```1:15:components/Chat/Message/MessageReactions/MessageReactionsDrawer/MessageReactions.store.tsx
import { create } from "zustand";
import { RolledUpReactions } from "../MessageReactions.types";

export interface IMessageReactionsStore {
  rolledUpReactions: RolledUpReactions;
}

export const initialMessageReactionsState: IMessageReactionsStore = {
  rolledUpReactions: {
    emojis: [],
    totalReactions: 0,
    userReacted: false,
  
```


### Explanation

- **Service Layer**: The `MessageReactions.service.ts` file acts as a service layer that handles the business logic of opening and closing the drawer. It interacts with the store and the bottom sheet modal reference.

- **Component**: The `MessageReactionsDrawer.tsx` component now only calls the service functions, keeping it clean and focused on rendering.

This refactor improves the separation of concerns and makes the codebase more maintainable. The component no longer directly interacts with the store, which aligns with your preference for a more organized structure.

---



---


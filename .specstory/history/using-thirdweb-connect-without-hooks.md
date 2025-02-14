## SpecStory

## Using Thirdweb Connect Without Hooks (10/21/2024, 3:57:56 PM)

_**User**_

is there a thirdweb function that dones't use the hook? like i just want to call thirdwebConect

---

_**Assistant**_

Yes, there is a way to use the Thirdweb connect functionality without using the hook. You can use the `connect` function directly from the Thirdweb SDK. Here's how you can modify your code to use it:

1. First, import the necessary functions from the Thirdweb SDK:

```typescript:screens/Onboarding/OnboardingGetStartedScreen.tsx
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Ethereum } from "@thirdweb-dev/chains";
```

2. Then, replace the `useThirdwebConnect` hook with a direct call to the `connect` function:

```typescript:screens/Onboarding/OnboardingGetStartedScreen.tsx
// Remove this line
// const { connect: thirdwebConnect } = useThirdwebConnect();

// Add this function
const thirdwebConnect = async (connectFunction: () => Promise<any>) => {
  const sdk = new ThirdwebSDK(Ethereum);
  return await sdk.wallet.connect(connectFunction);
};
```

Now you can use `thirdwebConnect` as a regular function instead of a hook. This approach gives you more control over when and how the connection is made, and it doesn't rely on React's hook system.

Here's how the `getCoinbaseData` function would look with this change:

```typescript:screens/Onboarding/OnboardingGetStartedScreen.tsx
const getCoinbaseData = async () => {
  const res = await thirdwebConnect(async () => {
    const coinbaseWallet = createWallet("com.coinbase.wallet", {
      appMetadata: config.walletConnectConfig.appMetadata,
      mobileConfig: {
        callbackURL: `https://dev.converse.xyz/coinbase`,
      },
    });
    await coinbaseWallet.connect({ client: thirdwebClient });
    return coinbaseWallet;
  });

  if (!res) {
    throw new Error("Failed to connect to Coinbase Wallet");
  }

  const account = res.getAccount();
  if (!account) {
    throw new Error("No coinbase account found");
  }

  const signer = await ethers5Adapter.signer.toEthers({
    client: thirdwebClient,
    chain: ethereum,
    account: account,
  });

  return { signer, address: account.address };
};
```

This approach should work without relying on the React hook system, giving you more flexibility in how you use the Thirdweb connect functionality.

---



---


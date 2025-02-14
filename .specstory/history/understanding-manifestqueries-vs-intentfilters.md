## SpecStory

## Understanding manifestQueries vs intentFilters (2/6/2025, 11:20:27 AM)

_**User**_

do i need those manifestQueries?? or can i just have the intentFilters above? Why would i need both

---

_**Assistant**_

Let me explain the difference between `manifestQueries` and `intentFilters` in this context:

1. **intentFilters**: These define what URLs and schemes your app can handle/open. In your code, they allow your app to handle deep links like `converse://` or `https://converse.xyz/dm`, etc.

2. **manifestQueries**: These declare what external apps/schemes your app wants to interact with. In your case, they're necessary if you want your app to:
   - Be able to check if specific wallet apps are installed
   - Show up as an option when users click on wallet-related links
   - Launch these wallet apps from within your app

Here's a practical example:
- Without `manifestQueries`, on Android 11+ your app won't be able to detect or launch wallet apps like Metamask or Coinbase Wallet due to Android's package visibility restrictions
- The `LSApplicationQueriesSchemes` in your iOS config serves the same purpose for iOS

So if your app needs to:
- Launch wallet apps
- Check if specific wallets are installed
- Handle wallet connections

Then yes, you need both. If you're not doing any of these wallet-related features, you could remove the `manifestQueries` section.

The corresponding iOS configuration is already present in your code:

```typescript:app.config.ts
ios: {
  // ... existing code ...
  infoPlist: {
    LSApplicationQueriesSchemes: [
      "cbwallet",
      "ledgerlive",
      "rainbow",
      "metamask",
      // ... other wallet schemes ...
    ],
  },
}
```

---



---


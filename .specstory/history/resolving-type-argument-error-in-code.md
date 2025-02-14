## SpecStory

## Resolving Type Argument Error in Code (11/7/2024, 9:10:09 AM)

_**User**_

For the code present, we get this error:
```
Generic type 'transportFunctionType' requires 1 type argument(s).
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

*Anthropic is experiencing a partial outage right now. To avoid downtime, we've temporarily fallen back to an OpenAI model.*

To resolve the error, you need to provide the required type argument for `transportFunctionType`. Here's how you can fix it:

```typescript:utils/logger.ts
const converseTransport: transportFunctionType<YourTypeHere> = async (props) => {
  // Logs are subperformant, so only in dev
  if (config.env === "dev") {
    ...
  }
  ...
};
```

Replace `YourTypeHere` with the appropriate type that matches the expected structure of the `props` argument. If you're unsure what type to use, you may need to refer to the documentation or type definitions for `react-native-logs` to determine the correct type argument.

---



---


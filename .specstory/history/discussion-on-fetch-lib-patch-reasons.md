## SpecStory

## Discussion on Fetch Lib Patch Reasons (1/25/2025, 10:32:53 AM)

_**User**_

why do you think a teamate added this patch for the fetch lib?

---

_**Assistant**_

This patch modifies the default response type in the `react-native-fetch-api` library from `"blob"` to `"text"`. Here's likely why this change was made:

1. **Performance**: In React Native, handling blob responses can be more memory-intensive and slower than handling text responses, especially when dealing with JSON data (which is very common in API calls).

2. **Common Use Case**: Most API responses are typically JSON or text-based. When working with REST APIs, the response is usually JSON that needs to be parsed, so getting it as text first is the more common use case.

3. **Compatibility**: Some versions of React Native have had issues with blob handling, particularly on certain platforms or versions. Using text as the default is generally more reliable across different environments.

4. **Memory Management**: Blob responses need to be manually cleaned up in React Native to prevent memory leaks. Text responses don't have this requirement, making them safer to work with by default.

The change is made through a patch file (`.patch` extension), which suggests this is a temporary fix or customization to the library without forking it entirely. This is a common practice when you need to modify node_modules dependencies but don't want to maintain a full fork of the library.

---

_**User**_

but where in my repo do we use readct-native-fetch-api

---

_**Assistant**_

I can help you find where this library is being used in your repository. You can try these methods to locate its usage:

1. Check your `package.json` to see if it's a direct dependency or a sub-dependency
2. Search your codebase for imports/requires of 'react-native-fetch-api'
3. Use `npm ls react-native-fetch-api` or `yarn why react-native-fetch-api` to see which package(s) depend on it

Would you like me to help you with any of these approaches? Just let me know which file(s) you'd like to examine and I can help identify where and how this library is being used.

Also, it's possible this library is being used indirectly through another dependency, which would explain why you have a patch for it but don't see direct usage in your code.

---



---


## SpecStory

## Removing Unnecessary Web Libraries in React Native (1/13/2025, 3:53:55 PM)

_**User**_

which library are for web that we can remove

---

_**Assistant**_

Looking at the `package.json`, I can identify several web-specific libraries that can be removed since this is a React Native project. Here are the libraries that are typically used for web and can be safely removed:

```json:package.json
{
  "dependencies": {
    // Browser-specific polyfills and libraries
    "browserify-zlib": "^0.2.0",
    "crypto-browserify": "^3.12.0",
    "https-browserify": "^1.0.0",
    "os-browserify": "^0.3.0",
    "stream-browserify": "^3.0.0",
    "stream-http": "^3.2.0",
    "text-encoding": "^0.7.0",
    
    // Web-specific libraries
    "react-dom": "18.3.1",
    "@stardazed/streams-polyfill": "^2.4.0",
    
    // Browser-specific utilities
    "process": "^0.11.10",
    "url": "^0.11.0",
    
    // These might be removable depending on your specific needs
    "@babel/plugin-transform-flow-strip-types": "^7.25.2",
    "@peculiar/webcrypto": "^1.4.1",
    "react-refresh": "0.14.0"
  }
}
```

Before removing these dependencies, you should:

1. Verify none of your native dependencies require these as peer dependencies
2. Test the app thoroughly after removal
3. Check if any of your code directly imports these packages
4. Consider keeping polyfills if you're using libraries that expect browser APIs

Note that some of these might be transitive dependencies required by other packages. You should check the dependency tree (using `yarn why <package-name>`) before removing them to ensure they're not required by other packages in your project.

---



---


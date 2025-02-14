## SpecStory

## Update README for Environment Variable Setup (1/27/2025, 11:45:55 AM)

_**User**_

replace with calling "yarn env:pull:dev" that will create a .env.local file with all the development env variable set in expo.dev. If you want env var for preview or prod you can call env:pull:preview and env:pull:prod

---

_**Assistant**_

I'll help you update the README.md to replace the environment setup instructions with the new yarn commands. Here's the modified section:

````markdown:README.md
// ... existing code ...

### Environment

Run one of the following commands to set up your environment variables:

```sh
# For development environment
yarn env:pull:dev

# For preview environment
yarn env:pull:preview

# For production environment
yarn env:pull:prod
```

This will create the appropriate `.env.local` file with environment variables configured in expo.dev.

// ... existing code ...
````

This update:
1. Removes the old instructions about copying `.env` from another repository
2. Adds clear instructions for pulling environment variables for different environments
3. Explains that this creates a `.env.local` file with the appropriate configuration
4. Maintains the same clear, instructional tone of the README

The rest of the README can remain unchanged since this only affects the environment setup section.

---



---


## SpecStory

## Yarn Version Confirmation in Repository (1/13/2025, 8:17:11 PM)

_**User**_

is there anyplace in the repo where it says we use yarn v4

---

_**Assistant**_

Based on the package.json file shown, there's no indication that this project uses Yarn v4. In fact, the package.json explicitly specifies:

```json:package.json
"packageManager": "yarn@1.22.19"
```

This indicates that the project is using Yarn Classic (v1), specifically version 1.22.19. If the project was using Yarn v4, it would typically:

1. Have a different version number in the packageManager field (starting with 4.x.x)
2. Include a `.yarnrc.yml` file in the repository
3. Have a `.yarn` directory with the Yarn release

The current configuration clearly shows this is a Yarn v1 project.

---



---


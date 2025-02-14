## SpecStory

## Improving Code Readability and Formatting (2/17/2025, 9:56:02 AM)

_**User**_

can you make the code more readable? like spaces and tabs. Format the code correctly. Make the code example really small too

---

_**Assistant**_

Below are partial edits to **.cursor/rules/example.md**, focusing on making code examples smaller and more readable with clearer indentation. Unchanged text is represented by comments.

````.cursor/rules/example.md
markdown:.cursor/rules/example.md
// existing guide content above...

### Write concise TypeScript code

```typescript
// ❌ Bad: Verbose, redundant code
function processUserData(user: any) {
  if (!user || !user.name) return "";
  return user.name;
}

// ✅ Good: Concise, type-safe code
function processUserData({ name }: { name: string }) {
  return name;
}
```

// existing guide content...
### Use functional programming patterns

```typescript
// ❌ Bad: Imperative approach with mutations
let total = 0;
const numbers = [1, 2];
for (let i = 0; i < numbers.length; i++) {
  total += numbers[i];
}

// ✅ Good: Functional approach
const nums = [1, 2];
const totalNums = nums.reduce((sum, num) => sum + num, 0);
```

// existing guide content...
### Use descriptive variable names

```typescript
// ❌ Bad: Unclear variable names
const d = new Date();
const u = fetchUserData(d);
const p = processData(u);

// ✅ Good: Clear, descriptive names with auxiliary verbs
const currentDate = new Date();
const userData = fetchUserData(currentDate);
const processedUserData = processData(userData);
```

// existing guide content...
### Don't create nested functions

```typescript
// ❌ Bad: Function defined inside component
function UserProfile({ userId }: { userId: string }) {
  function formatName(firstName: string, lastName: string) {
    return `${firstName} ${lastName}`;
  }
  return <div>{formatName("John", "Doe")}</div>;
}

// ✅ Good: Function defined at module level
function formatName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`;
}

function UserProfile({ userId }: { userId: string }) {
  return <div>{formatName("John", "Doe")}</div>;
}
```

// existing guide content...
### Add clear comments for non-obvious logic

```typescript
// ❌ Bad: Missing explanation
function calculatePrice(amount: number) {
  return amount * 1.2;
}

// ✅ Good: Clear explanation of logic
// Apply a 20% tax before returning total.
function calculatePriceWithTax(amount: number) {
  return amount * 1.2;
}
```

// existing guide content...
### Use ForCurrentAccount suffix appropriately

```typescript
// ❌ Bad: Missing suffix
function useGroupMembers() {
  const { currentAccount } = useCurrentAccount();
  return useQuery(["members", currentAccount]);
}

// ✅ Good: Proper suffix indicates currentAccount usage
function useGroupMembersForCurrentAccount() {
  const { currentAccount } = useCurrentAccount();
  return useQuery(["members", currentAccount]);
}
```

// existing guide content...
### Handle errors at caller level

```typescript
// ❌ Bad: Error swallowed in utility
async function fetchUserData(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch {
    return null;
  }
}

// ✅ Good: Errors propagated to the caller
async function fetchUserData(userId: string) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

// Caller handles error:
try {
  const userData = await fetchUserData(userId);
} catch (error) {
  logger.error(`[fetchUserData] Failed: ${error}`);
  throw error;
}
```

// existing guide content...
### Use Zod for API validation

```typescript
// ❌ Bad: Manual type checking
interface IUserResponse {
  id: string;
  name: string;
}

// ✅ Good: Zod schema validation
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

type IUserResponse = z.infer<typeof UserSchema>;

const response = UserSchema.parse(data);
```

// existing guide content...
### Keep files focused and modular

```typescript
// ❌ Bad: Multiple components in one file
export function UserProfile() { /* ... */ }
export function UserSettings() { /* ... */ }

// ✅ Good: Separate files for each component
// user-profile.screen.tsx
export function UserProfile() { /* ... */ }

// user-settings.screen.tsx
export function UserSettings() { /* ... */ }
```

// existing guide content...
### Use composable pattern for complex components

```typescript
// ❌ Bad: Many optional props in a single component
function UserCard(props: {
  name?: string;
  avatarUrl?: string;
  bio?: string;
  onEdit?: () => void;
}) {
  // ... big complicated render ...
}

// ✅ Good: Composable
function UserCard({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

UserCard.Avatar = function Avatar({ src }: { src: string }) {
  return <img src={src} alt="avatar" />;
};

UserCard.Info = function Info({ name, bio }: { name: string; bio: string }) {
  return (
    <div>
      <p>{name}</p>
      <p>{bio}</p>
    </div>
  );
};
```

// existing guide content below...
````
**Explanation of Updates:**
- Reformatted code blocks with consistent indentation and spacing.  
- Shortened arrays and function bodies to create more concise examples.  
- Preserved original comment context while downsizing code.

---

_**User**_

ok perfect! Take a look at what you did for  @example.md and make it for all the .md files in .cursor/rules like for @cache-management.md @file-structure.md @imports.md @logging.md  @mutations.md  @react-components.md  @react-query.md  @theming.md  @typescript.md .

So iw ant small examples of bad vs good code. Needs to be clean and easy to read and understand

---

_**Assistant**_

I'll help improve each file one by one. Let's start with cache-management.md:

```markdown:.cursor/rules/cache-management.md
# Cache Management

// ... existing description ...

```typescript
// ❌ Bad: Direct cache manipulation
queryClient.setQueryData(['conversations'], (old) => {
  return [...old, newConversation];
});

// ✅ Good: Encapsulated cache update helper
function updateConversationInCache({ conversation }: { conversation: IConversation }) {
  const options = getConversationsQueryOptions();
  
  queryClient.setQueryData(options.queryKey, (prev: IConversation[]) => 
    [...prev, conversation]
  );
}

// ❌ Bad: Direct key usage
queryClient.getQueryData(['user', userId]);

// ✅ Good: Using query options
const options = getUserQueryOptions({ userId });
queryClient.getQueryData(options.queryKey);
```
```

For file-structure.md:

```markdown:.cursor/rules/file-structure.md
# File Structure & Naming

// ... existing description ...

```typescript
// ❌ Bad: Generic file names and structure
/src
  /utils
    helpers.ts
    types.ts
  /components
    profile.tsx
    settings.tsx

// ✅ Good: Clear, feature-based structure
/src
  /features
    /profile
      profile.screen.tsx
      profile.utils.ts
      profile.types.ts
    /settings
      settings.screen.tsx
      settings.queries.ts
```
```

For imports.md:

```markdown:.cursor/rules/imports.md
# Import Guidelines

// ... existing description ...

```typescript
// ❌ Bad: Relative imports
import { UserProfile } from "../../../components/profile";
import { useAuth } from "../../../../hooks/auth";

// ✅ Good: Absolute imports with @ alias
import { UserProfile } from "@/features/profile/profile.screen";
import { useAuth } from "@/hooks/use-auth";
```
```

For mutations.md:

```markdown:.cursor/rules/mutations.md
# Mutation Patterns

// ... existing description ...

```typescript
// ❌ Bad: No optimistic updates
const { mutate } = useMutation({
  mutationFn: updateProfile,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  }
});

// ✅ Good: With optimistic updates and rollback
const { mutate } = useMutation({
  mutationFn: updateProfile,
  onMutate: async (newProfile) => {
    await queryClient.cancelQueries({ queryKey: ['profile'] });
    const previous = queryClient.getQueryData(['profile']);
    queryClient.setQueryData(['profile'], newProfile);
    return { previous };
  },
  onError: (err, newProfile, context) => {
    queryClient.setQueryData(['profile'], context.previous);
  }
});
```
```

For react-components.md:

```markdown:.cursor/rules/react-components.md
# React & Components Guidelines

// ... existing description ...

```typescript
// ❌ Bad: Default export and nested render function
export default function UserProfile({ user }) {
  const renderUserInfo = () => {
    return <div>{user.name}</div>;
  };
  
  return <div>{renderUserInfo()}</div>;
}

// ✅ Good: Named export with inline JSX
export function UserProfile({ user }: { user: IUser }) {
  if (!user) return null;
  
  return (
    <div>
      <span>{user.name}</span>
    </div>
  );
}
```
```

For react-query.md:

```markdown:.cursor/rules/react-query.md
# React Query Guidelines

// ... existing description ...

```typescript
// ❌ Bad: Destructuring rest and direct key usage
const { data, ...rest } = useQuery(['users', userId], fetchUser);

// ✅ Good: Explicit properties and query options
const { data: user, isLoading, error } = useQuery(
  getUserQueryOptions({ userId })
);

// ❌ Bad: Inline query function
useQuery(['posts'], async () => {
  const res = await fetch('/api/posts');
  return res.json();
});

// ✅ Good: Separated query options
const getPostsQueryOptions = () => ({
  queryKey: ['posts'],
  queryFn: () => fetchPosts(),
  staleTime: 5000
});

const { data: posts } = useQuery(getPostsQueryOptions());
```
```

For typescript.md:

```markdown:.cursor/rules/typescript.md
# TypeScript Guidelines

// ... existing description ...

```typescript
// ❌ Bad: Using any and function parameters
function updateUser(name: any, email: any) {
  // ...
}

// ✅ Good: Type-safe object parameters
function updateUser({ name, email }: { 
  name: string;
  email: string;
}) {
  // ...
}

// ❌ Bad: Using enum
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

// ✅ Good: Using const map
const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER'
} as const;

<<<<<<< HEAD
type IUserRole = typeof UserRole[keyof typeof UserRole];
```
```

For theming.md:

```markdown:.cursor/rules/theming.md
# Theming & Styling

// ... existing description ...

```typescript
// ❌ Bad: Hardcoded styles
function Button({ children }) {
  return (
    <Pressable style={{ 
      backgroundColor: '#007AFF',
      padding: 12
    }}>
      {children}
    </Pressable>
  );
}

// ✅ Good: Using theme
function Button({ children }) {
  const { theme } = useAppTheme();
  
  return (
    <Pressable style={[{
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium
    }]}>
      {children}
    </Pressable>
  );
}
```
```

These examples are now more concise, focused, and demonstrate clear good vs bad patterns. Each example shows a common mistake and its proper implementation, making it easier for developers to understand and follow the guidelines.
=======
type
>>>>>>> 398693d3 (wip)

---



---


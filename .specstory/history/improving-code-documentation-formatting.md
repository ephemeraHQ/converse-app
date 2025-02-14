## SpecStory

## Improving Code Documentation Formatting (2/17/2025, 9:34:31 AM)

_**User**_

can you format this better

---

_**Assistant**_

Below is a reformatted version of the file with improved code blocks and clearer presentation:

````markdown:.cursor/rules/example.md
# Core Development Principles

This guide contains fundamental coding principles that should be applied when writing or reviewing TypeScript/React code. These rules are especially relevant when:

- Writing or refactoring React components and custom hooks  
- Implementing data fetching and state management logic  
- Handling API integrations and data validation  
- Structuring new features or components  
- Reviewing code for maintainability and performance  

## Rules with Examples

### Write concise TypeScript code

```typescript
// ❌ Bad: Verbose, redundant code
function processUserData(user: any) {
  let userName = '';
  if (user && user.name) {
    userName = user.name;
  }
  return userName;
}

// ✅ Good: Concise, type-safe code
function processUserData({ name }: { name: string }) {
  return name;
}
```

### Use functional programming patterns

```typescript
// ❌ Bad: Imperative approach with mutations
let total = 0;
const numbers = [1, 2, 3, 4];
for (let i = 0; i < numbers.length; i++) {
  total += numbers[i];
}

// ✅ Good: Functional approach
const numbers = [1, 2, 3, 4];
const total = numbers.reduce((sum, num) => sum + num, 0);
```

### Use descriptive variable names

```typescript
// ❌ Bad: Unclear variable names
const d = new Date();
const u = getUserData();
const p = processData(u);

// ✅ Good: Clear, descriptive names with auxiliary verbs
const currentDate = new Date();
const userData = getUserData();
const processedUserProfile = processData(userData);
```

### Don't create nested functions

```typescript
// ❌ Bad: Function defined inside component
function UserProfile({ userId }: { userId: string }) {
  const formatName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`;
  };
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

### Add clear comments for non-obvious logic

```typescript
// ❌ Bad: Missing or unclear comments
function calculatePrice(amount: number) {
  return amount * 1.08 * 100;
}

// ✅ Good: Clear explanation of logic
// Apply 8% tax and convert to cents for payment processing
function calculatePriceWithTax(amount: number) {
  return amount * 1.08 * 100;
}
```

### Use ForCurrentAccount suffix appropriately

```typescript
// ❌ Bad: Missing suffix when using currentAccount
function useGroupMembers() {
  const { currentAccount } = useCurrentAccount();
  return useQuery(['members', currentAccount]);
}

// ✅ Good: Proper suffix indicates currentAccount usage
function useGroupMembersForCurrentAccount() {
  const { currentAccount } = useCurrentAccount();
  return useQuery(['members', currentAccount]);
}
```

### Handle errors at caller level

```typescript
// ❌ Bad: Error handling buried in utility
async function fetchUserData(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ✅ Good: Errors propagated to caller
async function fetchUserData(userId: string) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

// Caller handles errors
try {
  const userData = await fetchUserData(userId);
} catch (error) {
  logger.error(`Failed to fetch user data: ${error}`);
  throw error;
}
```

### Use Zod for API validation

```typescript
// ❌ Bad: Manual type checking
interface UserResponse {
  id: string;
  name: string;
}

// ✅ Good: Zod schema validation
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

type UserResponse = z.infer<typeof UserSchema>;

const response = UserSchema.parse(data);
```

### Keep files focused and modular

```typescript
// ❌ Bad: Multiple components in one file
// user-components.tsx
export function UserProfile() {
  // ...
}
export function UserSettings() {
  // ...
}
export function UserFriends() {
  // ...
}

// ✅ Good: Separate files for each component
// user-profile.screen.tsx
export function UserProfile() {
  // ...
}

// user-settings.screen.tsx
export function UserSettings() {
  // ...
}
```

### Use composable pattern for complex components

```typescript
// ❌ Bad: Many optional props
function UserCard({
  name,
  avatar,
  bio,
  isEditable,
  showStats,
  onEdit,
}: UserCardProps) {
  // Complex rendering logic
}

// ✅ Good: Composable components
function UserCard({ children }: { children: React.ReactNode }) {
  return <div className="user-card">{children}</div>;
}

UserCard.Avatar = function Avatar({ src }: { src: string }) {
  return <img src={src} />;
};

UserCard.Info = function Info({ name, bio }: { name: string; bio: string }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>{bio}</p>
    </div>
  );
};

// Usage
<UserCard>
  <UserCard.Avatar src={avatarUrl} />
  <UserCard.Info name={name} bio={bio} />
</UserCard>
```
````

---



---


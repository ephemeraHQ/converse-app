## SpecStory

## TypeScript Best Practices Code Examples (2/17/2025, 9:19:43 AM)

_**User**_

for each of those point. write a small code examples on how it should look like

---

_**Assistant**_

I'll provide examples for each core principle with practical code snippets.

### 1. Write concise TypeScript code

```typescript:.cursorrules/core-principles.md
// ❌ Bad: Verbose and redundant
interface IUserData {
  firstName: string | null;
  lastName: string | null;
  age: number | undefined;
}

// ✅ Good: Concise and clear
type IUserData = {
  firstName: string;
  lastName: string;
  age?: number;
}
```

### 2. Use functional programming patterns

```typescript
// ❌ Bad: Imperative approach
function calculateTotal(items: IItem[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// ✅ Good: Functional approach
function calculateTotal(items: IItem[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### 3. Use empty lines to separate logical blocks

```typescript
// ❌ Bad: No separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();
  const handlePress = () => {
    navigation.navigate('Settings');
  };
  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}

// ✅ Good: Clear separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}
```

### 4. Use descriptive variable names

```typescript
// ❌ Bad: Unclear variable names
const q = useQuery(['data']);
const h = useHandler();
const n = useNavigation();

// ✅ Good: Descriptive names with auxiliary verbs
const { data: groupMembersInfo } = useGroupMembersInfoForCurrentAccount();
const isLoadingMembers = useIsLoadingGroupMembers();
const hasErrorFetchingProfile = useHasErrorFetchingProfile();
```

### 5. Don't create functions inside other functions

```typescript
// ❌ Bad: Nested function definition
export function ConversationList() {
  const handleMessagePress = () => {
    function formatMessage(msg: string) {
      return msg.trim();
    }
    // ...
  };
}

// ✅ Good: Separate function definitions
function formatMessage(msg: string) {
  return msg.trim();
}

export function ConversationList() {
  const handleMessagePress = () => {
    const formattedMessage = formatMessage(message);
    // ...
  };
}
```

### 6. Clear comments for non-obvious logic

```typescript
// ❌ Bad: Unnecessary or unclear comments
function processData(data: IData) {
  // Loop through data
  data.forEach(item => {
    // Process item
    process(item);
  });
}

// ✅ Good: Meaningful comments explaining complex logic
function processTransactionBatch(transactions: ITransaction[]) {
  // We need to process transactions in reverse order to handle
  // dependent transactions correctly and prevent double-spending
  return transactions.reverse().map(transaction => {
    return processTransaction(transaction);
  });
}
```

### 7. Use 'ForCurrentAccount' suffix

```typescript
// ❌ Bad: Missing suffix
export function useGroupMembers() {
  const { currentAccount } = useCurrentAccount();
  // ...
}

// ✅ Good: Using ForCurrentAccount suffix
export function useGroupMembersForCurrentAccount() {
  const { currentAccount } = useCurrentAccount();
  // ...
}
```

### 8. Error handling at caller level

```typescript
// ❌ Bad: Handling errors inside utility function
function fetchUserData(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch user data: ${error}`);
    return null;
  }
}

// ✅ Good: Throwing errors to caller
function fetchUserData(userId: string) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

// Handle errors in the caller
function ProfileScreen() {
  const { data, error } = useQuery({
    queryKey: ['userData'],
    queryFn: () => fetchUserData(userId),
    onError: (error) => {
      logger.error(`Failed to fetch user data: ${error}`);
    }
  });
}
```

### 9. Zod for API validation

```typescript
// ❌ Bad: Manual type definition without validation
type IUserResponse = {
  id: string;
  name: string;
  email: string;
};

// ✅ Good: Zod schema with type inference
const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

type IUserResponse = z.infer<typeof UserResponseSchema>;

function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return UserResponseSchema.parse(response.data);
}
```

### 10. Small, focused files

```typescript
// ❌ Bad: Everything in one file
// profile.tsx
export function ProfileScreen() { /* ... */ }
export function useProfileData() { /* ... */ }
export function ProfileHeader() { /* ... */ }
export function ProfileSettings() { /* ... */ }

// ✅ Good: Separated files
// profile.screen.tsx
export function ProfileScreen() { /* ... */ }

// profile-header.component.tsx
export function ProfileHeader() { /* ... */ }

// use-profile-data.hook.ts
export function useProfileData() { /* ... */ }

// profile-settings.component.tsx
export function ProfileSettings() { /* ... */ }
```

### 11. Composable pattern for optional props

```typescript
// ❌ Bad: Too many optional props
type IButtonProps = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  // ...more props
};

// ✅ Good: Composable components
export function Button({ label, onClick }: IButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

export function IconButton({ icon, ...props }: IIconButtonProps) {
  return <Button {...props} leftIcon={icon} />;
}

export function LoadingButton({ loading, ...props }: ILoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      rightIcon={loading ? <Spinner /> : props.rightIcon}
    />
  );
}
```

---

_**User**_

can you put those example in the core-principles.mdc file?

---

_**Assistant**_

I'll help you update the core-principles.mdc file with the examples.

```markdown:core-principles.mdc
# Core Principles

These core principles help maintain code quality and consistency across the codebase. They are particularly useful when:
- Writing new features or components
- Refactoring existing code
- Reviewing pull requests
- Making architectural decisions
- Implementing logging and error handling

These principles ensure code is maintainable, readable, and follows established patterns that have proven effective in our codebase.

## 1. Write concise TypeScript code

```typescript
// ❌ Bad: Verbose and redundant
interface IUserData {
  firstName: string | null;
  lastName: string | null;
  age: number | undefined;
}

// ✅ Good: Concise and clear
type IUserData = {
  firstName: string;
  lastName: string;
  age?: number;
}
```

## 2. Use functional programming patterns

```typescript
// ❌ Bad: Imperative approach
function calculateTotal(items: IItem[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// ✅ Good: Functional approach
function calculateTotal(items: IItem[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## 3. Use empty lines to separate logical blocks

```typescript
// ❌ Bad: No separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();
  const handlePress = () => {
    navigation.navigate('Settings');
  };
  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}

// ✅ Good: Clear separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}
```

## 4. Use descriptive variable names

```typescript
// ❌ Bad: Unclear variable names
const q = useQuery(['data']);
const h = useHandler();
const n = useNavigation();

// ✅ Good: Descriptive names with auxiliary verbs
const { data: groupMembersInfo } = useGroupMembersInfoForCurrentAccount();
const isLoadingMembers = useIsLoadingGroupMembers();
const hasErrorFetchingProfile = useHasErrorFetchingProfile();
```

## 5. Don't create functions inside other functions

```typescript
// ❌ Bad: Nested function definition
export function ConversationList() {
  const handleMessagePress = () => {
    function formatMessage(msg: string) {
      return msg.trim();
    }
    // ...
  };
}

// ✅ Good: Separate function definitions
function formatMessage(msg: string) {
  return msg.trim();
}

export function ConversationList() {
  const handleMessagePress = () => {
    const formattedMessage = formatMessage(message);
    // ...
  };
}
```

## 6. Clear comments for non-obvious logic

```typescript
// ❌ Bad: Unnecessary or unclear comments
function processData(data: IData) {
  // Loop through data
  data.forEach(item => {
    // Process item
    process(item);
  });
}

// ✅ Good: Meaningful comments explaining complex logic
function processTransactionBatch(transactions: ITransaction[]) {
  // We need to process transactions in reverse order to handle
  // dependent transactions correctly and prevent double-spending
  return transactions.reverse().map(transaction => {
    return processTransaction(transaction);
  });
}
```

## 7. Use 'ForCurrentAccount' suffix

```typescript
// ❌ Bad: Missing suffix
export function useGroupMembers() {
  const { currentAccount } = useCurrentAccount();
  // ...
}

// ✅ Good: Using ForCurrentAccount suffix
export function useGroupMembersForCurrentAccount() {
  const { currentAccount } = useCurrentAccount();
  // ...
}
```

## 8. Error handling at caller level

```typescript
// ❌ Bad: Handling errors inside utility function
function fetchUserData(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch user data: ${error}`);
    return null;
  }
}

// ✅ Good: Throwing errors to caller
function fetchUserData(userId: string) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

// Handle errors in the caller
function ProfileScreen() {
  const { data, error } = useQuery({
    queryKey: ['userData'],
    queryFn: () => fetchUserData(userId),
    onError: (error) => {
      logger.error(`Failed to fetch user data: ${error}`);
    }
  });
}
```

## 9. Zod for API validation

```typescript
// ❌ Bad: Manual type definition without validation
type IUserResponse = {
  id: string;
  name: string;
  email: string;
};

// ✅ Good: Zod schema with type inference
const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

type IUserResponse = z.infer<typeof UserResponseSchema>;

function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return UserResponseSchema.parse(response.data);
}
```

## 10. Small, focused files

```typescript
// ❌ Bad: Everything in one file
// profile.tsx
export function ProfileScreen() { /* ... */ }
export function useProfileData() { /* ... */ }
export function ProfileHeader() { /* ... */ }
export function ProfileSettings() { /* ... */ }

// ✅ Good: Separated files
// profile.screen.tsx
export function ProfileScreen() { /* ... */ }

// profile-header.component.tsx
export function ProfileHeader() { /* ... */ }

// use-profile-data.hook.ts
export function useProfileData() { /* ... */ }

// profile-settings.component.tsx
export function ProfileSettings() { /* ... */ }
```

## 11. Composable pattern for optional props

```typescript
// ❌ Bad: Too many optional props
type IButtonProps = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  // ...more props
};

// ✅ Good: Composable components
export function Button({ label, onClick }: IButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

export function IconButton({ icon, ...props }: IIconButtonProps) {
  return <Button {...props} leftIcon={icon} />;
}

export function LoadingButton({ loading, ...props }: ILoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      rightIcon={loading ? <Spinner /> : props.rightIcon}
    />
  );
}
```
```

---

_**User**_

ok put that into a .md file with same file name

---

_**Assistant**_

I'll create a new file with the same content.

```markdown:.cursorrules/core-principles.md
# Core Principles

These core principles help maintain code quality and consistency across the codebase. They are particularly useful when:
- Writing new features or components
- Refactoring existing code
- Reviewing pull requests
- Making architectural decisions
- Implementing logging and error handling

These principles ensure code is maintainable, readable, and follows established patterns that have proven effective in our codebase.

## 1. Write concise TypeScript code

```typescript
// ❌ Bad: Verbose and redundant
interface IUserData {
  firstName: string | null;
  lastName: string | null;
  age: number | undefined;
}

// ✅ Good: Concise and clear
type IUserData = {
  firstName: string;
  lastName: string;
  age?: number;
}
```

## 2. Use functional programming patterns

```typescript
// ❌ Bad: Imperative approach
function calculateTotal(items: IItem[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// ✅ Good: Functional approach
function calculateTotal(items: IItem[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## 3. Use empty lines to separate logical blocks

```typescript
// ❌ Bad: No separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();
  const handlePress = () => {
    navigation.navigate('Settings');
  };
  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}

// ✅ Good: Clear separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}
```

## 4. Use descriptive variable names

```typescript
// ❌ Bad: Unclear variable names
const q = useQuery(['data']);
const h = useHandler();
const n = useNavigation();

// ✅ Good: Descriptive names with auxiliary verbs
const { data: groupMembersInfo } = useGroupMembersInfoForCurrentAccount();
const isLoadingMembers = useIsLoadingGroupMembers();
const hasErrorFetchingProfile = useHasErrorFetchingProfile();
```

## 5. Don't create functions inside other functions

```typescript
// ❌ Bad: Nested function definition
export function ConversationList() {
  const handleMessagePress = () => {
    function formatMessage(msg: string) {
      return msg.trim();
    }
    // ...
  };
}

// ✅ Good: Separate function definitions
function formatMessage(msg: string) {
  return msg.trim();
}

export function ConversationList() {
  const handleMessagePress = () => {
    const formattedMessage = formatMessage(message);
    // ...
  };
}
```

## 6. Clear comments for non-obvious logic

```typescript
// ❌ Bad: Unnecessary or unclear comments
function processData(data: IData) {
  // Loop through data
  data.forEach(item => {
    // Process item
    process(item);
  });
}

// ✅ Good: Meaningful comments explaining complex logic
function processTransactionBatch(transactions: ITransaction[]) {
  // We need to process transactions in reverse order to handle
  // dependent transactions correctly and prevent double-spending
  return transactions.reverse().map(transaction => {
    return processTransaction(transaction);
  });
}
```

## 7. Use 'ForCurrentAccount' suffix

```typescript
// ❌ Bad: Missing suffix
export function useGroupMembers() {
  const { currentAccount } = useCurrentAccount();
  // ...
}

// ✅ Good: Using ForCurrentAccount suffix
export function useGroupMembersForCurrentAccount() {
  const { currentAccount } = useCurrentAccount();
  // ...
}
```

## 8. Error handling at caller level

```typescript
// ❌ Bad: Handling errors inside utility function
function fetchUserData(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch user data: ${error}`);
    return null;
  }
}

// ✅ Good: Throwing errors to caller
function fetchUserData(userId: string) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

// Handle errors in the caller
function ProfileScreen() {
  const { data, error } = useQuery({
    queryKey: ['userData'],
    queryFn: () => fetchUserData(userId),
    onError: (error) => {
      logger.error(`Failed to fetch user data: ${error}`);
    }
  });
}
```

## 9. Zod for API validation

```typescript
// ❌ Bad: Manual type definition without validation
type IUserResponse = {
  id: string;
  name: string;
  email: string;
};

// ✅ Good: Zod schema with type inference
const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

type IUserResponse = z.infer<typeof UserResponseSchema>;

function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return UserResponseSchema.parse(response.data);
}
```

## 10. Small, focused files

```typescript
// ❌ Bad: Everything in one file
// profile.tsx
export function ProfileScreen() { /* ... */ }
export function useProfileData() { /* ... */ }
export function ProfileHeader() { /* ... */ }
export function ProfileSettings() { /* ... */ }

// ✅ Good: Separated files
// profile.screen.tsx
export function ProfileScreen() { /* ... */ }

// profile-header.component.tsx
export function ProfileHeader() { /* ... */ }

// use-profile-data.hook.ts
export function useProfileData() { /* ... */ }

// profile-settings.component.tsx
export function ProfileSettings() { /* ... */ }
```

## 11. Composable pattern for optional props

```typescript
// ❌ Bad: Too many optional props
type IButtonProps = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  // ...more props
};

// ✅ Good: Composable components
export function Button({ label, onClick }: IButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

export function IconButton({ icon, ...props }: IIconButtonProps) {
  return <Button {...props} leftIcon={icon} />;
}

export function LoadingButton({ loading, ...props }: ILoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      rightIcon={loading ? <Spinner /> : props.rightIcon}
    />
  );
}
```
```

---

_**User**_

recreate  the .md file and put those in it

---

_**Assistant**_

I'll help you create the .md file with proper markdown formatting.

```markdown:.cursorrules/core-principles.md
# Core Principles

These core principles help maintain code quality and consistency across the codebase. They are particularly useful when:
- Writing new features or components
- Refactoring existing code
- Reviewing pull requests
- Making architectural decisions
- Implementing logging and error handling

These principles ensure code is maintainable, readable, and follows established patterns that have proven effective in our codebase.

## 1. Write concise TypeScript code
```typescript
// ❌ Bad: Verbose and redundant
interface IUserData {
  firstName: string | null;
  lastName: string | null;
  age: number | undefined;
}

// ✅ Good: Concise and clear
type IUserData = {
  firstName: string;
  lastName: string;
  age?: number;
}
```

## 2. Use functional programming patterns
```typescript
// ❌ Bad: Imperative approach
function calculateTotal(items: IItem[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// ✅ Good: Functional approach
function calculateTotal(items: IItem[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## 3. Use empty lines to separate logical blocks
```typescript
// ❌ Bad: No separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();
  const handlePress = () => {
    navigation.navigate('Settings');
  };
  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}

// ✅ Good: Clear separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}
```

## 4. Use descriptive variable names
```typescript
// ❌ Bad: Unclear variable names
const q = useQuery(['data']);
const h = useHandler();
const n = useNavigation();

// ✅ Good: Descriptive names with auxiliary verbs
const { data: groupMembersInfo } = useGroupMembersInfoForCurrentAccount();
const isLoadingMembers = useIsLoadingGroupMembers();
const hasErrorFetchingProfile = useHasErrorFetchingProfile();
```

## 5. Don't create functions inside other functions
```typescript
// ❌ Bad: Nested function definition
export function ConversationList() {
  const handleMessagePress = () => {
    function formatMessage(msg: string) {
      return msg.trim();
    }
    // ...
  };
}

// ✅ Good: Separate function definitions
function formatMessage(msg: string) {
  return msg.trim();
}

export function ConversationList() {
  const handleMessagePress = () => {
    const formattedMessage = formatMessage(message);
    // ...
  };
}
```

## 6. Clear comments for non-obvious logic
```typescript
// ❌ Bad: Unnecessary or unclear comments
function processData(data: IData) {
  // Loop through data
  data.forEach(item => {
    // Process item
    process(item);
  });
}

// ✅ Good: Meaningful comments explaining complex logic
function processTransactionBatch(transactions: ITransaction[]) {
  // We need to process transactions in reverse order to handle
  // dependent transactions correctly and prevent double-spending
  return transactions.reverse().map(transaction => {
    return processTransaction(transaction);
  });
}
```

## 7. Use 'ForCurrentAccount' suffix
```typescript
// ❌ Bad: Missing suffix
export function useGroupMembers() {
  const { currentAccount } = useCurrentAccount();
  // ...
}

// ✅ Good: Using ForCurrentAccount suffix
export function useGroupMembersForCurrentAccount() {
  const { currentAccount } = useCurrentAccount();
  // ...
}
```

## 8. Error handling at caller level
```typescript
// ❌ Bad: Handling errors inside utility function
function fetchUserData(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch user data: ${error}`);
    return null;
  }
}

// ✅ Good: Throwing errors to caller
function fetchUserData(userId: string) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

// Handle errors in the caller
function ProfileScreen() {
  const { data, error } = useQuery({
    queryKey: ['userData'],
    queryFn: () => fetchUserData(userId),
    onError: (error) => {
      logger.error(`Failed to fetch user data: ${error}`);
    }
  });
}
```

## 9. Zod for API validation
```typescript
// ❌ Bad: Manual type definition without validation
type IUserResponse = {
  id: string;
  name: string;
  email: string;
};

// ✅ Good: Zod schema with type inference
const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

type IUserResponse = z.infer<typeof UserResponseSchema>;

function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return UserResponseSchema.parse(response.data);
}
```

## 10. Small, focused files
```typescript
// ❌ Bad: Everything in one file
// profile.tsx
export function ProfileScreen() { /* ... */ }
export function useProfileData() { /* ... */ }
export function ProfileHeader() { /* ... */ }
export function ProfileSettings() { /* ... */ }

// ✅ Good: Separated files
// profile.screen.tsx
export function ProfileScreen() { /* ... */ }

// profile-header.component.tsx
export function ProfileHeader() { /* ... */ }

// use-profile-data.hook.ts
export function useProfileData() { /* ... */ }

// profile-settings.component.tsx
export function ProfileSettings() { /* ... */ }
```

## 11. Composable pattern for optional props
```typescript
// ❌ Bad: Too many optional props
type IButtonProps = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  // ...more props
};

// ✅ Good: Composable components
export function Button({ label, onClick }: IButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

export function IconButton({ icon, ...props }: IIconButtonProps) {
  return <Button {...props} leftIcon={icon} />;
}

export function LoadingButton({ loading, ...props }: ILoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      rightIcon={loading ? <Spinner /> : props.rightIcon}
    />
  );
}
```

---

_**User**_

the file should be called example.md

---

_**Assistant**_

I'll create a new file called example.md with the same content.

```markdown:.cursor/rules/example.md
# Core Principles Examples

This file provides concrete examples of our core principles in action. Each section demonstrates both anti-patterns to avoid (❌) and recommended approaches (✅).

## 1. Write concise TypeScript code
```typescript
// ❌ Bad: Verbose and redundant
interface IUserData {
  firstName: string | null;
  lastName: string | null;
  age: number | undefined;
}

// ✅ Good: Concise and clear
type IUserData = {
  firstName: string;
  lastName: string;
  age?: number;
}
```

## 2. Use functional programming patterns
```typescript
// ❌ Bad: Imperative approach
function calculateTotal(items: IItem[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// ✅ Good: Functional approach
function calculateTotal(items: IItem[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## 3. Use empty lines to separate logical blocks
```typescript
// ❌ Bad: No separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();
  const handlePress = () => {
    navigation.navigate('Settings');
  };
  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}

// ✅ Good: Clear separation between logical blocks
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const { data: user } = useUserQuery();
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress}>Settings</Button>
    </View>
  );
}
```

## 4. Use descriptive variable names
```typescript
// ❌ Bad: Unclear variable names
const q = useQuery(['data']);
const h = useHandler();
const n = useNavigation();

// ✅ Good: Descriptive names with auxiliary verbs
const { data: groupMembersInfo } = useGroupMembersInfoForCurrentAccount();
const isLoadingMembers = useIsLoadingGroupMembers();
const hasErrorFetchingProfile = useHasErrorFetchingProfile();
```

## 5. Don't create functions inside other functions
```typescript
// ❌ Bad: Nested function definition
export function ConversationList() {
  const handleMessagePress = () => {
    function formatMessage(msg: string) {
      return msg.trim();
    }
    // ...
  };
}

// ✅ Good: Separate function definitions
function formatMessage(msg: string) {
  return msg.trim();
}

export function ConversationList() {
  const handleMessagePress = () => {
    const formattedMessage = formatMessage(message);
    // ...
  };
}
```

## 6. Clear comments for non-obvious logic
```typescript
// ❌ Bad: Unnecessary or unclear comments
function processData(data: IData) {
  // Loop through data
  data.forEach(item => {
    // Process item
    process(item);
  });
}

// ✅ Good: Meaningful comments explaining complex logic
function processTransactionBatch(transactions: ITransaction[]) {
  // We need to process transactions in reverse order to handle
  // dependent transactions correctly and prevent double-spending
  return transactions.reverse().map(transaction => {
    return processTransaction(transaction);
  });
}
```

## 7. Use 'ForCurrentAccount' suffix
```typescript
// ❌ Bad: Missing suffix
export function useGroupMembers() {
  const { currentAccount } = useCurrentAccount();
  // ...
}

// ✅ Good: Using ForCurrentAccount suffix
export function useGroupMembersForCurrentAccount() {
  const { currentAccount } = useCurrentAccount();
  // ...
}
```

## 8. Error handling at caller level
```typescript
// ❌ Bad: Handling errors inside utility function
function fetchUserData(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch user data: ${error}`);
    return null;
  }
}

// ✅ Good: Throwing errors to caller
function fetchUserData(userId: string) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

// Handle errors in the caller
function ProfileScreen() {
  const { data, error } = useQuery({
    queryKey: ['userData'],
    queryFn: () => fetchUserData(userId),
    onError: (error) => {
      logger.error(`Failed to fetch user data: ${error}`);
    }
  });
}
```

## 9. Zod for API validation
```typescript
// ❌ Bad: Manual type definition without validation
type IUserResponse = {
  id: string;
  name: string;
  email: string;
};

// ✅ Good: Zod schema with type inference
const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

type IUserResponse = z.infer<typeof UserResponseSchema>;

function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return UserResponseSchema.parse(response.data);
}
```

## 10. Small, focused files
```typescript
// ❌ Bad: Everything in one file
// profile.tsx
export function ProfileScreen() { /* ... */ }
export function useProfileData() { /* ... */ }
export function ProfileHeader() { /* ... */ }
export function ProfileSettings() { /* ... */ }

// ✅ Good: Separated files
// profile.screen.tsx
export function ProfileScreen() { /* ... */ }

// profile-header.component.tsx
export function ProfileHeader() { /* ... */ }

// use-profile-data.hook.ts
export function useProfileData() { /* ... */ }

// profile-settings.component.tsx
export function ProfileSettings() { /* ... */ }
```

## 11. Composable pattern for optional props
```typescript
// ❌ Bad: Too many optional props
type IButtonProps = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  // ...more props
};

// ✅ Good: Composable components
export function Button({ label, onClick }: IButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

export function IconButton({ icon, ...props }: IIconButtonProps) {
  return <Button {...props} leftIcon={icon} />;
}

export function LoadingButton({ loading, ...props }: ILoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      rightIcon={loading ? <Spinner /> : props.rightIcon}
    />
  );
}
```

---



---


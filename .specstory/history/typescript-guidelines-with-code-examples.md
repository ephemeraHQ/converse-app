## SpecStory

## TypeScript Guidelines with Code Examples (2/17/2025, 10:08:51 AM)

_**User**_

make sure we have small code example for each point

---

_**Assistant**_

I'll help improve the TypeScript guidelines by adding concise code examples for each point. Here's how we can update the file:

````markdown:.cursor/rules/typescript.md
# TypeScript Guidelines

Description: These TypeScript guidelines are essential when:

- Defining new types and interfaces
- Writing type-safe functions and components
- Working with external API responses
- Refactoring JavaScript code to TypeScript
- Implementing function parameters and return types

These rules help maintain type safety, catch errors at compile time, and make the codebase more maintainable and self-documenting.

## Core Rules

### Use Types Over Interfaces

```typescript
// ❌ Bad: Using interface
interface UserData {
  id: string;
  name: string;
}

// ✅ Good: Using type with 'I' prefix
type IUserData = {
  id: string;
  name: string;
};
```

### Never Use Any

```typescript
// ❌ Bad: Using any
function processUserData(data: any) {
  return data.name;
}

// ✅ Good: Using proper typing
function processUserData(data: { name: string }) {
  return data.name;
}
```

### Avoid Enums, Use Maps

```typescript
// ❌ Bad: Using enum
enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
}

// ✅ Good: Using const map with type
const MessageStatus = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
} as const;

type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];
```

### Use Functional Components with Types

```typescript
// ❌ Bad: Implicit any props
export function UserCard(props) {
  return <div>{props.name}</div>;
}

// ✅ Good: Typed functional component
type IUserCardProps = {
  name: string;
  age: number;
};

export function UserCard({ name, age }: IUserCardProps) {
  return <div>{name} ({age})</div>;
}
```

### Prefer Type Inference

```typescript
// ❌ Bad: Unnecessary explicit typing
const numbers: number[] = [1, 2, 3].map((num: number): number => num * 2);

// ✅ Good: Let TypeScript infer types
const numbers = [1, 2, 3].map(num => num * 2);
```

### Type Assertions on Return Objects

```typescript
// ❌ Bad: Function return type annotation
function createUser(): IUser {
  return {
    id: "123",
    name: "John",
    email: "john@example.com",
  };
}

// ✅ Good: Type assertion with satisfies
function createUser() {
  return {
    id: "123",
    name: "John",
    email: "john@example.com",
  } satisfies IUser;
}
```

## Function Patterns

### Use Function Keyword for Pure Functions

```typescript
// ❌ Bad: Arrow function for utility
const calculateTotal = (items: IItem[]) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✅ Good: Function keyword for utility
function calculateTotal(items: IItem[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Prefer Object Parameters

```typescript
// ❌ Bad: Multiple parameters
function updateProfile(userId: string, name: string, age: number) {
  // ...
}

// ✅ Good: Object parameters
function updateProfile({
  userId,
  name,
  age,
}: {
  userId: string;
  name: string;
  age: number;
}) {
  // ...
}
```

### Top-Level Parameter Destructuring

```typescript
// ❌ Bad: Nested destructuring
function getMetadataOptions(args: IArgs) {
  const { account } = args;
  const { id } = account;
  return id;
}

// ✅ Good: Top-level destructuring
function getMetadataOptions({ account: { id } }: IArgs) {
  return id;
}
```

### Use Zod for API Response Validation

```typescript
// ❌ Bad: Manual type definition
type ApiResponse = {
  data: {
    users: { id: string; name: string }[];
  };
};

// ✅ Good: Zod schema with inferred type
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const ApiResponseSchema = z.object({
  data: z.object({
    users: z.array(UserSchema),
  }),
});

type IApiResponse = z.infer<typeof ApiResponseSchema>;
```
````

This update:
1. Adds clear, concise code examples for each guideline
2. Groups related concepts together
3. Shows both incorrect and correct implementations
4. Includes practical examples that reflect real-world usage
5. Maintains consistent formatting and naming conventions
6. Adds a section about Zod validation which was mentioned in the custom instructions

---



---


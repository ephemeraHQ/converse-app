## SpecStory

## Code Examples for React Component Guidelines (2/17/2025, 10:08:10 AM)

_**User**_

make sure we have a small code example for each point

---

_**Assistant**_

I'll help add code examples for each guideline in the React & Components section. Here's how we can update the file:

````markdown:.cursor/rules/react-components.md
# React & Components Guidelines

Description: These React component guidelines are crucial when:

- Creating new components
- Refactoring existing components
- Implementing performance optimizations
- Managing component state and effects
- Structuring component hierarchies
  These rules help ensure components are performant, maintainable, and follow React best practices while maintaining consistency across the application.

## Core Guidelines

### Named Exports
```typescript
// ❌ Bad: Default export
export default function ProfileScreen() {
  return <View>...</View>;
}

// ✅ Good: Named export
export function ProfileScreen() {
  return <View>...</View>;
}
```

### Inline JSX
```typescript
// ❌ Bad: Separate render method
function UserProfile() {
  const renderUserInfo = () => {
    return <UserInfo />;
  };
  
  return <View>{renderUserInfo()}</View>;
}

// ✅ Good: Inline JSX
function UserProfile() {
  return (
    <View>
      <UserInfo />
    </View>
  );
}
```

### Early Returns Over Ternaries
```typescript
// ❌ Bad: Nested ternaries
function UserProfile({ user, isLoading }) {
  return (
    <View>
      {isLoading ? (
        <LoadingSpinner />
      ) : user ? (
        <UserInfo user={user} />
      ) : (
        <EmptyState />
      )}
    </View>
  );
}

// ✅ Good: Early returns
function UserProfile({ user, isLoading }) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <EmptyState />;
  }

  return <UserInfo user={user} />;
}
```

### Array Syntax for Merged Styles
```typescript
// ❌ Bad: Spreading styles
function CustomButton({ style }) {
  return (
    <TouchableOpacity style={{ ...defaultStyles.button, ...style }}>
      <Text>Click me</Text>
    </TouchableOpacity>
  );
}

// ✅ Good: Array syntax
function CustomButton({ style }) {
  return (
    <TouchableOpacity style={[defaultStyles.button, style]}>
      <Text>Click me</Text>
    </TouchableOpacity>
  );
}
```

### Minimize useEffect and setState
```typescript
// ❌ Bad: Unnecessary state and effect
function UserStatus({ userId }) {
  const [isOnline, setIsOnline] = useState(false);
  
  useEffect(() => {
    setIsOnline(checkUserStatus(userId));
  }, [userId]);

  return <Text>{isOnline ? 'Online' : 'Offline'}</Text>;
}

// ✅ Good: Compute values directly
function UserStatus({ userId }) {
  const isOnline = checkUserStatus(userId);
  return <Text>{isOnline ? 'Online' : 'Offline'}</Text>;
}
```

### Wrap with memo() for Performance
```typescript
// ❌ Bad: Unnecessary rerenders
function ExpensiveComponent({ data }) {
  return <ComplexVisualization data={data} />;
}

// ✅ Good: Memoized component
export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  return <ComplexVisualization data={data} />;
});
```

### Minimize Props with Hooks
```typescript
// ❌ Bad: Passing unnecessary props
function UserAvatar({ userId, size, theme, onLoad, onError }) {
  return (
    <Avatar 
      userId={userId} 
      size={size} 
      theme={theme}
      onLoad={onLoad} 
      onError={onError} 
    />
  );
}

// ✅ Good: Using hooks to minimize props
function UserAvatar({ userId }) {
  const { size } = useAvatarConfig();
  const { theme } = useAppTheme();
  const { handleLoad, handleError } = useImageHandlers();

  return (
    <Avatar 
      userId={userId} 
      size={size}
      theme={theme}
      onLoad={handleLoad} 
      onError={handleError}
    />
  );
}
```

### Keep Related Code Together
```typescript
// ✅ Good: Main component at top, related components below
export function UserProfile({ userId }) {
  return (
    <Container>
      <UserHeader userId={userId} />
      <UserDetails userId={userId} />
    </Container>
  );
}

// Related components directly underneath
function UserHeader({ userId }) {
  return <Header>{userId}</Header>;
}

function UserDetails({ userId }) {
  return <Details>{userId}</Details>;
}
```

### Composable Pattern for Complex Components
```typescript
// ❌ Bad: Many optional props
function UserCard({
  name,
  avatar,
  bio,
  stats,
  actions,
  isEditable,
  onEdit,
}) {
  return (
    <Card>
      {avatar && <Avatar src={avatar} />}
      {name && <Title>{name}</Title>}
      {bio && <Bio>{bio}</Bio>}
      {stats && <Stats data={stats} />}
      {isEditable && <EditButton onClick={onEdit} />}
    </Card>
  );
}

// ✅ Good: Composable components
export function UserCard({ children }: { children: React.ReactNode }) {
  return <Card>{children}</Card>;
}

UserCard.Avatar = function Avatar({ src }: { src: string }) {
  return <Image source={src} />;
};

UserCard.Title = function Title({ children }: { children: string }) {
  return <Text variant="title">{children}</Text>;
};

// Usage
function Profile() {
  return (
    <UserCard>
      <UserCard.Avatar src={avatarUrl} />
      <UserCard.Title>John Doe</UserCard.Title>
    </UserCard>
  );
}
```
````

---



---


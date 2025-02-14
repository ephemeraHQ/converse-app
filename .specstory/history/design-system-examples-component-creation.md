## SpecStory

## Design System Examples Component Creation (11/8/2024, 10:54:06 AM)

_**User**_

create a examples component that I can render and it will have many buttons to display the different design system components. I want a button for each one and when we press the button it will render the content for the specifc design system element. Example if we press on butotn avatar it will render a component call ExampleAvatars that will containt differetn variations of the avatar cmoponent

---

_**Assistant**_

I'll help you create an Examples component that showcases your design system elements. Here's how we can structure it:

```typescript:design-system/Examples.tsx
import { View } from 'react-native'
import { useState } from 'react'
import { Button } from './Button'
import { ExampleAvatars } from './examples/ExampleAvatars'
import { ExampleButtons } from './examples/ExampleButtons'
import { ExampleCards } from './examples/ExampleCards'
import { ExampleTypography } from './examples/ExampleTypography'

type IDesignSystemComponent = 'avatars' | 'buttons' | 'cards' | 'typography'

export function Examples() {
  const [selectedComponent, setSelectedComponent] = useState<IDesignSystemComponent | null>(null)

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button 
          label="Avatars" 
          onPress={() => setSelectedComponent('avatars')}
          variant={selectedComponent === 'avatars' ? 'primary' : 'secondary'}
        />
        <Button 
          label="Buttons" 
          onPress={() => setSelectedComponent('buttons')}
          variant={selectedComponent === 'buttons' ? 'primary' : 'secondary'}
        />
        <Button 
          label="Cards" 
          onPress={() => setSelectedComponent('cards')}
          variant={selectedComponent === 'cards' ? 'primary' : 'secondary'}
        />
        <Button 
          label="Typography" 
          onPress={() => setSelectedComponent('typography')}
          variant={selectedComponent === 'typography' ? 'primary' : 'secondary'}
        />
      </View>

      <View style={{ flex: 1 }}>
        {selectedComponent === 'avatars' && <ExampleAvatars />}
        {selectedComponent === 'buttons' && <ExampleButtons />}
        {selectedComponent === 'cards' && <ExampleCards />}
        {selectedComponent === 'typography' && <ExampleTypography />}
      </View>
    </View>
  )
}
```

And here's an example of how one of the example components could look:

```typescript:design-system/examples/ExampleAvatars.tsx
import { View } from 'react-native'
import { Avatar } from '../Avatar'

export function ExampleAvatars() {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Avatar size="small" source={{ uri: 'https://i.pravatar.cc/150?img=1' }} />
        <Avatar size="medium" source={{ uri: 'https://i.pravatar.cc/150?img=2' }} />
        <Avatar size="large" source={{ uri: 'https://i.pravatar.cc/150?img=3' }} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Avatar size="small" initials="JD" />
        <Avatar size="medium" initials="AB" />
        <Avatar size="large" initials="YZ" />
      </View>
    </View>
  )
}
```

This structure provides:

1. A main `Examples` component that manages which example is currently being shown
2. Individual example components for each design system element
3. Buttons that toggle between different examples
4. A clean layout with proper spacing and organization

You would need to create similar example components for buttons, cards, and typography following the same pattern. Each example component should showcase different variations and use cases of that particular design system element.

The buttons at the top will highlight which section is currently selected (using the variant prop), and the content below will update accordingly. You can add more design system elements by:

1. Adding a new value to the `IDesignSystemComponent` type
2. Creating a new example component
3. Adding a new button and conditional render in the main `Examples` component

---



---


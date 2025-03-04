import { memo } from "react"
import { ViewStyle } from "react-native"
import { useAppTheme } from "@/theme/use-app-theme"
import { Center } from "../Center"
import { IconButton } from "../IconButton/IconButton"
import { Text } from "../Text/Text"
import { VStack } from "../VStack"
import { TextField } from "./TextField"
import { TextFieldSimple } from "./TextFieldSimple"

export const TextFieldExample = memo(function TextFieldExample() {
  const { theme } = useAppTheme()

  return (
    <VStack
      // {...debugBorder()}
      style={{
        rowGap: theme.spacing.xl,
      }}
    >
      <TextField
        label="Enter your phone number"
        helper="Numbers only"
        status="error"
        RightAccessory={({ style }) => {
          return (
            <Center style={style as ViewStyle}>
              <IconButton variant="ghost" iconName="phone" />
            </Center>
          )
        }}
      />
      <TextField
        label="Email address"
        placeholder="example@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        LeftAccessory={({ style }) => (
          <Center style={style as ViewStyle}>
            <IconButton variant="ghost" iconName="link" />
          </Center>
        )}
      />
      <TextField
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        helper="Must be at least 8 characters long"
        RightAccessory={({ style }) => (
          <Center style={style as ViewStyle}>
            <IconButton variant="ghost" iconName="eyes" />
          </Center>
        )}
      />
      <TextField label="Bio" placeholder="Tell us about yourself" multiline numberOfLines={4} />
      <TextField
        label="Disabled example"
        placeholder="Hello there"
        status="disabled"
        RightAccessory={({ style }) => {
          return (
            <Center style={style as ViewStyle}>
              <IconButton disabled variant="ghost" iconName="xmark" />
            </Center>
          )
        }}
      />
      <TextFieldSimple placeholder="Enter your phone number" />
      <TextFieldSimple value="This is a test" size="lg" placeholder="Enter your phone number" />
      <TextFieldSimple
        placeholder="Search..."
        LeftAccessory={({ style }) => (
          <Center style={style as ViewStyle}>
            <IconButton variant="ghost" iconName="magnifyingglass" />
          </Center>
        )}
      />
      <TextFieldSimple
        placeholder="Enter amount"
        keyboardType="numeric"
        RightAccessory={({ style }) => (
          <Center style={style as ViewStyle}>
            <Text>USD</Text>
          </Center>
        )}
      />
      <TextFieldSimple value="Read-only field" editable={false} selectTextOnFocus={false} />
    </VStack>
  )
})

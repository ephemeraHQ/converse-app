## SpecStory

## The conversation revolves around refactoring a React Native component to improve its structure and maintainability. The focus is on moving certain state management and logic from a parent component to a child component, specifically regarding the handling of the OTP input and its visibility. 

The key points discussed include:

1. **State Management**: The `showOtpTick` state, which controls the visibility of a tick mark in the OTP input, should be managed within the `PhoneVerificationComponent` instead of being passed down as a prop from the parent component.

2. **Effect Hooks**: The use of `useEffect` for managing keyboard events (showing and hiding the tick mark) should also be encapsulated within the child component to keep related logic together.

3. **Code Modularity**: By moving the state and logic to the child component, the code becomes more modular, making it easier to read, maintain, and test.

Overall, the conversation emphasizes best practices in React component design, particularly in terms of state management and component communication. 

A suitable name for this conversation could be:

"Refactoring OTP Input Component for Better State Management" (9/27/2024, 6:11:12 PM)

_**User**_

there are still some props you pass that shouldnt be at parent but should but initizliae at the children level example the showTick

---

_**Assistant**_

You're right, and I apologize for missing that detail. Let's refactor the code to move the `showOtpTick` state and related logic into the `PhoneVerificationComponent`. Here's an updated version of the relevant parts of the code:

```typescript:screens/Onboarding/PrivyConnectScreen.tsx
export function PrivyConnectScreen() {
  // ... (other code remains the same)

  const [status, setStatus] = useState<"enter-phone" | "verify-phone">("enter-phone");
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [formattedPhone, setFormattedPhone] = useState("");
  const [beautifulPhone, setBeautifulPhone] = useState("");

  // ... (other code remains the same)

  // Remove showOtpTick state and related useEffect

  return (
    <Screen
      preset="scroll"
      // ... (other props remain the same)
    >
      <PictoTitleSubtitle.Container
        // ... (content remains the same)
      />

      {status === "enter-phone" ? (
        <PhoneEntryComponent setFormattedPhone={setFormattedPhone} />
      ) : (
        <PhoneVerificationComponent
          beautifulPhone={beautifulPhone}
          retrySeconds={retrySeconds}
          submitCode={submitCode}
          sendPhone={sendPhone}
        />
      )}
    </Screen>
  );
}

// ... (PhoneEntryComponent remains the same)

const PhoneVerificationComponent = ({
  beautifulPhone,
  retrySeconds,
  submitCode,
  sendPhone,
}) => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const otpInputRef = useRef<OtpInputRef>();
  const [showOtpTick, setShowOtpTick] = useState(true);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      "keyboardWillShow",
      () => setShowOtpTick(true)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      () => setShowOtpTick(false)
    );
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setShowOtpTick(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setShowOtpTick(false)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <>
      <Text style={styles.text}>
        {translate("privyConnect.otpInput.enterCode")}
      </Text>
      <Text style={[styles.text, { fontWeight: "600" }]}>{beautifulPhone}</Text>
      <OtpInput
        numberOfDigits={6}
        onFilled={(text) => {
          if (text.length === 6) {
            submitCode(text);
          }
        }}
        ref={(r) => {
          if (r) {
            otpInputRef.current = r;
          }
        }}
        hideStick={!showOtpTick}
        focusColor={textSecondaryColor(colorScheme)}
        theme={{
          containerStyle: styles.otp,
          focusStickStyle: styles.otpFocus,
          pinCodeContainerStyle: styles.otpInput,
          pinCodeTextStyle: styles.otpText,
        }}
      />
      <Button
        style={{ marginTop: 16 }}
        textStyle={{
          fontSize: 15,
          color:
            retrySeconds > 0
              ? textSecondaryColor(colorScheme)
              : primaryColor(colorScheme),
        }}
        variant="text"
        title={
          retrySeconds > 0
            ? translate("privyConnect.resendCodeIn", {
                seconds: retrySeconds,
              })
            : translate("privyConnect.buttons.resendCode")
        }
        onPress={() => {
          if (retrySeconds > 0) return;
          sendPhone();
        }}
      />
    </>
  );
};
```

In this refactored version:

1. We've moved the `showOtpTick` state and its related `useEffect` hook into the `PhoneVerificationComponent`.
2. We've removed the `showOtpTick` and `otpInputRef` props from the `PhoneVerificationComponent` in the `PrivyConnectScreen` component.
3. The `otpInputRef` is now created and managed within the `PhoneVerificationComponent`.

This change improves the component structure by keeping the `showOtpTick` state and its related logic closer to where it's actually used. It also reduces the props passed down from the parent component, making the code more modular and easier to maintain.

---



---


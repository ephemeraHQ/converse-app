## SpecStory

## Ensuring Prop Validation in BottomSheetModal Component (10/17/2024, 8:56:00 PM)

_**User**_

I have acustom bottomsheethanldebar that can be absolute, but when my teammates will use this bottomsheetmodal component, how can i make sure that if they use the bottomSheetHeader, they have to pass isAboluste to the handleBar

---

_**Assistant**_

To ensure that when your teammates use the `BottomSheetModal` component with `BottomSheetHeader`, they also pass the `isAbsolute` prop to the `BottomSheetHandleBar`, we can modify the `BottomSheetModal` component to handle this automatically. Here's how we can update the code:

```typescript:design-system/BottomSheet/BottomSheetModal.tsx
// ... existing imports ...

export type IBottomSheetModalProps = GorhomBottomSheetModalProps & {
  headerProps?: {
    title: string;
    hasClose?: boolean;
  };
};

export const BottomSheetModal = memo(
  forwardRef<GorhomBottomSheetModalMethods, IBottomSheetModalProps>(
    function BottomSheetModal({ headerProps, ...props }, ref) {
      const renderContainerComponent = useCallback((props: any) => {
        return <FullWindowOverlay {...props} />;
      }, []);

      const renderHandle = useCallback(
        (handleProps: GorhomBottomSheetHandleProps) => (
          <BottomSheetHandleBar {...handleProps} isAbsolute={!!headerProps} />
        ),
        [headerProps]
      );

      return (
        <GorhomBottomSheetModal
          ref={ref}
          containerComponent={
            Platform.OS === "ios" ? renderContainerComponent : undefined
          }
          backdropComponent={BottomSheetBackdropOpacity}
          handleComponent={renderHandle}
          {...props}
        >
          {headerProps && <BottomSheetHeader {...headerProps} />}
          {props.children}
        </GorhomBottomSheetModal>
      );
    }
  )
);

// ... rest of the file remains unchanged ...
```

Here's what we've changed:

1. We've extended the `IBottomSheetModalProps` type to include an optional `headerProps` property.

2. In the `BottomSheetModal` component, we've destructured `headerProps` from the props and passed the rest to the `GorhomBottomSheetModal`.

3. We've created a `renderHandle` callback that automatically sets `isAbsolute` to `true` if `headerProps` is provided.

4. We've replaced the `handleComponent` prop with our new `renderHandle` function.

5. Inside the `GorhomBottomSheetModal`, we now conditionally render the `BottomSheetHeader` if `headerProps` is provided, followed by the original `children`.

With these changes, your teammates can now use the `BottomSheetModal` like this:

```tsx
<BottomSheetModal
  headerProps={{
    title: "My Modal",
    hasClose: true,
  }}
  // ... other props ...
>
  {/* Modal content */}
</BottomSheetModal>
```

This approach ensures that the `isAbsolute` prop is automatically set on the `BottomSheetHandleBar` when a header is used, without requiring your teammates to manually set it each time.

---



---


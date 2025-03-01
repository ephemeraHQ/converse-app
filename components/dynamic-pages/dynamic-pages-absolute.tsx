// import {
//   Children,
//   memo,
//   useCallback,
//   useEffect,
//   useImperativeHandle,
//   useMemo,
// } from "react";
// import { LayoutChangeEvent, View } from "react-native";
// import {
//   interpolate,
//   useAnimatedReaction,
//   useAnimatedStyle,
//   useSharedValue,
//   withSpring,
// } from "react-native-reanimated";
// import { AnimatedVStack, VStack } from "@/design-system/VStack";
// import { $globalStyles } from "@/theme/styles";
// import {
//   DynamicPagesStoreProvider,
//   useDynamicPagesStore,
//   useDynamicPagesStoreContext,
// } from "./dynamic-pages.store-context";

// // Animation constants
// const ANIMATION_DAMPING = 18;
// const ANIMATION_STIFFNESS = 150;

// export type IDynamicPagesRef = {
//   nextPage: () => void;
//   previousPage: () => void;
//   reset: () => void;
// };

// export type IDynamicPagesProps = {
//   actionRef?: React.Ref<IDynamicPagesRef>;
//   pages: React.ReactNode[];
//   onPageChange?: (args: { pageIndex: number; pageHeight?: number }) => void;
// };

// export const DynamicPages = memo(function DynamicPages(
//   props: IDynamicPagesProps,
// ) {
//   const { onPageChange, ...rest } = props;

//   return (
//     <DynamicPagesStoreProvider onPageChange={onPageChange}>
//       <Main {...rest} />
//     </DynamicPagesStoreProvider>
//   );
// });

// const Main = memo(function Main(
//   props: Omit<IDynamicPagesProps, "onPageChange">,
// ) {
//   const { pages, actionRef } = props;

//   // Convert children to array for pagination
//   // const pages = useMemo(() => Children.toArray(children), [children]);

//   const store = useDynamicPagesStore();

//   useImperativeHandle(actionRef, () => ({
//     nextPage() {
//       store.getState().actions.goToNextPage();
//     },
//     previousPage() {
//       store.getState().actions.goToPreviousPage();
//     },
//     reset() {
//       store.getState().actions.reset();
//     },
//   }));

//   const currentPageIndexAV = useSharedValue(store.getState().currentPageIndex);

//   useEffect(() => {
//     store.subscribe((state) => {
//       currentPageIndexAV.value = state.currentPageIndex;
//     });
//   }, [store, currentPageIndexAV]);

//   console.log("rerender main");

//   return (
//     <AnimatedVStack style={$globalStyles.flex1}>
//       {pages.map((page, index) => (
//         <AbsoluteTab
//           key={index}
//           index={index}
//           activeIndexAV={currentPageIndexAV}
//         >
//           <PageWrapper index={index}>{page}</PageWrapper>
//         </AbsoluteTab>
//       ))}
//     </AnimatedVStack>
//   );
// });

// type IPageWrapperProps = {
//   children: React.ReactNode;
//   index: number;
// };

// const PageWrapper = memo(function PageWrapper(props: IPageWrapperProps) {
//   const { children, index } = props;

//   console.log("rerender page wrapper", index);

//   const store = useDynamicPagesStore();

//   const handleLayout = useCallback(
//     (event: LayoutChangeEvent) => {
//       const { height } = event.nativeEvent.layout;
//       console.log("page wrapper:", index, height);
//       store.getState().actions.updatePageHeight({
//         pageIndex: index,
//         height,
//       });
//     },
//     [index],
//   );

//   return <VStack onLayout={handleLayout}>{children}</VStack>;
// });

// type IAbsoluteTabProps = {
//   children: React.ReactNode;
//   index: number;
//   activeIndexAV: { value: number };
// };

// const AbsoluteTab = memo(function AbsoluteTab(props: IAbsoluteTabProps) {
//   const { index, activeIndexAV, children } = props;

//   const activeIndexProgressAV = useSharedValue(activeIndexAV.value);
//   const previousActiveIndexAV = useSharedValue(activeIndexAV.value);

//   console.log("rerender", index);

//   useAnimatedReaction(
//     () => activeIndexAV.value,
//     (activeIndex, prevActiveIndex) => {
//       if (prevActiveIndex !== null) {
//         previousActiveIndexAV.value = prevActiveIndex;
//       }
//       activeIndexProgressAV.value = withSpring(activeIndex, {
//         damping: ANIMATION_DAMPING,
//         stiffness: ANIMATION_STIFFNESS,
//       });
//     },
//     [],
//   );

//   const animatedStyle = useAnimatedStyle(() => {
//     const isActive = index === activeIndexAV.value;
//     const isPreviouslyActive = index === previousActiveIndexAV.value;

//     if (!isActive && !isPreviouslyActive) {
//       return {
//         opacity: 0,
//         zIndex: -1,
//       };
//     }

//     return {
//       opacity: interpolate(
//         activeIndexProgressAV.value,
//         [index - 1, index, index + 1],
//         [0, 1, 0],
//       ),
//       zIndex: interpolate(
//         activeIndexProgressAV.value,
//         [index - 1, index, index + 1],
//         [-1, 1, -1],
//       ),
//       transform: [
//         {
//           translateX: interpolate(
//             activeIndexProgressAV.value,
//             [index - 1, index, index + 1],
//             [20, 0, -20],
//           ),
//         },
//       ],
//     };
//   }, [index]);

//   return (
//     <AnimatedVStack
//       style={[
//         {
//           position: "absolute",
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           height: "100%",
//           width: "100%",
//         },
//         animatedStyle,
//       ]}
//     >
//       {children}
//     </AnimatedVStack>
//   );
// });

// // Commented out unused components
// //  const HandleComponent = memo(function HandleComponent(props: {
// //   currentPageIndex: number
// // }) {
// //   const { currentPageIndex } = props
// //   return (
// //     <Box>
// //       <ActionsBar currentPageIndex={currentPageIndex} />
// //       <BottomSheetCustomHandleBar />
// //     </Box>
// //   )
// // })

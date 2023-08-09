import * as React from "react";

import {
  StyleSheet,
  View,
  FlatList,
  useWindowDimensions,
  Animated,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import type { EmojisByCategory } from "../types";
import { EmojiCategory } from "./EmojiCategory";
import { KeyboardContext } from "../contexts/KeyboardContext";
import { Categories } from "./Categories";
import { SearchBar } from "./SearchBar";
import { useKeyboardStore } from "../store/useKeyboardStore";
import { ConditionalContainer } from "./ConditionalContainer";
import { SkinTones } from "./SkinTones";

export let keyboardScrollOffsetY = 0;
const setKeyboardScrollOffsetY = (offset: number) => {
  keyboardScrollOffsetY = offset;
};

export const EmojiStaticKeyboard = React.memo(
  () => {
    const { width } = useWindowDimensions();
    const {
      activeCategoryIndex,
      setActiveCategoryIndex,
      onCategoryChangeFailed,
      enableCategoryChangeGesture,
      categoryPosition,
      enableSearchBar,
      searchPhrase,
      renderList,
      disableSafeArea,
      theme,
      styles: themeStyles,
      shouldAnimateScroll,
      enableCategoryChangeAnimation,
    } = React.useContext(KeyboardContext);
    const { keyboardState } = useKeyboardStore();
    const flatListRef = React.useRef<FlatList<any>>(null);

    const getItemLayout = React.useCallback(
      (_: ArrayLike<EmojisByCategory> | null | undefined, index: number) => ({
        length: width,
        offset: width * index,
        index,
      }),
      [width]
    );

    const renderItem = React.useCallback(
      ({ item }: { item: EmojisByCategory }) => (
        <EmojiCategory
          item={item}
          setKeyboardScrollOffsetY={setKeyboardScrollOffsetY}
        />
      ),
      []
    );

    React.useEffect(() => {
      flatListRef.current?.scrollToIndex({
        index: activeCategoryIndex,
        animated: shouldAnimateScroll && enableCategoryChangeAnimation,
      });
      setKeyboardScrollOffsetY(0);
    }, [
      activeCategoryIndex,
      enableCategoryChangeAnimation,
      shouldAnimateScroll,
    ]);

    const keyExtractor = React.useCallback(
      (item: EmojisByCategory) => item.title,
      []
    );

    const onScrollEnd = React.useCallback(
      (el: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = el.nativeEvent.contentOffset.x / width;
        setActiveCategoryIndex(Math.round(index));
      },
      [setActiveCategoryIndex, width]
    );
    const scrollNav = React.useRef(new Animated.Value(0)).current;

    // const handleScroll = React.useCallback(
    //   (el: NativeSyntheticEvent<NativeScrollEvent>) => {
    //     const index = el.nativeEvent.contentOffset.x / width;
    //     scrollNav.setValue(index * CATEGORY_ELEMENT_WIDTH);
    //   },
    //   [scrollNav, width]
    // );

    return (
      <View
        style={[
          styles.container,
          styles.containerShadow,
          categoryPosition === "top" &&
            disableSafeArea &&
            styles.containerReverse,
          themeStyles.container,
          { backgroundColor: theme.container },
        ]}
      >
        <ConditionalContainer
          condition={!disableSafeArea}
          container={(children) => (
            <SafeAreaView
              style={[
                styles.flex,
                categoryPosition === "top" && styles.containerReverse,
              ]}
            >
              {children}
            </SafeAreaView>
          )}
        >
          <>
            {enableSearchBar && <SearchBar />}
            <View style={{ flex: 1 }}>
              <FlatList
                extraData={[keyboardState.recentlyUsed.length, searchPhrase]}
                data={renderList}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                // removeClippedSubviews={isAndroid}
                ref={flatListRef}
                onScrollToIndexFailed={onCategoryChangeFailed}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                // estimatedItemSize={Dimensions.get("window").width}
                scrollEventThrottle={16}
                getItemLayout={getItemLayout}
                scrollEnabled={enableCategoryChangeGesture}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={2}
                // onScroll={handleScroll}
                keyboardShouldPersistTaps="handled"
                onMomentumScrollEnd={onScrollEnd}
              />
            </View>

            <Categories
              scrollNav={enableCategoryChangeGesture ? scrollNav : undefined}
            />
            <SkinTones />
          </>
        </ConditionalContainer>
      </View>
    );
  },
  () => true
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    borderRadius: 16,
  },
  containerReverse: { flexDirection: "column-reverse" },
  containerShadow: {
    shadowColor: "black",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    elevation: 10,
  },
});

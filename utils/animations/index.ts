import { FlashList } from "@shopify/flash-list";
import { FlatList, TouchableOpacity, View } from "react-native";
import Reanimated from "react-native-reanimated";

export const ReanimatedView = Reanimated.createAnimatedComponent(View);
export const ReanimatedFlatList = Reanimated.createAnimatedComponent(
  FlatList
) as typeof FlatList;
export const ReanimatedFlashList = Reanimated.createAnimatedComponent(
  FlashList
) as typeof FlashList;
export const ReanimatedTouchableOpacity =
  Reanimated.createAnimatedComponent(TouchableOpacity);

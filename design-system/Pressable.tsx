import { memo } from "react";
import {
  Pressable as RNPressable,
  PressableProps as RNPressableProps,
} from "react-native";

type IPressableProps = RNPressableProps;

export const Pressable = memo(function Pressable(props: IPressableProps) {
  return <RNPressable {...props} />;
});

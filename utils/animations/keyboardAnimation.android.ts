import { useSharedValue } from "react-native-reanimated";

export const useKeyboardAnimation = () => {
  const progress = useSharedValue(0);
  const height = useSharedValue(0);
  return { height, progress };
};

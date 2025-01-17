import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export const useScreenFocusEffectOnce = (
  callback: () => void | Promise<void>
) => {
  useFocusEffect(
    useCallback(() => {
      callback();
      // It's okay because we only want to run the callback once
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );
};

import {
  NavigationAction,
  NavigationProp,
  StackActions,
  useNavigation,
} from "@react-navigation/native";
import { useEffect, useMemo } from "react";

import { NavigationParamList } from "../screens/Navigation/Navigation";

// Wrapper around useNavigation to add some useful hooks.
// Also, expo-router syntax is useRouter so if we want to migrate towards that later it's useful to call it useRouter now.
export function useRouter(args?: {
  onTransitionEnd?: (isClosing: boolean) => void;
  onBeforeRemove?: (e: { data: { action: NavigationAction } }) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}) {
  const { onTransitionEnd, onFocus, onBeforeRemove, onBlur } = args || {};

  const navigation = useNavigation<NavigationProp<NavigationParamList>>();

  useEffect(() => {
    const unsubscribe = navigation.addListener(
      // @ts-ignore https://reactnavigation.org/docs/native-stack-navigator/#transitionend
      "transitionEnd",
      (e: {
        data: {
          closing: boolean;
        };
        target: string; // "ProfileName-anvy_wQr9ft7HDG66f0k1"
      }) => {
        if (onTransitionEnd) {
          onTransitionEnd(e.data.closing);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [onTransitionEnd, navigation]);

  useEffect(() => {
    const focusListener = navigation.addListener("focus", () => {
      if (onFocus) {
        onFocus();
      }
    });

    return () => {
      focusListener();
    };
  }, [onFocus, navigation]);

  useEffect(() => {
    const blurListener = navigation.addListener("blur", () => {
      if (onBlur) {
        onBlur();
      }
    });

    return () => {
      blurListener();
    };
  }, [onBlur, navigation]);

  useEffect(() => {
    const beforeRemoveListener = navigation.addListener("beforeRemove", (e) => {
      if (onBeforeRemove) {
        onBeforeRemove(e);
      }
    });

    return () => {
      beforeRemoveListener();
    };
  }, [onBeforeRemove, navigation]);

  return useMemo(
    () => {
      return {
        popToTop: () => navigation.dispatch(StackActions.popToTop()),
        ...navigation,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}

import {
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
  onBeforeRemove?: () => void;
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
      // @ts-ignore
      navigation.removeListener("transitionEnd");
    };
  }, [onTransitionEnd, navigation]);

  useEffect(() => {
    navigation.addListener("focus", () => {
      if (onFocus) {
        onFocus();
      }
    });

    return () => {
      navigation.removeListener("focus", () => {
        console.log("focus listener removed");
      });
    };
  }, [onFocus, navigation]);

  useEffect(() => {
    navigation.addListener("blur", () => {
      if (onBlur) {
        onBlur();
      }
    });

    return () => {
      navigation.removeListener("blur", () => {
        console.log("blur listener removed");
      });
    };
  }, [onBlur, navigation]);

  useEffect(() => {
    navigation.addListener("beforeRemove", (e) => {
      if (onBeforeRemove) {
        onBeforeRemove();
      }
    });
    return () => {
      navigation.removeListener("beforeRemove", () => {
        console.log("beforeRemove listener removed");
      });
    };
  }, [onBeforeRemove, navigation]);

  return useMemo(() => {
    return {
      push: navigation.navigate, // To make sure if we decide to migrate to expo-router it's easier
      popToTop: () => navigation.dispatch(StackActions.popToTop()),
      ...navigation,
    };
  }, [navigation]);
}

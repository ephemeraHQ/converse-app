import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

import { AuthStackParamList } from "./AuthNavigation";

export function useAuthNavigation() {
  return useRouter<AuthStackParamList>();
}

export function useRouter<T extends Record<string, any>>(args?: {
  onTransitionEnd?: (isClosing: boolean) => void;
  onBeforeRemove?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
}) {
  const { onTransitionEnd, onFocus, onBeforeRemove, onBlur } = args || {};

  const navigation = useNavigation<NavigationProp<T>>();

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

  return {
    setOptions: navigation.setOptions,
    push: navigation.navigate,
    goBack: navigation.goBack,
  };
}

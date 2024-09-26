import {
  DocumentTitleOptions,
  LinkingOptions,
  NavigationContainerProps,
  NavigationContainer as RNNavigationContainer,
  Theme,
} from "@react-navigation/native";
import React from "react";

import { useAppStore } from "../data/store/appStore";
import { converseNavigations } from "../utils/navigation";

// Copied from react-navigation because they didn't export the type
type INavigationContainerProps<ParamList extends object> =
  NavigationContainerProps & {
    theme?: Theme;
    linking?: LinkingOptions<ParamList>;
    fallback?: React.ReactNode;
    documentTitle?: DocumentTitleOptions;
    onReady?: () => void;
  };

export const NavigationContainer = <ParamList extends object>(
  props: INavigationContainerProps<ParamList>
) => {
  const { children, linking } = props;

  const splashScreenHidden = useAppStore((s) => s.splashScreenHidden);

  return (
    <RNNavigationContainer
      linking={splashScreenHidden ? linking : undefined}
      ref={(r) => {
        if (r) {
          converseNavigations["splitScreen"] = r;
        }
      }}
      onUnhandledAction={() => {
        // Since we're handling multiple navigators,
        // let's silence errors when the action
        // is not meant for this one
      }}
    >
      {children}
    </RNNavigationContainer>
  );
};

export default NavigationContainer;

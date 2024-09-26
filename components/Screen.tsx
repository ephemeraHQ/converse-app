import React from "react";
import { FlexStyle } from "react-native";
import { Edge, useSafeAreaInsets } from "react-native-safe-area-context";

import VStack, { IVStackProps } from "../design-system/VStack";

export type IScreenProps = {
  backgroundColor?: string;
  contentContainerStyle?: IVStackProps["style"];
  containerStyle?: IVStackProps["style"];
  safeAreaEdges?: ExtendedEdge[];
  children?: React.ReactNode;
};

export default function Screen(props: IScreenProps) {
  const {
    backgroundColor,
    containerStyle,
    contentContainerStyle,
    safeAreaEdges,
    children,
  } = props;

  const containerStyleInsets = useSafeAreaInsetsStyle(safeAreaEdges);

  return (
    <VStack
      // {...debugBorder()}
      style={[
        {
          flex: 1,
          width: "100%",
          height: "100%",
        },
        { backgroundColor },
        containerStyleInsets,
        containerStyle,
      ]}
    >
      <VStack
        style={[
          {
            justifyContent: "flex-start",
            alignItems: "stretch",
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </VStack>
    </VStack>
  );
}

export type ExtendedEdge = Edge | "start" | "end";

const propertySuffixMap = {
  top: "Top",
  bottom: "Bottom",
  left: "Start",
  right: "End",
  start: "Start",
  end: "End",
};

const edgeInsetMap = {
  start: "left",
  end: "right",
};

/**
 * A hook that can be used to create a safe-area-aware style object that can be passed directly to a View.
 *
 * - [Documentation and Examples](https://github.com/infinitered/ignite/blob/master/docs/Utils-useSafeAreaInsetsStyle.md)
 */
export function useSafeAreaInsetsStyle(
  safeAreaEdges: ExtendedEdge[] = [],
  property: "padding" | "margin" = "padding"
): Pick<
  FlexStyle,
  | "marginBottom"
  | "marginEnd"
  | "marginStart"
  | "marginTop"
  | "paddingBottom"
  | "paddingEnd"
  | "paddingStart"
  | "paddingTop"
> {
  const insets = useSafeAreaInsets();

  return safeAreaEdges.reduce((acc, e) => {
    return {
      ...acc,
      // @ts-ignore
      [`${property}${propertySuffixMap[e]}`]: insets[edgeInsetMap[e] ?? e],
    };
  }, {});
}

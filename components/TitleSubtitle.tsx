import { ITextProps, Text } from "@design-system/Text";
import { ITitleProps, Title } from "@design-system/Title";
import { IVStackProps, VStack } from "@design-system/VStack";
import { spacing } from "@theme/spacing";
import React, { memo } from "react";

export const TitleAndSubtitle = memo(function TitleAndSubtitle(props: {
  title: string | React.ReactNode;
  subtitle: string | React.ReactNode;
  titleProps?: ITitleProps;
  subtitleProps?: ITextProps;
  containerProps?: IVStackProps;
}) {
  const { title, subtitle, titleProps, subtitleProps, containerProps } = props;

  const { style: containerStyle } = containerProps ?? {};

  return (
    <VStack
      style={[
        {
          alignItems: "center",
        },
        containerStyle,
      ]}
      {...containerProps}
    >
      {typeof title === "string" ? (
        <Title
          {...titleProps}
          style={[
            { marginBottom: spacing.sm, textAlign: "center" },
            titleProps?.style,
          ]}
        >
          {title}
        </Title>
      ) : (
        title
      )}
      {typeof subtitle === "string" ? (
        <Text
          {...subtitleProps}
          style={[{ textAlign: "center" }, subtitleProps?.style]}
        >
          {subtitle}
        </Text>
      ) : (
        subtitle
      )}
    </VStack>
  );
});

export const TITLE_AND_SUBTITLE_SPACE_TOKEN = 2;

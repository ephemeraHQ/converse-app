import { ITextProps } from "@design-system/Text";
import { ITextStyleProps } from "@design-system/Text/Text.props";
import { ParseShape } from "react-native-parsed-text";

export interface IParsedTextProps extends ITextProps {
  parse: ParseShape[];
  pressableStyle?: ITextStyleProps;
}

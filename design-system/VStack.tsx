import { View, ViewProps } from "react-native";

export type IVStackProps = ViewProps;

export default function VStack(props: IVStackProps) {
  return <View {...props} />;
}

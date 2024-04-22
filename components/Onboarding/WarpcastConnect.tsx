import { StyleSheet, useColorScheme, View } from "react-native";

import OnboardingComponent from "./OnboardingComponent";

export default function WarpcastConnect() {
  const styles = useStyles();
  return (
    <OnboardingComponent
      title="Warpcast connect"
      picto="message.circle.fill"
      subtitle="Warpcast connect"
    >
      <View />
    </OnboardingComponent>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({});
};

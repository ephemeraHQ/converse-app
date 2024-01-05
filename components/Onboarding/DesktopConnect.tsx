import { StyleSheet, Text } from "react-native";

import config from "../../config";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import Button from "../Button/Button";
import OnboardingComponent from "./OnboardingComponent";

export default function DesktopConnect() {
  const styles = useStyles();
  const setConnectionMethod = useOnboardingStore((s) => s.setConnectionMethod);
  return (
    <OnboardingComponent
      title="Desktop Connect"
      picto="lock.open.laptopcomputer"
      subtitle={
        <Text>
          Go to{" "}
          <Text style={{ fontWeight: "700" }}>
            {config.websiteDomain}/connect
          </Text>{" "}
          and follow instructions.
        </Text>
      }
    >
      <Button
        title="Back to home screen"
        style={[styles.logout, { marginTop: "auto" }]}
        variant="text"
        textStyle={{ fontWeight: "600" }}
        onPress={() => {
          setConnectionMethod(undefined);
        }}
      />
    </OnboardingComponent>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    logout: {
      marginBottom: 54,
    },
  });
};

import { AppStateStatus } from "react-native";

const blurredStateRegex = /inactive|background/;

export const appStateIsBlurredState = (appState: AppStateStatus) =>
  appState.match(blurredStateRegex);

import "./wdyr";
import "./polyfills";

import { registerRootComponent } from "expo";

// import { AppWithProviders } from "./App";
import { SlimApp } from "./SlimApp";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(SlimApp);

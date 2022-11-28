import { AppProvider } from "./store/context";
import Home from "./screens/Home";
import FlyerChatScreen from "./screens/FlyerChatView";

export default function App() {
  return (
    <AppProvider>
      {/* <Home /> */}
      <FlyerChatScreen />
    </AppProvider>
  );
}

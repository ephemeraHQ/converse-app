import { AppProvider } from "./store/context";
import Home from "./screens/Home";

export default function App() {
  return (
    <AppProvider>
      <Home />
    </AppProvider>
  );
}

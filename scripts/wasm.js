// In react native for web to execute wasm packages we need to
// have them accessible. Easiest way is just to copy them to public folder
const fs = require("fs");
const path = require("path");

// eslint-disable-next-line no-undef
const PROJECT_ROOT = path.join(__dirname, "..");
const WASM_FOLDER = path.join(PROJECT_ROOT, "public", "wasm");


fs.copyFileSync(
  path.join(PROJECT_ROOT, "node_modules/@xmtp/user-preferences-bindings-wasm/dist/web/user_preferences_bindings_wasm_bg.wasm"),
  path.join(WASM_FOLDER, "user_preferences_bindings_wasm_bg.wasm")
);

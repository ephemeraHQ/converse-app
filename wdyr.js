import React from "react";

if (
  process.env.NODE_ENV === "development" &&
  process.env.EXPO_PUBLIC_WDYR === "true"
) {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}

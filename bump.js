const fs = require("fs");

const data = JSON.parse(fs.readFileSync("./app.json").toString());
data.expo.ios.buildNumber = (
  parseInt(data.expo.ios.buildNumber, 10) + 1
).toString();

fs.writeFileSync("./app.json", JSON.stringify(data, null, 2));

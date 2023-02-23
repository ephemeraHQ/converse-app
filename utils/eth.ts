import { ethers } from "ethers";

import config from "../config";

export const ethProvider = new ethers.providers.InfuraProvider(
  config.ethereumNetwork,
  config.infuraApiKey
);

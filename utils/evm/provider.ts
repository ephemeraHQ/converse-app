import { ethers } from "ethers";

import config from "../../config";

const provider = new ethers.providers.StaticJsonRpcProvider(
  config.evm.rpcEndpoint
);

export default provider;

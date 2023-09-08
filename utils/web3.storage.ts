import type { Web3Storage as Web3StorageType } from "web3.storage";

import config from "../config";

const { Web3Storage } = require("web3.storage/dist/bundle.esm.min.js");

export default new Web3Storage({
  token: config.web3StorageToken,
}) as Web3StorageType;

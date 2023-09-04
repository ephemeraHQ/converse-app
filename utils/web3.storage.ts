import { Web3Storage } from "web3.storage";

import config from "../config";

export default new Web3Storage({
  token: config.web3StorageToken,
});

import { pbkdf2 } from "crypto";
import { ethers } from "ethers";
import { entropyToMnemonic, mnemonicToEntropy } from "ethers/lib/utils";

export const validateMnemonic = (mnemonic: string) =>
  entropyToMnemonic(mnemonicToEntropy(mnemonic));

export const getPrivateKeyFromMnemonic = (mnemonic: string): Promise<string> =>
  new Promise((resolve, reject) => {
    pbkdf2(mnemonic, "mnemonic", 2048, 64, "sha512", (error, key) => {
      if (error) return reject(error);
      const hdnode = ethers.utils.HDNode.fromSeed(key);
      const path = "m/44'/60'/0'/0/0";
      const childNode = hdnode.derivePath(path);
      const privateKey = childNode.privateKey;
      resolve(privateKey);
    });
  });

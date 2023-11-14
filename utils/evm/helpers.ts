import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { ethers } from "ethers";
import "@ethersproject/shims";
import { useState } from "react";

import config from "../../config";
import {
  useAccountsStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { pick } from "../objects";

export const usePrivySigner = (onboarding: boolean = false) => {
  const currentAccount = useCurrentAccount();
  const { privyAccountId } = useAccountsStore((s) =>
    pick(s, ["privyAccountId"])
  );
  const { isReady: privyReady, user: privyUser } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const [hasSwitchedNetwork, setHasSwitchedNetwork] = useState(false);
  if (!onboarding && (!currentAccount || !privyAccountId[currentAccount])) {
    // Except during onboarding, we need to be
    // logged in a privy account to access a privy signer
    return undefined;
  }
  if (privyReady && privyUser && embeddedWallet.status === "connected") {
    const provider = embeddedWallet.provider;
    if (!hasSwitchedNetwork) {
      provider
        .request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: config.transactionChainId }],
        })
        .then(() => {
          setHasSwitchedNetwork(true);
        })
        .catch(console.error);
    } else {
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const ethersSigner = ethersProvider.getSigner();
      return ethersSigner;
    }
  }
  return undefined;
};

export default {
  toWei: (value: string, units: ethers.BigNumberish) =>
    ethers.utils.parseUnits(value, units),
  // This converts a string representation from a value to a number of units, based on the number of decimals passed in
  toDecimal: (value: string, decimals: number) =>
    ethers.utils.parseUnits(value, decimals),
  hexlify: ethers.utils.hexlify,
  hexStripZeros: ethers.utils.hexStripZeros,
  bigNumberify: ethers.BigNumber.from,
  hexToNumberString: (num: number) =>
    ethers.utils
      .formatUnits(ethers.BigNumber.from(num), "wei")
      .replace(".0", ""),
  toChecksumAddress: ethers.utils.getAddress,
  fromWei: (num: ethers.BigNumber, units: ethers.BigNumberish) => {
    return ethers.utils
      .formatUnits(ethers.BigNumber.from(num), units)
      .replace(/\.0$/, "");
  },
  // This converts a string representation from a unit value to a higher base
  fromDecimal: (num: string, decimals: number) => {
    return ethers.utils
      .formatUnits(ethers.BigNumber.from(num), decimals)
      .replace(/\.0$/, "");
  },
  isInfiniteKeys: (value: string) => {
    return ethers.BigNumber.from(value).eq(ethers.constants.MaxUint256);
  },
  isInfiniteDuration: (value: string) => {
    return ethers.BigNumber.from(value).eq(ethers.constants.MaxUint256);
  },
  toNumber: (value: string) => {
    return ethers.BigNumber.from(value).toNumber();
  },
  toRpcResultNumber: (value: number) => {
    const num = ethers.utils.hexlify(ethers.BigNumber.from(value));
    return ethers.utils.hexZeroPad(num, 32);
  },
  toRpcResultString: (str: string) => {
    return str;
  },
  utf8ToHex: (str: string) =>
    ethers.utils.hexlify(str.length ? ethers.utils.toUtf8Bytes(str) : 0),
  sha3: ethers.utils.keccak256,
  verifyMessage: ethers.utils.verifyMessage,

  currencyAmountToBigNumber: (amount: CurrencyAmount<any>) => {
    const { decimals } = amount.currency;
    const fixed = ethers.FixedNumber.from(amount.toExact());
    const tokenScale = ethers.FixedNumber.from(
      ethers.BigNumber.from(10).pow(decimals)
    );
    return ethers.BigNumber.from(
      // have to remove trailing .0 "manually" :/
      fixed.mulUnsafe(tokenScale).floor().toString().split(".")[0]
    );
  },

  randomHex: (length: number) => {
    const randomBytes = ethers.utils.randomBytes(length);
    const randomHex = ethers.utils.hexlify(randomBytes);
    return randomHex;
  },
};

import "@ethersproject/shims";
import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { Signer, ethers } from "ethers";
import { useState } from "react";

import config from "../../config";
import {
  useAccountsStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { pick } from "../objects";
import erc3009Abi from "./abis/erc3009.json";

export const transferETH = async (
  signer: Signer,
  amountInEther: string,
  recipientAddress: string
) => {
  const tx: ethers.providers.TransactionRequest = {
    to: recipientAddress,
    // Convert currency unit from ether to wei
    value: ethers.utils.parseEther(amountInEther),
    gasLimit: 100000,
  };
  const txObj = await signer.sendTransaction(tx);
  console.log("txHash", txObj.hash);
};

export const getETHBalance = async (signer: Signer) => {
  const balance = await signer.getBalance();
  return ethers.utils.formatEther(balance);
};

export const getUSDCBalance = async (signer: Signer) => {
  const contract = new ethers.Contract(
    config.USDCAddress,
    erc3009Abi,
    signer.provider
  );
  const [balance, decimals] = await Promise.all([
    contract.balanceOf(await signer.getAddress()),
    contract.decimals(),
  ]);
  return ethers.utils.formatUnits(balance, decimals);
};

const getRandomHex = (length: number) => {
  const randomBytes = ethers.utils.randomBytes(length);
  const randomHex = ethers.utils.hexlify(randomBytes);
  return randomHex;
};

export const getUSDCTransferAuthorization = async (
  signer: Signer,
  amountInUSDC: string,
  recipientAddress: string
) => {
  const contract = new ethers.Contract(
    config.USDCAddress,
    erc3009Abi,
    signer.provider
  );
  const [name, version, decimals] = await Promise.all([
    contract.name(),
    contract.version(),
    contract.decimals(),
  ]);

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };
  const domain = {
    name,
    version,
    chainId: Number(config.transactionChainId),
    verifyingContract: config.USDCAddress,
  };
  const dataToSign = {
    from: await signer.getAddress(),
    to: recipientAddress,
    value: ethers.utils.parseUnits(amountInUSDC, decimals),
    validAfter: 0,
    validBefore: Math.floor(Date.now() / 1000) + 3600, // Valid for an hour
    nonce: getRandomHex(32),
  };

  const signature = await (signer as any)._signTypedData(
    domain,
    types,
    dataToSign
  );
  const v = "0x" + signature.slice(130, 132);
  const r = signature.slice(0, 66);
  const s = "0x" + signature.slice(66, 130);
  console.log({ ...dataToSign, v, r, s, value: dataToSign.value.toString() });
};

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

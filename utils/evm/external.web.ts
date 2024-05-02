import {
  useWeb3Modal,
  useWeb3ModalProvider,
  useWeb3ModalState,
} from "@web3modal/ethers5/react";
import { ethers } from "ethers";
import { useCallback, useEffect, useRef } from "react";

export const useExternalProvider = () => {
  const { walletProvider } = useWeb3ModalProvider();

  const currentWalletProvider = useRef(walletProvider);
  useEffect(() => {
    currentWalletProvider.current = walletProvider;
  }, [walletProvider]);
  const { open: openWeb3Modal } = useWeb3Modal();
  const { open: isWeb3ModalOpen } = useWeb3ModalState();
  const currentWeb3ModalOpen = useRef(isWeb3ModalOpen);
  useEffect(() => {
    currentWeb3ModalOpen.current = isWeb3ModalOpen;
  }, [isWeb3ModalOpen]);

  const getExternalProvider = useCallback(async () => {
    if (currentWalletProvider.current) {
      return new ethers.providers.Web3Provider(currentWalletProvider.current);
    }
    await openWeb3Modal();
    while (!currentWeb3ModalOpen.current) {
      await new Promise((r) => setTimeout(r, 50));
    }
    // Modal is opened, let's wait until it's closed
    while (currentWeb3ModalOpen.current) {
      await new Promise((r) => setTimeout(r, 150));
    }
    // Modal is closed, let's check the provider
    let i = 0;
    while (!currentWalletProvider.current && i < 4) {
      await new Promise((r) => setTimeout(r, 50));
      i += 1;
    }
    if (currentWalletProvider.current) {
      return new ethers.providers.Web3Provider(currentWalletProvider.current);
    }
    return undefined;
  }, [openWeb3Modal]);
  return { getExternalProvider };
};

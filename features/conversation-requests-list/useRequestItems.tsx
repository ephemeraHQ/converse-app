import { useV3RequestItems } from "./useV3RequestItems";

export const useRequestItems = () => {
  const { likelyNotSpam, likelySpam, isRefetching, refetch } =
    useV3RequestItems();

  return {
    likelyNotSpam,
    likelySpam,
    isRefetching,
    refetch,
  };
};

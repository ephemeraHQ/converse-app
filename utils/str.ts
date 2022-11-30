export const shortAddress = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(
    address.length - 4,
    address.length
  )}`;

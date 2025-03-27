export const shortAddress = (address: string) =>
  address && address.length > 7
    ? `${address.slice(0, 6)}...${address.slice(address.length - 4, address.length)}`
    : address || ""

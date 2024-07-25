export const getFirstLetterForAvatar = (name: string) => {
  return name.startsWith("0x")
    ? name.slice(0, 2)
    : name.charAt(0).toUpperCase();
};

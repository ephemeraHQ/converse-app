export function formatRandomUserName(args: { displayName?: string }) {
  const { displayName = "" } = args;

  // Remove all whitespace characters and convert to lowercase
  const cleanDisplayName = displayName.replace(/\s+/g, "").toLowerCase();

  // Generate 4 random digits
  const randomNumbers = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  // Combine name and numbers, ensuring total length doesn't exceed reasonable length
  return `${cleanDisplayName}${randomNumbers}`.slice(0, 20);
}

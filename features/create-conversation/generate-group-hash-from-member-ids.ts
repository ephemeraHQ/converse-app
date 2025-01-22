/**
 * Produce a 16-hex-digit hash (64-bit) from an array of member IDs,
 * regardless of how many members there are. The result is a stable,
 * constant-length string for a given input order-insensitively.
 *
 * Note: this algorithm is arbitrarily chosen to be stable and deterministic.
 * Any implementation that produces a stable, constant-length string for a
 * given input order-insensitively is acceptable.
 *
 * 1) We sort and lowercase the members to normalize.
 * 2) Convert them into a JSON string (so the order is stable).
 * 3) Perform two passes of a FNV-1a–style hashing:
 *    - Forward pass
 *    - Reverse pass
 * 4) Combine both 32-bit results into a single 64-bit hex string.
 *
 * WARNING: This is NOT cryptographically secure. Just a stable "fingerprint."
 *
 * @throws {Error} If members array is empty
 */
export function generateGroupHashFromMemberIds(
  members: string[]
): string | undefined {
  if (!members.length) {
    return undefined;
  }

  // 1) Sort members (case-insensitive) and deduplicate
  const sorted = [...new Set(members)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
  // 2) Lowercase them
  const lowercased = sorted.map((m) => m.toLowerCase());
  // 3) Convert to a JSON string
  const input = JSON.stringify(lowercased);

  // ----------------------------
  // FNV-1a–style "forward" pass
  // ----------------------------
  let hash1 = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash1 ^= input.charCodeAt(i);
    // 16777619 is the FNV magic prime
    hash1 = Math.imul(hash1, 16777619);
  }

  // ------------------------------------
  // FNV-1a–style "reverse" pass (optional)
  // ------------------------------------
  let hash2 = 2166136261 >>> 0;
  for (let i = input.length - 1; i >= 0; i--) {
    hash2 ^= input.charCodeAt(i);
    hash2 = Math.imul(hash2, 16777619);
  }

  // Combine both 32-bit results into one 64-bit hex string (16 hex chars).
  const part1 = (hash1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (hash2 >>> 0).toString(16).padStart(8, "0");

  return part1 + part2;
}

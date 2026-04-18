/**
 * Non-cryptographic hash utilities for cache keys and fingerprints.
 * FNV-1a 32-bit — fast, zero-dependency, collision-resistant enough for
 * the handful of cache keys this extension maintains.
 */

export function fnv1a32(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * 64-bit-ish key (two independent 32-bit hashes concatenated) for cases
 * where a single 32-bit space risks collisions across a large keyspace.
 */
export function fnv1a64(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b1;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x85ebca6b);
  }
  return (
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0")
  );
}

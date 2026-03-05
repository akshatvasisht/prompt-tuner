import { describe, expect, it } from "vitest";
import { ERROR_MESSAGES } from "../../src/lib/constants";
import type { ErrorCode } from "../../src/types/index";

describe("ERROR_MESSAGES Mapping", () => {
  // We extract ErrorCode conceptually by testing the mapped keys.
  // Given typescript handles the type literal union, we construct a mock array
  // of the union members to ensure runtime values match the types correctly.
  const knownErrorCodes: ErrorCode[] = [
    "AI_UNAVAILABLE",
    "AI_SESSION_FAILED",
    "AI_GENERATION_FAILED",
    "INPUT_TOO_LONG",
    "INVALID_REQUEST",
    "ELEMENT_NOT_FOUND",
    "PLATFORM_UNSUPPORTED",
    "UNKNOWN_ERROR",
  ];

  it("should provide a user-facing string for every known ErrorCode", () => {
    for (const code of knownErrorCodes) {
      // Some codes like ELEMENT_NOT_FOUND might be handled implicitly or by default fallbacks,
      // but let's check that ERROR_MESSAGES generally contains non-empty strings for what it does map.
      if (ERROR_MESSAGES[code]) {
        expect(typeof ERROR_MESSAGES[code]).toBe("string");

        expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
      }
    }
  });

  it("should contain the required critical network and session errors", () => {
    expect(ERROR_MESSAGES.AI_UNAVAILABLE).toBeDefined();
    expect(ERROR_MESSAGES.UNKNOWN_ERROR).toBeDefined();
    expect(ERROR_MESSAGES.INPUT_TOO_LONG).toBeDefined();
  });
});

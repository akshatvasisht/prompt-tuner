import { describe, expect, it } from "vitest";
import { ACTIONS } from "../../src/lib/actions";

describe("ACTIONS Registry", () => {
  it("should have exactly 6 actions", () => {
    expect(ACTIONS.length).toBe(6);
  });

  it("should have exactly 1 primary action", () => {
    const primaryActions = ACTIONS.filter((a) => a.type === "primary");
    expect(primaryActions.length).toBe(1);
    expect(primaryActions[0].id).toBe("optimize");
  });

  it("should have exactly 5 secondary actions", () => {
    const secondaryActions = ACTIONS.filter((a) => a.type === "secondary");
    expect(secondaryActions.length).toBe(5);
  });

  it("should have no duplicate IDs", () => {
    const ids = ACTIONS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid properties for all actions", () => {
    for (const action of ACTIONS) {
      expect(typeof action.id).toBe("string");
      expect(typeof action.label).toBe("string");
      expect(typeof action.description).toBe("string");
      expect(action.id.length).toBeGreaterThan(0);
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.description.length).toBeGreaterThan(0);
      expect(action.keywords).toBeInstanceOf(Array);
      expect(action.keywords.length).toBeGreaterThan(0);
    }
  });
});

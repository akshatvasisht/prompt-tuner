import { describe, it, expect, vi } from "vitest";

import {
  chunkByParagraphs,
  mapReduce,
  refineChain,
  recursiveDecompose,
} from "~lib/decompose";

// Synthetic tokenizer: 1 token per character - deterministic for testing.
const charTokenizer = (s: string): number => s.length;

describe("decompose.chunkByParagraphs", () => {
  it("returns empty array for empty input", async () => {
    const chunks = await chunkByParagraphs("", 100, charTokenizer);
    expect(chunks).toEqual([]);
  });

  it("returns input unchanged when it fits", async () => {
    const chunks = await chunkByParagraphs("hello world", 100, charTokenizer);
    expect(chunks).toEqual(["hello world"]);
  });

  it("splits multi-paragraph input on blank lines", async () => {
    const input = "Para one has text.\n\nPara two is here.\n\nPara three ends.";
    const chunks = await chunkByParagraphs(input, 25, charTokenizer);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(25);
    }
    // Content preserved
    const joined = chunks.join(" ");
    expect(joined).toContain("Para one");
    expect(joined).toContain("Para two");
    expect(joined).toContain("Para three");
  });

  it("splits an oversized paragraph on sentence boundaries", async () => {
    const input =
      "First sentence here. Second sentence is longer and has content. Third.";
    const chunks = await chunkByParagraphs(input, 40, charTokenizer);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(40);
    }
  });

  it("falls back to char-slicing for a single unbreakable sentence", async () => {
    const input = "a".repeat(200);
    const chunks = await chunkByParagraphs(input, 50, charTokenizer);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(50);
    }
    expect(chunks.join("")).toBe(input);
  });

  it("packs multiple paragraphs greedily when they fit", async () => {
    const input = "abc\n\ndef\n\nghi";
    const chunks = await chunkByParagraphs(input, 100, charTokenizer);
    expect(chunks).toEqual(["abc\n\ndef\n\nghi"]);
  });
});

describe("decompose.mapReduce", () => {
  it("applies map then reduce", async () => {
    const chunks = ["a", "b", "c"];
    const map = vi.fn((c: string) => Promise.resolve(c.toUpperCase()));
    const reduce = vi.fn((arr: string[]) => Promise.resolve(arr.join("-")));

    const result = await mapReduce({ chunks, map, reduce });

    expect(map).toHaveBeenCalledTimes(3);
    expect(reduce).toHaveBeenCalledWith(["A", "B", "C"]);
    expect(result).toBe("A-B-C");
  });

  it("preserves input ordering", async () => {
    const chunks = ["one", "two", "three"];
    const result = await mapReduce({
      chunks,
      map: (c, i) => Promise.resolve(`${String(i)}:${c}`),
      reduce: (a) => Promise.resolve(a.join(",")),
    });
    expect(result).toBe("0:one,1:two,2:three");
  });

  it("aborts between map calls when signal fires", async () => {
    const controller = new AbortController();
    const map = vi.fn((c: string) => {
      controller.abort();
      return Promise.resolve(c);
    });
    const reduce = vi.fn((arr: string[]) => Promise.resolve(arr.join("")));

    await expect(
      mapReduce({
        chunks: ["a", "b", "c"],
        map,
        reduce,
        signal: controller.signal,
      }),
    ).rejects.toThrow();
    // map runs once, abort fires, subsequent iterations throw before calling map
    expect(map).toHaveBeenCalledTimes(1);
    expect(reduce).not.toHaveBeenCalled();
  });
});

describe("decompose.refineChain", () => {
  it("threads output through each stage", async () => {
    const result = await refineChain("seed", [
      (s) => Promise.resolve(`${s}-1`),
      (s) => Promise.resolve(`${s}-2`),
      (s) => Promise.resolve(`${s}-3`),
    ]);
    expect(result).toBe("seed-1-2-3");
  });

  it("respects abort signal", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      refineChain("seed", [(s) => Promise.resolve(`${s}!`)], controller.signal),
    ).rejects.toThrow();
  });
});

describe("decompose.recursiveDecompose", () => {
  it("respects depth=2 cap and composes tree", async () => {
    const expand = vi.fn((parent: string, depth: number) => {
      if (depth === 1) return Promise.resolve(["A", "B"]);
      return Promise.resolve([`${parent}.1`, `${parent}.2`]);
    });

    const result = await recursiveDecompose<string>({
      rootPrompt: "root",
      depth: 2,
      expand,
      compose: (parent, children) => {
        const lines = [`root:${parent}`];
        for (const { node, expanded } of children) {
          lines.push(`-${node}`);
          if (expanded) for (const e of expanded) lines.push(`--${e}`);
        }
        return lines.join("\n");
      },
    });

    expect(expand).toHaveBeenCalledTimes(3); // 1 top + 2 depth-2
    expect(result).toContain("root:root");
    expect(result).toContain("-A");
    expect(result).toContain("--A.1");
  });

  it("skips depth-2 expansion when depth=1", async () => {
    const expand = vi.fn(() => Promise.resolve(["X"]));
    await recursiveDecompose<string>({
      rootPrompt: "r",
      depth: 1,
      expand,
      compose: () => "",
    });
    expect(expand).toHaveBeenCalledTimes(1);
  });
});

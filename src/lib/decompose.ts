/**
 * Decomposition primitives — pure, Nano-independent orchestration helpers.
 *
 * These functions take injected `map`/`reduce`/`expand`/`compose` callables,
 * so they can be unit-tested against synthetic stubs without spinning up a
 * real LanguageModel session.
 */

export type MeasureFn = (text: string) => Promise<number> | number;

/**
 * Splits text into chunks that each measure ≤ maxChunkTokens via measureFn.
 *
 * Strategy:
 *   1. Split on blank lines (paragraphs). Cheap and preserves semantics.
 *   2. For any paragraph that still exceeds the cap, split on sentence
 *      boundaries ([.!?] followed by whitespace).
 *   3. For sentences that still exceed the cap, fall back to character-cap
 *      slicing (degenerate case — a single unbreakable run of text).
 *
 * The measureFn is async to accommodate Nano's `session.measureInputUsage`.
 */
export async function chunkByParagraphs(
  text: string,
  maxChunkTokens: number,
  measureFn: MeasureFn,
): Promise<string[]> {
  if (!text.trim()) return [];

  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];

  const splitOversized = async (block: string): Promise<string[]> => {
    const blockSize = await measureFn(block);
    if (blockSize <= maxChunkTokens) return [block];

    // Sentence-level split
    const sentences = block
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length > 1) {
      const out: string[] = [];
      for (const s of sentences) {
        const subs = await splitOversized(s);
        out.push(...subs);
      }
      return out;
    }

    // Degenerate path: single unbreakable sentence. Slice by characters using
    // a proportional heuristic derived from the measurement ratio.
    const ratio = blockSize / block.length;
    const charCap = Math.max(1, Math.floor(maxChunkTokens / Math.max(ratio, 0.001)));
    const pieces: string[] = [];
    for (let i = 0; i < block.length; i += charCap) {
      pieces.push(block.slice(i, i + charCap));
    }
    return pieces;
  };

  let current = "";
  for (const p of paragraphs) {
    const candidate = current ? `${current}\n\n${p}` : p;
    const size = await measureFn(candidate);
    if (size <= maxChunkTokens) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    const pieces = await splitOversized(p);
    // Greedily re-pack pieces.
    for (const piece of pieces) {
      const next = current ? `${current}\n\n${piece}` : piece;
      const nextSize = await measureFn(next);
      if (nextSize <= maxChunkTokens) {
        current = next;
      } else {
        if (current) chunks.push(current);
        current = piece;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export interface MapReduceArgs<T> {
  chunks: T[];
  map: (chunk: T, index: number) => Promise<string>;
  reduce: (mappedChunks: string[]) => Promise<string>;
  signal?: AbortSignal;
  /**
   * Maximum number of `map` calls in flight concurrently. Default 2 —
   * each Nano session holds a KV-cache that can cost tens of MB; high
   * parallelism risks OOMing the service worker on constrained devices.
   * Pass 1 for strictly sequential execution.
   */
  concurrency?: number;
}

/**
 * Runs `map` over every chunk with bounded concurrency, preserves input
 * ordering in the output, then runs `reduce` over the results.
 */
export async function mapReduce<T>(args: MapReduceArgs<T>): Promise<string> {
  const { chunks, map, reduce, signal } = args;
  const concurrency = Math.max(1, args.concurrency ?? 2);
  const mapped: string[] = new Array<string>(chunks.length);

  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      signal?.throwIfAborted();
      const i = next++;
      if (i >= chunks.length) return;
      mapped[i] = await map(chunks[i] as T, i);
    }
  };

  const workers: Promise<void>[] = [];
  const n = Math.min(concurrency, chunks.length);
  for (let i = 0; i < n; i++) workers.push(worker());
  await Promise.all(workers);

  signal?.throwIfAborted();
  return reduce(mapped);
}

/**
 * Runs an ordered list of stages. Each stage receives the previous stage's
 * output. Abortable between stages.
 */
export async function refineChain(
  initial: string,
  stages: ((input: string) => Promise<string>)[],
  signal?: AbortSignal,
): Promise<string> {
  let current = initial;
  for (const stage of stages) {
    signal?.throwIfAborted();
    current = await stage(current);
  }
  return current;
}

export interface RecursiveDecomposeArgs<Node> {
  rootPrompt: string;
  /** Cap on expansion depth. Effectively 2 for our current use. */
  depth: number;
  /** Produces child nodes from a parent. */
  expand: (parent: string, currentDepth: number) => Promise<Node[]>;
  /** Stitches a node and its (possibly recursively-expanded) children. */
  compose: (
    parent: string,
    children: { node: Node; expanded: Node[] | null }[],
  ) => string;
  signal?: AbortSignal;
}

/**
 * Two-level recursive decomposition. Current consumers cap depth at 2, so
 * we intentionally avoid generalising deeper and keep the shape simple.
 */
export async function recursiveDecompose<Node>(
  args: RecursiveDecomposeArgs<Node>,
): Promise<string> {
  const { rootPrompt, depth, expand, compose, signal } = args;
  signal?.throwIfAborted();

  const topLevel = await expand(rootPrompt, 1);
  const children: { node: Node; expanded: Node[] | null }[] = [];

  for (const node of topLevel) {
    signal?.throwIfAborted();
    if (depth >= 2) {
      const expanded = await expand(String(node), 2);
      children.push({ node, expanded });
    } else {
      children.push({ node, expanded: null });
    }
  }

  return compose(rootPrompt, children);
}

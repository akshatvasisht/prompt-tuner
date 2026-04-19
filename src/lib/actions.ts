import {
  Sparkle,
  Lightning,
  TreeStructure,
  UserCircle,
  Table,
  Funnel,
  ListDashes,
} from "~lib/icons";

/**
 * Interface for Command Palette actions
 */
export interface Action {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  keywords: string[];
  type: "primary" | "secondary";
  /** Which Chrome AI API to route through. Defaults to "prompt". */
  engine?: "prompt" | "writer" | "rewriter";
  /** Decomposition pattern to use. Defaults to "single". */
  pattern?: "single" | "refine" | "recursive";
}

/**
 * The primary registry of all AI optimization actions.
 *
 * Design Principle: Each action answers "what outcome are you trying
 * to unlock from the model?" - not "what is technically wrong with your text?"
 *
 * All actions are platform-agnostic. Platform-specific rule files inform
 * HOW the AI executes each action, but the labels are identical everywhere.
 */
export const ACTIONS: Action[] = [
  {
    id: "optimize",
    label: "Improve Prompt",
    icon: Sparkle,
    description: "Improve clarity, structure, and effectiveness",
    keywords: ["improve", "enhance", "better"],
    type: "primary",
    engine: "prompt",
    pattern: "refine",
  },
  {
    id: "few-shot",
    label: "Add Examples",
    icon: Lightning,
    description: "Add examples to show the model what you want",
    keywords: ["examples", "demonstrate", "show"],
    type: "secondary",
    engine: "writer",
    pattern: "single",
  },
  {
    id: "chain-of-thought",
    label: "Think Step by Step",
    icon: TreeStructure,
    description: "Get the model to reason through the problem",
    keywords: ["reasoning", "steps", "think", "logic"],
    type: "secondary",
    engine: "prompt",
    pattern: "recursive",
  },
  {
    id: "assign-role",
    label: "Set a Persona",
    icon: UserCircle,
    description: "Tell the model who to be for better answers",
    keywords: ["persona", "expert", "role", "character"],
    type: "secondary",
    engine: "rewriter",
    pattern: "single",
  },
  {
    id: "define-output",
    label: "Set the Format",
    icon: Table,
    description: "Specify the format you want the response in",
    keywords: ["format", "structure", "json", "table", "list"],
    type: "secondary",
    engine: "prompt",
    pattern: "single",
  },
  {
    id: "add-constraints",
    label: "Add Boundaries",
    icon: Funnel,
    description: "Tell the model what to avoid or stay within",
    keywords: ["limit", "restrict", "avoid", "scope"],
    type: "secondary",
    engine: "rewriter",
    pattern: "single",
  },
  {
    id: "break-down",
    label: "Break Down Task",
    icon: ListDashes,
    description: "Split a complex task into clear, ordered steps",
    keywords: ["decompose", "steps", "structure", "split", "tasks"],
    type: "secondary" as const,
    engine: "prompt",
    pattern: "recursive",
  },
];

export function getActionById(id: string): Action | undefined {
  return ACTIONS.find((a) => a.id === id);
}

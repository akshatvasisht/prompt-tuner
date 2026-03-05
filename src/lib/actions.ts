import {
  Sparkle,
  Lightning,
  TreeStructure,
  UserCircle,
  Table,
  Funnel,
} from "phosphor-react";

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
}

/**
 * The primary registry of all AI optimization actions.
 *
 * Design Principle: Each action answers "what outcome are you trying
 * to unlock from the model?" — not "what is technically wrong with your text?"
 *
 * All actions are platform-agnostic. Platform-specific rule files inform
 * HOW the AI executes each action, but the labels are identical everywhere.
 */
export const ACTIONS: Action[] = [
  {
    id: "optimize",
    label: "Optimize Prompt",
    icon: Sparkle,
    description: "Improve clarity, structure, and effectiveness automatically",
    keywords: ["improve", "enhance", "better"],
    type: "primary",
  },
  {
    id: "few-shot",
    label: "Few-Shot Prompting",
    icon: Lightning,
    description: "Add examples to show the model exactly what you want",
    keywords: ["examples", "demonstrate", "show"],
    type: "secondary",
  },
  {
    id: "chain-of-thought",
    label: "Chain of Thought",
    icon: TreeStructure,
    description: "Get the model to reason step-by-step before answering",
    keywords: ["reasoning", "steps", "think", "logic"],
    type: "secondary",
  },
  {
    id: "assign-role",
    label: "Assign a Role",
    icon: UserCircle,
    description: "Tell the model who to be for better-calibrated answers",
    keywords: ["persona", "expert", "role", "character"],
    type: "secondary",
  },
  {
    id: "define-output",
    label: "Define the Output",
    icon: Table,
    description: "Specify the exact format you want the response in",
    keywords: ["format", "structure", "json", "table", "list"],
    type: "secondary",
  },
  {
    id: "add-constraints",
    label: "Add Constraints",
    icon: Funnel,
    description: "Tell the model what to avoid or stay within",
    keywords: ["limit", "restrict", "avoid", "scope"],
    type: "secondary",
  },
];

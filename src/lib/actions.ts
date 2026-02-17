import { Sparkle, MagicWand, ChatText, Eraser, TextT } from "phosphor-react";

/** 
 * Interface for Command Palette actions 
 */
export interface Action {
    id: string;
    label: string;
    icon: React.ElementType;
    description: string;
    keywords: string[];
}

/**
 * The primary registry of all AI optimization actions.
 * Centralizing this allows for easy expansion and testing of new features.
 */
export const ACTIONS: Action[] = [
    {
        id: "improve",
        label: "Improve Prompt",
        icon: Sparkle,
        description: "Make the prompt clearer and more effective",
        keywords: ["enhance", "better", "optimize"],
    },
    {
        id: "fix-grammar",
        label: "Fix Grammar",
        icon: TextT,
        description: "Correct spelling and grammar mistakes",
        keywords: ["spelling", "correct", "typo"],
    },
    {
        id: "change-tone",
        label: "Change Tone",
        icon: ChatText,
        description: "Adjust the tone (formal, casual, friendly)",
        keywords: ["tone", "style", "voice"],
    },
    {
        id: "make-shorter",
        label: "Make Shorter",
        icon: Eraser,
        description: "Reduce length while keeping meaning",
        keywords: ["condense", "shorten", "brief"],
    },
    {
        id: "make-longer",
        label: "Make Longer",
        icon: MagicWand,
        description: "Expand with more detail",
        keywords: ["expand", "elaborate", "detail"],
    },
];

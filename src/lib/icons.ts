/**
 * Deep re-exports of phosphor-react icons.
 *
 * Parcel (Plasmo's bundler) does not tree-shake `phosphor-react`'s barrel
 * entrypoint — importing a single icon from the top-level `phosphor-react`
 * pulls in every icon in every bundle that touches it. Bypassing the barrel
 * with per-icon deep imports cuts the overlay bundle from ~600 KB to ~60 KB.
 */

export { default as ArrowClockwise } from "phosphor-react/dist/icons/ArrowClockwise.esm.js";
export { default as ArrowRight } from "phosphor-react/dist/icons/ArrowRight.esm.js";
export { default as CaretDown } from "phosphor-react/dist/icons/CaretDown.esm.js";
export { default as Check } from "phosphor-react/dist/icons/Check.esm.js";
export { default as CheckCircle } from "phosphor-react/dist/icons/CheckCircle.esm.js";
export { default as Cpu } from "phosphor-react/dist/icons/Cpu.esm.js";
export { default as Funnel } from "phosphor-react/dist/icons/Funnel.esm.js";
export { default as Keyboard } from "phosphor-react/dist/icons/Keyboard.esm.js";
export { default as Lightning } from "phosphor-react/dist/icons/Lightning.esm.js";
export { default as ListDashes } from "phosphor-react/dist/icons/ListDashes.esm.js";
export { default as Play } from "phosphor-react/dist/icons/Play.esm.js";
export { default as Sparkle } from "phosphor-react/dist/icons/Sparkle.esm.js";
export { default as Table } from "phosphor-react/dist/icons/Table.esm.js";
export { default as TreeStructure } from "phosphor-react/dist/icons/TreeStructure.esm.js";
export { default as UserCircle } from "phosphor-react/dist/icons/UserCircle.esm.js";
export { default as WarningCircle } from "phosphor-react/dist/icons/WarningCircle.esm.js";
export { default as X } from "phosphor-react/dist/icons/X.esm.js";

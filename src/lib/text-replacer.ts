/**
 * Text replacement utilities for content script
 * Gets or replaces selected text in the active textarea or input.
 */

/**
 * Replaces selected text in the active textarea or input with new text.
 * Sets cursor to end of inserted text and dispatches input event for framework reactivity.
 */
export function replaceSelectedText(newText: string): boolean {
  const activeElement = document.activeElement;

  if (
    activeElement &&
    (activeElement.tagName === "TEXTAREA" ||
      (activeElement.tagName === "INPUT" &&
        (activeElement as HTMLInputElement).type === "text"))
  ) {
    const textarea = activeElement as HTMLTextAreaElement | HTMLInputElement;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    textarea.value = before + newText + after;

    const newCursorPos = start + newText.length;
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos;

    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    return true;
  }

  return false;
}

/**
 * Gets currently selected text from the active element (textarea/input) or window selection.
 */
export function getSelectedText(): string | null {
  const activeElement = document.activeElement;

  if (
    activeElement &&
    (activeElement.tagName === "TEXTAREA" ||
      (activeElement.tagName === "INPUT" &&
        (activeElement as HTMLInputElement).type === "text"))
  ) {
    const textarea = activeElement as HTMLTextAreaElement | HTMLInputElement;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    if (start !== end) {
      return textarea.value.substring(start, end);
    }
  }

  const selection = window.getSelection();
  const trimmed = selection?.toString().trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

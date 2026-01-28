import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isElementValid,
  replaceText,
  getActiveTextInput,
  getElementText,
} from "~lib/dom-injector";

describe("dom-injector", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("isElementValid", () => {
    it("should return false for null", () => {
      expect(isElementValid(null)).toBe(false);
    });

    it("should return true for valid textarea", () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      expect(isElementValid(textarea)).toBe(true);
    });

    it("should return false for disabled textarea", () => {
      const textarea = document.createElement("textarea");
      textarea.disabled = true;
      container.appendChild(textarea);

      expect(isElementValid(textarea)).toBe(false);
    });

    it("should return false for readonly textarea", () => {
      const textarea = document.createElement("textarea");
      textarea.readOnly = true;
      container.appendChild(textarea);

      expect(isElementValid(textarea)).toBe(false);
    });

    it("should return true for contenteditable div", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      container.appendChild(div);

      expect(isElementValid(div)).toBe(true);
    });

    it("should return false for non-contenteditable div", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      expect(isElementValid(div)).toBe(false);
    });

    it("should return false for element not in DOM", () => {
      const textarea = document.createElement("textarea");
      // Not appended to document

      expect(isElementValid(textarea)).toBe(false);
    });
  });

  describe("replaceText", () => {
    it("should replace text in textarea", () => {
      const textarea = document.createElement("textarea");
      textarea.value = "old text";
      container.appendChild(textarea);

      const result = replaceText(textarea, "new text");

      expect(result.success).toBe(true);
      expect(textarea.value).toBe("new text");
    });

    it("should dispatch input event on textarea", () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      const inputHandler = vi.fn();
      textarea.addEventListener("input", inputHandler);

      replaceText(textarea, "test");

      expect(inputHandler).toHaveBeenCalled();
    });

    it("should dispatch change event on textarea", () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      const changeHandler = vi.fn();
      textarea.addEventListener("change", changeHandler);

      replaceText(textarea, "test");

      expect(changeHandler).toHaveBeenCalled();
    });

    it("should replace text in contenteditable", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      div.textContent = "old text";
      container.appendChild(div);

      // Focus the element (required for execCommand)
      div.focus();

      const result = replaceText(div, "new text");

      expect(result.success).toBe(true);
      // Note: In JSDOM, execCommand might not work perfectly
      // The test verifies the function doesn't throw
    });

    it("should return error for invalid element", () => {
      const result = replaceText(null, "text");

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("should return error for unsupported element type", () => {
      const input = document.createElement("input");
      container.appendChild(input);

      // Cast to bypass type checking - testing runtime behavior
      const result = replaceText(
        input as unknown as HTMLTextAreaElement,
        "text",
      );

      expect(result.success).toBe(false);
    });
  });

  describe("getActiveTextInput", () => {
    it("should return active textarea", () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);
      textarea.focus();

      const result = getActiveTextInput();

      expect(result).toBe(textarea);
    });

    it("should return active contenteditable div", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      container.appendChild(div);
      div.focus();

      const result = getActiveTextInput();

      expect(result).toBe(div);
    });

    it("should return null when no text input is active", () => {
      const button = document.createElement("button");
      container.appendChild(button);
      button.focus();

      const result = getActiveTextInput();

      expect(result).toBe(null);
    });

    it("should fallback to querySelector for known selectors", () => {
      const textarea = document.createElement("textarea");
      textarea.id = "prompt-textarea";
      container.appendChild(textarea);

      // Focus something else
      const button = document.createElement("button");
      container.appendChild(button);
      button.focus();

      const result = getActiveTextInput();

      expect(result).toBe(textarea);
    });
  });

  describe("getElementText", () => {
    it("should get text from textarea", () => {
      const textarea = document.createElement("textarea");
      textarea.value = "textarea content";
      container.appendChild(textarea);

      expect(getElementText(textarea)).toBe("textarea content");
    });

    it("should get text from contenteditable div", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      div.textContent = "div content";
      container.appendChild(div);

      expect(getElementText(div)).toBe("div content");
    });

    it("should return empty string for empty elements", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      container.appendChild(div);

      expect(getElementText(div)).toBe("");
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SparkleWidget } from "~components/sparkle-widget";

// Mock platform detector
vi.mock("~lib/platform-detector", () => ({
  detectPlatform: vi.fn(() => "openai"),
}));

// Mock DOM injector
vi.mock("~lib/dom-injector", () => ({
  isElementValid: vi.fn(() => true),
  replaceText: vi.fn(() => ({ success: true })),
  getElementText: vi.fn((el: HTMLElement) => {
    if (el instanceof HTMLTextAreaElement) return el.value;
    return el.textContent || "";
  }),
}));

// Mock Plasmo messaging
const mockSendToBackground = vi.fn();
vi.mock("@plasmohq/messaging", () => ({
  sendToBackground: (...args: unknown[]): unknown =>
    mockSendToBackground(...args),
}));

// Mock Floating UI
vi.mock("@floating-ui/react", () => ({
  useFloating: () => ({
    refs: {
      setFloating: vi.fn(),
      setReference: vi.fn(),
      floating: { current: null },
    },
    floatingStyles: {},
    update: vi.fn(),
  }),
  autoUpdate: vi.fn(() => vi.fn()),
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}));

describe("SparkleWidget", () => {
  let mockTextarea: HTMLTextAreaElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock textarea
    mockTextarea = document.createElement("textarea");
    mockTextarea.value = "Test prompt";
    document.body.appendChild(mockTextarea);

    // Default mock response
    mockSendToBackground.mockResolvedValue({
      success: true,
      optimizedPrompt: "Optimized: Test prompt",
      appliedRules: ["rule1"],
    });
  });

  afterEach(() => {
    if (mockTextarea.parentNode) {
      mockTextarea.parentNode.removeChild(mockTextarea);
    }
  });

  it("renders the sparkle button when activeElement is provided", () => {
    render(<SparkleWidget activeElement={mockTextarea} />);

    const button = screen.getByRole("button", { name: /optimize prompt/i });
    expect(button).toBeInTheDocument();
  });

  it("renders nothing when activeElement is null", () => {
    const { container } = render(<SparkleWidget activeElement={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows processing state when button is clicked", async () => {
    mockSendToBackground.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              optimizedPrompt: "Optimized: Test prompt",
              appliedRules: ["rule1"],
            });
          }, 100);
        }),
    );

    const user = userEvent.setup();
    render(<SparkleWidget activeElement={mockTextarea} />);

    const button = screen.getByRole("button", { name: /optimize prompt/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /processing/i }),
      ).toBeInTheDocument();
    });
  });

  it("handles optimization errors gracefully", async () => {
    mockSendToBackground.mockResolvedValue({
      success: false,
      optimizedPrompt: "Test prompt",
      appliedRules: [],
      error: { code: "AI_UNAVAILABLE", message: "AI not available" },
    });

    const user = userEvent.setup();
    render(<SparkleWidget activeElement={mockTextarea} />);

    const button = screen.getByRole("button", { name: /optimize prompt/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows error for empty input", async () => {
    mockTextarea.value = "";

    const user = userEvent.setup();
    render(<SparkleWidget activeElement={mockTextarea} />);

    const button = screen.getByRole("button", { name: /optimize prompt/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/enter some text/i)).toBeInTheDocument();
    });
  });

  it("calls onProcessingComplete callback on success", async () => {
    const onComplete = vi.fn();

    const user = userEvent.setup();
    render(
      <SparkleWidget
        activeElement={mockTextarea}
        onProcessingComplete={onComplete}
      />,
    );

    const button = screen.getByRole("button", { name: /optimize prompt/i });
    await user.click(button);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it("disables button during processing", async () => {
    mockSendToBackground.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              optimizedPrompt: "Result",
              appliedRules: [],
            });
          }, 200);
        }),
    );

    const user = userEvent.setup();
    render(<SparkleWidget activeElement={mockTextarea} />);

    const button = screen.getByRole("button", { name: /optimize prompt/i });
    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });
});

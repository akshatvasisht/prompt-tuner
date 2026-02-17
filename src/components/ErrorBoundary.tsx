import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "~lib/logger";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Uncaught error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[var(--pt-surface)] text-[var(--pt-text-primary)] rounded-[var(--pt-radius-lg)] border border-[var(--pt-surface-border)] shadow-[var(--pt-shadow-lg)]">
            <img
              /* eslint-disable-next-line @typescript-eslint/no-deprecated */
              src={chrome.runtime.getURL("assets/logo.svg")}
              alt="Prompt Tuner"
              className="h-12 w-12 mb-4 opacity-40"
            />
            <h2 className="text-lg font-semibold mb-2 text-[var(--pt-text-primary)]">
              Something went wrong
            </h2>
            <p className="text-sm text-[var(--pt-text-secondary)] mb-6 max-w-sm">
              The Command Palette encountered an unexpected error. Please try again.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
              }}
              className="px-4 py-2 bg-[var(--pt-accent)] hover:bg-[var(--pt-accent-hover)] text-white rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

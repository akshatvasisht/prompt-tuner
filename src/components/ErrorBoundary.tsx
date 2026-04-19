import { Component, type ErrorInfo, type ReactNode } from "react";
import { Logo } from "~components/Logo";
import { Button } from "~components/ui/Button";
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
          <div
            role="alert"
            className="flex w-full flex-col items-center gap-2 px-6 py-5 text-center text-[var(--pt-text-primary)]"
          >
            <Logo
              aria-label="Prompt Tuner"
              className="h-8 w-8 opacity-40 text-[var(--pt-accent)]"
            />
            <h2 className="text-sm font-semibold text-[var(--pt-text-primary)]">
              Something went wrong
            </h2>
            <p className="max-w-xs text-xs text-[var(--pt-text-secondary)]">
              The Command Palette hit an unexpected error.
            </p>
            <Button
              size="sm"
              className="mt-1"
              onClick={() => {
                this.setState({ hasError: false });
              }}
            >
              Try again
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

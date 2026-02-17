import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "~lib/logger";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

/**
 * Global Error Boundary for Overlay Components
 * Following industry standards for React robustness.
 */
export class ErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error("Uncaught error:", error, errorInfo);
    }

    public override render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-zinc-900 text-white rounded-2xl border border-white/10">
                        <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            The Command Palette encountered an unexpected error.
                        </p>
                        <button
                            onClick={() => { this.setState({ hasError: false }); }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm transition-colors"
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

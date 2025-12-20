import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, borderTop: "4px solid red" }}>
                    <h1 style={{ color: "red" }}>Application Error</h1>
                    <p>The application crashed with the following error:</p>
                    <pre style={{ background: "#eee", padding: 10, overflow: "auto" }}>
                        {this.state.error?.toString()}
                    </pre>
                    <details>
                        <summary>Stack Trace</summary>
                        <pre style={{ fontSize: 12, lineHeight: 1.4 }}>{this.state.error?.stack}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

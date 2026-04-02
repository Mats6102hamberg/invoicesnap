import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; errorText?: string; stack?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      errorText: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("UI crashed:", error, info);
    this.setState({ stack: info.componentStack ?? undefined });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 p-4">
          <div className="max-w-xl mx-auto pt-16">
            <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-gray-600">
              The app crashed whilst loading. Please copy the error message and send it to the developer.
            </p>
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-sm font-semibold text-gray-700">Error message</div>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {this.state.errorText || "Unknown error"}
              </pre>
            </div>
            {this.state.stack ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">Technical details</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-400">
                  {this.state.stack}
                </pre>
              </details>
            ) : null}
            <button
              className="mt-6 w-full rounded-xl bg-blue-600 text-white px-4 py-3 font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

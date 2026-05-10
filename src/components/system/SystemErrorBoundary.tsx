import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logPageError } from '@/lib/systemEvents';
import { ServerErrorState } from './ServerErrorState';

interface State {
  hasError: boolean;
  referenceId: string | null;
}

export class SystemErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, referenceId: null };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    const referenceId = logPageError({
      route: typeof window === 'undefined' ? '' : window.location.pathname,
      error,
    });
    this.setState({ referenceId });
  }

  reset = () => this.setState({ hasError: false, referenceId: null });

  render(): ReactNode {
    if (this.state.hasError) {
      return <ServerErrorState referenceId={this.state.referenceId} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

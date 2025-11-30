/**
 * ErrorBoundary Component
 *
 * React Error Boundary to catch rendering errors and display fallback UI.
 * Prevents white screen of death when components crash.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('[ErrorBoundary] Component error caught:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Something went wrong',
        fallbackMessage = 'An error occurred while rendering this component.'
      } = this.props;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            minHeight: '300px',
          }}
        >
          {/* Error Icon */}
          <AlertTriangle
            size={48}
            color="#FF3B30"
            strokeWidth={2}
            style={{ marginBottom: '16px' }}
          />

          {/* Error Title */}
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1d1d1f',
              marginBottom: '8px',
              margin: 0,
            }}
          >
            {fallbackTitle}
          </h2>

          {/* Error Message */}
          <p
            style={{
              fontSize: '14px',
              color: '#6e6e73',
              marginBottom: '24px',
              maxWidth: '400px',
              margin: '8px 0 24px 0',
              lineHeight: '1.5',
            }}
          >
            {fallbackMessage}
          </p>

          {/* Error Details (development only) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                marginBottom: '24px',
                padding: '12px',
                backgroundColor: '#FAFAFA',
                borderRadius: '8px',
                maxWidth: '500px',
                textAlign: 'left',
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#6e6e73',
                  marginBottom: '8px',
                  fontWeight: '600',
                }}
              >
                Error Details (dev only)
              </summary>
              <pre
                style={{
                  fontSize: '11px',
                  color: '#FF3B30',
                  overflow: 'auto',
                  maxHeight: '200px',
                  margin: 0,
                  padding: '8px',
                  backgroundColor: '#FFF5F5',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          {/* Retry Button */}
          <button
            onClick={this.handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#0077B5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#005885';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0077B5';
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

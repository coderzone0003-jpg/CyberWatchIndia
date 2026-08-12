import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by Error Boundary:', error, errorInfo);
    this.setState({ errorInfo });
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    try {
      const errorData = {
        message: error?.toString?.() || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      console.log('Error data prepared for logging:', errorData);
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
          <div className="text-center p-5">
            <div className="display-1 text-danger mb-4">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h1 className="display-4 fw-bold text-danger mb-3">Something went wrong</h1>
            <p className="lead text-muted mb-4">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="alert alert-warning mb-4 text-start">
                <h5 className="alert-heading">Error Details (Development Only)</h5>
                <pre className="mb-0" style={{ fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                  {this.state.error?.toString?.()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn btn-primary btn-lg"
                onClick={this.handleReset}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reload Page
              </button>
              <button
                className="btn btn-outline-secondary btn-lg"
                onClick={() => { window.location.href = '/'; }}
              >
                <i className="bi bi-house me-2"></i>
                Go Home
              </button>
            </div>

            <p className="text-muted mt-4 small">
              Error ID: {Date.now()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 48, gap: 16, textAlign: 'center', minHeight: 300,
        }}>
          <AlertTriangle size={48} style={{ color: 'var(--color-danger, #e5484d)' }} />
          <h2 style={{ color: 'var(--color-surface, #1a1a1e)', margin: 0 }}>Algo salió mal</h2>
          <p style={{ color: '#666', maxWidth: 400, margin: 0 }}>
            Ocurrió un error inesperado en esta sección. Intenta recargar la página.
          </p>
          <button onClick={this.handleReset} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
            background: 'var(--color-primary, #f5661e)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md, 10px)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>
            <RefreshCw size={16} /> Reintentar
          </button>
          {this.state.error && (
            <details style={{ marginTop: 16, textAlign: 'left', color: '#999', fontSize: 12, maxWidth: 500 }}>
              <summary>Detalles técnicos</summary>
              <pre style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 6, overflow: 'auto', maxHeight: 200 }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

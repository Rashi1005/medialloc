import { Component } from 'react';

/**
 * ErrorBoundary — per-module crash containment
 * Props:
 *   module  — name shown in the error card (e.g. "DP Visualizer")
 *   compact — smaller inline variant for section-level boundaries
 */
export class ErrorBoundary extends Component {
  state = { error: null, info: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // Could send to error tracking here
    console.error('[MediAlloc ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    const { error } = this.state;
    const { module: moduleName = 'Module', compact = false, children } = this.props;

    if (!error) return children;

    if (compact) {
      return (
        <div style={{
          padding: '12px 16px',
          background: 'var(--critical-muted)',
          border: '1px solid var(--critical-border)',
          borderRadius: 'var(--r-md)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--critical)' }}>
              {moduleName} error: {error.message}
            </span>
          </div>
          <button onClick={this.handleReset} style={{
            padding: '4px 12px', background: 'var(--critical-muted)',
            border: '1px solid var(--critical-border)', borderRadius: 6,
            color: 'var(--critical)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
          }}>Retry</button>
        </div>
      );
    }

    return (
      <div style={{
        padding: 40, textAlign: 'center',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--critical-border)',
        borderRadius: 'var(--r-xl)',
        margin: '0 auto',
        maxWidth: 480,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--critical-muted)',
          border: '2px solid var(--critical-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '1.5rem',
        }}>⚠️</div>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: '1.1rem', color: 'var(--critical)', marginBottom: 8,
        }}>{moduleName} crashed</h3>
        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.85rem',
          marginBottom: 6, lineHeight: 1.6,
        }}>An unexpected error occurred in this module.</p>
        <pre style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
          color: 'var(--text-muted)', background: 'var(--bg-void)',
          padding: '10px 14px', borderRadius: 'var(--r-md)',
          marginBottom: 20, textAlign: 'left', overflowX: 'auto',
          border: '1px solid var(--border-subtle)',
        }}>{error.message}</pre>
        <button onClick={this.handleReset} style={{
          padding: '10px 24px',
          background: 'var(--accent-500)', color: 'var(--bg-void)',
          border: 'none', borderRadius: 'var(--r-md)',
          cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 0 20px var(--accent-glow)',
        }}>Try Again</button>
      </div>
    );
  }
}
import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#admin';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6 text-stone-900 font-sans">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div>
              <h2 className="font-serif font-bold text-xl text-primary">Notice Recovered</h2>
              <p className="text-xs text-stone-500 mt-1">
                An interface refresh occurred. Click below to continue managing orders.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-left font-mono text-[11px] text-stone-700 overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs font-bold py-3 rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reload & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

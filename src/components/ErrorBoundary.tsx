import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#fee2e2', color: '#b91c1c', height: '100vh' }}>
                    <h1>Bir Hata Oluştu (Error)</h1>
                    <p>Lütfen bu ekranın fotoğrafını çekin veya aşağıdaki hatayı kopyalayıp asistana gönderin.</p>
                    <hr style={{ borderColor: '#fca5a5' }} />
                    <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', overflow: 'auto', marginTop: '20px' }}>
                        <h3 style={{ marginTop: 0 }}>Hata Detayı:</h3>
                        <pre style={{ color: '#000' }}>{this.state.error && this.state.error.toString()}</pre>
                        <br />
                        {this.state.errorInfo && (
                            <details>
                                <summary>Stack Trace</summary>
                                <pre style={{ fontSize: '12px' }}>{this.state.errorInfo.componentStack}</pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

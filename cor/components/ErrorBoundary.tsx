import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-lg">
                <h1 className="text-2xl font-bold text-red-600 mb-4">
                    오류가 발생했습니다.
                </h1>
                <p className="text-slate-600 mb-6">
                    애플리케이션을 로드하는 중 예기치 않은 오류가 발생했습니다. 이 문제는 보통 데이터 파일의 형식이 잘못되었거나 계산에 필요한 값이 누락된 경우 발생할 수 있습니다.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 text-sm font-semibold rounded-md cursor-pointer
                               bg-brand-blue text-white hover:bg-brand-blue/90 
                               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                >
                    앱 새로고침
                </button>
                 <p className="text-xs text-slate-500 mt-4">
                    문제가 계속되면 다른 데이터 파일을 사용해 보십시오.
                 </p>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

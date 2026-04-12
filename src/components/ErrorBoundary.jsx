import React, { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Konsola yazdır (production'da hata izleme sistemine gönderilebilir)
    console.error("ErrorBoundary caught an error: ", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4">
            <span className="text-6xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-red-500">Oyun Bir Hatayla Karşılaştı</h1>
          <p className="text-xl mb-6 max-w-sm text-gray-300">
            Beklenmeyen bir sorun oluştu. Oyun verilerinizi korumak için lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all"
          >
            Sayfayı Yenile
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-8 text-left bg-gray-900 p-4 rounded text-sm text-red-400 overflow-auto max-w-2xl max-h-64">
              <summary className="font-bold cursor-pointer">Hata Detayları (Sadece Geliştirici)</summary>
              <pre className="mt-2 text-xs">{this.state.error.toString()}</pre>
              <pre className="mt-2 text-xs">{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

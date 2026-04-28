"use client";

import { Component, ReactNode } from "react";

export class RecorderErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

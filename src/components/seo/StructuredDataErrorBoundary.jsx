'use client';
import React from 'react';

class StructuredDataErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('StructuredData Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing instead of crashing the page
      console.warn('StructuredData component failed, continuing without structured data');
      return null;
    }

    return this.props.children;
  }
}

export default StructuredDataErrorBoundary;
'use client';
import { useEffect } from 'react';

export default function ProductStructuredDataHead({ productStructuredData }) {
  useEffect(() => {
    if (!productStructuredData || typeof window === 'undefined') return;

    // Remove any existing product structured data scripts
    const existingScripts = document.querySelectorAll('script[data-type="product-structured-data"]');
    existingScripts.forEach(script => script.remove());

    // Create and append new structured data script to head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-type', 'product-structured-data');
    script.textContent = JSON.stringify(productStructuredData, null, 2);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const scriptToRemove = document.querySelector('script[data-type="product-structured-data"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [productStructuredData]);

  return null; // This component doesn't render anything visible
}
'use client';
import { useEffect } from 'react';

/**
 * Client component to inject FAQ structured data into document head
 * This component handles dynamic FAQ data from both product and website sources
 */
export default function FaqStructuredDataHead({ faqStructuredData }) {
  useEffect(() => {
    if (!faqStructuredData || typeof window === 'undefined') return;

    // Remove any existing FAQ structured data scripts
    const existingScripts = document.querySelectorAll('script[data-type="faq-structured-data"]');
    existingScripts.forEach(script => script.remove());

    // Create and append new structured data script to head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-type', 'faq-structured-data');
    script.textContent = JSON.stringify(faqStructuredData, null, 2);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const scriptToRemove = document.querySelector('script[data-type="faq-structured-data"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [faqStructuredData]);

  return null; // This component doesn't render anything visible
}

/**
 * Generate Capabilities WebPage JSON-LD structured data
 * @param {Object} topicPageData - Topic page data from API
 * @returns {Object} JSON-LD structured data object
 */
export const generateCapabilitiesPageStructuredData = (topicPageData) => {
  try {
    // Get site URL from environment with fallback
    const siteUrl = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SITE_URL) 
      ? process.env.NEXT_PUBLIC_SITE_URL 
      : 'https://www.amrita-fashions.com';
    
    const cleanSiteUrl = String(siteUrl || '').replace(/\/+$/, ''); // Remove trailing slash

    // Build the WebPage structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": topicPageData?.metaTitle || "Capabilities",
      "description": topicPageData?.description || topicPageData?.excerpt || "Our capabilities and services",
      "url": `${cleanSiteUrl}/capabilities`,
      "isPartOf": { 
        "@id": `${cleanSiteUrl}/#website` 
      },
      "publisher": { 
        "@id": `${cleanSiteUrl}/#org` 
      }
    };

    return structuredData;
  } catch (error) {
    console.error('Error generating Capabilities page structured data:', error);
    return null;
  }
};

/**
 * Generate Capabilities WebPage JSON-LD script tag
 * @param {Object} topicPageData - Topic page data from API
 * @returns {string} HTML script tag with JSON-LD
 */
export const generateCapabilitiesPageJsonLdScript = (topicPageData) => {
  try {
    const structuredData = generateCapabilitiesPageStructuredData(topicPageData);
    
    if (!structuredData) return '';

    return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
  } catch (error) {
    console.error('Error generating Capabilities page JSON-LD script:', error);
    return '';
  }
};

/**
 * Capabilities WebPage JSON-LD Component for Server-Side Rendering
 * @param {Object} props - Component props
 * @param {Object} props.topicPageData - Topic page data from API
 * @returns {JSX.Element} Script tag with JSON-LD
 */
export function CapabilitiesPageJsonLd({ topicPageData }) {
  const structuredData = generateCapabilitiesPageStructuredData(topicPageData);

  if (!structuredData) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

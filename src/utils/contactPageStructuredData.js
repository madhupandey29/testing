/**
 * Generate ContactPage JSON-LD structured data
 * @param {Object} topicPageData - Topic page data from API
 * @returns {Object} JSON-LD structured data object
 */
export const generateContactPageStructuredData = (topicPageData) => {
  try {
    // Get site URL from environment with fallback
    const siteUrl = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SITE_URL) 
      ? process.env.NEXT_PUBLIC_SITE_URL 
      : 'https://www.amrita-fashions.com';
    
    const cleanSiteUrl = String(siteUrl || '').replace(/\/+$/, ''); // Remove trailing slash

    // Build the ContactPage structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": topicPageData?.metaTitle || "Contact Us",
      "description": topicPageData?.description || topicPageData?.excerpt || "Get in touch with us",
      "url": `${cleanSiteUrl}/contact`,
      "isPartOf": { 
        "@id": `${cleanSiteUrl}/#website` 
      },
      "about": { 
        "@id": `${cleanSiteUrl}/#org` 
      }
    };

    return structuredData;
  } catch (error) {
    console.error('Error generating ContactPage structured data:', error);
    return null;
  }
};

/**
 * Generate ContactPage JSON-LD script tag
 * @param {Object} topicPageData - Topic page data from API
 * @returns {string} HTML script tag with JSON-LD
 */
export const generateContactPageJsonLdScript = (topicPageData) => {
  try {
    const structuredData = generateContactPageStructuredData(topicPageData);
    
    if (!structuredData) return '';

    return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
  } catch (error) {
    console.error('Error generating ContactPage JSON-LD script:', error);
    return '';
  }
};

/**
 * ContactPage JSON-LD Component for Server-Side Rendering
 * @param {Object} props - Component props
 * @param {Object} props.topicPageData - Topic page data from API
 * @returns {JSX.Element} Script tag with JSON-LD
 */
export function ContactPageJsonLd({ topicPageData }) {
  const structuredData = generateContactPageStructuredData(topicPageData);

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

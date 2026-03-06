/**
 * Generate AboutPage JSON-LD structured data
 * @param {Object} topicPageData - Topic page data from API
 * @returns {Object} JSON-LD structured data object
 */
export const generateAboutPageStructuredData = (topicPageData) => {
  try {
    // Get site URL from environment with fallback
    const siteUrl = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SITE_URL) 
      ? process.env.NEXT_PUBLIC_SITE_URL 
      : 'https://www.amrita-fashions.com';
    
    const cleanSiteUrl = String(siteUrl || '').replace(/\/+$/, ''); // Remove trailing slash

    // Build the AboutPage structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": topicPageData?.metaTitle || "About Us",
      "description": topicPageData?.description || topicPageData?.excerpt || "Learn about our company",
      "url": `${cleanSiteUrl}/about`,
      "isPartOf": { 
        "@id": `${cleanSiteUrl}/#website` 
      },
      "about": { 
        "@id": `${cleanSiteUrl}/#org` 
      }
    };

    return structuredData;
  } catch (error) {
    console.error('Error generating AboutPage structured data:', error);
    return null;
  }
};

/**
 * Generate AboutPage JSON-LD script tag
 * @param {Object} topicPageData - Topic page data from API
 * @returns {string} HTML script tag with JSON-LD
 */
export const generateAboutPageJsonLdScript = (topicPageData) => {
  try {
    const structuredData = generateAboutPageStructuredData(topicPageData);
    
    if (!structuredData) return '';

    return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
  } catch (error) {
    console.error('Error generating AboutPage JSON-LD script:', error);
    return '';
  }
};

/**
 * AboutPage JSON-LD Component for Server-Side Rendering
 * @param {Object} props - Component props
 * @param {Object} props.topicPageData - Topic page data from API
 * @returns {JSX.Element} Script tag with JSON-LD
 */
export function AboutPageJsonLd({ topicPageData }) {
  const structuredData = generateAboutPageStructuredData(topicPageData);

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

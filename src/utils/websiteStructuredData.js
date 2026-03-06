/**
 * Generate WebSite JSON-LD structured data with SearchAction
 * @param {Object} companyInfo - Company information from officeInformationApi
 * @param {Object} siteSettings - Site settings from sitesettings API
 * @returns {Object} JSON-LD structured data object
 */
export const generateWebsiteStructuredData = (companyInfo, siteSettings) => {
  // Validate input
  if (!companyInfo || typeof companyInfo !== 'object') {
    console.warn('generateWebsiteStructuredData: Invalid companyInfo provided');
    return null;
  }

  try {
    // Get site URL from environment with fallback
    const siteUrl = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SITE_URL) 
      ? process.env.NEXT_PUBLIC_SITE_URL 
      : 'https://www.amrita-fashions.com';
    
    const cleanSiteUrl = String(siteUrl || '').replace(/\/+$/, ''); // Remove trailing slash

    // Get primary language from company info with fallback
    const primaryLanguage = (Array.isArray(companyInfo.languages) && companyInfo.languages.length > 0) 
      ? companyInfo.languages[0] 
      : 'en';

    // Build the WebSite structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${cleanSiteUrl}/#website`,
      "url": `${cleanSiteUrl}/`,
      "name": (companyInfo.legalName && typeof companyInfo.legalName === 'string') 
        ? companyInfo.legalName 
        : (companyInfo.name && typeof companyInfo.name === 'string') 
          ? companyInfo.name 
          : "Amrita Global Enterprises",
      "publisher": {
        "@id": `${cleanSiteUrl}/#org`
      },
      "inLanguage": primaryLanguage,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${cleanSiteUrl}/fabric?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    return structuredData;
  } catch (error) {
    console.error('Error generating website structured data:', error);
    return null;
  }
};

/**
 * Generate WebSite JSON-LD script tag
 * @param {Object} companyInfo - Company information from API
 * @param {Object} siteSettings - Site settings from API
 * @returns {string} HTML script tag with JSON-LD
 */
export const generateWebsiteJsonLdScript = (companyInfo, siteSettings) => {
  try {
    const structuredData = generateWebsiteStructuredData(companyInfo, siteSettings);
    
    if (!structuredData) return '';

    return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
  } catch (error) {
    console.error('Error generating website JSON-LD script:', error);
    return '';
  }
};
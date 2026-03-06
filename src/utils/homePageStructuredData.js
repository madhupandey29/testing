import { fetchTopicPageByName } from './topicPageApi';

/**
 * Generate Home Page JSON-LD structured data exactly as specified
 * Following the same pattern as corporationStructuredData.js
 * @param {Object} topicPageData - Topic page data from API (contains ogType)
 * @param {Object} companyInfo - Company information from officeInformationApi (contains legalName, description, languages)
 * @param {Object} siteSettings - Site settings from sitesettings API
 * @returns {Object} JSON-LD structured data object for home page
 */
export const generateHomePageStructuredData = (topicPageData, companyInfo, siteSettings) => {
  if (!companyInfo || typeof companyInfo !== 'object') {
    return null;
  }

  try {
    // Get site URL from environment
    const siteUrl = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SITE_URL) 
      ? process.env.NEXT_PUBLIC_SITE_URL 
      : 'https://www.amrita-fashions.com';
    
    const cleanSiteUrl = String(siteUrl || '').replace(/\/+$/, '');

    // Get @type from topic page ogType or default to WebPage
    const schemaType = (topicPageData?.ogType && typeof topicPageData.ogType === 'string') 
      ? topicPageData.ogType 
      : "WebPage";

    // Get name from company info legalName | description
    let pageName = companyInfo.legalName;
    if (companyInfo.description && typeof companyInfo.description === 'string') {
      pageName = `${companyInfo.legalName} | ${companyInfo.description}`;
    }

    // Get all languages from office information API
    const languages = companyInfo.languages;

    // Generate the JSON-LD structure
    const structuredData = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "@id": `${cleanSiteUrl}/#home`,
      "url": `${cleanSiteUrl}/`,
      "name": pageName,
      "isPartOf": { 
        "@id": `${cleanSiteUrl}/#website`
      },
      "publisher": { 
        "@id": `${cleanSiteUrl}/#org`
      },
      "inLanguage": Array.isArray(languages) && languages.length > 0 
        ? (languages.length === 1 ? languages[0] : languages)
        : "en"
    };

    return structuredData;
  } catch (error) {
    return null;
  }
};

/**
 * Generate home page JSON-LD script tag exactly as specified
 * @param {Object} topicPageData - Topic page data from API
 * @param {Object} companyInfo - Company information from API
 * @param {Object} siteSettings - Site settings from API
 * @returns {string} HTML script tag with JSON-LD
 */
export const generateHomePageJsonLdScript = (topicPageData, companyInfo, siteSettings) => {
  try {
    const structuredData = generateHomePageStructuredData(topicPageData, companyInfo, siteSettings);
    
    if (!structuredData) return '';

    return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
  } catch (error) {
    return '';
  }
};

/**
 * Fetch home page topic data and generate structured data exactly as specified
 * @param {Object} companyInfo - Company information from API
 * @param {Object} siteSettings - Site settings from API
 * @returns {Promise<Object>} Structured data object
 */
export const generateHomePageStructuredDataWithApi = async (companyInfo, siteSettings) => {
  try {
    let homePageTopic = null;
    try {
      homePageTopic = await fetchTopicPageByName('home');
    } catch (topicError) {
      homePageTopic = null;
    }
    
    const structuredData = generateHomePageStructuredData(homePageTopic, companyInfo, siteSettings);
    
    return structuredData;
  } catch (error) {
    return generateHomePageStructuredData(null, companyInfo, siteSettings);
  }
};

/**
 * Generate home page JSON-LD script with API data
 * @param {Object} companyInfo - Company information from API
 * @param {Object} siteSettings - Site settings from API
 * @returns {Promise<string>} HTML script tag with JSON-LD
 */
export const generateHomePageJsonLdScriptWithApi = async (companyInfo, siteSettings) => {
  try {
    const structuredData = await generateHomePageStructuredDataWithApi(companyInfo, siteSettings);
    
    if (!structuredData) return '';

    return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
  } catch (error) {
    return '';
  }
};
import { generateHomePageStructuredData } from '../../utils/homePageStructuredData';

/**
 * Simple Home Page JSON-LD Component
 * @param {Object} topicPageData - Topic page data from API
 * @param {Object} companyInfo - Company information from API
 * @param {Object} siteSettings - Site settings from API
 */
const HomePageJsonLd = ({ topicPageData, companyInfo, siteSettings }) => {
  // Generate structured data
  const structuredData = generateHomePageStructuredData(topicPageData, companyInfo, siteSettings);

  // Don't render if no data
  if (!structuredData) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
};

export default HomePageJsonLd;
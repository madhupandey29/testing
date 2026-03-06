import { useEffect, useState } from 'react';
import { generateHomePageStructuredDataWithApi } from '../../utils/homePageStructuredData';
import { useGetOfficeInformationQuery } from '../../redux/features/officeInformationApi';
import { useGetHomePageTopicQuery } from '../../redux/features/topicPageApi';

/**
 * Home Page Structured Data Component
 * Generates and injects JSON-LD structured data for the home page
 */
const HomePageStructuredData = ({ companyInfo, siteSettings }) => {
  const [structuredData, setStructuredData] = useState(null);
  
  // Fetch home page topic data using Redux
  const { data: homePageTopic, isLoading: topicLoading } = useGetHomePageTopicQuery();
  
  // Fetch office information if not provided
  const { data: officeInfo, isLoading: officeLoading } = useGetOfficeInformationQuery(undefined, {
    skip: !!companyInfo // Skip if companyInfo is already provided
  });

  // Use provided companyInfo or fetched officeInfo
  const finalCompanyInfo = companyInfo || officeInfo;

  useEffect(() => {
    const generateStructuredData = async () => {
      if (!finalCompanyInfo || topicLoading || officeLoading) return;

      try {
        // Generate structured data using the topic page data and company info
        const data = await generateHomePageStructuredDataWithApi(finalCompanyInfo, siteSettings);
        setStructuredData(data);
      } catch (error) {
        console.error('Error generating home page structured data:', error);
      }
    };

    generateStructuredData();
  }, [finalCompanyInfo, siteSettings, homePageTopic, topicLoading, officeLoading]);

  // Don't render anything if data is not ready
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

export default HomePageStructuredData;
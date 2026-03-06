'use client';
import { useEffect, useState } from 'react';
import { useGetOfficeInformationQuery } from '@/redux/features/officeInformationApi';
import { generateCorporationStructuredData } from '@/utils/corporationStructuredData';
import { generateWebsiteStructuredData } from '@/utils/websiteStructuredData';

const GlobalStructuredData = () => {
  const [siteSettings, setSiteSettings] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const { data: companyData, isSuccess, isLoading, error } = useGetOfficeInformationQuery();

  console.log('🚀 GlobalStructuredData component rendered');

  // Log the query state changes
  useEffect(() => {
    console.log('🔄 GlobalStructuredData Query State Changed:', {
      isLoading,
      isSuccess,
      error: error?.message || null,
      hasData: !!companyData,
      timestamp: new Date().toISOString()
    });
  }, [isLoading, isSuccess, error, companyData]);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
    console.log('🖥️ GlobalStructuredData: Client-side flag set');
  }, []);

  // Fetch site settings on component mount
  useEffect(() => {
    if (!isClient) return;

    const fetchSiteSettings = async () => {
      try {
        // Import dynamically to avoid SSR issues
        const { getDefaultSeoSettings } = await import('@/utils/seo');
        const settings = await getDefaultSeoSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error('Failed to fetch site settings:', error);
        setSiteSettings(null);
      }
    };

    fetchSiteSettings();
  }, [isClient]);

  useEffect(() => {
    // Only run on client side
    if (!isClient || typeof window === 'undefined') {
      console.log('🚫 GlobalStructuredData: Not client side or window undefined');
      return;
    }
    
    // Wait for data to be loaded
    if (isLoading) {
      console.log('⏳ GlobalStructuredData: Still loading...');
      return;
    }
    
    if (error) {
      console.log('❌ GlobalStructuredData: Error:', error);
      return;
    }
    
    // Check if we have valid company data
    if (!isSuccess) {
      console.log('❌ GlobalStructuredData: Query not successful');
      return;
    }
    
    if (!companyData) {
      console.log('❌ GlobalStructuredData: No company data');
      return;
    }
    
    if (!companyData.success) {
      console.log('❌ GlobalStructuredData: Company data success is false');
      return;
    }
    
    if (!companyData.data) {
      console.log('❌ GlobalStructuredData: No company data.data');
      return;
    }

    const companyInfo = companyData.data[0];
    if (!companyInfo) {
      console.log('❌ GlobalStructuredData: No company info at index 0');
      return;
    }
    
    if (!companyInfo.name) {
      console.log('❌ GlobalStructuredData: Company info has no name');
      return;
    }

    console.log('✅ GlobalStructuredData: All checks passed, generating structured data...');
    console.log('🏢 Company Info:', companyInfo);
    console.log('⚙️ Site Settings:', siteSettings);

    try {
      // Remove any existing structured data scripts
      const existingCorporationScripts = document.querySelectorAll('script[data-structured-data="true"][data-type="corporation"]');
      const existingWebsiteScripts = document.querySelectorAll('script[data-structured-data="true"][data-type="website"]');
      
      console.log(`🗑️ Removing ${existingCorporationScripts.length} existing corporation scripts`);
      console.log(`🗑️ Removing ${existingWebsiteScripts.length} existing website scripts`);
      
      existingCorporationScripts.forEach(script => {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
      
      existingWebsiteScripts.forEach(script => {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });

      // Generate corporation structured data
      console.log('🏢 Generating corporation structured data...');
      const corporationStructuredData = generateCorporationStructuredData(companyInfo, siteSettings);
      console.log('🏢 Corporation structured data result:', corporationStructuredData);

      if (corporationStructuredData) {
        const corporationScript = document.createElement('script');
        corporationScript.type = 'application/ld+json';
        corporationScript.setAttribute('data-structured-data', 'true');
        corporationScript.setAttribute('data-type', 'corporation');
        corporationScript.textContent = JSON.stringify(corporationStructuredData, null, 2);
        
        if (document.head) {
          document.head.appendChild(corporationScript);
          console.log('✅ Corporation structured data added to head');
        } else {
          console.log('❌ No document.head found');
        }
      } else {
        console.log('❌ Corporation structured data generation returned null');
      }

      // Generate website structured data
      console.log('🌐 Generating website structured data...');
      const websiteStructuredData = generateWebsiteStructuredData(companyInfo, siteSettings);
      console.log('🌐 Website structured data result:', websiteStructuredData);

      if (websiteStructuredData) {
        const websiteScript = document.createElement('script');
        websiteScript.type = 'application/ld+json';
        websiteScript.setAttribute('data-structured-data', 'true');
        websiteScript.setAttribute('data-type', 'website');
        websiteScript.textContent = JSON.stringify(websiteStructuredData, null, 2);
        
        if (document.head) {
          document.head.appendChild(websiteScript);
          console.log('✅ Website structured data added to head');
        } else {
          console.log('❌ No document.head found');
        }
      } else {
        console.log('❌ Website structured data generation returned null');
      }
    } catch (err) {
      console.error('❌ Error generating structured data:', err);
    }

    // Cleanup function
    return () => {
      if (typeof document !== 'undefined' && document.querySelectorAll) {
        try {
          const corporationScriptsToRemove = document.querySelectorAll('script[data-structured-data="true"][data-type="corporation"]');
          const websiteScriptsToRemove = document.querySelectorAll('script[data-structured-data="true"][data-type="website"]');
          
          corporationScriptsToRemove.forEach(script => {
            if (script && script.parentNode) {
              script.parentNode.removeChild(script);
            }
          });
          
          websiteScriptsToRemove.forEach(script => {
            if (script && script.parentNode) {
              script.parentNode.removeChild(script);
            }
          });
        } catch (err) {
          console.error('Error cleaning up structured data scripts:', err);
        }
      }
    };
  }, [companyData, isSuccess, isLoading, error, siteSettings, isClient]);

  return null;
};

export default GlobalStructuredData;
import { useState, useEffect } from 'react';
import { fetchTopicPageByName, fetchTopicPageBySlug, getTopicPageSeoData } from '../utils/topicPageApi';

/**
 * Custom hook to fetch and manage topic page data
 * @param {string} identifier - Page name or slug to fetch
 * @param {string} type - Type of identifier: 'name' or 'slug' (default: 'name')
 * @returns {Object} Hook state and functions
 */
export const useTopicPage = (identifier, type = 'name') => {
  const [topicPage, setTopicPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seoData, setSeoData] = useState(null);

  useEffect(() => {
    if (!identifier) {
      setTopicPage(null);
      setSeoData(null);
      return;
    }

    const fetchTopicPage = async () => {
      setLoading(true);
      setError(null);

      try {
        let pageData = null;
        
        if (type === 'slug') {
          pageData = await fetchTopicPageBySlug(identifier);
        } else {
          pageData = await fetchTopicPageByName(identifier);
        }

        setTopicPage(pageData);
        
        // Generate SEO data from topic page
        if (pageData) {
          const seo = getTopicPageSeoData(pageData);
          setSeoData(seo);
        } else {
          setSeoData(null);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch topic page');
        setTopicPage(null);
        setSeoData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTopicPage();
  }, [identifier, type]);

  return {
    topicPage,
    seoData,
    loading,
    error,
    refetch: () => {
      if (identifier) {
        // Trigger re-fetch by updating a dependency
        setLoading(true);
      }
    }
  };
};

/**
 * Custom hook specifically for home page topic data
 * @returns {Object} Hook state and functions for home page
 */
export const useHomePageTopic = () => {
  return useTopicPage('home', 'name');
};

/**
 * Custom hook specifically for contact page topic data
 * @returns {Object} Hook state and functions for contact page
 */
export const useContactPageTopic = () => {
  return useTopicPage('contact', 'name');
};

/**
 * Custom hook to get SEO metadata for any page
 * @param {string} pageName - Name of the page
 * @returns {Object} SEO metadata and loading state
 */
export const usePageSeoData = (pageName) => {
  const { seoData, loading, error } = useTopicPage(pageName, 'name');
  
  return {
    seoData: seoData || {
      title: '',
      description: '',
      keywords: [],
      canonicalUrl: '',
      excerpt: '',
      ogType: 'website'
    },
    loading,
    error
  };
};

/**
 * Custom hook to get topic page data with Redux integration
 * Uses the Redux API slice for caching and state management
 * @param {string} pageName - Name of the page
 * @returns {Object} Redux query result
 */
export const useTopicPageRedux = (pageName) => {
  // This would use the Redux hook when available
  // For now, fallback to the direct API approach
  return useTopicPage(pageName, 'name');
};
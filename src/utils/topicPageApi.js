/**
 * Topic Page API utility for fetching SEO-related data for pages
 * API URL: Uses NEXT_PUBLIC_API_BASE_URL from environment variables
 * 
 * Example response structure:
 * {
 *   "success": true,
 *   "data": [{
 *     "id": "6984513aebcd81703",
 *     "name": "Contact",
 *     "deleted": false,
 *     "description": "contact page description",
 *     "slug": "contact",
 *     "metaTitle": "contact us meta title",
 *     "keywords": ["contact page keyword1", "contact page keyword2", "contact page keyword3"],
 *     "canonicalUrl": "www.amrita-fashions.com/contact",
 *     "excerpt": "contact page excerpt",
 *     "ogType": "contact",
 *     "versionNumber": 2
 *   }],
 *   "total": 1,
 *   "entity": "CTopicPage",
 *   "pagination": {"page": 1, "limit": 20, "totalPages": 1}
 * }
 */

// Get API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';
const TOPIC_PAGE_API_URL = `${API_BASE_URL}/topicpage`;

/**
 * Fetch all topic pages from the API
 * @returns {Promise<Array>} Array of topic page objects
 */
export const fetchAllTopicPages = async () => {
  try {
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Only add Next.js specific options on server side
    if (typeof window === 'undefined') {
      fetchOptions.next = { revalidate: 3600 }; // Revalidate every hour
    }

    const response = await fetch(TOPIC_PAGE_API_URL, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      return result.data.filter(page => !page.deleted); // Filter out deleted pages
    }
    
    console.warn('Topic Page API returned unexpected format:', result);
    return [];
  } catch (error) {
    console.error('Error fetching topic pages:', error);
    return [];
  }
};

/**
 * Fetch topic page data by name (case-insensitive)
 * @param {string} pageName - Name of the page (e.g., "home", "contact", "about")
 * @returns {Promise<Object|null>} Topic page object or null if not found
 */
export const fetchTopicPageByName = async (pageName) => {
  try {
    if (!pageName || typeof pageName !== 'string') {
      console.warn('fetchTopicPageByName: Invalid pageName provided');
      return null;
    }

    const allPages = await fetchAllTopicPages();
    
    // Find page by name (case-insensitive)
    const page = allPages.find(p => 
      p.name && p.name.toLowerCase() === pageName.toLowerCase()
    );

    return page || null;
  } catch (error) {
    console.error(`Error fetching topic page for "${pageName}":`, error);
    return null;
  }
};

/**
 * Fetch topic page data by slug
 * @param {string} slug - Slug of the page (e.g., "contact", "about-us")
 * @returns {Promise<Object|null>} Topic page object or null if not found
 */
export const fetchTopicPageBySlug = async (slug) => {
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('fetchTopicPageBySlug: Invalid slug provided');
      return null;
    }

    const allPages = await fetchAllTopicPages();
    
    // Find page by slug
    const page = allPages.find(p => 
      p.slug && p.slug === slug
    );

    return page || null;
  } catch (error) {
    console.error(`Error fetching topic page for slug "${slug}":`, error);
    return null;
  }
};

/**
 * Get SEO metadata from topic page data
 * @param {Object} topicPage - Topic page object from API
 * @returns {Object} SEO metadata object
 */
export const getTopicPageSeoData = (topicPage) => {
  if (!topicPage || typeof topicPage !== 'object') {
    return {
      title: '',
      description: '',
      excerpt: '',
      keywords: [],
      canonicalUrl: '',
      ogType: 'website',
      slug: '',
      name: ''
    };
  }

  return {
    title: topicPage.metaTitle || '',
    description: topicPage.description || '',
    excerpt: topicPage.excerpt || '',
    keywords: Array.isArray(topicPage.keywords) ? topicPage.keywords : [],
    canonicalUrl: topicPage.canonicalUrl || '',
    ogType: topicPage.ogType || 'website',
    slug: topicPage.slug || '',
    name: topicPage.name || ''
  };
};

/**
 * Cache for topic pages to avoid repeated API calls
 */
let topicPagesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Get cached topic pages or fetch fresh data
 * @returns {Promise<Array>} Array of topic page objects
 */
export const getCachedTopicPages = async () => {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (topicPagesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return topicPagesCache;
  }
  
  // Fetch fresh data
  const pages = await fetchAllTopicPages();
  topicPagesCache = pages;
  cacheTimestamp = now;
  
  return pages;
};

/**
 * Clear the topic pages cache (useful for testing or forced refresh)
 */
export const clearTopicPagesCache = () => {
  topicPagesCache = null;
  cacheTimestamp = null;
};

/**
 * Validate topic page object structure
 * @param {Object} topicPage - Topic page object to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateTopicPage = (topicPage) => {
  if (!topicPage || typeof topicPage !== 'object') {
    return false;
  }

  const requiredFields = ['id', 'name', 'slug'];
  return requiredFields.every(field => 
    Object.prototype.hasOwnProperty.call(topicPage, field) && 
    topicPage[field] !== null && 
    topicPage[field] !== undefined
  );
};

/**
 * Get topic page data for home page specifically
 * @returns {Promise<Object|null>} Home page topic data or null
 */
export const getHomePageTopicData = async () => {
  return await fetchTopicPageByName('home');
};

/**
 * Get topic page data for contact page specifically
 * @returns {Promise<Object|null>} Contact page topic data or null
 */
export const getContactPageTopicData = async () => {
  return await fetchTopicPageByName('contact');
};
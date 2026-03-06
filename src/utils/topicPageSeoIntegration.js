/**
 * Topic Page SEO Integration Utility
 * Fetches SEO data from the topic page API and formats it for Next.js metadata
 */

// Get API base URL from environment variable
const API_BASE_URL =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://espobackend.vercel.app/api";
const TOPIC_PAGE_API_URL = `${API_BASE_URL}/topicpage`;

/**
 * Fetch topic page data by name
 * @param {string} pageName - Name of the page (e.g., 'home', 'contact', 'about')
 * @returns {Promise<Object|null>} Topic page data or null
 */
export async function fetchTopicPageByName(pageName) {
  try {
    if (!pageName || typeof pageName !== 'string') {
      console.warn('[Topic Page API] Invalid pageName provided:', pageName);
      return null;
    }

    console.log('[Topic Page API] Fetching data for page:', pageName);
    console.log('[Topic Page API] API URL:', TOPIC_PAGE_API_URL);

    const fetchOptions = {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    };


    const response = await fetch(TOPIC_PAGE_API_URL, fetchOptions);

    console.log('[Topic Page API] Response status:', response.status);

    if (!response.ok) {
      console.error(`[Topic Page API] Failed to fetch topic pages: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log('[Topic Page API] Response data structure:', {
      success: data.success,
      total: data.total,
      dataLength: data.data?.length
    });
    
    if (!data.success || !Array.isArray(data.data)) {
      console.error('[Topic Page API] Invalid topic page API response structure:', data);
      return null;
    }

    // Filter out deleted pages and find by name (case-insensitive)
    const pages = data.data.filter(page => !page.deleted);
    console.log('[Topic Page API] Active pages found:', pages.length);
    console.log('[Topic Page API] Page names:', pages.map(p => p.name));
    
    const topicPage = pages.find(p => 
      p.name && p.name.toLowerCase() === pageName.toLowerCase()
    );

    if (topicPage) {
      console.log('[Topic Page API] ✅ Found page data for:', pageName);
      console.log('[Topic Page API] Page data:', {
        id: topicPage.id,
        name: topicPage.name,
        metaTitle: topicPage.metaTitle,
        hasDescription: !!topicPage.description,
        hasExcerpt: !!topicPage.excerpt,
        hasKeywords: !!topicPage.keywords?.length
      });
    } else {
      console.warn('[Topic Page API] ❌ Page not found:', pageName);
    }

    return topicPage || null;
  } catch (error) {
    console.error('[Topic Page API] Error fetching topic page:', error);
    console.error('[Topic Page API] Error details:', {
      message: error.message,
      stack: error.stack
    });
    return null;
  }
}

/**
 * Generate Next.js metadata from topic page data
 * @param {Object} topicPage - Topic page data from API
 * @param {Object} fallback - Fallback metadata if topic page is not found
 * @returns {Object} Next.js metadata object with canonicalUrl for merging
 */
export function generateMetadataFromTopicPage(topicPage, fallback = {}) {
  if (!topicPage) {
    return {
      title: fallback.title || null,
      description: fallback.description || null,
      excerpt: fallback.excerpt || null,
      keywords: fallback.keywords || null,
      canonicalUrl: null, // No canonical from API
    };
  }

  const metadata = {
    title: topicPage.metaTitle || fallback.title || null,
    description: topicPage.description || fallback.description || null,
    excerpt: topicPage.excerpt || fallback.excerpt || null,
    canonicalUrl: null, // Will be set below if available
  };

  // Add keywords if available
  if (topicPage.keywords && Array.isArray(topicPage.keywords) && topicPage.keywords.length > 0) {
    metadata.keywords = topicPage.keywords.join(', ');
  } else if (fallback.keywords) {
    metadata.keywords = fallback.keywords;
  } else {
    metadata.keywords = null;
  }

  // Store canonical URL from API (will be used by pages to override default)
  if (topicPage.canonicalUrl) {
    metadata.canonicalUrl = topicPage.canonicalUrl.startsWith('http') 
      ? topicPage.canonicalUrl 
      : `https://${topicPage.canonicalUrl}`;
  }

  return metadata;
}

/**
 * Get SEO data for a specific page
 * @param {string} pageName - Name of the page
 * @param {Object} fallback - Fallback metadata
 * @returns {Promise<Object>} Next.js metadata object
 */
export async function getPageSeoMetadata(pageName, fallback = {}) {
  const topicPage = await fetchTopicPageByName(pageName);
  const metadata = generateMetadataFromTopicPage(topicPage, fallback);
  
  // Debug logging
  console.log(`[Topic Page SEO] Page: ${pageName}`);
  console.log(`[Topic Page SEO] Topic Page Data:`, topicPage);
  console.log(`[Topic Page SEO] Metadata extracted:`, {
    title: metadata.title,
    description: metadata.description,
    excerpt: metadata.excerpt,
    keywords: metadata.keywords,
    canonicalUrl: metadata.canonicalUrl
  });
  
  // Build complete Next.js metadata object
  const nextMetadata = {};

  // Only add fields if they have values
  if (metadata.title) {
    nextMetadata.title = metadata.title;
  }

  if (metadata.description) {
    nextMetadata.description = metadata.description;
  }

  // Add keywords if available
  if (metadata.keywords) {
    nextMetadata.keywords = metadata.keywords;
  }

  // Add canonical URL if available from API
  if (metadata.canonicalUrl) {
    nextMetadata.alternates = {
      canonical: metadata.canonicalUrl,
    };
    console.log(`[Topic Page SEO] Setting canonical to:`, metadata.canonicalUrl);
  } else {
    console.log(`[Topic Page SEO] No canonical URL from API`);
  }

  // Add Open Graph data only if we have title or description
  if (metadata.title || metadata.description || metadata.excerpt) {
    nextMetadata.openGraph = {};
    
    if (metadata.title) {
      nextMetadata.openGraph.title = metadata.title;
    }
    
    // Use excerpt for OG description if available, otherwise use description
    if (metadata.excerpt) {
      nextMetadata.openGraph.description = metadata.excerpt;
    } else if (metadata.description) {
      nextMetadata.openGraph.description = metadata.description;
    }
    
    nextMetadata.openGraph.type = topicPage?.ogType || 'website';

    // Add canonical URL to Open Graph
    if (metadata.canonicalUrl) {
      nextMetadata.openGraph.url = metadata.canonicalUrl;
    }
  }

  // Add Twitter Card data only if we have title or description
  if (metadata.title || metadata.description || metadata.excerpt) {
    nextMetadata.twitter = {
      card: 'summary_large_image',
    };
    
    if (metadata.title) {
      nextMetadata.twitter.title = metadata.title;
    }
    
    // Use excerpt for Twitter description if available, otherwise use description
    if (metadata.excerpt) {
      nextMetadata.twitter.description = metadata.excerpt;
    } else if (metadata.description) {
      nextMetadata.twitter.description = metadata.description;
    }
  }

  // Add excerpt as a custom meta tag in other section
  if (metadata.excerpt) {
    nextMetadata.other = {
      'excerpt': metadata.excerpt,
    };
  }

  console.log(`[Topic Page SEO] Final metadata:`, nextMetadata);

  return nextMetadata;
}

/**
 * Page name mappings for common routes
 */
export const PAGE_NAMES = {
  HOME: 'home',
  CONTACT: 'contact',
  ABOUT: 'about',
  BLOG: 'blog',
  CAPABILITIES: 'capabilities',
  FABRIC: 'fabric',
  PRODUCT: 'product',
};

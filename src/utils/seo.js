/**
 * SEO utilities for consistent canonical URL generation
 */

const stripTrailingSlash = (s = "") => String(s || "").replace(/\/+$/, "");

// Ensure we always use the production URL, with fallback
const SITE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL
);

/**
 * Fetch default SEO settings from API
 * @returns {Promise<Object|null>} Site settings object or null
 */
export async function getDefaultSeoSettings() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !process?.env?.NEXT_PUBLIC_API_BASE_URL) {
      return null;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/sitesettings`,
      { 
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );
    
    if (!res.ok) return null;
    const json = await res.json();
    
    // Handle both direct array response and wrapped response
    let siteSettingsData = [];
    if (Array.isArray(json)) {
      siteSettingsData = json;
    } else if (json?.success && Array.isArray(json.data)) {
      siteSettingsData = json.data;
    } else if (json?.data && Array.isArray(json.data)) {
      siteSettingsData = json.data;
    }
    
    if (siteSettingsData.length === 0) return null;
    
    // Get filter value from environment variable
    const siteFilter = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SITE_FILTER) 
      ? process.env.NEXT_PUBLIC_SITE_FILTER 
      : 'catalogue';
    
    // Find site settings by siteKey (catalogue) or name (eCatalogue)
    const targetSiteSettings = siteSettingsData.find(settings => 
      (settings && settings.siteKey === siteFilter) || 
      (settings && settings.name === 'eCatalogue')
    );
    
    return targetSiteSettings || null;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
}

/**
 * Generate Next.js optimized logo URL
 * @param {string} logoPath - The logo path (default: "/assets/img/logo/age.jpg")
 * @param {number} width - Image width (default: 256)
 * @param {number} quality - Image quality (default: 90)
 * @returns {string} - Complete Next.js optimized logo URL
 */
export const getOptimizedLogoUrl = (logoPath = "/assets/img/logo/age.jpg", width = 256, quality = 90) => {
 const baseUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || "https://espo-shofy-final-project.vercel.app");
  return `${baseUrl}/_next/image?url=${encodeURIComponent(logoPath)}&w=${width}&q=${quality}`;
};

/**
 * Generate canonical URL from environment variable and path
 * @param {string} path - The path to append to the site URL (default: "/")
 * @returns {string} - Complete canonical URL
 */
export const getCanonicalUrl = (path = "/") => {
  if (!SITE_URL) {
    return path;
  }
  
  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  const canonicalUrl = `${SITE_URL}${cleanPath}`;

  return canonicalUrl;
};

/**
 * Generate absolute URL for images
 * @param {string} imagePath - The image path (e.g., "/assets/img/logo/logo.svg")
 * @returns {string} - Complete image URL
 */
export const getAbsoluteImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Already absolute
  
  return SITE_URL ? `${SITE_URL}${imagePath}` : imagePath;
};

/**
 * Generate metadata object with canonical URL and default SEO settings
 * @param {Object} options - Metadata options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.path - Page path for canonical URL
 * @param {string} options.canonicalOverride - Override canonical URL (from Topic Page API)
 * @param {string} options.keywords - SEO keywords
 * @param {string} options.ogImage - OpenGraph image path (will be made absolute)
 * @param {string} options.ogLogo - OpenGraph logo path (will be made absolute)
 * @param {string} options.robots - Robots meta tag value (default: "index, follow")
 * @param {Object} options.openGraph - OpenGraph overrides
 * @param {Object} options.twitter - Twitter card overrides
 * @returns {Object} - Next.js metadata object
 */
export const generateMetadata = async ({
  title,
  description,
  path = "/",
  canonicalOverride = null,
  keywords,
  ogImage,
  ogLogo,
  robots = "index, follow",
  openGraph = {},
  twitter = {}
}) => {
  // Fetch default SEO settings
  const defaultSeoSettings = await getDefaultSeoSettings();
  
  // Use canonical override from Topic Page API if provided, otherwise generate from path
  const canonical = canonicalOverride || getCanonicalUrl(path);
  const absoluteOgImage = ogImage ? getAbsoluteImageUrl(ogImage) : null;
  const absoluteOgLogo = ogLogo ? getAbsoluteImageUrl(ogLogo) : null;
  
  // Site name from default SEO settings or environment
  const siteName = defaultSeoSettings?.name || process.env.NEXT_PUBLIC_SITE_NAME || 'eCatalogue';
  
  // Build metadata object - only include fields with values
  const metadata = {};
  
  // Add title if provided
  if (title) {
    metadata.title = title;
  }
  
  // Add description if provided
  if (description) {
    metadata.description = description;
  }
  
  // Add keywords if provided
  if (keywords) {
    metadata.keywords = keywords;
  }
  
  // Add robots
  const finalRobots = robots || defaultSeoSettings?.robotsPolicy || "index, follow";
  metadata.robots = finalRobots;
  
  // Add canonical
  metadata.alternates = { canonical };
  
  // Build OpenGraph data
  const ogData = {
    type: "website",
    siteName,
    locale: 'en_US',
    url: canonical,
    ...openGraph
  };
  
  // Only add title/description to OG if they exist
  if (title) {
    ogData.title = title;
  }
  
  if (description) {
    ogData.description = description;
  }

  // Add image if provided
  if (absoluteOgImage) {
    ogData.images = [
      {
        url: absoluteOgImage,
        width: 1200,
        height: 630,
        alt: title || siteName
      }
    ];
  }

  // Add logo if provided
  if (absoluteOgLogo) {
    ogData.logo = absoluteOgLogo;
  }
  
  metadata.openGraph = ogData;

  // Build Twitter data
  const twitterData = {
    card: "summary_large_image",
    ...twitter
  };
  
  // Only add title/description to Twitter if they exist
  if (title) {
    twitterData.title = title;
  }
  
  if (description) {
    twitterData.description = description;
  }

  // Add image for Twitter if provided
  if (absoluteOgImage) {
    twitterData.images = [absoluteOgImage];
  }
  
  metadata.twitter = twitterData;

  // Build verification object from default SEO settings - CRITICAL FOR SEO
  const verification = {};
  if (defaultSeoSettings?.googleVerification) {
    verification.google = defaultSeoSettings.googleVerification;
  }
  if (defaultSeoSettings?.bingVerification) {
    verification.other = {
      'msvalidate.01': defaultSeoSettings.bingVerification,
    };
  }

  // Build Twitter handle from default SEO settings
  const twitterHandle = defaultSeoSettings?.twitterHandle;
  if (twitterHandle) {
    twitterData.site = twitterHandle.startsWith('@') ? twitterHandle : `@${twitterHandle}`;
  }

  // Apple Web App configuration from default SEO settings
  metadata.appleWebApp = {
    capable: true,
    statusBarStyle: 'default',
    title: siteName,
  };

  // Format detection settings
  metadata.formatDetection = {
    telephone: false,
    email: false,
    address: false,
  };

  // Additional meta tags from default SEO settings
  metadata.other = {
    ...(defaultSeoSettings?.siteStatus && {
      'site-status': defaultSeoSettings.siteStatus,
    }),
    ...(defaultSeoSettings?.siteKey && {
      'site-key': defaultSeoSettings.siteKey,
    }),
    ...(defaultSeoSettings?.name && {
      'site-name': defaultSeoSettings.name,
    }),
    ...(defaultSeoSettings?.websiteFaqId && {
      'website-faq-id': defaultSeoSettings.websiteFaqId,
    }),
    ...(defaultSeoSettings?.websiteFaqName && {
      'website-faq-name': defaultSeoSettings.websiteFaqName,
    }),
    // Add Bing verification directly in other meta tags as fallback
    ...(defaultSeoSettings?.bingVerification && {
      'msvalidate.01': defaultSeoSettings.bingVerification,
    }),
    // Add Open Graph logo if provided
    ...(absoluteOgLogo && {
      'og:logo': absoluteOgLogo,
    }),
  };

  // Add verification if we have any - CRITICAL FOR SEARCH CONSOLE
  if (Object.keys(verification).length > 0) {
    metadata.verification = verification;
  }

  return metadata;
};
// utils/cleanBlogContent.js

/**
 * Clean blog HTML content by removing or fixing invalid image sources
 * @param {string} htmlContent - HTML content from blog API
 * @returns {string} Cleaned HTML content
 */
export const cleanBlogContent = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') return '';

  // Replace invalid image sources with placeholder or remove them
  const cleanedContent = htmlContent.replace(
    /<img[^>]*src=["']([^"']*?)["'][^>]*>/gi,
    (match, src) => {
      // Check if src is a valid URL (starts with http/https or /)
      if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'))) {
        return match; // Keep valid images
      } else {
        // Log and remove invalid images
        console.warn(`Removed invalid image from blog content: ${src}`);
        return `<!-- Invalid image removed: ${src} -->`; // Replace with comment
      }
    }
  );

  return cleanedContent;
};

/**
 * Extract and validate image URLs from HTML content
 * @param {string} htmlContent - HTML content
 * @returns {string[]} Array of valid image URLs
 */
export const extractValidImages = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') return [];

  const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const images = [];
  let match;

  while ((match = imageRegex.exec(htmlContent)) !== null) {
    const src = match[1];
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
      images.push(src);
    }
  }

  return images;
};
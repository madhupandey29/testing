/**
 * Extract all unique tags from blogs and count their occurrences
 * @param {Array} blogs - Array of blog objects
 * @returns {Array} - Array of tag objects sorted by popularity
 */
export const getPopularTags = (blogs) => {
  if (!Array.isArray(blogs) || blogs.length === 0) {
    return [];
  }

  const tagCount = {};

  // Count occurrences of each tag
  blogs.forEach(blog => {
    if (blog?.tags && Array.isArray(blog.tags)) {
      blog.tags.forEach(tag => {
        if (tag && typeof tag === 'string') {
          const trimmedTag = tag.trim();
          if (trimmedTag) {
            tagCount[trimmedTag] = (tagCount[trimmedTag] || 0) + 1;
          }
        }
      });
    }
  });

  // Convert to array and sort by count (most popular first)
  const sortedTags = Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return sortedTags;
};

/**
 * Get top N popular tags
 * @param {Array} blogs - Array of blog objects
 * @param {number} limit - Maximum number of tags to return
 * @returns {Array} - Array of tag strings
 */
export const getTopTags = (blogs, limit = 10) => {
  const popularTags = getPopularTags(blogs);
  return popularTags.slice(0, limit).map(item => item.tag);
};
